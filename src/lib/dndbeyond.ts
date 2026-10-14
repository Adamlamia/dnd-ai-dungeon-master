/**
 * D&D Beyond API Integration
 * 
 * Uses the undocumented D&D Beyond character service API to fetch character data.
 * Endpoint: https://character-service.dndbeyond.com/character/v5/character/{characterId}
 * 
 * Note: This is an unofficial API and may change without notice.
 */

export interface DnDBeyondCharacter {
  id: number;
  name: string;
  race: string;
  class: string;
  level: number;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hitPoints: {
    current: number;
    maximum: number;
    temp: number;
  };
  armorClass: number;
  speed: number;
  proficiencyBonus: number;
  skills: Record<string, {
    value: number;
    proficient: boolean;
  }>;
  spells?: {
    cantrips: string[];
    level1: string[];
    level2: string[];
    level3: string[];
    level4: string[];
    level5: string[];
  };
  inventory?: string[];
  backstory?: string;
  traits?: {
    personalityTraits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
}

/**
 * Error carrying the upstream HTTP status so callers (API routes) can map it
 * to an appropriate response code and a clear, user-facing message.
 */
export class DnDBeyondError extends Error {
  status: number;
  constructor(message: string, status: number = 502) {
    super(message);
    this.name = 'DnDBeyondError';
    this.status = status;
  }
}

/**
 * Fetch a character from D&D Beyond by character ID
 * @param characterId - The D&D Beyond character ID (from URL)
 * @returns Parsed character data
 */
export async function fetchDnDBeyondCharacter(characterId: string | number): Promise<DnDBeyondCharacter> {
  const url = `https://character-service.dndbeyond.com/character/v5/character/${characterId}`;
  
  try {
    // D&D Beyond's character-service rejects requests without a browser-like
    // User-Agent (returns 403). Send one so public/shared sheets are retrievable.
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new DnDBeyondError(
          `Character not found on D&D Beyond (id ${characterId}). Check the ID/URL and make sure the character sheet is shared/public.`,
          404
        );
      }
      throw new DnDBeyondError(
        `D&D Beyond request failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }
    
    const body = await response.json();
    
    // The v5 character-service returns { success, data: { ...character } }
    const character = body?.data ?? body?.character;
    if (!character) {
      throw new DnDBeyondError('Invalid character data received from D&D Beyond', 502);
    }
    
    return parseDnDBeyondCharacter(character);
  } catch (error) {
    console.error('Error fetching D&D Beyond character:', error);
    throw error;
  }
}

/**
 * Parse raw D&D Beyond API response into our character format
 */
function parseDnDBeyondCharacter(rawData: any): DnDBeyondCharacter {
  const character = rawData;
  const mod = (score: number) => Math.floor((score - 10) / 2);

  // --- Ability scores: base `stats`, plus `bonusStats`, with `overrideStats` winning ---
  const byId = (arr: any[] | undefined): Record<number, number | null> => {
    const map: Record<number, number | null> = {};
    (arr || []).forEach((s: any) => {
      if (s && s.id != null) map[s.id] = s.value ?? null;
    });
    return map;
  };
  const base = byId(character.stats);
  const bonus = byId(character.bonusStats);
  const override = byId(character.overrideStats);
  // stat ids: 1 STR, 2 DEX, 3 CON, 4 INT, 5 WIS, 6 CHA
  const getStatValue = (id: number): number => {
    if (override[id] != null) return override[id] as number;
    return (base[id] ?? 10) + (bonus[id] ?? 0);
  };
  const STR = getStatValue(1);
  const DEX = getStatValue(2);
  const CON = getStatValue(3);
  const INT = getStatValue(4);
  const WIS = getStatValue(5);
  const CHA = getStatValue(6);

  // --- Classes / total level / proficiency bonus ---
  const classes = (character.classes || []).map((c: any) => ({
    name: c.definition?.name || c.name || 'Unknown',
    level: c.level || 1,
  }));
  const totalLevel = classes.reduce((sum: number, c: any) => sum + c.level, 0) || 1;
  const primaryClass = classes[0]?.name || 'Unknown';
  // Proficiency bonus is not exposed directly; derive from total level.
  const proficiencyBonus = 2 + Math.floor((totalLevel - 1) / 4);

  // --- Race / speed ---
  const race =
    character.race?.fullName || character.race?.baseRaceName || 'Unknown Race';
  const speed =
    character.race?.weightSpeeds?.normal?.walk ||
    (character.customSpeeds || [])[0]?.speed ||
    30;

  // --- Hit points ---
  const maxHp =
    character.overrideHitPoints ??
    ((character.baseHitPoints ?? 0) + (character.bonusHitPoints ?? 0));
  const hitPoints = {
    current: Math.max(0, maxHp - (character.removedHitPoints ?? 0)),
    maximum: maxHp,
    temp: character.temporaryHitPoints ?? 0,
  };

  // --- Armor class (best-effort from equipped armor; falls back to unarmored) ---
  const dexMod = mod(DEX);
  let armorClass = 10 + dexMod; // unarmored
  const inventory = character.inventory || [];
  const equippedArmor = inventory.find(
    (i: any) =>
      i.equipped &&
      i.definition?.armorClass != null &&
      i.definition?.armorTypeId != null
  );
  if (equippedArmor) {
    const baseAc = equippedArmor.definition.armorClass as number;
    const typeId = equippedArmor.definition.armorTypeId; // 1 light, 2 medium, 3 heavy
    if (typeId === 1) armorClass = baseAc + dexMod;
    else if (typeId === 2) armorClass = baseAc + Math.min(dexMod, 2);
    else armorClass = baseAc; // heavy armor: no DEX bonus
  }
  const hasShield = inventory.some(
    (i: any) =>
      i.equipped &&
      /shield/i.test(
        i.definition?.baseArmorName || i.definition?.name || ''
      )
  );
  if (hasShield) armorClass += 2;

  // --- Inventory (names) ---
  const inventoryNames = inventory
    .map((i: any) => i.definition?.name)
    .filter((n: any): n is string => typeof n === 'string' && n.length > 0);

  // --- Traits (fields may be null; may be arrays) ---
  const t = character.traits || {};
  const pick = (v: any): string =>
    Array.isArray(v) ? v.join(', ') : v ? String(v) : '';
  const traits =
    t.personalityTraits || t.ideals || t.bonds || t.flaws
      ? {
          personalityTraits: pick(t.personalityTraits),
          ideals: pick(t.ideals),
          bonds: pick(t.bonds),
          flaws: pick(t.flaws),
        }
      : undefined;

  // NOTE: Full skill bonuses require D&D Beyond's modifier engine, which is not
  // present in this payload. We import the core sheet and leave skills empty
  // rather than guess incorrect values.
  const skills: Record<string, { value: number; proficient: boolean }> = {};

  return {
    id: character.id,
    name: character.name || 'Unnamed Character',
    race,
    class: primaryClass,
    level: totalLevel,
    abilityScores: {
      strength: STR,
      dexterity: DEX,
      constitution: CON,
      intelligence: INT,
      wisdom: WIS,
      charisma: CHA,
    },
    hitPoints,
    armorClass,
    speed,
    proficiencyBonus,
    skills,
    inventory: inventoryNames,
    backstory: character.notes?.backstory || '',
    traits,
  };
}

/**
 * Validate a D&D Beyond character URL and extract character ID
 */
export function extractCharacterIdFromUrl(url: string): string | null {
  // Match patterns like:
  // https://www.dndbeyond.com/characters/12345678
  // https://dndbeyond.com/characters/12345678
  const match = url.match(/\/characters\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Roll dice using D&D Beyond's dice roller (if available) or fallback to local
 */
export function rollDice(diceNotation: string): number {
  // Parse dice notation like "2d6+3", "1d20", "3d8"
  const match = diceNotation.match(/(\d+)d(\d+)(?:\+(\d+))?/);
  
  if (!match) {
    throw new Error(`Invalid dice notation: ${diceNotation}`);
  }
  
  const [, count, sides, modifier] = match;
  const numDice = parseInt(count, 10);
  const dieSides = parseInt(sides, 10);
  const mod = modifier ? parseInt(modifier, 10) : 0;
  
  let total = 0;
  for (let i = 0; i < numDice; i++) {
    total += Math.floor(Math.random() * dieSides) + 1;
  }
  
  return total + mod;
}

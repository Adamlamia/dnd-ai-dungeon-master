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
 * Fetch a character from D&D Beyond by character ID
 * @param characterId - The D&D Beyond character ID (from URL)
 * @returns Parsed character data
 */
export async function fetchDnDBeyondCharacter(characterId: string | number): Promise<DnDBeyondCharacter> {
  const url = `https://character-service.dndbeyond.com/character/v5/character/${characterId}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch character: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // The API returns { character: { ... } }
    if (!data.character) {
      throw new Error('Invalid character data received');
    }
    
    return parseDnDBeyondCharacter(data.character);
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
  
  // Extract ability scores
  const stats = character.stats?.map((s: any) => ({
    id: s.id,
    value: s.value,
  })) || [];
  
  const getStatValue = (statName: string) => {
    const statMap: Record<string, number> = {
      'STR': 1, 'DEX': 2, 'CON': 3, 'INT': 4, 'WIS': 5, 'CHA': 6
    };
    const statId = statMap[statName];
    const found = stats.find((s: any) => s.id === statId);
    return found?.value || 10;
  };
  
  // Extract class info
  const classes = character.classes?.map((c: any) => ({
    name: c.definition?.name || c.name || 'Unknown',
    level: c.level || 1,
  })) || [];
  
  const totalLevel = classes.reduce((sum: number, c: any) => sum + c.level, 0);
  const primaryClass = classes[0]?.name || 'Unknown';
  
  // Calculate modifiers
  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);
  
  // Extract skills
  const skills: Record<string, any> = {};
  character.customActions?.forEach((action: any) => {
    if (action.subtype === 'skill') {
      const skillName = action.name;
      const abilityScore = getStatValue(action.ability);
      const proficiencyBonus = character.proficiencyBonus || 2;
      const proficient = action.isProficient || false;
      
      skills[skillName] = {
        value: calculateModifier(abilityScore) + (proficient ? proficiencyBonus : 0),
        proficient,
      };
    }
  });
  
  // Extract hit points
  const hitPoints = {
    current: character.hitPoints?.current || character.hitPoints?.maximum || 0,
    maximum: character.hitPoints?.maximum || 0,
    temp: character.hitPoints?.temp || 0,
  };
  
  return {
    id: character.id,
    name: character.name || 'Unnamed Character',
    race: character.race?.fullName || character.race?.name || 'Unknown Race',
    class: primaryClass,
    level: totalLevel,
    abilityScores: {
      strength: getStatValue('STR'),
      dexterity: getStatValue('DEX'),
      constitution: getStatValue('CON'),
      intelligence: getStatValue('INT'),
      wisdom: getStatValue('WIS'),
      charisma: getStatValue('CHA'),
    },
    hitPoints,
    armorClass: character.armorClass || 10,
    speed: character.speed || 30,
    proficiencyBonus: character.proficiencyBonus || 2,
    skills,
    backstory: character.backstory,
    traits: character.personalityTraits ? {
      personalityTraits: character.personalityTraits.trait || '',
      ideals: character.personalityTraits.ideal || '',
      bonds: character.personalityTraits.bond || '',
      flaws: character.personalityTraits.flaw || '',
    } : undefined,
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

/**
 * Character Management Service
 * 
 * Handles character import from D&D Beyond and local character management
 * Uses in-memory storage compatible with Vercel serverless deployment
 */

import { Character } from '@/types';
import { fetchDnDBeyondCharacter, extractCharacterIdFromUrl } from '@/lib/dndbeyond';
import { characterStorage } from '@/lib/storage';

/**
 * Import character from D&D Beyond
 */
export async function importFromDnDBeyond(
  characterIdOrUrl: string,
  playerId: string
): Promise<Character> {
  // Extract ID if full URL provided
  const characterId = extractCharacterIdFromUrl(characterIdOrUrl) || characterIdOrUrl;
  
  // Fetch from D&D Beyond
  const dndbeyondChar = await fetchDnDBeyondCharacter(characterId);
  
  // Convert to our Character format
  const character: Character = {
    id: generateId(),
    name: dndbeyondChar.name,
    playerId,
    dndbeyondId: characterId,
    dndbeyondUrl: `https://www.dndbeyond.com/characters/${characterId}`,
    race: dndbeyondChar.race,
    classType: dndbeyondChar.class,
    level: dndbeyondChar.level,
    abilityScores: dndbeyondChar.abilityScores,
    hitPoints: dndbeyondChar.hitPoints,
    armorClass: dndbeyondChar.armorClass,
    speed: dndbeyondChar.speed,
    proficiencyBonus: dndbeyondChar.proficiencyBonus,
    skills: dndbeyondChar.skills,
    spells: dndbeyondChar.spells ? {
      cantrips: dndbeyondChar.spells.cantrips || [],
      levels: {
        1: dndbeyondChar.spells.level1 || [],
        2: dndbeyondChar.spells.level2 || [],
        3: dndbeyondChar.spells.level3 || [],
        4: dndbeyondChar.spells.level4 || [],
        5: dndbeyondChar.spells.level5 || [],
      }
    } : undefined,
    backstory: dndbeyondChar.backstory,
    personalityTraits: dndbeyondChar.traits ? {
      traits: dndbeyondChar.traits.personalityTraits,
      ideals: dndbeyondChar.traits.ideals,
      bonds: dndbeyondChar.traits.bonds,
      flaws: dndbeyondChar.traits.flaws,
    } : undefined,
    inventory: dndbeyondChar.inventory || [],
    notes: '',
    lastUpdated: new Date(),
  };
  
  // Save locally
  await characterStorage.save(character);
  
  return character;
}

/**
 * Create a manual character (not from D&D Beyond)
 */
export async function createCharacter(characterData: Omit<Character, 'id' | 'lastUpdated'>): Promise<Character> {
  const character: Character = {
    ...characterData,
    id: generateId(),
    lastUpdated: new Date(),
  };
  
  await characterStorage.save(character);
  
  return character;
}

/**
 * Get character by ID
 */
export async function getCharacter(id: string): Promise<Character | null> {
  return await characterStorage.get(id);
}

/**
 * List all characters
 */
export async function listCharacters(): Promise<Character[]> {
  try {
    const characters = await characterStorage.getAll();
    return characters.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error listing characters:', error);
    return [];
  }
}

/**
 * List characters by player
 */
export async function listCharactersByPlayer(playerId: string): Promise<Character[]> {
  const allCharacters = await listCharacters();
  return allCharacters.filter(char => char.playerId === playerId);
}

/**
 * Update character
 */
export async function updateCharacter(
  id: string,
  updates: Partial<Character>
): Promise<Character> {
  const character = await getCharacter(id);
  
  if (!character) {
    throw new Error(`Character not found: ${id}`);
  }
  
  const updated: Character = {
    ...character,
    ...updates,
    id, // Prevent ID change
    lastUpdated: new Date(),
  };
  
  await characterStorage.save(updated);
  
  return updated;
}

/**
 * Update character HP
 */
export async function updateCharacterHP(
  characterId: string,
  hpUpdate: { current?: number; temp?: number }
): Promise<Character> {
  const character = await getCharacter(characterId);
  
  if (!character) {
    throw new Error(`Character not found: ${characterId}`);
  }
  
  return updateCharacter(characterId, {
    hitPoints: {
      ...character.hitPoints,
      ...(hpUpdate.current !== undefined && { current: hpUpdate.current }),
      ...(hpUpdate.temp !== undefined && { temp: hpUpdate.temp }),
    },
  });
}

/**
 * Delete character
 */
export async function deleteCharacter(id: string): Promise<void> {
  await characterStorage.delete(id);
}

/**
 * Refresh character from D&D Beyond
 */
export async function refreshFromDnDBeyond(characterId: string): Promise<Character> {
  const character = await getCharacter(characterId);
  
  if (!character || !character.dndbeyondId) {
    throw new Error('Character not found or not linked to D&D Beyond');
  }
  
  // Fetch latest data
  const updatedData = await fetchDnDBeyondCharacter(character.dndbeyondId);
  
  // Update local copy
  const updated: Character = {
    ...character,
    name: updatedData.name,
    race: updatedData.race,
    classType: updatedData.class,
    level: updatedData.level,
    abilityScores: updatedData.abilityScores,
    hitPoints: updatedData.hitPoints,
    armorClass: updatedData.armorClass,
    speed: updatedData.speed,
    proficiencyBonus: updatedData.proficiencyBonus,
    skills: updatedData.skills,
    spells: updatedData.spells ? {
      cantrips: updatedData.spells.cantrips || [],
      levels: {
        1: updatedData.spells.level1 || [],
        2: updatedData.spells.level2 || [],
        3: updatedData.spells.level3 || [],
        4: updatedData.spells.level4 || [],
        5: updatedData.spells.level5 || [],
      }
    } : undefined,
    backstory: updatedData.backstory,
    personalityTraits: updatedData.traits ? {
      traits: updatedData.traits.personalityTraits,
      ideals: updatedData.traits.ideals,
      bonds: updatedData.traits.bonds,
      flaws: updatedData.traits.flaws,
    } : undefined,
    inventory: updatedData.inventory || character.inventory,
    lastUpdated: new Date(),
  };
  
  await characterStorage.save(updated);
  
  return updated;
}

/**
 * Calculate ability modifier
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculate skill bonus
 */
export function calculateSkillBonus(
  abilityScore: number,
  proficient: boolean,
  proficiencyBonus: number
): number {
  const abilityMod = calculateModifier(abilityScore);
  return abilityMod + (proficient ? proficiencyBonus : 0);
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Search characters by name
 */
export async function searchCharacters(query: string): Promise<Character[]> {
  const allCharacters = await listCharacters();
  const lowerQuery = query.toLowerCase();
  
  return allCharacters.filter(character => 
    character.name.toLowerCase().includes(lowerQuery) ||
    character.race.toLowerCase().includes(lowerQuery) ||
    character.classType.toLowerCase().includes(lowerQuery)
  );
}

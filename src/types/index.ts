/**
 * Core Type Definitions for D&D AI Dungeon Master
 */

// Campaign Types
export interface Campaign {
  id: string;
  name: string;
  description: string;
  theme: string;
  levelRange: {
    min: number;
    max: number;
  };
  tone: 'serious' | 'comedic' | 'horror' | 'epic' | 'casual';
  createdAt: Date;
  updatedAt: Date;
  status: 'planning' | 'active' | 'paused' | 'completed';
  
  // Prepared materials from Prep AI
  preparedMaterials?: {
    storyline: string;
    majorArcs: string[];
    npcs: NPC[];
    locations: Location[];
    encounters: Encounter[];
    lootTable: LootItem[];
  };
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  race: string;
  classType: string;
  alignment: string;
  description: string;
  personalityTraits: string[];
  motivations: string;
  secrets: string;
  dialoguePatterns: string;
  combatStats?: any; // Could reference D&D Beyond stat blocks
  relationships: Record<string, string>; // NPC ID -> relationship description
  sampleDialogue: string[];
}

export interface Location {
  id: string;
  name: string;
  type: string;
  description: string;
  visualDescription: string;
  sensoryDetails: {
    sounds?: string;
    smells?: string;
    textures?: string;
  };
  notableFeatures: string[];
  interactiveElements: string[];
  hiddenDetails: Array<{
    description: string;
    perceptionDC: number;
  }>;
  npcsPresent: string[]; // NPC IDs
  atmosphere: string;
}

export interface Encounter {
  id: string;
  name: string;
  type: 'combat' | 'social' | 'exploration' | 'puzzle';
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  description: string;
  enemies?: Array<{
    name: string;
    count: number;
    cr: number;
    statBlock?: any;
  }>;
  terrain?: string;
  tacticalConsiderations: string[];
  rewards: {
    xp: number;
    loot: LootItem[];
  };
  alternativeOutcomes: string[];
  followUpHooks: string[];
}

export interface LootItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'wondrous' | 'gold';
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary';
  value?: number; // in gold pieces
  properties?: string[];
}

// Character Types (integrates with D&D Beyond)
export interface Character {
  id: string;
  name: string;
  playerId: string;
  
  // D&D Beyond integration
  dndbeyondId?: string; // D&D Beyond character ID
  dndbeyondUrl?: string; // Full D&D Beyond URL
  
  // Basic stats
  race: string;
  classType: string;
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
  
  // Skills and abilities
  skills: Record<string, {
    value: number;
    proficient: boolean;
  }>;
  spells?: {
    cantrips: string[];
    levels: {
      [level: number]: string[];
    };
  };
  
  // Roleplay elements
  backstory?: string;
  personalityTraits?: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
  
  // Session tracking
  inventory: string[];
  notes: string;
  lastUpdated: Date;
}

// Session Types
export interface Session {
  id: string;
  campaignId: string;
  sessionNumber: number;
  title: string;
  date: Date;
  duration?: number; // in minutes
  
  // Session state
  status: 'planned' | 'in_progress' | 'completed';
  
  // Runtime data
  narrativeLog: NarrativeEntry[];
  combatLog?: CombatEntry[];
  diceRolls: DiceRoll[];
  
  // Recap
  recap?: string;
  nextSessionHook?: string;
}

export interface NarrativeEntry {
  timestamp: Date;
  type: 'narration' | 'dialogue' | 'action' | 'description';
  speaker?: string; // NPC or player name
  content: string;
  metadata?: {
    location?: string;
    npcsInvolved?: string[];
  };
}

export interface CombatEntry {
  timestamp: Date;
  round: number;
  initiative: Array<{
    characterId: string;
    value: number;
  }>;
  actions: CombatAction[];
}

export interface CombatAction {
  characterId: string;
  action: string;
  target?: string;
  roll?: DiceRoll;
  damage?: number;
  result: string;
}

export interface DiceRoll {
  id: string;
  notation: string; // e.g., "2d6+3"
  result: number;
  breakdown: number[]; // individual die results
  modifier: number;
  rolledBy: string; // character ID or "DM"
  purpose: string; // what the roll was for
  timestamp: Date;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// AI Service Types
export interface AIPreparationRequest {
  campaignConcept?: {
    theme: string;
    levelRange: string;
    tone: string;
  };
  npcGeneration?: {
    role: string;
    race: string;
    classType: string;
    alignment: string;
    context: string;
  };
  encounterDesign?: {
    partyLevel: number;
    partySize: number;
    encounterType: 'combat' | 'social' | 'exploration' | 'puzzle';
    difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
    context: string;
  };
}

export interface AIRuntimeRequest {
  narration?: {
    preparedDescription: string;
    playerActions: string;
    context: string;
  };
  rulesAdjudication?: {
    situation: string;
    relevantRules: string;
  };
  npcDialogue?: {
    npcName: string;
    npcPersonality: string;
    playerDialogue: string;
    context: string;
  };
}

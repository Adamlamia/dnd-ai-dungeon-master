/**
 * AI Service Layer - Two-AI Architecture
 * 
 * 1. Prep AI (Cloud-based): Comprehensive AI for campaign preparation, NPC generation, encounter design
 *    - Uses Groq (free tier) or Hugging Face for powerful reasoning and creativity
 *    - Runs during campaign setup and planning phases
 * 
 * 2. Runtime AI (Local): Lightweight AI for live session management
 *    - Uses Ollama (local LLM) for fast, private session running
 *    - Uses prepared materials from Prep AI to guide sessions
 */

export type AIProvider = 'ollama' | 'groq' | 'huggingface';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiUrl?: string;
  apiKey?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Get AI configuration from environment variables
 */
export function getAIConfig(role: 'prep' | 'runtime'): AIConfig {
  if (role === 'prep') {
    // Prep AI uses cloud provider for comprehensive analysis
    const provider = process.env.PREP_AI_PROVIDER as AIProvider || 'groq';
    
    return {
      provider,
      model: provider === 'groq' 
        ? process.env.PREP_AI_MODEL || 'llama-3.1-8b-instant'
        : process.env.PREP_AI_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',
      apiUrl: provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : `https://api-inference.huggingface.co/models/${process.env.HF_MODEL}`,
      apiKey: provider === 'groq'
        ? process.env.GROQ_API_KEY
        : process.env.HUGGINGFACE_API_KEY,
    };
  } else {
    // Runtime AI uses configured provider (defaults to Groq for cloud deployment)
    const provider = process.env.RUNTIME_AI_PROVIDER as AIProvider || 'groq';
    
    return {
      provider,
      model: provider === 'groq' 
        ? process.env.RUNTIME_AI_MODEL || 'llama-3.1-8b-instant'
        : provider === 'ollama'
          ? process.env.RUNTIME_AI_MODEL || 'llama3.2'
          : process.env.RUNTIME_AI_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',
      apiUrl: provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : provider === 'ollama'
          ? process.env.OLLAMA_URL || 'http://localhost:11434/api/chat'
          : `https://api-inference.huggingface.co/models/${process.env.HF_MODEL}`,
      apiKey: provider === 'groq'
        ? process.env.GROQ_API_KEY
        : provider === 'huggingface'
          ? process.env.HUGGINGFACE_API_KEY
          : undefined,
    };
  }
}

/**
 * Send message to AI provider
 */
export async function sendToAI(
  messages: AIMessage[],
  config: AIConfig
): Promise<AIResponse> {
  switch (config.provider) {
    case 'ollama':
      return sendToOllama(messages, config);
    case 'groq':
      return sendToGroq(messages, config);
    case 'huggingface':
      return sendToHuggingFace(messages, config);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

/**
 * Ollama integration (local)
 */
async function sendToOllama(messages: AIMessage[], config: AIConfig): Promise<AIResponse> {
  const response = await fetch(config.apiUrl!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    content: data.message?.content || data.response || '',
  };
}

/**
 * Groq Cloud integration (free tier)
 */
async function sendToGroq(messages: AIMessage[], config: AIConfig): Promise<AIResponse> {
  if (!config.apiKey) {
    throw new Error('GROQ_API_KEY is required for Groq provider');
  }
  
  const response = await fetch(config.apiUrl!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

/**
 * Hugging Face Inference API (free tier)
 */
async function sendToHuggingFace(messages: AIMessage[], config: AIConfig): Promise<AIResponse> {
  if (!config.apiKey) {
    throw new Error('HUGGINGFACE_API_KEY is required for Hugging Face provider');
  }
  
  // Combine messages into single prompt
  const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
  
  const response = await fetch(config.apiUrl!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 2000,
        temperature: 0.7,
        return_full_text: false,
      },
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  return {
    content: Array.isArray(data) ? data[0]?.generated_text || '' : data.generated_text || '',
  };
}

/**
 * Prep AI: Campaign Preparation Functions
 */
export const PrepAI = {
  /**
   * Generate campaign concept and storyline
   */
  async generateCampaignConcept(
    theme: string,
    levelRange: string,
    tone: string
  ): Promise<string> {
    const config = getAIConfig('prep');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert D&D 5e Dungeon Master. Create compelling campaign concepts with clear story arcs, major plot points, and engaging hooks. Focus on creating a framework that can adapt to player choices.`,
      },
      {
        role: 'user',
        content: `Create a D&D 5e campaign concept with the following parameters:
        
Theme: ${theme}
Level Range: ${levelRange}
Tone: ${tone}

Provide:
1. Campaign Title
2. Elevator Pitch (2-3 sentences)
3. Major Story Arcs (3-5 arcs)
4. Key NPCs (3-5 important characters)
5. Starting Hook
6. Potential Endgame Scenarios`,
      },
    ];
    
    const response = await sendToAI(messages, config);
    return response.content;
  },
  
  /**
   * Generate detailed NPCs with personalities and motivations
   */
  async generateNPC(
    role: string,
    race: string,
    classType: string,
    alignment: string,
    context: string
  ): Promise<string> {
    const config = getAIConfig('prep');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert D&D 5e NPC creator. Create detailed, memorable NPCs with distinct personalities, motivations, secrets, and dialogue patterns.`,
      },
      {
        role: 'user',
        content: `Create a detailed NPC with these parameters:
        
Role in Story: ${role}
Race: ${race}
Class: ${classType}
Alignment: ${alignment}
Context: ${context}

Provide:
1. Name and Title
2. Physical Description
3. Personality Traits (3)
4. Ideals, Bonds, Flaws
5. Motivations and Goals
6. Secrets
7. Speech Patterns/Voice Notes
8. Combat Stats (if applicable)
9. Relationship to Party
10. Sample Dialogue Lines (3-5)`,
      },
    ];
    
    const response = await sendToAI(messages, config);
    return response.content;
  },
  
  /**
   * Design balanced encounters
   */
  async designEncounter(
    partyLevel: number,
    partySize: number,
    encounterType: 'combat' | 'social' | 'exploration' | 'puzzle',
    difficulty: 'easy' | 'medium' | 'hard' | 'deadly',
    context: string
  ): Promise<string> {
    const config = getAIConfig('prep');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert D&D 5e encounter designer. Create balanced, engaging encounters using proper CR calculations and tactical considerations.`,
      },
      {
        role: 'user',
        content: `Design a D&D 5e encounter:
        
Party Level: ${partyLevel}
Party Size: ${partySize}
Encounter Type: ${encounterType}
Difficulty: ${difficulty}
Context: ${context}

Provide:
1. Encounter Overview
2. Enemies/NPCs (with stat block references)
3. Terrain/Environment Features
4. Tactical Considerations
5. Rewards (XP, loot)
6. Alternative Outcomes
7. Follow-up Hooks`,
      },
    ];
    
    const response = await sendToAI(messages, config);
    return response.content;
  },
  
  /**
   * Generate location descriptions
   */
  async generateLocation(
    locationType: string,
    atmosphere: string,
    purpose: string
  ): Promise<string> {
    const config = getAIConfig('prep');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert D&D 5e worldbuilder. Create vivid, immersive location descriptions that engage all senses and provide interactive elements.`,
      },
      {
        role: 'user',
        content: `Create a detailed location description:
        
Type: ${locationType}
Atmosphere: ${atmosphere}
Purpose in Story: ${purpose}

Provide:
1. Location Name
2. Visual Description (what players see first)
3. Sensory Details (sounds, smells, textures)
4. Notable Features
5. Interactive Elements
6. Hidden Details (perception checks)
7. NPCs Present
8. Atmosphere Notes for DM`,
      },
    ];
    
    const response = await sendToAI(messages, config);
    return response.content;
  },
};

/**
 * Runtime AI: Live Session Management Functions
 */
export const RuntimeAI = {
  /**
   * Narrate scene based on prepared materials
   */
  async narrateScene(
    preparedDescription: string,
    playerActions: string,
    context: string
  ): Promise<string> {
    const config = getAIConfig('runtime');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are the Dungeon Master running a live D&D 5e session. Use the prepared materials to guide your narration. Be descriptive but concise. Adapt to player choices while maintaining the story framework.`,
      },
      {
        role: 'user',
        content: `PREPARED MATERIALS:
${preparedDescription}

CURRENT CONTEXT:
${context}

PLAYER ACTIONS:
${playerActions}

Narrate what happens next, including:
1. Immediate consequences of player actions
2. Environmental reactions
3. NPC responses (if applicable)
4. What the players perceive
5. Options available to players`,
      },
    ];
    
    const response = await sendToAI(messages, config);
    return response.content;
  },
  
  /**
   * Adjudicate rules questions
   */
  async adjudicateRule(
    situation: string,
    relevantRules: string
  ): Promise<string> {
    const config = getAIConfig('runtime');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a D&D 5e rules expert. Provide clear, fair rulings based on RAW (Rules As Written) when possible, but prioritize fun and flow over strict rules adherence.`,
      },
      {
        role: 'user',
        content: `RULES SITUATION:
${situation}

RELEVANT RULES:
${relevantRules}

Provide:
1. The ruling
2. Brief explanation
3. Any dice rolls needed
4. How to proceed`,
      },
    ];
    
    const response = await sendToAI(messages, config);
    return response.content;
  },
  
  /**
   * Roleplay NPC dialogue
   */
  async npcDialogue(
    npcName: string,
    npcPersonality: string,
    playerDialogue: string,
    context: string
  ): Promise<string> {
    const config = getAIConfig('runtime');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are roleplaying as ${npcName}. Stay in character based on their personality traits. Respond naturally to player dialogue.`,
      },
      {
        role: 'user',
        content: `NPC: ${npcName}
PERSONALITY: ${npcPersonality}
CONTEXT: ${context}

PLAYER SAYS: "${playerDialogue}"

Respond as the NPC in character. Include any non-verbal cues in asterisks.`,
      },
    ];
    
    const response = await sendToAI(messages, config);
    return response.content;
  },
  
  /**
   * Generate session recap
   */
  async generateRecap(
    sessionEvents: string
  ): Promise<string> {
    const config = getAIConfig('runtime');
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are summarizing a D&D session for the next meeting. Create an engaging recap that highlights key events, decisions, and cliffhangers.`,
      },
      {
        role: 'user',
        content: `SESSION EVENTS:
${sessionEvents}

Create a "Previously On..." style recap that includes:
1. Where the party was
2. Key decisions made
3. Important discoveries
4. Current situation
5. Unresolved threads`,
      },
    ];
    
    const response = await sendToAI(messages, config);
    return response.content;
  },
};

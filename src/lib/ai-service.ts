/**
 * AI Service Layer - Two-AI Architecture
 * 
 * 1. Prep AI (Cloud-based): Comprehensive AI for campaign preparation, NPC generation, encounter design
 *    - Uses Groq (free tier) or Hugging Face for powerful reasoning and creativity
 *    - Runs during campaign setup and planning phases
 * 
 * 2. Runtime AI (Cloud-based): Live session management
 *    - Uses Groq (free tier) by default for cloud/serverless deployment;
 *      Ollama remains available for local/private runs via RUNTIME_AI_PROVIDER=ollama
 *    - Uses prepared materials from Prep AI to guide sessions
 *
 * Default Groq model: openai/gpt-oss-120b (the former llama-3.1-8b-instant was
 * retired by Groq and now returns 404 model_not_found). Override with
 * PREP_AI_MODEL / RUNTIME_AI_MODEL env vars if needed.
 */

export type AIProvider = 'ollama' | 'groq' | 'huggingface';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiUrl?: string;
  apiKey?: string;
  /** Request strict JSON output (Groq response_format json_object). */
  jsonMode?: boolean;
  /** Override max completion tokens (reasoning models need headroom). */
  maxTokens?: number;
  /** Override sampling temperature. */
  temperature?: number;
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
        ? process.env.PREP_AI_MODEL || 'openai/gpt-oss-120b'
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
        ? process.env.RUNTIME_AI_MODEL || 'openai/gpt-oss-120b'
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
  
  const payload: Record<string, unknown> = {
    model: config.model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxTokens ?? 2000,
  };

  if (config.jsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch(config.apiUrl!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
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
   * Generate detailed NPCs with personalities and motivations.
   * Returns a strict JSON string (Groq json_object mode).
   */
  async generateNPC(
    role: string,
    race: string,
    classType: string,
    alignment: string,
    context: string
  ): Promise<string> {
    const config = { ...getAIConfig('prep'), jsonMode: true, maxTokens: 4000 };
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert D&D 5e NPC creator. You respond ONLY with a single valid JSON object and no prose, markdown, or code fences.`,
      },
      {
        role: 'user',
        content: `Create a detailed D&D 5e NPC with these parameters:

Role in Story: ${role}
Race: ${race}
Class: ${classType}
Alignment: ${alignment}
Context: ${context}

Return ONLY a JSON object with exactly these keys:
{
  "name": string,
  "title": string,
  "role": string,
  "race": string,
  "classType": string,
  "alignment": string,
  "description": string,            // physical description
  "personalityTraits": string[],    // exactly 3 short traits
  "ideals": string,
  "bonds": string,
  "flaws": string,
  "motivations": string,
  "secrets": string,
  "dialoguePatterns": string,       // speech/voice notes
  "sampleDialogue": string[],       // 3-5 lines
  "combatStats": string,            // brief stat block or "" if non-combatant
  "relationshipToParty": string
}`,
      },
    ];
    
    const response = await sendToAI(messages, config);
    return response.content;
  },
  
  /**
   * Design balanced encounters.
   * Returns a strict JSON string (Groq json_object mode).
   */
  async designEncounter(
    partyLevel: number,
    partySize: number,
    encounterType: 'combat' | 'social' | 'exploration' | 'puzzle',
    difficulty: 'easy' | 'medium' | 'hard' | 'deadly',
    context: string
  ): Promise<string> {
    const config = { ...getAIConfig('prep'), jsonMode: true, maxTokens: 4000 };
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert D&D 5e encounter designer. You respond ONLY with a single valid JSON object and no prose, markdown, or code fences.`,
      },
      {
        role: 'user',
        content: `Design a D&D 5e encounter:

Party Level: ${partyLevel}
Party Size: ${partySize}
Encounter Type: ${encounterType}
Difficulty: ${difficulty}
Context: ${context}

Return ONLY a JSON object with exactly these keys:
{
  "name": string,
  "type": "${encounterType}",
  "difficulty": "${difficulty}",
  "overview": string,
  "enemies": string[],              // each with a short stat-block reference
  "terrain": string[],
  "tacticalConsiderations": string[],
  "rewardsXp": number,
  "rewardsLoot": string[],
  "alternativeOutcomes": string[],
  "followUpHooks": string[]
}`,
      },
    ];
    
    const response = await sendToAI(messages, config);
    return response.content;
  },
  
  /**
   * Generate location descriptions.
   * Returns a strict JSON string (Groq json_object mode).
   */
  async generateLocation(
    locationType: string,
    atmosphere: string,
    purpose: string
  ): Promise<string> {
    const config = { ...getAIConfig('prep'), jsonMode: true, maxTokens: 4000 };
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert D&D 5e worldbuilder. You respond ONLY with a single valid JSON object and no prose, markdown, or code fences.`,
      },
      {
        role: 'user',
        content: `Create a detailed location description:

Type: ${locationType}
Atmosphere: ${atmosphere}
Purpose in Story: ${purpose}

Return ONLY a JSON object with exactly these keys:
{
  "name": string,
  "type": string,
  "visualDescription": string,      // what players see first
  "sensoryDetails": { "sounds": string, "smells": string, "textures": string },
  "notableFeatures": string[],
  "interactiveElements": string[],
  "hiddenDetails": string[],        // perception-check reveals
  "npcsPresent": string[],
  "atmosphere": string              // DM atmosphere notes
}`,
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

import { NextRequest, NextResponse } from 'next/server';
import { getCampaign, addPreparedMaterials } from '@/services/campaignService';
import { PrepAI } from '@/lib/ai-service';

// POST /api/campaigns/[id]/prepare - Generate prepared materials using Prep AI
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { 
      generateStoryline, 
      generateNPCs, 
      generateEncounters, 
      generateLocations,
      npcParams,
      encounterParams,
      locationParams
    } = body;
    
    // Verify campaign exists
    const campaign = await getCampaign(id);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }
    
    const materials: any = {};
    
    // Generate storyline if requested
    if (generateStoryline) {
      const storyline = await PrepAI.generateCampaignConcept(
        campaign.theme,
        `${campaign.levelRange.min}-${campaign.levelRange.max}`,
        campaign.tone
      );
      materials.storyline = storyline;
    }
    
    // Generate NPCs if requested
    if (generateNPCs && npcParams) {
      const npcs = [];
      for (const npc of npcParams) {
        const npcData = await PrepAI.generateNPC(
          npc.role,
          npc.race,
          npc.classType,
          npc.alignment,
          npc.context || `Part of ${campaign.name} campaign`
        );
        // Parse the AI response into structured NPC data
        npcs.push(parseNPCResponse(npcData));
      }
      materials.npcs = npcs;
    }
    
    // Generate encounters if requested
    if (generateEncounters && encounterParams) {
      const encounters = [];
      for (const enc of encounterParams) {
        const encData = await PrepAI.designEncounter(
          enc.partyLevel || campaign.levelRange.max,
          enc.partySize || 4,
          enc.encounterType,
          enc.difficulty,
          enc.context || `${campaign.name} campaign`
        );
        encounters.push(parseEncounterResponse(encData));
      }
      materials.encounters = encounters;
    }
    
    // Generate locations if requested
    if (generateLocations && locationParams) {
      const locations = [];
      for (const loc of locationParams) {
        const locData = await PrepAI.generateLocation(
          loc.locationType,
          loc.atmosphere,
          loc.purpose || `Part of ${campaign.name}`
        );
        locations.push(parseLocationResponse(locData));
      }
      materials.locations = locations;
    }
    
    // Save prepared materials to campaign
    const updated = await addPreparedMaterials(id, materials);
    
    return NextResponse.json({ 
      success: true, 
      data: updated,
      message: 'Campaign preparation complete'
    });
  } catch (error) {
    console.error('Error preparing campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to prepare campaign materials' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------
// JSON parsing helpers (Prep AI now returns strict JSON via json_object mode)
// ------------------------------------------------------------------

/** Safely parse a model response into an object, tolerating stray code fences. */
function safeJsonParse(text: string): Record<string, any> | null {
  if (!text) return null;
  let raw = text.trim();
  // Strip ```json ... ``` fences if the model added any despite instructions.
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) raw = fence[1].trim();
  // Fall back to the first {...} block if there is surrounding prose.
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function asString(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v === undefined || v === null) return '';
  return String(v);
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(asString).filter((s) => s.length > 0);
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return [];
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function parseNPCResponse(aiText: string) {
  const o = safeJsonParse(aiText) || {};
  return {
    id: genId('npc'),
    name: asString(o.name) || 'Unknown NPC',
    title: asString(o.title),
    role: asString(o.role) || 'NPC',
    race: asString(o.race) || 'Unknown',
    classType: asString(o.classType) || 'Commoner',
    alignment: asString(o.alignment) || 'True Neutral',
    description: asString(o.description),
    personalityTraits: asStringArray(o.personalityTraits),
    ideals: asString(o.ideals),
    bonds: asString(o.bonds),
    flaws: asString(o.flaws),
    motivations: asString(o.motivations),
    secrets: asString(o.secrets),
    dialoguePatterns: asString(o.dialoguePatterns),
    sampleDialogue: asStringArray(o.sampleDialogue),
    combatStats: asString(o.combatStats),
    relationshipToParty: asString(o.relationshipToParty),
    relationships: {},
  };
}

function parseEncounterResponse(aiText: string) {
  const o = safeJsonParse(aiText) || {};
  return {
    id: genId('enc'),
    name: asString(o.name) || 'Encounter',
    type: asString(o.type) || 'combat',
    difficulty: asString(o.difficulty) || 'medium',
    overview: asString(o.overview),
    description: asString(o.overview) || aiText,
    enemies: asStringArray(o.enemies),
    terrain: asStringArray(o.terrain),
    tacticalConsiderations: asStringArray(o.tacticalConsiderations),
    rewards: {
      xp: typeof o.rewardsXp === 'number' ? o.rewardsXp : Number(o.rewardsXp) || 0,
      loot: asStringArray(o.rewardsLoot),
    },
    alternativeOutcomes: asStringArray(o.alternativeOutcomes),
    followUpHooks: asStringArray(o.followUpHooks),
  };
}

function parseLocationResponse(aiText: string) {
  const o = safeJsonParse(aiText) || {};
  const sensory = (o.sensoryDetails && typeof o.sensoryDetails === 'object') ? o.sensoryDetails : {};
  return {
    id: genId('loc'),
    name: asString(o.name) || 'Unknown Location',
    type: asString(o.type) || 'general',
    description: asString(o.visualDescription) || aiText,
    visualDescription: asString(o.visualDescription),
    sensoryDetails: {
      sounds: asString(sensory.sounds),
      smells: asString(sensory.smells),
      textures: asString(sensory.textures),
    },
    notableFeatures: asStringArray(o.notableFeatures),
    interactiveElements: asStringArray(o.interactiveElements),
    hiddenDetails: asStringArray(o.hiddenDetails),
    npcsPresent: asStringArray(o.npcsPresent),
    atmosphere: asString(o.atmosphere),
  };
}


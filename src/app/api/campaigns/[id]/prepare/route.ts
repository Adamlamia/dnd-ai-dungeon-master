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

// Helper functions to parse AI responses into structured data
function parseNPCResponse(aiText: any) {
  // This is a simplified parser - in production, you'd want more robust parsing
  return {
    id: `npc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: extractField(aiText, 'Name') || 'Unknown NPC',
    role: extractField(aiText, 'Role') || 'NPC',
    race: extractField(aiText, 'Race') || 'Human',
    classType: extractField(aiText, 'Class') || 'Commoner',
    alignment: extractField(aiText, 'Alignment') || 'True Neutral',
    description: extractField(aiText, 'Physical Description') || '',
    personalityTraits: extractList(aiText, 'Personality Traits'),
    motivations: extractField(aiText, 'Motivations') || '',
    secrets: extractField(aiText, 'Secrets') || '',
    dialoguePatterns: extractField(aiText, 'Speech Patterns') || '',
    sampleDialogue: extractList(aiText, 'Sample Dialogue'),
    relationships: {},
  };
}

function parseEncounterResponse(aiText: any) {
  return {
    id: `enc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: extractField(aiText, 'Encounter Overview')?.split('\n')[0] || 'Encounter',
    type: 'combat',
    difficulty: 'medium',
    description: aiText,
    tacticalConsiderations: [],
    rewards: { xp: 0, loot: [] },
    alternativeOutcomes: [],
    followUpHooks: [],
  };
}

function parseLocationResponse(aiText: any) {
  return {
    id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: extractField(aiText, 'Location Name') || 'Unknown Location',
    type: 'general',
    description: aiText,
    visualDescription: extractField(aiText, 'Visual Description') || '',
    sensoryDetails: {},
    notableFeatures: [],
    interactiveElements: [],
    hiddenDetails: [],
    npcsPresent: [],
    atmosphere: '',
  };
}

function extractField(text: string, fieldName: string): string {
  const regex = new RegExp(`${fieldName}:?\\s*\\n([\\s\\S]*?)(?=\\n\\w+:|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractList(text: string, fieldName: string): string[] {
  const field = extractField(text, fieldName);
  if (!field) return [];
  
  // Split by numbered or bulleted items
  return field
    .split(/\n\s*(?:\d+\.|\-|\*)\s*/)
    .filter(item => item.trim().length > 0)
    .map(item => item.trim());
}

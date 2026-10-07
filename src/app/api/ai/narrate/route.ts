import { NextRequest, NextResponse } from 'next/server';
import { RuntimeAI } from '@/lib/ai-service';

// POST /api/ai/narrate - Get AI narration for session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    let result;
    
    switch (action) {
      case 'narrate':
        // Narrate scene based on prepared materials and player actions
        if (!params.preparedDescription || !params.playerActions) {
          return NextResponse.json(
            { success: false, error: 'preparedDescription and playerActions required' },
            { status: 400 }
          );
        }
        result = await RuntimeAI.narrateScene(
          params.preparedDescription,
          params.playerActions,
          params.context || ''
        );
        break;
        
      case 'rules':
        // Adjudicate rules question
        if (!params.situation) {
          return NextResponse.json(
            { success: false, error: 'situation required' },
            { status: 400 }
          );
        }
        result = await RuntimeAI.adjudicateRule(
          params.situation,
          params.relevantRules || ''
        );
        break;
        
      case 'npc-dialogue':
        // Roleplay NPC dialogue
        if (!params.npcName || !params.npcPersonality || !params.playerDialogue) {
          return NextResponse.json(
            { success: false, error: 'npcName, npcPersonality, and playerDialogue required' },
            { status: 400 }
          );
        }
        result = await RuntimeAI.npcDialogue(
          params.npcName,
          params.npcPersonality,
          params.playerDialogue,
          params.context || ''
        );
        break;
        
      case 'recap':
        // Generate session recap
        if (!params.sessionEvents) {
          return NextResponse.json(
            { success: false, error: 'sessionEvents required' },
            { status: 400 }
          );
        }
        result = await RuntimeAI.generateRecap(params.sessionEvents);
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true, data: { response: result } });
  } catch (error) {
    console.error('Error in AI narration:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}

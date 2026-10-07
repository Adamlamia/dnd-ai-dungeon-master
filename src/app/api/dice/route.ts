import { NextRequest, NextResponse } from 'next/server';
import { 
  rollDice, 
  rollWithAdvantage, 
  rollWithDisadvantage,
  rollAbilityCheck,
  rollAttack,
  rollInitiative,
  averageRoll
} from '@/lib/dice';

// POST /api/dice/roll - Roll dice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, notation, ...params } = body;
    
    let result;
    
    switch (action) {
      case 'roll':
        // Basic dice roll
        if (!notation) {
          return NextResponse.json(
            { success: false, error: 'Notation required' },
            { status: 400 }
          );
        }
        result = rollDice(notation);
        break;
        
      case 'advantage':
        // Roll with advantage
        result = rollWithAdvantage(params.sides || 20, params.modifier || 0);
        break;
        
      case 'disadvantage':
        // Roll with disadvantage
        result = rollWithDisadvantage(params.sides || 20, params.modifier || 0);
        break;
        
      case 'ability-check':
        // Ability check
        if (!params.abilityScore) {
          return NextResponse.json(
            { success: false, error: 'abilityScore required' },
            { status: 400 }
          );
        }
        result = rollAbilityCheck(
          params.abilityScore,
          params.proficient || false,
          params.proficiencyBonus || 2,
          params.advantage
        );
        break;
        
      case 'attack':
        // Attack roll with damage
        if (!params.attackBonus || !params.damageDice) {
          return NextResponse.json(
            { success: false, error: 'attackBonus and damageDice required' },
            { status: 400 }
          );
        }
        result = rollAttack(
          params.attackBonus,
          params.damageDice,
          params.advantage
        );
        break;
        
      case 'initiative':
        // Initiative roll
        if (!params.dexterityModifier) {
          return NextResponse.json(
            { success: false, error: 'dexterityModifier required' },
            { status: 400 }
          );
        }
        result = rollInitiative(params.dexterityModifier);
        break;
        
      case 'average':
        // Calculate average roll
        if (!notation) {
          return NextResponse.json(
            { success: false, error: 'Notation required' },
            { status: 400 }
          );
        }
        result = { notation, average: averageRoll(notation) };
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error rolling dice:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to roll dice' },
      { status: 500 }
    );
  }
}

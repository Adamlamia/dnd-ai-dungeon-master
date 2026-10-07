import { NextRequest, NextResponse } from 'next/server';
import { 
  importFromDnDBeyond, 
  createCharacter, 
  getCharacter, 
  listCharacters, 
  updateCharacter, 
  deleteCharacter,
  refreshFromDnDBeyond,
  listCharactersByPlayer
} from '@/services/characterService';

// GET /api/characters - List all characters or get specific character
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const playerId = searchParams.get('playerId');
    const search = searchParams.get('search');
    
    if (id) {
      // Get specific character
      const character = await getCharacter(id);
      if (!character) {
        return NextResponse.json(
          { success: false, error: 'Character not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: character });
    }
    
    if (playerId) {
      // List characters by player
      const characters = await listCharactersByPlayer(playerId);
      return NextResponse.json({ success: true, data: characters });
    }
    
    if (search) {
      // Search characters
      const characters = await import('@/services/characterService').then(m => m.searchCharacters(search));
      return NextResponse.json({ success: true, data: characters });
    }
    
    // List all characters
    const characters = await listCharacters();
    return NextResponse.json({ success: true, data: characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}

// POST /api/characters - Create or import character
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'import-dndbeyond') {
      // Import from D&D Beyond
      const { characterIdOrUrl, playerId } = body;
      
      if (!characterIdOrUrl || !playerId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: characterIdOrUrl, playerId' },
          { status: 400 }
        );
      }
      
      const character = await importFromDnDBeyond(characterIdOrUrl, playerId);
      return NextResponse.json({ success: true, data: character }, { status: 201 });
    }
    
    // Create manual character
    const { name, playerId, race, classType, level, abilityScores } = body;
    
    if (!name || !playerId || !race || !classType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const character = await createCharacter({
      name,
      playerId,
      race,
      classType,
      level: level || 1,
      abilityScores: abilityScores || {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      hitPoints: { current: 0, maximum: 0, temp: 0 },
      armorClass: 10,
      speed: 30,
      proficiencyBonus: 2,
      skills: {},
      inventory: [],
      notes: '',
      lastUpdated: new Date(),
    } as any);
    
    return NextResponse.json({ success: true, data: character }, { status: 201 });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create character' },
      { status: 500 }
    );
  }
}

// PATCH /api/characters - Update character
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Character ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const character = await updateCharacter(id, body);
    
    return NextResponse.json({ success: true, data: character });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

// DELETE /api/characters - Delete character
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Character ID required' },
        { status: 400 }
      );
    }
    
    await deleteCharacter(id);
    return NextResponse.json({ success: true, message: 'Character deleted' });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}

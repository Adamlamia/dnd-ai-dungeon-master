import { NextRequest, NextResponse } from 'next/server';
import { 
  createSession, 
  getSession, 
  listSessions, 
  startSession, 
  endSession,
  addNarrativeEntry,
  recordDiceRoll,
  listSessionsByCampaign,
  getActiveSession
} from '@/services/sessionService';

// GET /api/sessions - List all sessions or get specific session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const campaignId = searchParams.get('campaignId');
    const active = searchParams.get('active');
    
    if (id) {
      // Get specific session
      const session = await getSession(id);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: session });
    }
    
    if (campaignId) {
      // List sessions by campaign
      const sessions = await listSessionsByCampaign(campaignId);
      return NextResponse.json({ success: true, data: sessions });
    }
    
    if (active === 'true') {
      // Get active session for campaign
      const cid = searchParams.get('campaignId');
      if (!cid) {
        return NextResponse.json(
          { success: false, error: 'campaignId required for active session query' },
          { status: 400 }
        );
      }
      const session = await getActiveSession(cid);
      return NextResponse.json({ success: true, data: session });
    }
    
    // List all sessions
    const sessions = await listSessions();
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, ...data } = body;
    
    if (action === 'start') {
      // Start a session
      const session = await startSession(sessionId);
      return NextResponse.json({ success: true, data: session });
    }
    
    if (action === 'end') {
      // End a session
      const session = await endSession(sessionId, data.recap, data.nextSessionHook);
      return NextResponse.json({ success: true, data: session });
    }
    
    if (action === 'narrative') {
      // Add narrative entry
      const session = await addNarrativeEntry(sessionId, data);
      return NextResponse.json({ success: true, data: session });
    }
    
    if (action === 'dice') {
      // Record dice roll
      const session = await recordDiceRoll(sessionId, data);
      return NextResponse.json({ success: true, data: session });
    }
    
    // Create new session
    const { campaignId, title, sessionNumber } = body;
    
    if (!campaignId || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: campaignId, title' },
        { status: 400 }
      );
    }
    
    const session = await createSession(campaignId, title, sessionNumber);
    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

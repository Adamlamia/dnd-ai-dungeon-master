import { NextRequest, NextResponse } from 'next/server';
import { 
  createCampaign, 
  getCampaign, 
  listCampaigns, 
  updateCampaign, 
  deleteCampaign,
  addPreparedMaterials 
} from '@/services/campaignService';
import { PrepAI } from '@/lib/ai-service';

// GET /api/campaigns - List all campaigns or get specific campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    
    if (id) {
      // Get specific campaign
      const campaign = await getCampaign(id);
      if (!campaign) {
        return NextResponse.json(
          { success: false, error: 'Campaign not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: campaign });
    }
    
    if (search) {
      // Search campaigns
      const campaigns = await import('@/services/campaignService').then(m => m.searchCampaigns(search));
      return NextResponse.json({ success: true, data: campaigns });
    }
    
    // List all campaigns
    const campaigns = await listCampaigns();
    return NextResponse.json({ success: true, data: campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, description, theme, levelRange, tone } = body;
    
    if (!name || !theme || !levelRange) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, theme, levelRange' },
        { status: 400 }
      );
    }
    
    const campaign = await createCampaign({
      name,
      description: description || '',
      theme,
      levelRange: {
        min: levelRange.min || 1,
        max: levelRange.max || 1,
      },
      tone: tone || 'epic',
      status: 'planning',
    });
    
    return NextResponse.json({ success: true, data: campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// PATCH /api/campaigns - Update campaign
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const campaign = await updateCampaign(id, body);
    
    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID required' },
        { status: 400 }
      );
    }
    
    await deleteCampaign(id);
    return NextResponse.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}

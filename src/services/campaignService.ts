/**
 * Campaign Management Service
 * 
 * Handles CRUD operations for campaigns using in-memory storage
 * (compatible with Vercel serverless deployment)
 */

import { Campaign, NPC, Location, Encounter, LootItem } from '@/types';
import { campaignStorage } from '@/lib/storage';

/**
 * Create a new campaign
 */
export async function createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
  const campaign: Campaign = {
    ...campaignData,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await campaignStorage.save(campaign);
  
  return campaign;
}

/**
 * Get campaign by ID
 */
export async function getCampaign(id: string): Promise<Campaign | null> {
  return await campaignStorage.get(id);
}

/**
 * List all campaigns
 */
export async function listCampaigns(): Promise<Campaign[]> {
  try {
    return await campaignStorage.getAll();
  } catch (error) {
    console.error('Error listing campaigns:', error);
    return [];
  }
}

/**
 * Update campaign
 */
export async function updateCampaign(
  id: string,
  updates: Partial<Campaign>
): Promise<Campaign> {
  const campaign = await getCampaign(id);
  
  if (!campaign) {
    throw new Error(`Campaign not found: ${id}`);
  }
  
  const updated: Campaign = {
    ...campaign,
    ...updates,
    id, // Prevent ID change
    updatedAt: new Date(),
  };
  
  await campaignStorage.save(updated);
  
  return updated;
}

/**
 * Delete campaign
 */
export async function deleteCampaign(id: string): Promise<void> {
  await campaignStorage.delete(id);
}

/**
 * Add prepared materials to campaign (from Prep AI)
 */
export async function addPreparedMaterials(
  campaignId: string,
  materials: {
    storyline?: string;
    majorArcs?: string[];
    npcs?: NPC[];
    locations?: Location[];
    encounters?: Encounter[];
    lootTable?: LootItem[];
  }
): Promise<Campaign> {
  const campaign = await getCampaign(campaignId);
  
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }
  
  const updated: Campaign = {
    ...campaign,
    preparedMaterials: {
      storyline: materials.storyline || campaign.preparedMaterials?.storyline || '',
      majorArcs: materials.majorArcs || campaign.preparedMaterials?.majorArcs || [],
      npcs: [...(campaign.preparedMaterials?.npcs || []), ...(materials.npcs || [])],
      locations: [...(campaign.preparedMaterials?.locations || []), ...(materials.locations || [])],
      encounters: [...(campaign.preparedMaterials?.encounters || []), ...(materials.encounters || [])],
      lootTable: [...(campaign.preparedMaterials?.lootTable || []), ...(materials.lootTable || [])],
    },
    updatedAt: new Date(),
  };
  
  await campaignStorage.save(updated);
  
  return updated;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Search campaigns by name or theme
 */
export async function searchCampaigns(query: string): Promise<Campaign[]> {
  const allCampaigns = await listCampaigns();
  const lowerQuery = query.toLowerCase();
  
  return allCampaigns.filter(campaign => 
    campaign.name.toLowerCase().includes(lowerQuery) ||
    campaign.theme.toLowerCase().includes(lowerQuery) ||
    campaign.description.toLowerCase().includes(lowerQuery)
  );
}

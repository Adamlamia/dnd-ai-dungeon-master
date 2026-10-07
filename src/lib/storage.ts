/**
 * In-Memory Storage for Vercel Serverless Deployment
 * 
 * This module provides a simple in-memory storage solution that works
 * on serverless platforms like Vercel where filesystem access is not available.
 * 
 * NOTE: Data persists only during the lifetime of the serverless function instance.
 * For production, consider using Vercel KV, Neon Postgres, or Supabase.
 */

import { Campaign, Character, Session } from '@/types';

// In-memory storage maps
const campaigns = new Map<string, Campaign>();
const characters = new Map<string, Character>();
const sessions = new Map<string, Session>();

/**
 * Campaign Storage
 */
export const campaignStorage = {
  async save(campaign: Campaign): Promise<void> {
    campaigns.set(campaign.id, campaign);
  },
  
  async get(id: string): Promise<Campaign | null> {
    return campaigns.get(id) || null;
  },
  
  async getAll(): Promise<Campaign[]> {
    return Array.from(campaigns.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  },
  
  async delete(id: string): Promise<void> {
    campaigns.delete(id);
  },
};

/**
 * Character Storage
 */
export const characterStorage = {
  async save(character: Character): Promise<void> {
    characters.set(character.id, character);
  },
  
  async get(id: string): Promise<Character | null> {
    return characters.get(id) || null;
  },
  
  async getAll(): Promise<Character[]> {
    return Array.from(characters.values());
  },
  
  async delete(id: string): Promise<void> {
    characters.delete(id);
  },
};

/**
 * Session Storage
 */
export const sessionStorage = {
  async save(session: Session): Promise<void> {
    sessions.set(session.id, session);
  },
  
  async get(id: string): Promise<Session | null> {
    return sessions.get(id) || null;
  },
  
  async getAll(): Promise<Session[]> {
    return Array.from(sessions.values());
  },
  
  async getByCampaignId(campaignId: string): Promise<Session[]> {
    return Array.from(sessions.values())
      .filter(s => s.campaignId === campaignId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  },
  
  async delete(id: string): Promise<void> {
    sessions.delete(id);
  },
};

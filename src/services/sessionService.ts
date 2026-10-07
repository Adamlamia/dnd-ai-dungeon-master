/**
 * Session Management Service
 * 
 * Handles creation, tracking, and persistence of game sessions
 * Uses in-memory storage compatible with Vercel serverless deployment
 */

import { Session, NarrativeEntry, CombatEntry, DiceRoll } from '@/types';
import { sessionStorage } from '@/lib/storage';

/**
 * Create a new session
 */
export async function createSession(
  campaignId: string,
  title: string,
  sessionNumber?: number
): Promise<Session> {
  // Determine session number if not provided
  if (sessionNumber === undefined) {
    const sessions = await listSessionsByCampaign(campaignId);
    sessionNumber = sessions.length + 1;
  }
  
  const session: Session = {
    id: generateId(),
    campaignId,
    sessionNumber,
    title,
    date: new Date(),
    status: 'planned',
    narrativeLog: [],
    diceRolls: [],
  };
  
  await sessionStorage.save(session);
  
  return session;
}

/**
 * Get session by ID
 */
export async function getSession(id: string): Promise<Session | null> {
  return await sessionStorage.get(id);
}

/**
 * List all sessions
 */
export async function listSessions(): Promise<Session[]> {
  try {
    const sessions = await sessionStorage.getAll();
    return (sessions as Session[]).sort((a: Session, b: Session) => b.date.getTime() - a.date.getTime());
  } catch (error) {
    console.error('Error listing sessions:', error);
    return [];
  }
}

/**
 * List sessions by campaign
 */
export async function listSessionsByCampaign(campaignId: string): Promise<Session[]> {
  return await sessionStorage.getByCampaignId(campaignId);
}

/**
 * Start a session (change status to in_progress)
 */
export async function startSession(sessionId: string): Promise<Session> {
  const session = await getSession(sessionId);
  
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  const updated: Session = {
    ...session,
    status: 'in_progress',
  };
  
  await sessionStorage.save(updated);
  
  return updated;
}

/**
 * End a session (change status to completed)
 */
export async function endSession(
  sessionId: string,
  recap?: string,
  nextSessionHook?: string
): Promise<Session> {
  const session = await getSession(sessionId);
  
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  const updated: Session = {
    ...session,
    status: 'completed',
    duration: Math.floor((Date.now() - session.date.getTime()) / 60000), // minutes
    recap,
    nextSessionHook,
  };
  
  await sessionStorage.save(updated);
  
  return updated;
}

/**
 * Add narrative entry to session
 */
export async function addNarrativeEntry(
  sessionId: string,
  entry: Omit<NarrativeEntry, 'timestamp'>
): Promise<Session> {
  const session = await getSession(sessionId);
  
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  const newEntry: NarrativeEntry = {
    ...entry,
    timestamp: new Date(),
  };
  
  const updated: Session = {
    ...session,
    narrativeLog: [...session.narrativeLog, newEntry],
  };
  
  await sessionStorage.save(updated);
  
  return updated;
}

/**
 * Record dice roll
 */
export async function recordDiceRoll(
  sessionId: string,
  roll: Omit<DiceRoll, 'id' | 'timestamp'>
): Promise<Session> {
  const session = await getSession(sessionId);
  
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  const newRoll: DiceRoll = {
    ...roll,
    id: generateId(),
    timestamp: new Date(),
  };
  
  const updated: Session = {
    ...session,
    diceRolls: [...session.diceRolls, newRoll],
  };
  
  await sessionStorage.save(updated);
  
  return updated;
}

/**
 * Add combat log entry
 */
export async function addCombatEntry(
  sessionId: string,
  combat: CombatEntry
): Promise<Session> {
  const session = await getSession(sessionId);
  
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  
  const updated: Session = {
    ...session,
    combatLog: [...(session.combatLog || []), combat],
  };
  
  await sessionStorage.save(updated);
  
  return updated;
}

/**
 * Delete session
 */
export async function deleteSession(id: string): Promise<void> {
  await sessionStorage.delete(id);
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get recent sessions (for dashboard)
 */
export async function getRecentSessions(limit: number = 5): Promise<Session[]> {
  const allSessions = await listSessions();
  return allSessions.slice(0, limit);
}

/**
 * Get active session for campaign
 */
export async function getActiveSession(campaignId: string): Promise<Session | null> {
  const sessions = await listSessionsByCampaign(campaignId);
  return sessions.find(s => s.status === 'in_progress') || null;
}

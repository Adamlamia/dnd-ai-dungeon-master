'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import NarrativeDisplay from '@/components/NarrativeDisplay';
import DiceRoller from '@/components/DiceRoller';

interface Campaign {
  id: string;
  name: string;
  description: string;
  theme: string;
  levelRange: { min: number; max: number };
  tone: string;
  status: string;
  preparedMaterials?: any;
}

interface Session {
  id: string;
  title: string;
  sessionNumber: number;
  status: string;
  narrativeLog: any[];
  diceRolls?: any[];
  recap?: string;
  nextSessionHook?: string;
}

interface PartyCharacter {
  id: string;
  name: string;
  race: string;
  classType: string;
  level: number;
}

export default function CampaignPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [party, setParty] = useState<PartyCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerInput, setPlayerInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    loadCampaign();
    loadSessions();
    loadParty();
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns?id=${campaignId}`);
      const data = await response.json();
      if (data.success) {
        setCampaign(data.data);
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
    }
  };

  const loadParty = async () => {
    try {
      const response = await fetch(`/api/characters?campaignId=${campaignId}`);
      const data = await response.json();
      if (data.success) {
        setParty(data.data);
      }
    } catch (error) {
      console.error('Failed to load party:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/sessions?campaignId=${campaignId}`);
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
        const active = data.data.find((s: Session) => s.status === 'in_progress');
        setActiveSession(active || null);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          title: `Session ${sessions.length + 1}`,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        // Start the session
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'start',
            sessionId: data.data.id,
          }),
        });
        loadSessions();
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const sendToAI = async () => {
    if (!playerInput.trim()) return;
    
    setAiThinking(true);
    
    try {
      // Add player action to narrative
      if (activeSession) {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'narrative',
            sessionId: activeSession.id,
            type: 'action',
            content: playerInput,
          }),
        });
        
        // Get AI narration
        const partyRoster = party.length
          ? party.map(c => `${c.name} (level ${c.level} ${c.race} ${c.classType})`).join('; ')
          : 'no registered party members';
        const aiResponse = await fetch('/api/ai/narrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'narrate',
            preparedDescription: campaign?.preparedMaterials?.storyline || 'A D&D adventure',
            playerActions: playerInput,
            context: `Campaign: ${campaign?.name}. Party: ${partyRoster}.`,
          }),
        });
        
        const aiData = await aiResponse.json();
        if (aiData.success) {
          // Add AI narration to session
          await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'narrative',
              sessionId: activeSession.id,
              type: 'narration',
              content: aiData.data.response,
            }),
          });
        }
      }
      
      setPlayerInput('');
      loadSessions();
    } catch (error) {
      console.error('Failed to get AI response:', error);
    } finally {
      setAiThinking(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    setEnding(true);
    try {
      // Build a plain-text event log from the narrative for the recap AI
      const sessionEvents = (activeSession.narrativeLog || [])
        .map((e: any) => `[${e.type}] ${e.content}`)
        .join('\n');

      let recap = '';
      if (sessionEvents.trim()) {
        const recapRes = await fetch('/api/ai/narrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'recap', sessionEvents }),
        });
        const recapData = await recapRes.json();
        if (recapData.success) {
          recap = recapData.data.response;
        }
      }

      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          sessionId: activeSession.id,
          recap: recap || 'Session ended.',
          nextSessionHook: '',
        }),
      });

      setActiveSession(null);
      loadSessions();
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!campaign) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Campaign not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <a href="/" className="text-purple-400 hover:text-purple-300 mb-2 inline-block">
            ← Back to Campaigns
          </a>
          <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
          <p className="text-gray-400 mt-1">{campaign.theme} • Levels {campaign.levelRange.min}-{campaign.levelRange.max}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Session Runner */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Session or Start Button */}
            {!activeSession ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <h2 className="text-xl font-bold text-white mb-4">No Active Session</h2>
                <button
                  onClick={startSession}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition"
                >
                  Start New Session
                </button>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">{activeSession.title}</h2>
                  <div className="flex items-center gap-2">
                    <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-sm">
                      In Progress
                    </span>
                    <button
                      onClick={endSession}
                      disabled={ending}
                      className="bg-red-700 hover:bg-red-600 disabled:opacity-50 px-3 py-1 rounded-full text-sm font-semibold transition"
                    >
                      {ending ? 'Ending…' : 'End Session'}
                    </button>
                  </div>
                </div>
                
                {/* Narrative Log */}
                <div className="mb-4 max-h-96 overflow-y-auto">
                  <NarrativeDisplay entries={activeSession.narrativeLog || []} />
                </div>
                
                {/* Player Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendToAI()}
                    placeholder="What do you want to do?"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    disabled={aiThinking}
                  />
                  <button
                    onClick={sendToAI}
                    disabled={aiThinking || !playerInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded transition"
                  >
                    {aiThinking ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Session History */}
            {sessions.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Session History</h3>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-gray-700 rounded px-4 py-3"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-white">{session.title}</div>
                          <div className="text-sm text-gray-400">
                            {session.narrativeLog?.length || 0} entries
                            {session.diceRolls?.length ? ` • ${session.diceRolls.length} rolls` : ''}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          session.status === 'completed' ? 'bg-gray-600 text-gray-300' :
                          'bg-green-900 text-green-300'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      {session.recap && (
                        <details className="mt-2">
                          <summary className="text-sm text-purple-400 cursor-pointer hover:text-purple-300">
                            Recap
                          </summary>
                          <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">
                            {session.recap}
                          </p>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <DiceRoller
              sessionId={activeSession?.id}
              onRollPersisted={loadSessions}
            />

            {/* Party Roster */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Party</h3>
                <a href="/characters" className="text-sm text-purple-400 hover:text-purple-300">Manage</a>
              </div>
              {party.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No characters linked to this campaign yet. Add them from the Characters page.
                </p>
              ) : (
                <div className="space-y-2">
                  {party.map((c) => (
                    <div key={c.id} className="bg-gray-700 rounded px-3 py-2">
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-xs text-gray-400">
                        Level {c.level} {c.race} {c.classType}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Campaign Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Campaign Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Theme:</span>{' '}
                  <span className="text-white">{campaign.theme}</span>
                </div>
                <div>
                  <span className="text-gray-400">Level Range:</span>{' '}
                  <span className="text-white">{campaign.levelRange.min}-{campaign.levelRange.max}</span>
                </div>
                <div>
                  <span className="text-gray-400">Tone:</span>{' '}
                  <span className="text-white capitalize">{campaign.tone}</span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>{' '}
                  <span className="text-white capitalize">{campaign.status}</span>
                </div>
              </div>
            </div>
            
            {/* Prepared Materials */}
            {campaign.preparedMaterials && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Prepared Materials</h3>
                <div className="space-y-2 text-sm">
                  {campaign.preparedMaterials.npcs?.length > 0 && (
                    <div className="text-gray-300">
                      {campaign.preparedMaterials.npcs.length} NPCs created
                    </div>
                  )}
                  {campaign.preparedMaterials.encounters?.length > 0 && (
                    <div className="text-gray-300">
                      {campaign.preparedMaterials.encounters.length} encounters designed
                    </div>
                  )}
                  {campaign.preparedMaterials.locations?.length > 0 && (
                    <div className="text-gray-300">
                      {campaign.preparedMaterials.locations.length} locations mapped
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

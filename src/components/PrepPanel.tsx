'use client';

import { useState } from 'react';

interface NPC {
  id: string;
  name: string;
  role?: string;
  race?: string;
  classType?: string;
  alignment?: string;
  description?: string;
}

interface Encounter {
  id: string;
  name: string;
  type?: string;
  difficulty?: string;
  overview?: string;
}

interface Location {
  id: string;
  name: string;
  type?: string;
  visualDescription?: string;
}

interface PreparedMaterials {
  storyline?: string;
  npcs?: NPC[];
  encounters?: Encounter[];
  locations?: Location[];
}

interface PrepPanelProps {
  campaignId: string;
  campaignName: string;
  materials?: PreparedMaterials;
  onGenerated: () => void;
}

const EMPTY_NPC = { role: '', race: '', classType: '', alignment: '', context: '' };
const EMPTY_ENC = { encounterType: 'combat', difficulty: 'medium', partyLevel: '', partySize: '', context: '' };
const EMPTY_LOC = { locationType: '', atmosphere: '', purpose: '' };

export default function PrepPanel({ campaignId, campaignName, materials, onGenerated }: PrepPanelProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [npc, setNpc] = useState(EMPTY_NPC);
  const [enc, setEnc] = useState(EMPTY_ENC);
  const [loc, setLoc] = useState(EMPTY_LOC);

  const callPrepare = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      onGenerated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prep AI generation failed');
    } finally {
      setBusy(null);
    }
  };

  const input = 'w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm placeholder-gray-400';
  const label = 'block text-xs font-medium text-gray-400 mb-1';

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4">Campaign Prep (Prep AI)</h3>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded p-3 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Storyline */}
      <div className="mb-6">
        <button
          onClick={() => callPrepare('storyline', { generateStoryline: true })}
          disabled={busy !== null}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded font-semibold transition text-sm"
        >
          {busy === 'storyline' ? 'Generating storyline…' : 'Generate Storyline'}
        </button>
        {materials?.storyline && (
          <details className="mt-2">
            <summary className="text-sm text-purple-400 cursor-pointer hover:text-purple-300">
              View storyline
            </summary>
            <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
              {materials.storyline}
            </p>
          </details>
        )}
      </div>

      {/* NPC */}
      <div className="mb-6 border-t border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-white mb-3">Generate NPC</h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className={label}>Role</label>
            <input className={input} value={npc.role} placeholder="Quest giver"
              onChange={(e) => setNpc({ ...npc, role: e.target.value })} />
          </div>
          <div>
            <label className={label}>Race</label>
            <input className={input} value={npc.race} placeholder="Dwarf"
              onChange={(e) => setNpc({ ...npc, race: e.target.value })} />
          </div>
          <div>
            <label className={label}>Class</label>
            <input className={input} value={npc.classType} placeholder="Commoner"
              onChange={(e) => setNpc({ ...npc, classType: e.target.value })} />
          </div>
          <div>
            <label className={label}>Alignment</label>
            <input className={input} value={npc.alignment} placeholder="Lawful Good"
              onChange={(e) => setNpc({ ...npc, alignment: e.target.value })} />
          </div>
        </div>
        <div className="mb-2">
          <label className={label}>Context</label>
          <input className={input} value={npc.context} placeholder={`Role in ${campaignName}`}
            onChange={(e) => setNpc({ ...npc, context: e.target.value })} />
        </div>
        <button
          onClick={() => callPrepare('npc', {
            generateNPCs: true,
            npcParams: [{
              role: npc.role || 'NPC',
              race: npc.race || 'Human',
              classType: npc.classType || 'Commoner',
              alignment: npc.alignment || 'True Neutral',
              context: npc.context || `Part of ${campaignName}`,
            }],
          })}
          disabled={busy !== null || !npc.role.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded font-semibold transition text-sm"
        >
          {busy === 'npc' ? 'Generating NPC…' : 'Generate NPC'}
        </button>
        {materials?.npcs && materials.npcs.length > 0 && (
          <ul className="mt-3 space-y-1">
            {materials.npcs.map((n) => (
              <li key={n.id} className="bg-gray-700 rounded px-3 py-2 text-sm">
                <span className="font-semibold text-white">{n.name}</span>
                <span className="text-gray-400"> — {n.race} {n.classType}, {n.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Encounter */}
      <div className="mb-6 border-t border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-white mb-3">Generate Encounter</h4>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className={label}>Type</label>
            <select className={input} value={enc.encounterType}
              onChange={(e) => setEnc({ ...enc, encounterType: e.target.value })}>
              <option value="combat">Combat</option>
              <option value="social">Social</option>
              <option value="exploration">Exploration</option>
              <option value="puzzle">Puzzle</option>
            </select>
          </div>
          <div>
            <label className={label}>Difficulty</label>
            <select className={input} value={enc.difficulty}
              onChange={(e) => setEnc({ ...enc, difficulty: e.target.value })}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="deadly">Deadly</option>
            </select>
          </div>
          <div>
            <label className={label}>Party Level</label>
            <input className={input} type="number" value={enc.partyLevel} placeholder="3"
              onChange={(e) => setEnc({ ...enc, partyLevel: e.target.value })} />
          </div>
          <div>
            <label className={label}>Party Size</label>
            <input className={input} type="number" value={enc.partySize} placeholder="4"
              onChange={(e) => setEnc({ ...enc, partySize: e.target.value })} />
          </div>
        </div>
        <div className="mb-2">
          <label className={label}>Context</label>
          <input className={input} value={enc.context} placeholder={`${campaignName} ambush`}
            onChange={(e) => setEnc({ ...enc, context: e.target.value })} />
        </div>
        <button
          onClick={() => callPrepare('enc', {
            generateEncounters: true,
            encounterParams: [{
              encounterType: enc.encounterType,
              difficulty: enc.difficulty,
              partyLevel: enc.partyLevel ? Number(enc.partyLevel) : undefined,
              partySize: enc.partySize ? Number(enc.partySize) : undefined,
              context: enc.context || campaignName,
            }],
          })}
          disabled={busy !== null}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded font-semibold transition text-sm"
        >
          {busy === 'enc' ? 'Generating encounter…' : 'Generate Encounter'}
        </button>
        {materials?.encounters && materials.encounters.length > 0 && (
          <ul className="mt-3 space-y-1">
            {materials.encounters.map((en) => (
              <li key={en.id} className="bg-gray-700 rounded px-3 py-2 text-sm">
                <span className="font-semibold text-white">{en.name}</span>
                <span className="text-gray-400"> — {en.difficulty} {en.type}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Location */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-white mb-3">Generate Location</h4>
        <div className="mb-2">
          <label className={label}>Type</label>
          <input className={input} value={loc.locationType} placeholder="Abandoned mine"
            onChange={(e) => setLoc({ ...loc, locationType: e.target.value })} />
        </div>
        <div className="mb-2">
          <label className={label}>Atmosphere</label>
          <input className={input} value={loc.atmosphere} placeholder="Dark and foreboding"
            onChange={(e) => setLoc({ ...loc, atmosphere: e.target.value })} />
        </div>
        <div className="mb-2">
          <label className={label}>Purpose</label>
          <input className={input} value={loc.purpose} placeholder="Goblin hideout"
            onChange={(e) => setLoc({ ...loc, purpose: e.target.value })} />
        </div>
        <button
          onClick={() => callPrepare('loc', {
            generateLocations: true,
            locationParams: [{
              locationType: loc.locationType || 'General',
              atmosphere: loc.atmosphere || 'Neutral',
              purpose: loc.purpose || campaignName,
            }],
          })}
          disabled={busy !== null || !loc.locationType.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded font-semibold transition text-sm"
        >
          {busy === 'loc' ? 'Generating location…' : 'Generate Location'}
        </button>
        {materials?.locations && materials.locations.length > 0 && (
          <ul className="mt-3 space-y-1">
            {materials.locations.map((l) => (
              <li key={l.id} className="bg-gray-700 rounded px-3 py-2 text-sm">
                <span className="font-semibold text-white">{l.name}</span>
                <span className="text-gray-400"> — {l.type}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

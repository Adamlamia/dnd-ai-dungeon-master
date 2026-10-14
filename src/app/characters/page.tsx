'use client';

import { useState, useEffect } from 'react';
import CharacterSheet from '@/components/CharacterSheet';

interface Character {
  id: string;
  name: string;
  race: string;
  classType: string;
  level: number;
  dndbeyondUrl?: string;
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showImportForm, setShowImportForm] = useState(false);
  const [dndbeyondUrl, setDndbeyondUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  useEffect(() => {
    loadCharacters();
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data.map((c: any) => ({ id: c.id, name: c.name })));
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const loadCharacters = async () => {
    try {
      const response = await fetch('/api/characters');
      const data = await response.json();
      if (data.success) {
        setCharacters(data.data);
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const importCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import-dndbeyond',
          characterIdOrUrl: dndbeyondUrl,
          playerId: 'player-1', // TODO: Get from auth context
          campaignId: selectedCampaignId || undefined,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setDndbeyondUrl('');
        setShowImportForm(false);
        loadCharacters();
        setSelectedCharacter(data.data);
      } else {
        alert('Failed to import: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to import character:', error);
      alert('Failed to import character');
    } finally {
      setImporting(false);
    }
  };

  const loadCharacterDetail = async (id: string) => {
    try {
      const response = await fetch(`/api/characters?id=${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedCharacter(data.data);
      }
    } catch (error) {
      console.error('Failed to load character:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <a href="/" className="text-purple-400 hover:text-purple-300 mb-2 inline-block">
            ← Back to Home
          </a>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Characters</h1>
            <button
              onClick={() => setShowImportForm(!showImportForm)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition"
            >
              {showImportForm ? 'Cancel' : 'Import from D&D Beyond'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Import Form */}
        {showImportForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Import Character from D&D Beyond</h2>
            <form onSubmit={importCharacter}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  D&D Beyond Character URL or ID
                </label>
                <input
                  type="text"
                  value={dndbeyondUrl}
                  onChange={(e) => setDndbeyondUrl(e.target.value)}
                  placeholder="https://www.dndbeyond.com/characters/12345678 or just 12345678"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Find your character ID in the D&D Beyond URL
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Link to Campaign (optional)
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="">— No campaign —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Linked characters appear in the campaign's party roster and inform AI narration.
                </p>
              </div>
              <button
                type="submit"
                disabled={importing}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded font-semibold transition"
              >
                {importing ? 'Importing...' : 'Import Character'}
              </button>
            </form>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Character List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">Your Characters</h2>
            
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : characters.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-400 mb-2">No characters yet</p>
                <p className="text-sm text-gray-500">Import a character from D&D Beyond to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {characters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => loadCharacterDetail(character.id)}
                    className={`w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-left transition ${
                      selectedCharacter?.id === character.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    <div className="font-bold text-white">{character.name}</div>
                    <div className="text-sm text-gray-400">
                      Level {character.level} {character.race} {character.classType}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Character Detail */}
          <div className="lg:col-span-2">
            {selectedCharacter ? (
              <CharacterSheet 
                character={selectedCharacter}
                onRefresh={async () => {
                  if (selectedCharacter.dndbeyondId) {
                    try {
                      const response = await fetch(`/api/characters?id=${selectedCharacter.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh: true }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setSelectedCharacter(data.data);
                        loadCharacters();
                      }
                    } catch (error) {
                      console.error('Failed to refresh:', error);
                    }
                  }
                }}
              />
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400 text-lg">Select a character to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

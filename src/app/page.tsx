'use client';

import { useState, useEffect } from 'react';
import DiceRoller from '@/components/DiceRoller';

interface Campaign {
  id: string;
  name: string;
  theme: string;
  levelRange: { min: number; max: number };
  status: string;
}

export default function Home() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    theme: '',
    levelMin: 1,
    levelMax: 1,
  });

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaign.name,
          theme: newCampaign.theme,
          levelRange: {
            min: newCampaign.levelMin,
            max: newCampaign.levelMax,
          },
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setNewCampaign({ name: '', theme: '', levelMin: 1, levelMax: 1 });
        setShowCreateForm(false);
        loadCampaigns();
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">D&D AI Dungeon Master</h1>
              <p className="text-gray-400 mt-1">Your AI-powered companion for epic adventures</p>
            </div>
            <div className="flex gap-3">
              <a
                href="/characters"
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
              >
                Characters
              </a>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition"
              >
                {showCreateForm ? 'Cancel' : 'New Campaign'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Create Campaign Form */}
        {showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 animate-fade-in">
            <h2 className="text-xl font-bold text-white mb-4">Create New Campaign</h2>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Theme
                </label>
                <input
                  type="text"
                  value={newCampaign.theme}
                  onChange={(e) => setNewCampaign({...newCampaign, theme: e.target.value})}
                  placeholder="e.g., Dark Fantasy, High Magic, Political Intrigue"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Starting Level
                  </label>
                  <input
                    type="number"
                    value={newCampaign.levelMin}
                    onChange={(e) => setNewCampaign({...newCampaign, levelMin: parseInt(e.target.value)})}
                    min="1"
                    max="20"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Level
                  </label>
                  <input
                    type="number"
                    value={newCampaign.levelMax}
                    onChange={(e) => setNewCampaign({...newCampaign, levelMax: parseInt(e.target.value)})}
                    min="1"
                    max="20"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold transition"
              >
                Create Campaign
              </button>
            </form>
          </div>
        )}

        {/* Campaign List */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Campaigns</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : campaigns.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">No campaigns yet</p>
              <p className="text-sm text-gray-500">Create your first campaign to get started!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <a
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition block"
                >
                  <h3 className="text-lg font-bold text-white mb-2">{campaign.name}</h3>
                  <p className="text-sm text-purple-400 mb-2">{campaign.theme}</p>
                  <p className="text-sm text-gray-400">
                    Levels {campaign.levelRange.min}-{campaign.levelRange.max}
                  </p>
                  <span className={`inline-block mt-3 px-2 py-1 rounded text-xs ${
                    campaign.status === 'active' ? 'bg-green-900 text-green-300' :
                    campaign.status === 'planning' ? 'bg-blue-900 text-blue-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {campaign.status}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Quick Tools */}
        <div className="grid md:grid-cols-2 gap-6">
          <DiceRoller />
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">Quick Links</h3>
            <div className="space-y-2">
              <a
                href="/characters"
                className="block bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded transition"
              >
                📋 Manage Characters
              </a>
              <a
                href="https://www.dndbeyond.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded transition"
              >
                🔗 D&D Beyond
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

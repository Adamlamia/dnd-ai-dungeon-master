'use client';

import { useState } from 'react';

interface DiceRollResult {
  notation: string;
  rolls: number[];
  total: number;
  modifier: number;
  breakdown: string;
}

export default function DiceRoller() {
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rollDice = async (notation: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/dice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'roll',
          notation,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to roll dice');
    } finally {
      setLoading(false);
    }
  };

  const quickRolls = [
    { label: 'd4', notation: '1d4' },
    { label: 'd6', notation: '1d6' },
    { label: 'd8', notation: '1d8' },
    { label: 'd10', notation: '1d10' },
    { label: 'd12', notation: '1d12' },
    { label: 'd20', notation: '1d20' },
    { label: 'd100', notation: '1d100' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-purple-400">Dice Roller</h3>
      
      {/* Quick Roll Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {quickRolls.map((die) => (
          <button
            key={die.label}
            onClick={() => rollDice(die.notation)}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-3 py-2 rounded font-mono transition"
          >
            {die.label}
          </button>
        ))}
      </div>
      
      {/* Custom Roll Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="e.g., 2d6+3, 4d6"
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              rollDice(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
        <button
          onClick={(e) => {
            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
            rollDice(input.value);
            input.value = '';
          }}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded transition"
        >
          Roll
        </button>
      </div>
      
      {/* Result Display */}
      {loading && (
        <div className="text-center py-4 text-gray-400">Rolling...</div>
      )}
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded p-3 text-red-300">
          {error}
        </div>
      )}
      
      {result && !loading && (
        <div className="bg-gray-700 rounded p-4 animate-fade-in">
          <div className="text-sm text-gray-400 mb-1">{result.notation}</div>
          <div className="text-3xl font-bold text-white mb-2">{result.total}</div>
          <div className="text-sm text-gray-300 font-mono">{result.breakdown}</div>
          {result.rolls.length > 1 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {result.rolls.map((roll, i) => (
                <span
                  key={i}
                  className={`inline-block px-2 py-1 rounded text-sm ${
                    roll === 20 ? 'bg-green-600' :
                    roll === 1 ? 'bg-red-600' :
                    'bg-gray-600'
                  }`}
                >
                  {roll}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

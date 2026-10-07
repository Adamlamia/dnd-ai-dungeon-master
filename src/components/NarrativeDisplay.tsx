'use client';

import { NarrativeEntry } from '@/types';

interface NarrativeDisplayProps {
  entries: NarrativeEntry[];
}

export default function NarrativeDisplay({ entries }: NarrativeDisplayProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        <p>No narrative yet. The adventure begins when you take action!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div
          key={index}
          className={`rounded-lg p-4 animate-fade-in ${
            entry.type === 'narration' ? 'bg-gray-800' :
            entry.type === 'dialogue' ? 'bg-blue-900/30 border-l-4 border-blue-500' :
            entry.type === 'action' ? 'bg-green-900/30 border-l-4 border-green-500' :
            'bg-purple-900/30 border-l-4 border-purple-500'
          }`}
        >
          {/* Timestamp */}
          <div className="text-xs text-gray-500 mb-2">
            {new Date(entry.timestamp).toLocaleTimeString()}
          </div>
          
          {/* Speaker (for dialogue) */}
          {entry.speaker && (
            <div className="font-semibold text-purple-400 mb-1">{entry.speaker}</div>
          )}
          
          {/* Content */}
          <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
            {entry.content}
          </div>
          
          {/* Metadata */}
          {entry.metadata?.location && (
            <div className="mt-2 text-xs text-gray-500">
              📍 {entry.metadata.location}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

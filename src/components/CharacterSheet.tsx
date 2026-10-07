'use client';

import { Character } from '@/types';

interface CharacterSheetProps {
  character: Character;
  onRefresh?: () => void;
}

export default function CharacterSheet({ character, onRefresh }: CharacterSheetProps) {
  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);

  const abilityScores = [
    { name: 'STR', value: character.abilityScores.strength },
    { name: 'DEX', value: character.abilityScores.dexterity },
    { name: 'CON', value: character.abilityScores.constitution },
    { name: 'INT', value: character.abilityScores.intelligence },
    { name: 'WIS', value: character.abilityScores.wisdom },
    { name: 'CHA', value: character.abilityScores.charisma },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{character.name}</h2>
            <p className="text-gray-400">
              Level {character.level} {character.race} {character.classType}
            </p>
          </div>
          {character.dndbeyondUrl && (
            <a
              href={character.dndbeyondUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-400 hover:text-purple-300 underline"
            >
              View on D&D Beyond
            </a>
          )}
          {onRefresh && character.dndbeyondId && (
            <button
              onClick={onRefresh}
              className="text-sm text-blue-400 hover:text-blue-300 ml-4"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Combat Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Armor Class</div>
          <div className="text-2xl font-bold text-white">{character.armorClass}</div>
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Hit Points</div>
          <div className="text-2xl font-bold text-white">
            {character.hitPoints.current}/{character.hitPoints.maximum}
          </div>
          {character.hitPoints.temp > 0 && (
            <div className="text-xs text-blue-400">+{character.hitPoints.temp} temp</div>
          )}
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">Speed</div>
          <div className="text-2xl font-bold text-white">{character.speed}ft</div>
        </div>
      </div>

      {/* Ability Scores */}
      <div>
        <h3 className="text-lg font-semibold text-purple-400 mb-3">Ability Scores</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {abilityScores.map((ability) => {
            const modifier = calculateModifier(ability.value);
            return (
              <div key={ability.name} className="bg-gray-700 rounded p-3 text-center">
                <div className="text-xs font-bold text-gray-400 mb-1">{ability.name}</div>
                <div className="text-xl font-bold text-white">{ability.value}</div>
                <div className="text-sm text-gray-300">
                  {modifier >= 0 ? '+' : ''}{modifier}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proficiency Bonus */}
      <div className="bg-gray-700 rounded p-3">
        <span className="text-gray-400">Proficiency Bonus:</span>{' '}
        <span className="font-bold text-white">+{character.proficiencyBonus}</span>
      </div>

      {/* Skills */}
      {Object.keys(character.skills).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-purple-400 mb-3">Skills</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(character.skills).map(([skillName, skillData]) => (
              <div
                key={skillName}
                className={`bg-gray-700 rounded px-3 py-2 flex justify-between ${
                  skillData.proficient ? 'border-l-4 border-purple-500' : ''
                }`}
              >
                <span className="text-gray-300">{skillName}</span>
                <span className="font-bold text-white">
                  {skillData.value >= 0 ? '+' : ''}{skillData.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spells */}
      {character.spells && (
        <div>
          <h3 className="text-lg font-semibold text-purple-400 mb-3">Spells</h3>
          {character.spells.cantrips.length > 0 && (
            <div className="mb-3">
              <div className="text-sm text-gray-400 mb-1">Cantrips</div>
              <div className="flex flex-wrap gap-2">
                {character.spells.cantrips.map((spell, i) => (
                  <span key={i} className="bg-gray-700 px-2 py-1 rounded text-sm">
                    {spell}
                  </span>
                ))}
              </div>
            </div>
          )}
          {Object.entries(character.spells.levels).map(([level, spells]) => {
            if (spells.length === 0) return null;
            return (
              <div key={level} className="mb-3">
                <div className="text-sm text-gray-400 mb-1">Level {level}</div>
                <div className="flex flex-wrap gap-2">
                  {spells.map((spell, i) => (
                    <span key={i} className="bg-gray-700 px-2 py-1 rounded text-sm">
                      {spell}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Backstory & Personality */}
      {(character.backstory || character.personalityTraits) && (
        <div>
          <h3 className="text-lg font-semibold text-purple-400 mb-3">Roleplay</h3>
          {character.backstory && (
            <div className="mb-3">
              <div className="text-sm text-gray-400 mb-1">Backstory</div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{character.backstory}</p>
            </div>
          )}
          {character.personalityTraits && (
            <div className="space-y-2">
              {character.personalityTraits.traits && (
                <div>
                  <span className="text-sm text-gray-400">Traits: </span>
                  <span className="text-gray-300 text-sm">{character.personalityTraits.traits}</span>
                </div>
              )}
              {character.personalityTraits.ideals && (
                <div>
                  <span className="text-sm text-gray-400">Ideals: </span>
                  <span className="text-gray-300 text-sm">{character.personalityTraits.ideals}</span>
                </div>
              )}
              {character.personalityTraits.bonds && (
                <div>
                  <span className="text-sm text-gray-400">Bonds: </span>
                  <span className="text-gray-300 text-sm">{character.personalityTraits.bonds}</span>
                </div>
              )}
              {character.personalityTraits.flaws && (
                <div>
                  <span className="text-sm text-gray-400">Flaws: </span>
                  <span className="text-gray-300 text-sm">{character.personalityTraits.flaws}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Inventory */}
      {character.inventory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-purple-400 mb-3">Inventory</h3>
          <div className="flex flex-wrap gap-2">
            {character.inventory.map((item, i) => (
              <span key={i} className="bg-gray-700 px-2 py-1 rounded text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

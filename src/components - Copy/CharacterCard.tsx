import React from "react";
import type { PlayerCharacter } from "../types/character";

interface CharacterCardProps {
  character: PlayerCharacter;
  onClick?: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onClick }) => {
  // const factions = useQuery(api.factions.getFactionsByIds, {
  //   ids: character.factionId ? [character.factionId as any] : [],
  // });

  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const formatModifier = (modifier: number): string => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  // const faction = factions && factions.length > 0 ? factions[0] : null;

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{character.name}</h3>
          <p className="text-gray-600">
            Level {character.level} {character.race} {character.class}
          </p>
          <p className="text-sm text-gray-500">{character.background}</p>
          {/* {faction && (
            <p className="text-sm text-blue-600 font-medium">
              🏛️ {faction.name}
            </p>
          )} */}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">AC</div>
          <div className="text-lg font-semibold">{character.armorClass}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">HP</div>
          <div className="font-semibold">
            {character.hitPoints}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">AC</div>
          <div className="font-semibold">{character.armorClass}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Prof. Bonus</div>
          <div className="font-semibold">
            +{character.proficiencyBonus}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-4">
        {Object.entries(character.abilityScores).map(([ability, score]) => (
          <div key={ability} className="text-center">
            <div className="text-xs text-gray-500 uppercase">
              {ability.slice(0, 3)}
            </div>
            <div className="font-semibold">{score}</div>
            <div className="text-xs text-gray-600">
              {formatModifier(getAbilityModifier(score))}
            </div>
          </div>
        ))}
      </div>

      {character.skills.length > 0 && (
        <div className="mb-2">
          <div className="text-sm text-gray-500 mb-1">Skills:</div>
          <div className="text-sm text-gray-700">
            {character.skills.join(", ")}
          </div>
        </div>
      )}

      {character.languages && character.languages.length > 0 && (
        <div className="mb-2">
          <div className="text-sm text-gray-500 mb-1">Languages:</div>
          <div className="text-sm text-gray-700">
            {character.languages.join(", ")}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 mt-4">
        Created: {new Date(character.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
};

export default CharacterCard;

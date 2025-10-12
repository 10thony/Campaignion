import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import './InitiativeManager.css';

interface InitiativeManagerProps {
  interactionId: Id<"interactions">;
}

interface InitiativeRoll {
  entityId: string;
  entityType: 'playerCharacter' | 'npc' | 'monster';
  initiativeRoll: number;
}

export const InitiativeManager: React.FC<InitiativeManagerProps> = ({
  interactionId
}) => {
  const [initiativeRolls, setInitiativeRolls] = useState<InitiativeRoll[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [manualRolls, setManualRolls] = useState<Record<string, number>>({});

  // Queries
  const interaction = useQuery(
    api.interactions.getInteractionWithParticipants,
    { interactionId }
  );
  const currentInitiative = useQuery(
    api.interactions.getInitiativeOrder,
    { interactionId }
  );

  // Mutations
  const rollInitiative = useMutation(api.interactions.rollInitiative);

  useEffect(() => {
    if (interaction) {
      const allParticipants: InitiativeRoll[] = [];
      
      // Add player characters
      interaction.participants.playerCharacters?.forEach(pc => {
        if (pc) {
          allParticipants.push({
            entityId: pc._id,
            entityType: 'playerCharacter',
            initiativeRoll: 0
          });
        }
      });
      
      // Add NPCs
      interaction.participants.npcs?.forEach(npc => {
        if (npc) {
          allParticipants.push({
            entityId: npc._id,
            entityType: 'npc',
            initiativeRoll: 0
          });
        }
      });
      
      // Add monsters
      interaction.participants.monsters?.forEach(monster => {
        if (monster) {
          allParticipants.push({
            entityId: monster._id,
            entityType: 'monster',
            initiativeRoll: 0
          });
        }
      });
      
      setInitiativeRolls(allParticipants);
    }
  }, [interaction]);

  const rollD20 = () => {
    return Math.floor(Math.random() * 20) + 1;
  };

  const calculateInitiative = (entity: any, entityType: string) => {
    let initiativeModifier = 0;
    
    if (entityType === 'playerCharacter' || entityType === 'npc') {
      // Calculate initiative modifier from dexterity
      const dexModifier = Math.floor((entity.abilityScores.dexterity - 10) / 2);
      initiativeModifier = dexModifier;
    } else if (entityType === 'monster') {
      // Use monster's dexterity modifier
      const dexModifier = Math.floor((entity.abilityScores.dexterity - 10) / 2);
      initiativeModifier = dexModifier;
    }
    
    return rollD20() + initiativeModifier;
  };

  const handleAutoRoll = async () => {
    if (!interaction) return;

    setIsRolling(true);
    
    try {
      const rolls: InitiativeRoll[] = [];
      
      // Roll for player characters
      interaction.participants.playerCharacters?.forEach(pc => {
        if (pc) {
          const roll = calculateInitiative(pc, 'playerCharacter');
          rolls.push({
            entityId: pc._id,
            entityType: 'playerCharacter',
            initiativeRoll: roll
          });
        }
      });
      
      // Roll for NPCs
      interaction.participants.npcs?.forEach(npc => {
        if (npc) {
          const roll = calculateInitiative(npc, 'npc');
          rolls.push({
            entityId: npc._id,
            entityType: 'npc',
            initiativeRoll: roll
          });
        }
      });
      
      // Roll for monsters
      interaction.participants.monsters?.forEach(monster => {
        if (monster) {
          const roll = calculateInitiative(monster, 'monster');
          rolls.push({
            entityId: monster._id,
            entityType: 'monster',
            initiativeRoll: roll
          });
        }
      });
      
      await rollInitiative({
        interactionId,
        initiativeRolls: rolls
      });
      
    } catch (error) {
      console.error('Error rolling initiative:', error);
      alert('Failed to roll initiative. Please try again.');
    } finally {
      setIsRolling(false);
    }
  };

  const handleManualRoll = async () => {
    if (!interaction) return;

    setIsRolling(true);
    
    try {
      const rolls: InitiativeRoll[] = [];
      
      initiativeRolls.forEach(participant => {
        const manualRoll = manualRolls[participant.entityId];
        if (manualRoll !== undefined) {
          rolls.push({
            ...participant,
            initiativeRoll: manualRoll
          });
        } else {
          // Use auto-roll for participants without manual rolls
          let entity;
          if (participant.entityType === 'playerCharacter') {
            entity = interaction.participants.playerCharacters?.find(pc => pc?._id === participant.entityId);
          } else if (participant.entityType === 'npc') {
            entity = interaction.participants.npcs?.find(npc => npc?._id === participant.entityId);
          } else {
            entity = interaction.participants.monsters?.find(monster => monster?._id === participant.entityId);
          }
          
          if (entity) {
            rolls.push({
              ...participant,
              initiativeRoll: calculateInitiative(entity, participant.entityType)
            });
          }
        }
      });
      
      await rollInitiative({
        interactionId,
        initiativeRolls: rolls
      });
      
    } catch (error) {
      console.error('Error rolling initiative:', error);
      alert('Failed to roll initiative. Please try again.');
    } finally {
      setIsRolling(false);
    }
  };

  const handleManualRollChange = (entityId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setManualRolls(prev => ({
      ...prev,
      [entityId]: numValue
    }));
  };

  const getEntityName = (entityId: string, entityType: string) => {
    if (!interaction) return 'Unknown';
    
    if (entityType === 'playerCharacter') {
      return interaction.participants.playerCharacters?.find(pc => pc?._id === entityId)?.name || 'Unknown';
    } else if (entityType === 'npc') {
      return interaction.participants.npcs?.find(npc => npc?._id === entityId)?.name || 'Unknown';
    } else {
      return interaction.participants.monsters?.find(monster => monster?._id === entityId)?.name || 'Unknown';
    }
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'playerCharacter':
        return '👤';
      case 'npc':
        return '🧙';
      case 'monster':
        return '🐉';
      default:
        return '❓';
    }
  };

  if (!interaction) {
    return <div className="initiative-manager loading">Loading interaction data...</div>;
  }

  return (
    <div className="initiative-manager">
      <div className="manager-header">
        <h3>Initiative Manager</h3>
        {currentInitiative && (
          <div className="initiative-status">
            <span className="status-badge">Initiative Set</span>
          </div>
        )}
      </div>

      {!currentInitiative ? (
        <div className="initiative-setup">
          <div className="setup-header">
            <h4>Roll Initiative</h4>
            <p>Set the turn order for all participants</p>
          </div>

          <div className="participants-list">
            <h5>Participants ({initiativeRolls.length})</h5>
            <div className="participant-items">
              {initiativeRolls.map((participant) => (
                <div key={participant.entityId} className="participant-item">
                  <div className="participant-info">
                    <span className="participant-icon">
                      {getEntityTypeIcon(participant.entityType)}
                    </span>
                    <div className="participant-details">
                      <div className="participant-name">
                        {getEntityName(participant.entityId, participant.entityType)}
                      </div>
                      <div className="participant-type">
                        {participant.entityType.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    </div>
                  </div>
                  <div className="initiative-input">
                    <label>Initiative:</label>
                    <input
                      type="number"
                      value={manualRolls[participant.entityId] || ''}
                      onChange={(e) => handleManualRollChange(participant.entityId, e.target.value)}
                      placeholder="Auto"
                      min="1"
                      max="50"
                      className="initiative-input-field"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="roll-buttons">
            <button
              className="btn-auto-roll"
              onClick={handleAutoRoll}
              disabled={isRolling}
            >
              {isRolling ? 'Rolling...' : '🎲 Auto Roll All'}
            </button>
            <button
              className="btn-manual-roll"
              onClick={handleManualRoll}
              disabled={isRolling}
            >
              {isRolling ? 'Rolling...' : '📝 Manual Roll'}
            </button>
          </div>
        </div>
      ) : (
        <div className="initiative-display">
          <div className="display-header">
            <h4>Initiative Order</h4>
            <button
              className="btn-reroll"
              onClick={() => window.location.reload()}
            >
              🔄 Reroll
            </button>
          </div>

          <div className="initiative-order">
            {currentInitiative.initiativeOrder.map((participant, index) => (
              <div
                key={`${participant.entityId}-${index}`}
                className={`order-item ${index === currentInitiative.currentIndex ? 'current-turn' : ''}`}
              >
                <div className="order-number">{index + 1}</div>
                <div className="order-participant">
                  <span className="participant-icon">
                    {getEntityTypeIcon(participant.entityType)}
                  </span>
                  <div className="participant-details">
                    <div className="participant-name">
                      {getEntityName(participant.entityId, participant.entityType)}
                    </div>
                    <div className="participant-type">
                      {participant.entityType.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                  </div>
                </div>
                <div className="order-roll">{participant.initiativeRoll}</div>
              </div>
            ))}
          </div>

          <div className="current-turn-indicator">
            <h5>Current Turn</h5>
            {currentInitiative.currentParticipant ? (
              <div className="current-participant">
                <span className="participant-icon">
                  {getEntityTypeIcon(currentInitiative.currentParticipant.entityType)}
                </span>
                <span className="participant-name">
                  {getEntityName(currentInitiative.currentParticipant.entityId, currentInitiative.currentParticipant.entityType)}
                </span>
                <span className="initiative-roll">
                  (Initiative: {currentInitiative.currentParticipant.initiativeRoll})
                </span>
              </div>
            ) : (
              <p>No current turn</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 
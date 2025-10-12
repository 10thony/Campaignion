import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { DiceRoller } from './DiceRoller';
import './CombatStateManager.css';

interface CombatStateManagerProps {
  interactionId: Id<"interactions">;
}

interface CombatEntity {
  id: string;
  name: string;
  type: 'playerCharacter' | 'npc' | 'monster';
  maxHp: number;
  currentHp: number;
  armorClass: number;
  statusEffects: StatusEffect[];
  spellSlots?: SpellSlot[];
  equipment?: Equipment[];
  initiativeRoll?: number;
  isActive?: boolean;
}

interface StatusEffect {
  id: string;
  name: string;
  description: string;
  duration: number; // rounds remaining
  effect: 'buff' | 'debuff' | 'neutral';
  icon: string;
}

interface SpellSlot {
  level: number;
  max: number;
  used: number;
}

interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'other';
  uses?: number;
  maxUses?: number;
}

interface DamageLog {
  id: string;
  targetId: string;
  targetName: string;
  damage: number;
  damageType: string;
  source: string;
  timestamp: number;
  isHealing: boolean;
}

export const CombatStateManager: React.FC<CombatStateManagerProps> = ({
  interactionId
}) => {
  const [combatEntities, setCombatEntities] = useState<CombatEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [damageLog, setDamageLog] = useState<DamageLog[]>([]);
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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


  useEffect(() => {
    if (interaction) {
      const entities: CombatEntity[] = [];

      // Add player characters
      interaction.participants.playerCharacters?.forEach(pc => {
        if (pc) {
          entities.push({
            id: pc._id,
            name: pc.name,
            type: 'playerCharacter',
            maxHp: pc.hitPoints || 10,
            currentHp: pc.hitPoints || 10,
            armorClass: pc.armorClass || 10,
            statusEffects: [],
            spellSlots: generateSpellSlots(pc.level || 1, pc.class || 'Fighter'),
            equipment: [],
            initiativeRoll: 0,
            isActive: false
          });
        }
      });

      // Add NPCs
      interaction.participants.npcs?.forEach(npc => {
        if (npc) {
          entities.push({
            id: npc._id,
            name: npc.name,
            type: 'npc',
            maxHp: npc.hitPoints || 10,
            currentHp: npc.hitPoints || 10,
            armorClass: npc.armorClass || 10,
            statusEffects: [],
            equipment: [],
            initiativeRoll: 0,
            isActive: false
          });
        }
      });

      // Add monsters
      interaction.participants.monsters?.forEach(monster => {
        if (monster) {
          entities.push({
            id: monster._id,
            name: monster.name,
            type: 'monster',
            maxHp: monster.hitPoints || 10,
            currentHp: monster.hitPoints || 10,
            armorClass: monster.armorClass || 10,
            statusEffects: [],
            equipment: [],
            initiativeRoll: 0,
            isActive: false
          });
        }
      });

      setCombatEntities(entities);
    }
  }, [interaction]);

  useEffect(() => {
    if (currentInitiative && currentInitiative.initiativeOrder.length > 0) {
      setCombatEntities(prev => prev.map(entity => ({
        ...entity,
        initiativeRoll: currentInitiative.initiativeOrder.find(p => p.entityId === entity.id)?.initiativeRoll || 0,
        isActive: currentInitiative.initiativeOrder[currentInitiative.currentIndex]?.entityId === entity.id
      })));
    }
  }, [currentInitiative]);

  const generateSpellSlots = (level: number, className: string): SpellSlot[] => {
    const spellSlots: SpellSlot[] = [];
    
    // Basic spell slot progression (simplified)
    if (['Wizard', 'Sorcerer', 'Bard', 'Cleric', 'Druid'].includes(className)) {
      for (let i = 1; i <= Math.min(level, 9); i++) {
        const maxSlots = Math.max(0, Math.floor((level - i + 1) / 2));
        if (maxSlots > 0) {
          spellSlots.push({ level: i, max: maxSlots, used: 0 });
        }
      }
    }
    
    return spellSlots;
  };

  const handleHpChange = (entityId: string, newHp: number, isHealing: boolean = false) => {
    setCombatEntities(prev => prev.map(entity => {
      if (entity.id === entityId) {
        const clampedHp = Math.max(0, Math.min(newHp, entity.maxHp));
        return { ...entity, currentHp: clampedHp };
      }
      return entity;
    }));

    // Add to damage log
    const entity = combatEntities.find(e => e.id === entityId);
    if (entity) {
      const logEntry: DamageLog = {
        id: Date.now().toString(),
        targetId: entityId,
        targetName: entity.name,
        damage: Math.abs(newHp - entity.currentHp),
        damageType: isHealing ? 'Healing' : 'Damage',
        source: 'Manual',
        timestamp: Date.now(),
        isHealing
      };
      setDamageLog(prev => [logEntry, ...prev.slice(0, 19)]); // Keep last 20 entries
    }
  };

  const handleStatusEffectRemove = (entityId: string, effectId: string) => {
    setCombatEntities(prev => prev.map(entity => {
      if (entity.id === entityId) {
        return {
          ...entity,
          statusEffects: entity.statusEffects.filter(effect => effect.id !== effectId)
        };
      }
      return entity;
    }));
  };

  const handleSpellSlotUse = (entityId: string, level: number) => {
    setCombatEntities(prev => prev.map(entity => {
      if (entity.id === entityId && entity.spellSlots) {
        return {
          ...entity,
          spellSlots: entity.spellSlots.map(slot => 
            slot.level === level && slot.used < slot.max
              ? { ...slot, used: slot.used + 1 }
              : slot
          )
        };
      }
      return entity;
    }));
  };

  const handleSpellSlotRestore = (entityId: string, level: number) => {
    setCombatEntities(prev => prev.map(entity => {
      if (entity.id === entityId && entity.spellSlots) {
        return {
          ...entity,
          spellSlots: entity.spellSlots.map(slot => 
            slot.level === level && slot.used > 0
              ? { ...slot, used: slot.used - 1 }
              : slot
          )
        };
      }
      return entity;
    }));
  };

  const handleDiceRollComplete = (result: any) => {
    if (selectedEntity && result.total) {
      // Auto-apply damage/healing based on dice roll
      const entity = combatEntities.find(e => e.id === selectedEntity);
      if (entity) {
        handleHpChange(selectedEntity, entity.currentHp - result.total, false);
      }
    }
  };

  const getHpPercentage = (entity: CombatEntity) => {
    return (entity.currentHp / entity.maxHp) * 100;
  };

  const getHpColor = (percentage: number) => {
    if (percentage > 75) return '#10b981';
    if (percentage > 50) return '#f59e0b';
    if (percentage > 25) return '#f97316';
    return '#ef4444';
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'playerCharacter': return '👤';
      case 'npc': return '🧙';
      case 'monster': return '🐉';
      default: return '❓';
    }
  };

  const getStatusEffectIcon = (effect: StatusEffect) => {
    switch (effect.effect) {
      case 'buff': return '⬆️';
      case 'debuff': return '⬇️';
      case 'neutral': return '➡️';
      default: return '⚡';
    }
  };

  return (
    <div className="combat-state-manager">
      <div className="manager-header">
        <h3>⚔️ Combat State Manager</h3>
        <div className="header-controls">
          <button
            className="btn-dice"
            onClick={() => setShowDiceRoller(!showDiceRoller)}
          >
            🎲 Dice Roller
          </button>
          <button
            className="btn-edit"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '✅ Done' : '✏️ Edit'}
          </button>
        </div>
      </div>

      {/* Dice Roller */}
      {showDiceRoller && (
        <div className="dice-roller-section">
          <DiceRoller
            mode="combat"
            onRollComplete={handleDiceRollComplete}
          />
        </div>
      )}

      {/* Combat Entities */}
      <div className="combat-entities">
        <h4>Combatants ({combatEntities.length})</h4>
        <div className="entities-grid">
          {combatEntities.map(entity => (
            <div
              key={entity.id}
              className={`entity-card ${entity.isActive ? 'active' : ''} ${selectedEntity === entity.id ? 'selected' : ''}`}
              onClick={() => setSelectedEntity(entity.id)}
            >
              <div className="entity-header">
                <span className="entity-icon">{getEntityTypeIcon(entity.type)}</span>
                <div className="entity-info">
                  <div className="entity-name">{entity.name}</div>
                  <div className="entity-type">{entity.type.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
                {entity.isActive && (
                  <div className="active-indicator">⚡</div>
                )}
              </div>

              <div className="entity-stats">
                <div className="hp-section">
                  <div className="hp-bar">
                    <div
                      className="hp-fill"
                      style={{
                        width: `${getHpPercentage(entity)}%`,
                        backgroundColor: getHpColor(getHpPercentage(entity))
                      }}
                    />
                  </div>
                  <div className="hp-text">
                    {entity.currentHp} / {entity.maxHp} HP
                  </div>
                </div>

                <div className="ac-section">
                  <span className="ac-label">AC:</span>
                  <span className="ac-value">{entity.armorClass}</span>
                </div>

                {(entity.initiativeRoll || 0) > 0 && (
                  <div className="initiative-section">
                    <span className="initiative-label">Initiative:</span>
                    <span className="initiative-value">{entity.initiativeRoll}</span>
                  </div>
                )}
              </div>

              {/* Status Effects */}
              {entity.statusEffects.length > 0 && (
                <div className="status-effects">
                  <div className="effects-label">Status Effects:</div>
                  <div className="effects-list">
                    {entity.statusEffects.map(effect => (
                      <div key={effect.id} className="status-effect">
                        <span className="effect-icon">{getStatusEffectIcon(effect)}</span>
                        <span className="effect-name">{effect.name}</span>
                        <span className="effect-duration">({effect.duration})</span>
                        {isEditing && (
                          <button
                            className="remove-effect"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusEffectRemove(entity.id, effect.id);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spell Slots */}
              {entity.spellSlots && entity.spellSlots.length > 0 && (
                <div className="spell-slots">
                  <div className="slots-label">Spell Slots:</div>
                  <div className="slots-grid">
                    {entity.spellSlots.map(slot => (
                      <div key={slot.level} className="spell-slot">
                        <span className="slot-level">L{slot.level}</span>
                        <div className="slot-uses">
                          {slot.used}/{slot.max}
                        </div>
                        {isEditing && (
                          <div className="slot-controls">
                            <button
                              className="slot-btn use"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSpellSlotUse(entity.id, slot.level);
                              }}
                              disabled={slot.used >= slot.max}
                            >
                              -
                            </button>
                            <button
                              className="slot-btn restore"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSpellSlotRestore(entity.id, slot.level);
                              }}
                              disabled={slot.used <= 0}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HP Controls */}
              {isEditing && (
                <div className="hp-controls">
                  <div className="hp-input-group">
                    <label>HP:</label>
                    <input
                      type="number"
                      value={entity.currentHp}
                      onChange={(e) => handleHpChange(entity.id, parseInt(e.target.value) || 0)}
                      min="0"
                      max={entity.maxHp}
                      className="hp-input"
                    />
                  </div>
                  <div className="hp-buttons">
                    <button
                      className="hp-btn damage"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHpChange(entity.id, entity.currentHp - 5);
                      }}
                    >
                      -5
                    </button>
                    <button
                      className="hp-btn heal"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHpChange(entity.id, entity.currentHp + 5, true);
                      }}
                    >
                      +5
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Damage Log */}
      <div className="damage-log">
        <h4>Combat Log</h4>
        <div className="log-entries">
          {damageLog.map(entry => (
            <div key={entry.id} className={`log-entry ${entry.isHealing ? 'healing' : 'damage'}`}>
              <span className="log-time">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
              <span className="log-target">{entry.targetName}</span>
              <span className="log-action">
                {entry.isHealing ? 'healed' : 'took'} {entry.damage} {entry.damageType}
              </span>
              <span className="log-source">from {entry.source}</span>
            </div>
          ))}
          {damageLog.length === 0 && (
            <div className="no-log">No combat actions yet</div>
          )}
        </div>
      </div>
    </div>
  );
}; 
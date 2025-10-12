import React, { useState } from 'react';
import './DiceRoller.css';

interface DiceRollerProps {
  interactionId?: string;
  onRollComplete?: (result: DiceRollResult) => void;
  mode?: 'initiative' | 'combat' | 'custom';
  entityId?: string;
  entityType?: 'playerCharacter' | 'npc' | 'monster';
}

interface DiceRollResult {
  total: number;
  rolls: number[];
  diceExpression: string;
  modifier: number;
  timestamp: number;
}

interface DiceExpression {
  count: number;
  sides: number;
  modifier: number;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  onRollComplete,
  mode = 'custom'
}) => {
  const [customExpression, setCustomExpression] = useState('');
  const [diceHistory, setDiceHistory] = useState<DiceRollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedDice, setSelectedDice] = useState<DiceExpression>({ count: 1, sides: 20, modifier: 0 });
  const [rollAnimation, setRollAnimation] = useState(false);

  // Standard D&D dice
  const standardDice = [
    { name: 'd4', sides: 4, icon: '⚀' },
    { name: 'd6', sides: 6, icon: '⚁' },
    { name: 'd8', sides: 8, icon: '⚂' },
    { name: 'd10', sides: 10, icon: '⚃' },
    { name: 'd12', sides: 12, icon: '⚄' },
    { name: 'd20', sides: 20, icon: '⚅' },
    { name: 'd100', sides: 100, icon: '⚀' }
  ];

  // Combat dice for different damage types
  const combatDice = {
    'Slashing': { dice: 'd6', sides: 6 },
    'Piercing': { dice: 'd8', sides: 8 },
    'Bludgeoning': { dice: 'd6', sides: 6 },
    'Fire': { dice: 'd6', sides: 6 },
    'Cold': { dice: 'd6', sides: 6 },
    'Lightning': { dice: 'd8', sides: 8 },
    'Thunder': { dice: 'd8', sides: 8 },
    'Acid': { dice: 'd6', sides: 6 },
    'Poison': { dice: 'd6', sides: 6 },
    'Radiant': { dice: 'd8', sides: 8 },
    'Necrotic': { dice: 'd8', sides: 8 },
    'Force': { dice: 'd8', sides: 8 },
    'Psychic': { dice: 'd8', sides: 8 }
  };

  const rollDice = (count: number, sides: number, modifier: number = 0): DiceRollResult => {
    const rolls: number[] = [];
    let total = modifier;

    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }

    const diceExpression = `${count}d${sides}${modifier >= 0 ? '+' : ''}${modifier}`;
    
    return {
      total,
      rolls,
      diceExpression,
      modifier,
      timestamp: Date.now()
    };
  };

  const handleStandardRoll = (sides: number) => {
    const result = rollDice(1, sides, selectedDice.modifier);
    handleRollComplete(result);
  };

  const handleCustomRoll = () => {
    if (!customExpression.trim()) return;

    try {
      // Parse custom dice expression (e.g., "2d6+3", "1d20-1", "3d8")
      const match = customExpression.match(/^(\d+)d(\d+)([+-]\d+)?$/);
      if (!match) {
        alert('Invalid dice expression. Use format like "2d6+3" or "1d20-1"');
        return;
      }

      const count = parseInt(match[1]);
      const sides = parseInt(match[2]);
      const modifier = match[3] ? parseInt(match[3]) : 0;

      if (count > 100 || sides > 1000) {
        alert('Dice count or sides too high. Please use reasonable values.');
        return;
      }

      const result = rollDice(count, sides, modifier);
      handleRollComplete(result);
    } catch (error) {
      alert('Invalid dice expression. Please check your input.');
    }
  };

  const handleSelectedDiceRoll = () => {
    const result = rollDice(selectedDice.count, selectedDice.sides, selectedDice.modifier);
    handleRollComplete(result);
  };

  const handleRollComplete = (result: DiceRollResult) => {
    setIsRolling(true);
    setRollAnimation(true);

    // Add to history
    setDiceHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 rolls

    // Callback for parent component
    if (onRollComplete) {
      onRollComplete(result);
    }

    // Animation effect
    setTimeout(() => {
      setRollAnimation(false);
      setIsRolling(false);
    }, 1000);
  };

  const getRollDisplay = (result: DiceRollResult) => {
    const rollText = result.rolls.length > 1 
      ? `[${result.rolls.join(', ')}]`
      : result.rolls[0].toString();
    
    return `${result.diceExpression}: ${rollText}${result.modifier !== 0 ? ` ${result.modifier >= 0 ? '+' : ''}${result.modifier}` : ''} = ${result.total}`;
  };

  const getCriticalResult = (result: DiceRollResult) => {
    // Check if it's a d20 roll (single roll, likely d20)
    if (result.rolls.length === 1 && result.diceExpression.includes('d20')) {
      if (result.rolls[0] === 20) return 'critical-success';
      if (result.rolls[0] === 1) return 'critical-failure';
    }
    return '';
  };

  return (
    <div className="dice-roller">
      <div className="roller-header">
        <h3>🎲 Dice Roller</h3>
        {mode !== 'custom' && (
          <div className="mode-indicator">
            <span className={`mode-badge ${mode}`}>
              {mode === 'initiative' ? '⚡ Initiative' : '⚔️ Combat'}
            </span>
          </div>
        )}
      </div>

      {/* Standard Dice */}
      <div className="standard-dice">
        <h4>Standard Dice</h4>
        <div className="dice-grid">
          {standardDice.map(die => (
            <button
              key={die.name}
              className={`dice-button ${rollAnimation ? 'rolling' : ''}`}
              onClick={() => handleStandardRoll(die.sides)}
              disabled={isRolling}
            >
              <span className="dice-icon">{die.icon}</span>
              <span className="dice-name">{die.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Dice Configuration */}
      <div className="custom-dice">
        <h4>Custom Roll</h4>
        <div className="custom-config">
          <div className="config-row">
            <label>Count:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={selectedDice.count}
              onChange={(e) => setSelectedDice(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
              className="config-input"
            />
            <label>d</label>
            <input
              type="number"
              min="2"
              max="1000"
              value={selectedDice.sides}
              onChange={(e) => setSelectedDice(prev => ({ ...prev, sides: parseInt(e.target.value) || 6 }))}
              className="config-input"
            />
            <label>+</label>
            <input
              type="number"
              value={selectedDice.modifier}
              onChange={(e) => setSelectedDice(prev => ({ ...prev, modifier: parseInt(e.target.value) || 0 }))}
              className="config-input"
            />
            <button
              className="roll-button"
              onClick={handleSelectedDiceRoll}
              disabled={isRolling}
            >
              {isRolling ? 'Rolling...' : 'Roll'}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Expression */}
      <div className="custom-expression">
        <h4>Custom Expression</h4>
        <div className="expression-input">
          <input
            type="text"
            value={customExpression}
            onChange={(e) => setCustomExpression(e.target.value)}
            placeholder="e.g., 2d6+3, 1d20-1, 3d8"
            className="expression-field"
          />
          <button
            className="roll-button"
            onClick={handleCustomRoll}
            disabled={isRolling || !customExpression.trim()}
          >
            {isRolling ? 'Rolling...' : 'Roll'}
          </button>
        </div>
      </div>

      {/* Combat Dice (if in combat mode) */}
      {mode === 'combat' && (
        <div className="combat-dice">
          <h4>Combat Damage</h4>
          <div className="damage-grid">
            {Object.entries(combatDice).map(([damageType, dice]) => (
              <button
                key={damageType}
                className="damage-button"
                onClick={() => {
                  setSelectedDice({ count: 1, sides: dice.sides, modifier: 0 });
                  handleSelectedDiceRoll();
                }}
                disabled={isRolling}
              >
                <span className="damage-type">{damageType}</span>
                <span className="damage-dice">{dice.dice}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Roll History */}
      <div className="roll-history">
        <h4>Recent Rolls</h4>
        <div className="history-list">
          {diceHistory.map((result, index) => (
            <div
              key={index}
              className={`history-item ${getCriticalResult(result)}`}
            >
              <span className="roll-result">{getRollDisplay(result)}</span>
              <span className="roll-time">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {diceHistory.length === 0 && (
            <div className="no-rolls">No rolls yet</div>
          )}
        </div>
      </div>
    </div>
  );
}; 
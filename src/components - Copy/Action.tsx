import React from 'react';
import { PlayerCharacterAction } from '../types/dndRules';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface ActionProps {
  action: PlayerCharacterAction;
}

const Action: React.FC<ActionProps> = ({ action }) => {
  const getActionTypeVariant = (type: string) => {
    switch (type) {
      case 'MELEE_ATTACK':
      case 'RANGED_ATTACK':
        return 'destructive';
      case 'SPELL':
        return 'default';
      case 'CLASS_FEATURE':
        return 'secondary';
      case 'COMMONLY_AVAILABLE_UTILITY':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getActionCostVariant = (cost: string) => {
    switch (cost) {
      case 'Action':
        return 'default';
      case 'Bonus Action':
        return 'secondary';
      case 'Reaction':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="action-card">
      <CardHeader className="action-header">
        <div className="action-title-section">
          <CardTitle className="action-name">{action.name}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Badge variant={getActionTypeVariant(action.type)} className="action-type-badge">
            {action.type.replace(/_/g, ' ')}
          </Badge>
          <Badge variant={getActionCostVariant(action.actionCost)} className="action-cost-badge">
            {action.actionCost}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="action-content">
        <p className="action-description">{action.description}</p>

        {action.type === 'SPELL' && 'spellLevel' in action && (
          <div className="spell-info mb-2">
            <Badge variant="outline" className="spell-level">
              Level {action.spellLevel}
            </Badge>
            {action.requiresConcentration && (
              <Badge variant="outline" className="concentration-badge ml-2">
                (Concentration)
              </Badge>
            )}
          </div>
        )}

        {action.type === 'CLASS_FEATURE' && 'className' in action && (
          <div className="class-info mb-2">
            <Badge variant="outline" className="class-name">
              {action.className} Feature
            </Badge>
            {action.usesPer && (
              <span className="ml-2 text-sm text-gray-500">
                ({action.maxUses} uses per {action.usesPer})
              </span>
            )}
          </div>
        )}

        {'damageRolls' in action && action.damageRolls && action.damageRolls.length > 0 && (
          <div className="action-details mt-2">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Damage:</h4>
            <div className="flex flex-wrap gap-2">
              {action.damageRolls.map((roll, index) => (
                <Badge key={index} variant="outline" className="damage-roll">
                  {roll.dice.count}d{roll.dice.type} + {roll.modifier} {roll.damageType.toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {action.sourceBook && (
          <div className="source-book mt-2">
            <Badge variant="outline" className="source-badge">
              Source: {action.sourceBook}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Action; 
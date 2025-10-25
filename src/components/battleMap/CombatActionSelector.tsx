import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBattleMapUI } from "../../lib/battleMapStore";
import * as CombatUtils from "../../lib/combatUtils";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface CombatActionSelectorProps {
  attacker: CombatUtils.BattleToken;
  target: CombatUtils.BattleToken;
  attackerEntity: CombatUtils.Character | CombatUtils.Monster | null;
  availableActions: CombatUtils.Action[];
  onActionSelected: (action: CombatUtils.Action) => void;
  onCancel: () => void;
}

export function CombatActionSelector({
  attacker,
  target,
  attackerEntity,
  availableActions,
  onActionSelected,
  onCancel
}: CombatActionSelectorProps) {
  const { combatState, setSelectedAction } = useBattleMapUI();
  const updateToken = useMutation(api.battleTokens.update);
  
  // Get character/monster data for the attacker
  const character = useQuery(
    api.characters.getCharacterWithActions,
    attacker.characterId ? { characterId: attacker.characterId } : "skip"
  );
  
  const monster = useQuery(
    api.monsters.getMonsterById,
    attacker.monsterId ? { monsterId: attacker.monsterId } : "skip"
  );
  
  const actualAttackerEntity = character || monster;

  const handleActionClick = async (action: CombatUtils.Action) => {
    if (!actualAttackerEntity || !CombatUtils.canUseAction(actualAttackerEntity, action)) {
      return;
    }

    setSelectedAction(action);
    
    // Perform the attack
    const attackBonus = CombatUtils.calculateAttackBonus(actualAttackerEntity, action);
    const attackRoll = CombatUtils.rollAttackRoll(attackBonus);
    
    // For now, assume hit on roll of 10+ (simplified AC)
    const hit = attackRoll.total >= 10;
    
    if (hit) {
      const damageResult = CombatUtils.rollDamage(action);
      
      // Apply damage to target
      if (target.hp !== undefined) {
        const newHp = Math.max(0, target.hp - damageResult.totalDamage);
        await updateToken({
          id: target._id,
          hp: newHp
        });
      }
      
      // Show combat result
      alert(`${attacker.label} attacks ${target.label} with ${action.name}!\nAttack Roll: ${attackRoll.roll} + ${attackBonus} = ${attackRoll.total}\nDamage: ${damageResult.totalDamage}`);
    } else {
      alert(`${attacker.label} attacks ${target.label} with ${action.name}!\nAttack Roll: ${attackRoll.roll} + ${attackBonus} = ${attackRoll.total}\nMiss!`);
    }
    
    onActionSelected(action);
  };

  const getActionTypeColor = (type: CombatUtils.Action["type"]) => {
    switch (type) {
      case "MELEE_ATTACK":
        return "bg-red-100 text-red-800";
      case "RANGED_ATTACK":
        return "bg-blue-100 text-blue-800";
      case "SPELL":
        return "bg-purple-100 text-purple-800";
      case "BONUS_ACTION":
        return "bg-green-100 text-green-800";
      case "REACTION":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionCostColor = (cost: CombatUtils.Action["actionCost"]) => {
    switch (cost) {
      case "Action":
        return "bg-red-100 text-red-800";
      case "Bonus Action":
        return "bg-green-100 text-green-800";
      case "Reaction":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="w-96 max-h-[80vh]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Combat Action</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            ✕
          </Button>
        </CardTitle>
        <CardDescription>
          {attacker.label} → {target.label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-3">
            {availableActions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No available actions
              </div>
            ) : (
              availableActions.map((action) => {
                const canUse = actualAttackerEntity ? CombatUtils.canUseAction(actualAttackerEntity, action) : false;
                const attackBonus = actualAttackerEntity ? CombatUtils.calculateAttackBonus(actualAttackerEntity, action) : 0;
                
                return (
                  <Card key={action._id} className={`cursor-pointer transition-colors ${
                    canUse ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{action.name}</h3>
                        <div className="flex gap-1">
                          <Badge className={getActionTypeColor(action.type)}>
                            {action.type.replace("_", " ")}
                          </Badge>
                          <Badge className={getActionCostColor(action.actionCost)}>
                            {action.actionCost}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {action.description}
                      </p>
                      
                      {action.damageRolls && action.damageRolls.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-gray-700 mb-1">Damage:</div>
                          <div className="text-xs text-gray-600">
                            {action.damageRolls.map((damage: NonNullable<CombatUtils.Action['damageRolls']>[0], index) => (
                              <span key={index}>
                                {damage.dice.count}d{damage.dice.type.substring(1)}
                                {damage.modifier >= 0 ? "+" : ""}{damage.modifier} {damage.damageType}
                                {index < action.damageRolls!.length - 1 ? " + " : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {action.range && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-gray-700">Range:</div>
                          <div className="text-xs text-gray-600">{action.range}</div>
                        </div>
                      )}
                      
                      {action.type === "MELEE_ATTACK" || action.type === "RANGED_ATTACK" ? (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-gray-700">Attack Bonus:</div>
                          <div className="text-xs text-gray-600">+{attackBonus}</div>
                        </div>
                      ) : null}
                      
                      {action.spellLevel !== undefined && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-gray-700">Spell Level:</div>
                          <div className="text-xs text-gray-600">
                            {action.spellLevel === 0 ? "Cantrip" : `Level ${action.spellLevel}`}
                          </div>
                        </div>
                      )}
                      
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleActionClick(action)}
                        disabled={!canUse}
                      >
                        {canUse ? "Use Action" : "Cannot Use"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useBattleMapUI, InitiativeEntry } from "../../lib/battleMapStore";
import {
  calculateInitiativeBreakdown,
  rollInitiative,
} from "../../lib/initiativeUtils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronRight, ChevronLeft, Square, Dice1, Info } from "lucide-react";
import { useState } from "react";

interface InitiativePanelProps {
  mapId: string;
}

export function InitiativePanel({ mapId }: InitiativePanelProps) {
  const {
    initiativeState,
    setInitiativeOrder,
    setCurrentTurnIndex,
    nextTurn,
    previousTurn,
    startCombat,
    endCombat,
  } = useBattleMapUI();

  const tokens = useQuery(api.battleTokens.listByMap, {
    mapId: mapId as Id<"battleMaps">,
  });

  const [showBreakdown, setShowBreakdown] = useState<string | null>(null);

  // Fetch character/monster data for tokens
  const tokenEntities = useQuery(
    api.battleMaps.getTokenEntities,
    tokens && tokens.length > 0
      ? {
          tokenIds: tokens.map((t) => t._id),
        }
      : "skip"
  );

  const handleRollInitiative = () => {
    if (!tokenEntities || tokenEntities.length === 0) return;

    const entries: InitiativeEntry[] = [];

    for (const tokenEntity of tokenEntities) {
      // Skip tokens without entities (generic tokens)
      if (!tokenEntity.character && !tokenEntity.monster) continue;

      let entity: any = null;
      let dexterityScore = 10;

      if (tokenEntity.character) {
        const character = tokenEntity.character;
        entity = {
          abilityScores: character.abilityScores,
          abilityModifiers: character.abilityModifiers,
          classes: character.classes,
          feats: character.feats,
          features: character.features,
          equipmentBonuses: character.equipmentBonuses,
          conditions: tokenEntity.token.conditions,
        };
        dexterityScore = character.abilityScores?.dexterity || 10;
      } else if (tokenEntity.monster) {
        const monster = tokenEntity.monster;
        entity = {
          abilityScores: monster.abilityScores,
          abilityModifiers: monster.abilityModifiers,
          dexterity: monster.abilityScores?.dexterity,
        };
        dexterityScore = monster.abilityScores?.dexterity || 10;
      }

      if (!entity) continue;

      const breakdown = calculateInitiativeBreakdown(entity);
      const initiativeRoll = rollInitiative(
        breakdown,
        dexterityScore,
        undefined,
        undefined,
        breakdown.diceBonus
      );

      entries.push({
        tokenId: tokenEntity.tokenId,
        label: tokenEntity.token.label,
        roll: initiativeRoll.roll,
        modifier: initiativeRoll.modifier,
        total: initiativeRoll.total,
        dexterityScore,
        type: tokenEntity.token.type as "pc" | "npc_friendly" | "npc_foe",
        characterId: tokenEntity.token.characterId,
        monsterId: tokenEntity.token.monsterId,
      });
    }

    // Sort by initiative (highest first)
    entries.sort((a, b) => {
      // First compare by total
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      // Then compare by Dexterity score
      if (b.dexterityScore !== a.dexterityScore) {
        return b.dexterityScore - a.dexterityScore;
      }
      return 0;
    });

    setInitiativeOrder(entries);
    if (!initiativeState.isInCombat) {
      startCombat();
    }
  };

  const currentEntry =
    initiativeState.currentTurnIndex !== null
      ? initiativeState.initiativeOrder[initiativeState.currentTurnIndex]
      : null;

  if (!tokens || tokens.length === 0) {
    return (
      <div className="p-3">
        <p className="text-sm text-muted-foreground">
          Add tokens to the map to roll initiative
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="px-3 pt-2 pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {initiativeState.isInCombat && (
            <Badge variant="destructive" className="text-xs">
              Round {initiativeState.roundNumber}
            </Badge>
          )}
          {initiativeState.initiativeOrder.length > 0 ? (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={previousTurn}
                disabled={!initiativeState.isInCombat}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={nextTurn}
                disabled={!initiativeState.isInCombat}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={endCombat}
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              className="h-7"
              onClick={handleRollInitiative}
              disabled={!tokenEntities || tokenEntities.length === 0}
            >
              <Dice1 className="w-4 h-4 mr-1" />
              Roll
            </Button>
          )}
        </div>
      </div>
      <div className="px-3 pb-3 space-y-2">
        {initiativeState.initiativeOrder.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Click "Roll Initiative" to determine turn order
          </p>
        ) : (
          <div className="space-y-1">
            {initiativeState.initiativeOrder.map((entry, index) => {
              const isCurrentTurn =
                initiativeState.currentTurnIndex === index &&
                initiativeState.isInCombat;
              const typeColors = {
                pc: "bg-blue-500",
                npc_friendly: "bg-green-500",
                npc_foe: "bg-red-500",
              };

              return (
                <div
                  key={entry.tokenId}
                  className={`flex items-center justify-between p-2 rounded border transition-colors ${
                    isCurrentTurn
                      ? "bg-primary/10 border-primary"
                      : "bg-muted/50 border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${typeColors[entry.type]}`}
                    />
                    <span
                      className={`text-sm font-medium truncate ${
                        isCurrentTurn ? "font-bold" : ""
                      }`}
                    >
                      {entry.label}
                    </span>
                    {isCurrentTurn && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        setShowBreakdown(
                          showBreakdown === entry.tokenId
                            ? null
                            : entry.tokenId
                        )
                      }
                      title={`Roll: ${entry.roll} + Mod: ${entry.modifier >= 0 ? "+" : ""}${entry.modifier}\nTotal: ${entry.total}\nDex: ${entry.dexterityScore}`}
                    >
                      <Info className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-semibold w-8 text-right">
                      {entry.total}
                    </span>
                  </div>
                  {showBreakdown === entry.tokenId && (
                    <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                      <div>Roll: {entry.roll}</div>
                      <div>Modifier: {entry.modifier >= 0 ? "+" : ""}{entry.modifier}</div>
                      <div>Total: {entry.total}</div>
                      <div>Dex Score: {entry.dexterityScore}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


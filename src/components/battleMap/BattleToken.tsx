import { useDrag } from "react-dnd";
import { ItemTypes } from "../../lib/dndTypes";
import { cn } from "../../lib/utils";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { BattleToken as BattleTokenType, areEnemies, isWithinRange } from "../../lib/combatUtils";

// Utility function to intelligently truncate names for tokens
function truncateTokenName(name: string, tokenSizePx: number): string {
  // Calculate max characters based on token size (roughly 8px per character)
  const maxLength = Math.max(4, Math.floor(tokenSizePx / 8));
  
  if (name.length <= maxLength) {
    return name;
  }

  // If it's a single word that's too long, truncate it
  if (!name.includes(' ')) {
    return name.substring(0, maxLength - 1) + '…';
  }

  // If it has spaces, try to use just the first name
  const firstName = name.split(' ')[0];
  if (firstName.length <= maxLength) {
    return firstName;
  }

  // If even the first name is too long, truncate it
  return firstName.substring(0, maxLength - 1) + '…';
}

type TokenProps = {
  token: BattleTokenType;
  cellSize: number;
  allTokens?: BattleTokenType[];
};

export function BattleToken({ token, cellSize, allTokens = [] }: TokenProps) {
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.TOKEN,
      item: () => ({
        id: token._id,
        type: ItemTypes.TOKEN,
        offsetX: cellSize / 2,
        offsetY: cellSize / 2,
      }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [token._id, cellSize]
  );

  const { 
    setEditingTokenId, 
    selectedTokenForMovement, 
    setSelectedTokenForMovement, 
    editingMode,
    combatState,
    setAttackerToken,
    setTargetToken,
    setAvailableActions,
    setIsCombatMode,
    clearCombatState
  } = useBattleMapUI();
  
  const update = useMutation(api.battleTokens.update);
  
  // Get character/monster data for this token
  const character = useQuery(
    api.characters.getCharacterWithActions,
    token.characterId ? { characterId: token.characterId } : "skip"
  );
  
  const monster = useQuery(
    api.monsters.getMonsterById,
    token.monsterId ? { monsterId: token.monsterId } : "skip"
  );
  
  const attackerEntity = character || monster;

  const sizePx = token.size * cellSize;
  const hasHP = token.hp !== undefined && token.maxHp !== undefined;
  const hpPercent = hasHP ? (token.hp! / token.maxHp!) * 100 : 100;
  const isSelectedForMovement = selectedTokenForMovement === token._id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (editingMode === "token" || editingMode === null) {
      // If we're in combat mode and have an attacker selected
      if (combatState.isCombatMode && combatState.attackerTokenId) {
        const attackerToken = allTokens.find(t => t._id === combatState.attackerTokenId);
        
        if (attackerToken && areEnemies(attackerToken, token)) {
          // This is a valid target, set it as the target
          setTargetToken(token._id);
          
          // Get available actions for the attacker
          if (attackerEntity && attackerEntity.resolvedActions) {
            const availableActions = attackerEntity.resolvedActions.filter(action => 
              isWithinRange(attackerToken, token, action)
            );
            setAvailableActions(availableActions);
          }
        }
      } else {
        // Normal movement selection
        setSelectedTokenForMovement(isSelectedForMovement ? null : token._id);
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Right-click to start combat mode
    if (editingMode === "token" || editingMode === null) {
      setAttackerToken(token._id);
      setIsCombatMode(true);
      
      // Get available actions for this token
      if (attackerEntity && attackerEntity.resolvedActions) {
        setAvailableActions(attackerEntity.resolvedActions);
      }
    }
  };

  const isAttacker = combatState.attackerTokenId === token._id;
  const isTarget = combatState.targetTokenId === token._id;
  const isInCombatMode = combatState.isCombatMode;

  return (
    <div
      ref={drag}
      onClick={handleClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditingTokenId(token._id);
      }}
      onContextMenu={handleRightClick}
      className={cn(
        "absolute rounded-md flex flex-col items-center justify-center text-white font-medium select-none cursor-move transition-all overflow-hidden",
        isDragging && "opacity-50",
        isSelectedForMovement && "ring-4 ring-yellow-400 ring-opacity-80 scale-110",
        isAttacker && "ring-4 ring-blue-400 ring-opacity-80 scale-110",
        isTarget && "ring-4 ring-red-400 ring-opacity-80 scale-110"
      )}
      style={{
        width: sizePx,
        height: sizePx,
        left: token.x * cellSize,
        top: token.y * cellSize,
        backgroundColor: token.color,
        boxShadow: isSelectedForMovement 
          ? "0 0 20px rgba(250, 204, 21, 0.6)" 
          : isAttacker 
          ? "0 0 20px rgba(59, 130, 246, 0.6)"
          : isTarget
          ? "0 0 20px rgba(239, 68, 68, 0.6)"
          : "0 0 0 2px rgba(0,0,0,0.2) inset",
      }}
      title={`${token.label} (${token.type})${hasHP ? ` - ${token.hp}/${token.maxHp} HP` : ''}${token.speed ? ` - ${token.speed}ft speed` : ''}${isInCombatMode ? ' - Right-click to attack' : ''}`}
    >
      <span className="text-xs md:text-sm px-1 text-center z-10">{truncateTokenName(token.label, sizePx)}</span>
      {hasHP && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-30">
          <div 
            className="h-full transition-all"
            style={{
              width: `${Math.max(0, Math.min(100, hpPercent))}%`,
              backgroundColor: 
                hpPercent > 50 ? '#22c55e' : 
                hpPercent > 25 ? '#f59e0b' : '#ef4444'
            }}
          />
        </div>
      )}
      {hasHP && cellSize >= 40 && (
        <span className="text-[10px] absolute bottom-1 z-10 text-white drop-shadow-md">
          {token.hp}/{token.maxHp}
        </span>
      )}
    </div>
  );
}

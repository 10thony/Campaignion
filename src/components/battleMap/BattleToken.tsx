import { useDrag } from "react-dnd";
import { ItemTypes } from "../../lib/dndTypes";
import { cn } from "../../lib/utils";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { BattleToken as BattleTokenType, areEnemies, isWithinRange } from "../../lib/combatUtils";
import { getHexagonClipPath } from "../../lib/hexUtils";
import { toast } from "sonner";
import { useTheme } from "../theme/ThemeProvider";
import { getHpBarColor, getSelectionColors } from "../../lib/terrainColors";

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
  const sizePx = token.size * cellSize;
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const selectionColors = getSelectionColors(isDark);
  
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.TOKEN,
      item: () => ({
        id: token._id,
        type: ItemTypes.TOKEN,
        offsetX: sizePx / 2, // Offset from token center
        offsetY: sizePx / 2,
      }),
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [token._id, sizePx]
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
    clearCombatState,
    initiativeState
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
        // Normal movement selection - check initiative restrictions
        if (initiativeState.isInCombat && initiativeState.currentTurnIndex !== null) {
          const currentEntry = initiativeState.initiativeOrder[initiativeState.currentTurnIndex];
          if (currentEntry && currentEntry.tokenId !== token._id) {
            const currentTokenLabel = allTokens.find(t => t._id === currentEntry.tokenId)?.label || currentEntry.label;
            toast.error(`It's ${currentTokenLabel}'s turn. Only the current turn's token can be selected for movement during combat.`);
            return;
          }
        }
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

  // Calculate hex size for token (token should fit nicely in a hex cell)
  const tokenHexSize = sizePx / 2;
  const hexClipPath = getHexagonClipPath(tokenHexSize);

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
        "absolute flex flex-col items-center justify-center text-white font-medium select-none cursor-move transition-all overflow-hidden",
        isDragging && "opacity-50",
        isSelectedForMovement && "ring-4 ring-pacific-cyan-400 ring-opacity-80 scale-110",
        isAttacker && "ring-4 ring-rich-cerulean-400 ring-opacity-80 scale-110",
        isTarget && "ring-4 ring-cherry-rose-400 ring-opacity-80 scale-110"
      )}
      style={{
        width: sizePx,
        height: sizePx,
        backgroundColor: token.color,
        clipPath: hexClipPath,
        WebkitClipPath: hexClipPath, // Safari support
        boxShadow: isSelectedForMovement 
          ? `0 0 20px ${selectionColors.selected}` 
          : isAttacker 
          ? `0 0 20px ${selectionColors.movement}`
          : isTarget
          ? `0 0 20px ${selectionColors.attack}`
          : "0 0 0 2px rgba(0,0,0,0.3) inset",
        transform: 'translate(-50%, -50%)', // Center the token on the hex center
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
              backgroundColor: getHpBarColor(hpPercent, isDark)
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

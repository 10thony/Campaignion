import { useDrag } from "react-dnd";
import { ItemTypes } from "../../lib/dndTypes";
import { cn } from "../../lib/utils";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

type TokenProps = {
  token: {
    _id: Id<"battleTokens">;
    x: number;
    y: number;
    label: string;
    type: "pc" | "npc_friendly" | "npc_foe";
    color: string;
    size: number;
  };
  cellSize: number;
};

export function BattleToken({ token, cellSize }: TokenProps) {
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

  const { setEditingTokenId, selectedTokenForMovement, setSelectedTokenForMovement, editingMode } = useBattleMapUI();
  const update = useMutation(api.battleTokens.update);

  const sizePx = token.size * cellSize;
  const hasHP = token.hp !== undefined && token.maxHp !== undefined;
  const hpPercent = hasHP ? (token.hp! / token.maxHp!) * 100 : 100;
  const isSelectedForMovement = selectedTokenForMovement === token._id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingMode === "token" || editingMode === null) {
      // Toggle selection for movement preview
      setSelectedTokenForMovement(isSelectedForMovement ? null : token._id);
    }
  };

  return (
    <div
      ref={drag}
      onClick={handleClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditingTokenId(token._id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingTokenId(token._id);
      }}
      className={cn(
        "absolute rounded-md flex flex-col items-center justify-center text-white font-medium select-none cursor-move transition-all overflow-hidden",
        isDragging && "opacity-50",
        isSelectedForMovement && "ring-4 ring-yellow-400 ring-opacity-80 scale-110"
      )}
      style={{
        width: sizePx,
        height: sizePx,
        left: token.x * cellSize,
        top: token.y * cellSize,
        backgroundColor: token.color,
        boxShadow: isSelectedForMovement ? "0 0 20px rgba(250, 204, 21, 0.6)" : "0 0 0 2px rgba(0,0,0,0.2) inset",
      }}
      title={`${token.label} (${token.type})${hasHP ? ` - ${token.hp}/${token.maxHp} HP` : ''}${token.speed ? ` - ${token.speed}ft speed` : ''}`}
    >
      <span className="text-xs md:text-sm px-1 text-center z-10">{token.label}</span>
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

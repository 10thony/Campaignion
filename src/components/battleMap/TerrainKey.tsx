import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// Terrain color mapping (matching MapBoard.tsx exactly)
const terrainColors: Record<string, string> = {
  normal: "rgba(255, 255, 255, 0.1)",
  difficult: "rgba(139, 69, 19, 0.3)", // brown
  hazardous: "rgba(255, 165, 0, 0.3)", // orange
  magical: "rgba(147, 51, 234, 0.3)", // purple
  water: "rgba(59, 130, 246, 0.4)", // blue
  ice: "rgba(191, 219, 254, 0.5)", // light blue
  fire: "rgba(239, 68, 68, 0.4)", // red
  acid: "rgba(132, 204, 22, 0.4)", // lime
  poison: "rgba(34, 197, 94, 0.4)", // green
  unstable: "rgba(156, 163, 175, 0.4)", // gray
};

// Comprehensive terrain information with effects
const terrainInfo: Record<string, { 
  description: string; 
  movementCost: string; 
  icon: string;
  effects: string[];
}> = {
  normal: { 
    description: "Standard terrain", 
    movementCost: "1", 
    icon: "🟫",
    effects: ["No special effects"]
  },
  difficult: { 
    description: "Harder to move through", 
    movementCost: "2", 
    icon: "🟤",
    effects: ["Double movement cost", "Difficult terrain"]
  },
  hazardous: { 
    description: "Dangerous terrain", 
    movementCost: "2", 
    icon: "⚠️",
    effects: ["Double movement cost", "Risk of injury", "May require saves"]
  },
  magical: { 
    description: "Magical effects", 
    movementCost: "1", 
    icon: "✨",
    effects: ["Magical properties", "May enhance abilities", "Unpredictable effects"]
  },
  water: { 
    description: "Water terrain", 
    movementCost: "2", 
    icon: "💧",
    effects: ["Double movement cost", "Swimming required", "May cause drowning"]
  },
  ice: { 
    description: "Slippery surface", 
    movementCost: "2", 
    icon: "🧊",
    effects: ["Double movement cost", "Risk of falling", "Dexterity saves required"]
  },
  fire: { 
    description: "Burning terrain", 
    movementCost: "2", 
    icon: "🔥",
    effects: ["Double movement cost", "Fire damage", "Constitution saves vs burning"]
  },
  acid: { 
    description: "Corrosive surface", 
    movementCost: "2", 
    icon: "🧪",
    effects: ["Double movement cost", "Acid damage", "Equipment damage risk"]
  },
  poison: { 
    description: "Toxic environment", 
    movementCost: "2", 
    icon: "☠️",
    effects: ["Double movement cost", "Poison damage", "Constitution saves vs poisoning"]
  },
  unstable: { 
    description: "Shifting ground", 
    movementCost: "2", 
    icon: "🌋",
    effects: ["Double movement cost", "Risk of falling", "Unstable footing"]
  },
};

interface TerrainKeyProps {
  className?: string;
}

export function TerrainKey({ className = "" }: TerrainKeyProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Use the battlemap terrain types directly instead of database
  const battlemapTerrainTypes = [
    "normal", "difficult", "hazardous", "magical", "water", 
    "ice", "fire", "acid", "poison", "unstable"
  ];

  return (
    <div className={`bg-card/95 border backdrop-blur-sm rounded-lg shadow-lg pointer-events-auto max-w-xs ${className}`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div className="font-semibold text-foreground text-sm">Terrain Types & Effects</div>
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="space-y-2">
            {battlemapTerrainTypes.map((terrainType) => {
              const info = terrainInfo[terrainType];
              const color = terrainColors[terrainType];
              
              return (
                <div key={terrainType} className="border-b border-border/50 pb-2 last:border-b-0">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" 
                      style={{ backgroundColor: color }}
                      title={`${info.description}`}
                    />
                    <span className="text-muted-foreground">{info.icon}</span>
                    <span className="text-foreground font-medium capitalize">{terrainType}</span>
                    <span className="text-muted-foreground ml-auto">×{info.movementCost}</span>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6">
                    {info.effects.map((effect, index) => (
                      <div key={index} className="text-xs">• {effect}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <div className="font-medium mb-1">Movement Cost Guide:</div>
              <div>• ×1 = Normal movement (5ft)</div>
              <div>• ×2 = Difficult terrain (10ft)</div>
              <div className="mt-1 font-medium">Effects may require:</div>
              <div>• Dexterity saves (falling)</div>
              <div>• Constitution saves (damage)</div>
              <div>• Swimming checks (water)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

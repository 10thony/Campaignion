import { useTheme } from "../theme/ThemeProvider";
import { getTerrainColors, terrainInfo } from "../../lib/terrainColors";
import { cn } from "../../lib/utils";

interface TerrainKeyProps {
  className?: string;
}

export function TerrainKey({ className = "" }: TerrainKeyProps) {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const terrainColors = getTerrainColors(isDark);
  
  // Use the battlemap terrain types directly instead of database
  const battlemapTerrainTypes = [
    "normal", "difficult", "hazardous", "magical", "water", 
    "ice", "fire", "acid", "poison", "unstable"
  ];

  // Check if embedded mode (when wrapped in DraggablePanel)
  const isEmbedded = className.includes("border-0") || className.includes("shadow-none");

  const content = (
    <>
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
    </>
  );

  // When embedded in a DraggablePanel, render just the content
  if (isEmbedded) {
    return (
      <div className={cn("px-3 pb-3", className)}>
        {content}
      </div>
    );
  }

  // Standalone mode with full wrapper (backward compatible)
  return (
    <div className={cn(
      "bg-card/95 border backdrop-blur-sm rounded-lg shadow-lg pointer-events-auto max-w-xs",
      className
    )}>
      <div className="px-3 py-3">
        {content}
      </div>
    </div>
  );
}

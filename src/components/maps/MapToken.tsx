import React from 'react';
import { cn } from '@/lib/utils';
import { 
  User, 
  Users, 
  Skull, 
  Shield, 
  Zap,
  Heart,
  Target
} from 'lucide-react';

interface MapTokenProps {
  entity: {
    entityId: string;
    entityType: "playerCharacter" | "npc" | "monster";
    x: number;
    y: number;
    speed: number;
    name: string;
    color: string;
  };
  isSelected: boolean;
  cellSize: number;
}

export const MapToken: React.FC<MapTokenProps> = React.memo(({
  entity,
  isSelected,
  cellSize
}) => {
  // Calculate token size based on cell size
  const tokenSize = Math.max(20, cellSize * 0.8);
  const iconSize = Math.max(12, tokenSize * 0.6);

  // Get entity type icon
  const getEntityIcon = () => {
    switch (entity.entityType) {
      case 'playerCharacter':
        return <User size={iconSize} />;
      case 'npc':
        return <Users size={iconSize} />;
      case 'monster':
        return <Skull size={iconSize} />;
      default:
        return <Target size={iconSize} />;
    }
  };

  // Get entity type color
  const getEntityColor = () => {
    if (entity.color) {
      return entity.color;
    }
    
    switch (entity.entityType) {
      case 'playerCharacter':
        return '#3b82f6'; // Blue
      case 'npc':
        return '#10b981'; // Green
      case 'monster':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  // Get selection ring color
  const getSelectionColor = () => {
    if (isSelected) {
      return '#3b82f6'; // Blue for selected
    }
    return 'transparent';
  };

  // Get entity type indicator
  const getTypeIndicator = () => {
    switch (entity.entityType) {
      case 'playerCharacter':
        return (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white" />
        );
      case 'npc':
        return (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
        );
      case 'monster':
        return (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
        );
      default:
        return null;
    }
  };

  const entityColor = getEntityColor();
  const selectionColor = getSelectionColor();

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Selection ring */}
      {isSelected && (
        <div 
          className="absolute inset-0 rounded-full border-2 animate-pulse"
          style={{ 
            borderColor: selectionColor,
            boxShadow: `0 0 8px ${selectionColor}40`
          }}
        />
      )}

      {/* Token background */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center',
          'shadow-md border-2 border-white',
          'transition-all duration-200',
          isSelected && 'scale-110'
        )}
        style={{
          width: tokenSize,
          height: tokenSize,
          backgroundColor: entityColor,
          boxShadow: isSelected 
            ? `0 0 12px ${selectionColor}60` 
            : '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Entity icon */}
        <div className="text-white drop-shadow-sm">
          {getEntityIcon()}
        </div>

        {/* Entity type indicator */}
        {getTypeIndicator()}

        {/* Speed indicator (small dot) */}
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full border border-gray-300" />
      </div>

      {/* Entity name tooltip (shown on hover) */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {entity.name}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black" />
      </div>

      {/* Health indicator (placeholder for future implementation) */}
      {/* <div className="absolute -bottom-1 right-0 w-4 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="w-3/4 h-full bg-green-500" />
      </div> */}
    </div>
  );
});

MapToken.displayName = 'MapToken'; 
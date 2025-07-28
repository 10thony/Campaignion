// MapPreview is now fully responsive and dark mode aware. The grid and cells adapt to container size and theme.
import React from 'react';

type CellState = 'inbounds' | 'outbounds' | 'occupied';

type TerrainType = 'normal' | 'soft' | 'rough' | 'intense' | 'brutal' | 'deadly';

interface CellOccupant {
  id: string;
  type: 'playerCharacter' | 'npc' | 'monster';
  color: string;
  speed: number;
  name: string;
}

interface MapPreviewProps {
  map?: {
    width: number;
    height: number;
    cells: Array<{
      x: number;
      y: number;
      state: CellState;
      terrain?: TerrainType;
      terrainModifier?: number;
      affectedAbilityScores?: string[];
      occupant?: CellOccupant;
      customColor?: string;
    }>;
  };
  cellSize?: number;
  interactive?: boolean;
  onCellClick?: (x: number, y: number) => void;
  className?: string;
  showTerrainInfo?: boolean;
  onBulkColorChange?: (color: string) => void;
  showBulkColorControls?: boolean;
}

export const MapPreview: React.FC<MapPreviewProps> = ({ 
  map, 
  cellSize = 20, 
  interactive = false,
  onCellClick,
  className = "",
  showTerrainInfo = false,
  onBulkColorChange,
  showBulkColorControls = false
}) => {
  // Handle case where map is undefined or doesn't have required properties
  if (!map || !map.width || !map.height || !map.cells) {
    return (
      <div className={`map-preview-outer-wrapper w-full max-w-full overflow-auto flex justify-center ${className}`}>
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <p>No map data available</p>
        </div>
      </div>
    );
  }

  // Default cell colors based on state and dark mode
  const getDefaultCellColor = (state: CellState) => {
    switch (state) {
      case 'inbounds':
        return 'bg-gray-200 dark:bg-gray-600'; // Default grey for inbounds cells
      case 'outbounds':
        return 'bg-gray-100 dark:bg-gray-700'; // Lighter grey for outbounds
      case 'occupied':
        return 'bg-gray-300 dark:bg-gray-500'; // Darker grey for occupied (if no custom color)
      default:
        return 'bg-gray-200 dark:bg-gray-600';
    }
  };

  const handleBulkColorChange = (color: string) => {
    if (onBulkColorChange) {
      onBulkColorChange(color);
    }
  };

  return (
    <div className={`map-preview-outer-wrapper w-full max-w-full ${className}`}>
      {/* Bulk Color Controls */}
      {showBulkColorControls && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Change all cells to:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkColorChange('#e5e7eb')} // Light grey
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: '#e5e7eb' }}
                title="Light Grey"
              />
              <button
                onClick={() => handleBulkColorChange('#9ca3af')} // Medium grey
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: '#9ca3af' }}
                title="Medium Grey"
              />
              <button
                onClick={() => handleBulkColorChange('#6b7280')} // Dark grey
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: '#6b7280' }}
                title="Dark Grey"
              />
              <button
                onClick={() => handleBulkColorChange('#22c55e')} // Green
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: '#22c55e' }}
                title="Green"
              />
              <button
                onClick={() => handleBulkColorChange('#3b82f6')} // Blue
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: '#3b82f6' }}
                title="Blue"
              />
              <button
                onClick={() => handleBulkColorChange('#ef4444')} // Red
                className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                style={{ backgroundColor: '#ef4444' }}
                title="Red"
              />
              <button
                onClick={() => handleBulkColorChange('reset')} // Reset to default
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
                title="Reset to Default"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Grid */}
      <div className="overflow-auto flex justify-center" style={{ maxHeight: '60vh', minWidth: 0 }}>
        <div
          className="map-preview-grid grid border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900"
          style={{
            gridTemplateColumns: `repeat(${map.width}, minmax(0, ${cellSize}px))`,
            width: 'fit-content',
            maxWidth: '100%',
            gap: '1px',
          }}
        >
          {map.cells.map((cell) => {
            // Determine cell styling with proper hierarchy:
            // 1. Occupant color (highest priority)
            // 2. Custom color 
            // 3. Default grey based on state (lowest priority)
            let cellClasses = '';
            let inlineStyle: React.CSSProperties = {
              width: cellSize,
              height: cellSize,
              minWidth: 0,
              minHeight: 0,
            };

            if (cell.occupant) {
              // Occupant takes precedence - use inline style for occupant color
              inlineStyle.backgroundColor = cell.occupant.color;
            } else if (cell.customColor) {
              // Custom color takes precedence over default
              inlineStyle.backgroundColor = cell.customColor;
            } else {
              // Use default class-based colors that respond to dark mode
              cellClasses = getDefaultCellColor(cell.state);
            }

            return (
              <div
                key={`${cell.x}-${cell.y}`}
                className={`map-preview-cell ${cellClasses} ${
                  interactive ? 'cursor-pointer hover:opacity-80 transition-colors duration-150' : ''
                } border border-gray-300 dark:border-gray-600 relative`}
                style={inlineStyle}
                onClick={() => interactive && onCellClick && onCellClick(cell.x, cell.y)}
                title={
                  showTerrainInfo && cell.terrain
                    ? `${cell.terrain} terrain (${cell.terrainModifier || 0} modifier)`
                    : cell.occupant
                    ? `${cell.occupant.name} (${cell.occupant.type})`
                    : `Cell (${cell.x}, ${cell.y})`
                }
              >
                {cell.occupant && cellSize > 25 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-lg">
                    {cell.occupant.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {showTerrainInfo && cell.terrain && cell.terrain !== 'normal' && cellSize > 30 && (
                  <div className="absolute bottom-0 right-0 text-xs bg-black bg-opacity-70 text-white px-1 rounded-tl">
                    {cell.terrainModifier || 0}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 
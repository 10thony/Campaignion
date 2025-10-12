// MapCreator's preview is now responsive and dark mode aware, with overflow handling and max-width for better usability.
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { MapPreview } from './MapPreview';

interface MapCreatorProps {
  userId: string;
  mapId?: string;
  onMapCreated?: () => void;
}

type CellState = 'inbounds' | 'outbounds' | 'occupied';
type TerrainType = 'normal' | 'soft' | 'rough' | 'intense' | 'brutal' | 'deadly';

const DEFAULT_CELL_SIZE = 40; // Default cell size in pixels
const MIN_CELL_SIZE = 20;
const MAX_CELL_SIZE = 100;

export const MapCreator = ({ userId, mapId, onMapCreated }: MapCreatorProps) => {
  const [selectedState, setSelectedState] = useState<CellState>('inbounds');
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>('normal');
  const [selectedAbilityScores, setSelectedAbilityScores] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState('#000000');
  const [isCreating, setIsCreating] = useState(!mapId);
  const [mapName, setMapName] = useState('');
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(10);
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);

  const createMap = useMutation(api.maps.createMap);
  const updateMapCells = useMutation(api.maps.updateMapCells);
  const deleteMap = useMutation(api.maps.deleteMap);
  const map = useQuery(api.maps.getMap, mapId ? { mapId: mapId as Id<"maps"> } : 'skip');

  // Generate preview cells for creation form
  const generatePreviewCells = () => {
    const cells = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        cells.push({ x, y, state: 'inbounds' as CellState });
      }
    }
    return cells;
  };

  // Update form state when map is loaded
  useEffect(() => {
    if (map) {
      setMapName(map.name);
      setWidth(map.width);
      setHeight(map.height);
      setIsCreating(false);
    }
  }, [map]);

  const handleCreateMap = async () => {
    if (!mapName || width <= 0 || height <= 0) return;
    
    try {
      await createMap({
        name: mapName,
        width,
        height,
        clerkId: userId,
      });
      setIsCreating(false);
      if (onMapCreated) {
        onMapCreated();
      }
    } catch (error) {
      console.error('Failed to create map:', error);
    }
  };

  const handleCellClick = async (x: number, y: number) => {
    if (!map) return;

    const newCells = map.cells.map(cell => {
      if (cell.x === x && cell.y === y) {
        return {
          ...cell,
          state: selectedState,
          terrain: selectedTerrain,
          terrainModifier: selectedTerrain === 'normal' ? 0 :
                          selectedTerrain === 'soft' ? -1 : 
                          selectedTerrain === 'rough' ? -3 :
                          selectedTerrain === 'intense' ? -5 :
                          selectedTerrain === 'brutal' ? -7 : -9,
          affectedAbilityScores: selectedAbilityScores,
          customColor: customColor !== '#000000' ? customColor : undefined,
        };
      }
      return cell;
    });

    try {
      await updateMapCells({
        mapId: map._id,
        cells: newCells,
      });
    } catch (error) {
      console.error('Failed to update cell:', error);
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCellSize(parseInt(e.target.value));
  };

  const resetZoom = () => {
    setCellSize(DEFAULT_CELL_SIZE);
  };

  const handleBulkColorChange = async (color: string) => {
    if (!map) return;

    const newCells = map.cells.map(cell => {
      if (color === 'reset') {
        // Reset all cells to default (remove custom colors but keep occupants)
        return {
          ...cell,
          customColor: undefined,
        };
      } else if (cell.occupant) {
        // Don't change occupied cells - they retain their occupant color
        return cell;
      } else {
        // Change all non-occupied cells to the new color
        return {
          ...cell,
          customColor: color,
        };
      }
    });

    try {
      await updateMapCells({
        mapId: map._id,
        cells: newCells,
      });
    } catch (error) {
      console.error('Failed to update cell colors:', error);
    }
  };

  if (isCreating) {
    const previewMap = {
      width,
      height,
      cells: generatePreviewCells(),
    };

    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Create New Map</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Map Name</label>
              <input
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Width</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={width}
                  onChange={(e) => setWidth(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={height}
                  onChange={(e) => setHeight(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="form-input"
                />
              </div>
            </div>
            <button
              onClick={handleCreateMap}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create Map
            </button>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg w-full max-w-full overflow-auto flex justify-center">
              <div className="flex justify-center w-full">
                <MapPreview 
                  map={previewMap} 
                  cellSize={30}
                  className="border border-gray-300 dark:border-gray-600"
                />
              </div>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p>Dimensions: {width} × {height}</p>
                <p>Total cells: {width * height}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!map) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{map.name}</h2>
        <div className="space-x-2">
          <button
            onClick={() => deleteMap({ mapId: map._id })}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Delete Map
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Cell State</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value as CellState)}
            className="form-select w-full"
          >
            <option value="inbounds">Inbounds</option>
            <option value="outbounds">Outbounds</option>
            <option value="occupied">Occupied</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Terrain Type</label>
                      <select
              value={selectedTerrain}
              onChange={(e) => setSelectedTerrain(e.target.value as TerrainType)}
              className="form-select w-full"
            >
              <option value="normal">Normal (0)</option>
              <option value="soft">Soft (-1)</option>
              <option value="rough">Rough (-3)</option>
              <option value="intense">Intense (-5)</option>
              <option value="brutal">Brutal (-7)</option>
              <option value="deadly">Deadly (-9)</option>
            </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Custom Color</label>
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-full h-10 rounded border"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Affected Ability Scores</label>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((ability) => (
              <label key={ability} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={selectedAbilityScores.includes(ability)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAbilityScores([...selectedAbilityScores, ability]);
                    } else {
                      setSelectedAbilityScores(selectedAbilityScores.filter(a => a !== ability));
                    }
                  }}
                />
                <span className="capitalize">{ability}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium">Zoom:</label>
        <input
          type="range"
          min={MIN_CELL_SIZE}
          max={MAX_CELL_SIZE}
          value={cellSize}
          onChange={handleZoomChange}
          className="w-48"
        />
        <span className="text-sm text-gray-600">{cellSize}px</span>
        <button
          onClick={resetZoom}
          className="text-sm text-blue-500 hover:text-blue-600"
        >
          Reset
        </button>
      </div>

      <div className="overflow-auto border rounded-lg bg-white dark:bg-gray-800">
        <div className="p-4">
          <MapPreview 
            map={map} 
            cellSize={cellSize}
            interactive={true}
            onCellClick={handleCellClick}
            showTerrainInfo={true}
            onBulkColorChange={handleBulkColorChange}
            showBulkColorControls={true}
          />
        </div>
      </div>
    </div>
  );
}; 
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  MousePointer, 
  Move, 
  Ruler, 
  Zap, 
  Palette, 
  Eye,
  RotateCcw,
  Settings,
  HelpCircle
} from 'lucide-react';
import { MapTool } from './TacticalMapView';
import { cn } from '@/lib/utils';

interface MapToolbarProps {
  activeTool: MapTool;
  onToolChange: (tool: MapTool) => void;
  isDM: boolean;
  onClearMeasurements: () => void;
  onClearAOE: () => void;
  className?: string;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  activeTool,
  onToolChange,
  isDM,
  onClearMeasurements,
  onClearAOE,
  className = ""
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const tools = [
    {
      id: 'select' as MapTool,
      name: 'Select',
      icon: MousePointer,
      description: 'Select tokens and view information',
      available: true
    },
    {
      id: 'move' as MapTool,
      name: 'Move',
      icon: Move,
      description: 'Move selected tokens',
      available: true
    },
    {
      id: 'measure' as MapTool,
      name: 'Measure',
      icon: Ruler,
      description: 'Measure distances between points',
      available: true
    },
    {
      id: 'aoe' as MapTool,
      name: 'Area of Effect',
      icon: Zap,
      description: 'Place AoE spell templates',
      available: true
    },
    {
      id: 'terrain' as MapTool,
      name: 'Terrain',
      icon: Palette,
      description: 'Paint terrain types (DM only)',
      available: isDM
    },
    {
      id: 'info' as MapTool,
      name: 'Info',
      icon: Eye,
      description: 'View detailed information',
      available: true
    }
  ];

  const getToolButton = (tool: typeof tools[0]) => (
    <Button
      key={tool.id}
      variant={activeTool === tool.id ? "default" : "outline"}
      size="sm"
      onClick={() => onToolChange(tool.id)}
      disabled={!tool.available}
      className={cn(
        "flex flex-col items-center gap-1 h-auto p-3 min-w-[60px]",
        activeTool === tool.id && "bg-blue-600 text-white",
        !tool.available && "opacity-50 cursor-not-allowed"
      )}
      title={tool.description}
    >
      <tool.icon size={16} />
      <span className="text-xs">{tool.name}</span>
      {!tool.available && (
        <Badge variant="secondary" className="text-xs px-1 py-0">
          DM
        </Badge>
      )}
    </Button>
  );

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg shadow-sm p-4", className)}>
      {/* Main toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700">Tactical Tools</h3>
          <Badge variant="outline" className="text-xs">
            {isDM ? 'DM Mode' : 'Player Mode'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearMeasurements}
            className="text-xs"
          >
            <RotateCcw size={12} className="mr-1" />
            Clear
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="text-xs"
          >
            <HelpCircle size={12} className="mr-1" />
            Help
          </Button>
        </div>
      </div>

      {/* Tool buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {tools.map(getToolButton)}
      </div>

      {/* Help section */}
      {showHelp && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Mouse Controls</h4>
              <ul className="space-y-1">
                <li>• <strong>Left Click:</strong> Select tokens or confirm actions</li>
                <li>• <strong>Ctrl + Left Drag:</strong> Pan the map</li>
                <li>• <strong>Scroll Wheel:</strong> Zoom in/out</li>
                <li>• <strong>Hover:</strong> Preview movement and effects</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Keyboard Shortcuts</h4>
              <ul className="space-y-1">
                <li>• <strong>1-6:</strong> Switch tools</li>
                <li>• <strong>Space:</strong> Clear current tool</li>
                <li>• <strong>Escape:</strong> Cancel current action</li>
                <li>• <strong>Home:</strong> Reset view</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Active tool info */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Active: <strong className="text-gray-700">{tools.find(t => t.id === activeTool)?.name}</strong>
          </span>
          <span>
            {tools.find(t => t.id === activeTool)?.description}
          </span>
        </div>
      </div>
    </div>
  );
}; 
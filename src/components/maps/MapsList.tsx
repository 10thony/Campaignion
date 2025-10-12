// MapsList map cards and previews are now responsive and dark mode aware, with overflow handling and max-width for better usability.
import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { MapCard } from './MapCard';
import { MapModal } from './MapModal';
import { MapCreator } from './MapCreator';
import { useDatabaseUser } from '../../lib/clerkService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Map } from 'lucide-react';

interface MapsListProps {
  onMapSelect?: (mapId: Id<"maps">) => void;
  isSelectMode?: boolean;
  campaignId?: Id<"campaigns">;
  interactionId?: Id<"interactions">;
  onOpenInteractive?: (mapId: Id<"maps">) => void;
}

export const MapsList: React.FC<MapsListProps> = ({
  onMapSelect,
  isSelectMode = false,
  campaignId,
  interactionId,
  onOpenInteractive
}) => {
  const [selectedMapId, setSelectedMapId] = useState<Id<"maps"> | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isCreateMapOpen, setIsCreateMapOpen] = useState(false);

  // Get database user to ensure proper authentication sync
  const databaseUser = useDatabaseUser();
  
  // Only make queries if user is properly synced to database
  const maps = useQuery(api.maps.getUserMaps, databaseUser ? {} : 'skip');

  // Show loading state if user hasn't been synced yet
  if (!databaseUser) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Show loading state for queries
  if (maps === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading maps...</p>
        </div>
      </div>
    );
  }

  const handleMapClick = (mapId: Id<"maps">) => {
    if (isSelectMode && onMapSelect) {
      onMapSelect(mapId);
    } else {
      setSelectedMapId(mapId);
      setIsMapModalOpen(true);
    }
  };

  const handleMapCreated = () => {
    setIsCreateMapOpen(false);
    // The list will automatically refresh due to Convex reactivity
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Maps</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateMapOpen(true)}
            className="flex items-center gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Create Map
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {maps.map((map) => (
          <MapCard
            key={map._id}
            map={map}
            isSelected={selectedMapId === map._id}
            onSelect={handleMapClick}
            compact={false}
          />
        ))}
      </div>

      {maps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Map className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">No maps created yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first map to get started with tactical gameplay!
          </p>
          <Button 
            onClick={() => setIsCreateMapOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Map
          </Button>
        </div>
      )}

      {/* Create Map Modal */}
      {isCreateMapOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create New Map</h2>
              <Button
                variant="ghost"
                onClick={() => setIsCreateMapOpen(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            <MapCreator onMapCreated={handleMapCreated} showHeader={false} />
          </div>
        </div>
      )}

      {/* Unified Map Modal */}
      {selectedMapId && (
        <MapModal
          isOpen={isMapModalOpen}
          onClose={() => {
            setIsMapModalOpen(false);
            setSelectedMapId(null);
          }}
          mapId={selectedMapId}
          mode="detail"
          campaignId={campaignId}
          interactionId={interactionId}
          onOpenInteractive={onOpenInteractive}
        />
      )}
    </div>
  );
}; 
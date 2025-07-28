// MapsList map cards and previews are now responsive and dark mode aware, with overflow handling and max-width for better usability.
import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { MapCard } from './MapCard';
import { useDatabaseUser } from '../../lib/clerkService';

interface MapsListProps {
  onMapSelect?: (mapId: Id<"maps">) => void;
  isSelectMode?: boolean;
}

export const MapsList: React.FC<MapsListProps> = ({
  onMapSelect,
  isSelectMode = false
}) => {
  // Get database user to ensure proper authentication sync
  const databaseUser = useDatabaseUser();
  
  // Only make query if user is properly synced to database
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

  // Show loading state for query
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

return (
  <div className="p-4">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold">Your Maps</h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {maps.map((map) => (
        <div
          key={map._id}
          className="block p-4 border rounded hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800 max-w-xs w-full mx-auto map-card-responsive"
        >
          <h3 className="text-xl font-semibold mb-2">{map.name}</h3>
          
          <div className="mb-3 flex justify-center w-full overflow-x-auto">
            <div className="bg-white dark:bg-gray-800 rounded p-2 w-full max-w-full">
              <MapPreview map={map} cellSize={12} />
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Dimensions: {map.width} × {map.height}</p>
            <p>Created: {new Date(map.createdAt).toLocaleDateString()}</p>
            <p>Last Updated: {new Date(map.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>

    {maps.length === 0 && (
      <div className="text-center py-8 text-gray-500">
        No maps created yet. Click "Create New Map" to get started!
      </div>
    )}
  </div>
);
}; 
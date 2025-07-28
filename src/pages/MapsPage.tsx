import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { MapTabContent } from '../components/maps/MapTabContent';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MapModal } from '../components/maps/MapModal';
import { MapCreator } from '../components/maps/MapCreator';
import { Plus, Map } from 'lucide-react';

export const MapsPage: React.FC = () => {
  const { user } = useUser();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isCreateMapOpen, setIsCreateMapOpen] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-4">Maps</h1>
        <p>Please sign in to access maps.</p>
      </div>
    );
  }

  const handleMapCreated = () => {
    setIsCreateMapOpen(false);
    // The MapTabContent will automatically refresh due to Convex reactivity
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Map className="w-8 h-8" />
          Maps
        </h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateMapOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Map
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsMapModalOpen(true)}
          >
            Map Manager
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Maps</CardTitle>
        </CardHeader>
        <CardContent>
          <MapTabContent
            userId={user.id}
            isSelectMode={false}
          />
        </CardContent>
      </Card>

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

      {/* Map Manager Modal */}
      <MapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        userId={user.id}
        isSelectMode={false}
      />
    </div>
  );
}; 
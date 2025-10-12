import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { MapTab } from './MapTab';
import { MapModal } from './MapModal';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const MapTest: React.FC = () => {
  const { userId } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  if (!userId) return <div>Please sign in to test maps</div>;

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Map Functionality Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setIsModalOpen(true)}>
              Open Map Modal
            </Button>
            <Button 
              variant="outline"
              onClick={() => setSelectedInstanceId(null)}
            >
              Clear Selection
            </Button>
          </div>
          
          {selectedInstanceId && (
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded">
              <p>Selected Instance ID: {selectedInstanceId}</p>
            </div>
          )}

          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Map Tab Component:</h3>
            <MapTab
              userId={userId}
              onMapInstanceSelected={(instanceId) => {
                setSelectedInstanceId(instanceId);
                console.log('Map instance selected:', instanceId);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <MapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
        onMapInstanceSelected={(instanceId) => {
          setSelectedInstanceId(instanceId);
          console.log('Map instance selected from modal:', instanceId);
        }}
      />
    </div>
  );
}; 
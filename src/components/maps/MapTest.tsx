import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { MapsList } from './MapsList';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const MapTest: React.FC = () => {
  const { userId } = useAuth();
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);

  if (!userId) return <div>Please sign in to test maps</div>;

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Map Functionality Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setSelectedMapId(null)}
            >
              Clear Selection
            </Button>
          </div>
          
          {selectedMapId && (
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded">
              <p>Selected Map ID: {selectedMapId}</p>
            </div>
          )}

          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Maps List Component:</h3>
            <MapsList
              onMapSelect={(mapId) => {
                setSelectedMapId(mapId);
                console.log('Map selected:', mapId);
              }}
              isSelectMode={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
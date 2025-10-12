import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { MapModal } from './MapModal';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Map, Settings, Info } from 'lucide-react';

export const TacticalMapDemo: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <div className="p-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please sign in to test the tactical map system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Tactical Map System Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">This demo allows you to test the new tactical map system:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Create or load sample maps</li>
              <li>Create map instances for tactical combat</li>
              <li>Use the tactical view with pan, zoom, and token management</li>
              <li>Test D&D 5e movement rules and terrain effects</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Open Map Management
            </Button>
          </div>

          {selectedInstanceId && (
            <Alert>
              <Map className="h-4 w-4" />
              <AlertDescription>
                Selected Instance ID: <code className="bg-muted px-1 rounded">{selectedInstanceId}</code>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Quick Start Guide:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Open Map Management" above</li>
              <li>Go to the "Maps" tab and load sample maps (if you don't have any)</li>
              <li>Click "Edit" on a map to create an instance</li>
              <li>Go to the "Instances" tab and click "Manage" on an instance</li>
              <li>Switch to "Tactical View" to test the tactical interface</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <MapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={user?.id || ''}
        onMapInstanceSelected={(instanceId) => {
          setSelectedInstanceId(instanceId);
          console.log('Map instance selected:', instanceId);
        }}
      />
    </div>
  );
}; 
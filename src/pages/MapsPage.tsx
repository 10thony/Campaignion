import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from '@tanstack/react-router';
import { MapsList } from '../components/maps/MapsList';
import { MapMigrationPanel } from '../components/maps/MapMigrationPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { MapCreator } from '../components/maps/MapCreator';
import { Plus, Map, Sword, RefreshCw, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const MapsPage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isCreateMapOpen, setIsCreateMapOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('battle');

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
    // The MapsList will automatically refresh due to Convex reactivity
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
            onClick={() => navigate({ to: '/battle-map' })}
            className="flex items-center gap-2"
            variant="default"
          >
            <Sword className="w-4 h-4" />
            Go to Battle Map
          </Button>
        </div>
      </div>

      {/* Recommendation Card */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Sword className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Battle Map System Now Available!
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                The new Battle Map system includes enhanced token management, HP tracking, 
                measurement tools, AoE templates, and movement preview. Perfect for tactical combat!
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate({ to: '/battle-map' })}
                  className="gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Try Battle Map
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('migrate')}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Migrate Legacy Maps
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="battle" className="gap-2">
            <Sword className="w-4 h-4" />
            Battle Maps
            <Badge variant="secondary" className="ml-2">New!</Badge>
          </TabsTrigger>
          <TabsTrigger value="legacy" className="gap-2">
            <Map className="w-4 h-4" />
            Legacy Maps
          </TabsTrigger>
          <TabsTrigger value="migrate" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Migration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="battle">
          <Card>
            <CardHeader>
              <CardTitle>Battle Maps</CardTitle>
              <CardDescription>
                Enhanced tactical maps with tokens, HP tracking, and advanced features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Sword className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Battle Maps are in their own page!</h3>
                <p className="text-gray-600 mb-4">
                  Navigate to the Battle Map page to create and manage your tactical maps.
                </p>
                <Button onClick={() => navigate({ to: '/battle-map' })}>
                  Go to Battle Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Legacy Maps
                <Button
                  onClick={() => setIsCreateMapOpen(true)}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Legacy Map
                </Button>
              </CardTitle>
              <CardDescription>
                Original map system - consider migrating to Battle Maps for enhanced features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MapsList isSelectMode={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migrate">
          <MapMigrationPanel />
        </TabsContent>
      </Tabs>

      {/* Create Map Modal */}
      {isCreateMapOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create New Legacy Map</h2>
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
    </div>
  );
}; 
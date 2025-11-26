import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { BattleMapToolbar } from "./BattleMapToolbar";
import { BattleMapSelector } from "./BattleMapSelector";
import { MapBoard } from "./MapBoard";
import { NewBattleMapDialog } from "./NewBattleMapDialog";
import { MapCreator } from "../maps/MapCreator";
import { BattleTokenDialog } from "./BattleTokenDialog";
import { SampleDataPanel } from "../SampleDataPanel";
import { Alert, AlertDescription } from "../ui/alert";
import { Info, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

export default function BattleMapApp() {
  const maps = useQuery(api.battleMaps.list) ?? [];
  const { selectedMapId, setSelectedMapId, showNewMap, setShowNewMap } = useBattleMapUI();
  const [showWelcome, setShowWelcome] = useState(maps.length === 0);

  return (
    <div className="h-full flex flex-col">
      {/* Welcome Banner */}
      {showWelcome && maps.length === 0 && (
        <Alert className="m-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-blue-900">Welcome to the Enhanced Battle Map System!</strong>
              <p className="text-sm text-blue-700 mt-1">
                Create tactical maps with tokens, HP tracking, terrain editing, measurement tools, 
                AoE templates, and movement preview. Perfect for D&D 5e combat!
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowWelcome(false)}
              className="ml-4"
            >
              Got it
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="border-b">
        <div className="container mx-auto px-4 py-2 flex items-center gap-4">
          <BattleMapSelector
            maps={maps}
            value={selectedMapId}
            onChange={setSelectedMapId}
          />
          <BattleMapToolbar />
        </div>
      </div>
      
      {/* Sample Data Panel */}
      <div className="container mx-auto px-4 py-2">
        <SampleDataPanel 
          entityType="maps" 
          onDataLoaded={() => {
            // Data will automatically refresh via Convex queries
          }} 
        />
      </div>
      <div className="flex-1">
        {selectedMapId ? (
          <MapBoard mapId={selectedMapId} />
        ) : (
          <div className="h-full grid place-items-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">🗺️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Map Selected
              </h2>
              <p className="text-gray-600 mb-6">
                Create a new battle map or select an existing one from the dropdown above to begin your tactical combat session.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p><strong>Features:</strong></p>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div>✅ Token drag & drop</div>
                  <div>✅ HP tracking</div>
                  <div>✅ 10 terrain types</div>
                  <div>✅ Pan & zoom</div>
                  <div>✅ Measurement tool</div>
                  <div>✅ AoE templates</div>
                  <div>✅ Movement preview</div>
                  <div>✅ Real-time sync</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {showNewMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create New Battle Map</h2>
              <button
                onClick={() => setShowNewMap(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <MapCreator 
              onMapCreated={() => {
                setShowNewMap(false);
              }} 
              showHeader={false} 
            />
          </div>
        </div>
      )}
      <BattleTokenDialog />
    </div>
  );
}

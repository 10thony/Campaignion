import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

export function MapMigrationPanel() {
  const { user } = useUser();
  const [migrating, setMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<any>(null);
  
  const status = useQuery(api.mapMigration.getMigrationStatus);
  const legacyMaps = useQuery(api.mapMigration.getLegacyMaps);
  const migrateAll = useMutation(api.mapMigration.migrateAllMaps);
  const migrateSingle = useMutation(api.mapMigration.migrateSingleMap);

  const handleMigrateAll = async () => {
    if (!user) {
      alert("Please sign in to migrate maps");
      return;
    }

    if (!confirm(`Migrate ${status?.legacyMaps || 0} legacy maps to the new Battle Map system?`)) {
      return;
    }

    setMigrating(true);
    setMigrationResults(null);

    try {
      const results = await migrateAll({ clerkId: user.id });
      setMigrationResults(results);
    } catch (error) {
      console.error("Migration failed:", error);
      alert(`Migration failed: ${error}`);
    } finally {
      setMigrating(false);
    }
  };

  const handleMigrateSingle = async (mapId: string) => {
    if (!user) {
      alert("Please sign in to migrate maps");
      return;
    }

    setMigrating(true);

    try {
      const result = await migrateSingle({ 
        legacyMapId: mapId as any, 
        clerkId: user.id 
      });
      alert(result.message);
      // Refresh the page to show updated counts
      window.location.reload();
    } catch (error) {
      console.error("Migration failed:", error);
      alert(`Migration failed: ${error}`);
    } finally {
      setMigrating(false);
    }
  };

  if (!status) {
    return <div>Loading migration status...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Map Migration Status
          </CardTitle>
          <CardDescription>
            Migrate your legacy maps to the new Battle Map system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{status.legacyMaps}</div>
              <div className="text-sm text-gray-600">Legacy Maps</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{status.battleMaps}</div>
              <div className="text-sm text-blue-600">Battle Maps</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{status.legacyInstances}</div>
              <div className="text-sm text-gray-600">Legacy Instances</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{status.battleInstances}</div>
              <div className="text-sm text-blue-600">Battle Instances</div>
            </div>
          </div>

          {status.migrationRecommended && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {status.legacyMaps} legacy map(s) that can be migrated to the new system.
                Migration preserves all terrain data and tokens.
              </AlertDescription>
            </Alert>
          )}

          {!status.migrationRecommended && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                All maps have been migrated or you're starting fresh! 🎉
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Migration Actions */}
      {status.migrationRecommended && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Actions</CardTitle>
            <CardDescription>
              Migrate all maps at once or select individual maps to migrate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="font-semibold text-blue-900">Migrate All Maps</div>
                <div className="text-sm text-blue-700">
                  Convert all {status.legacyMaps} legacy maps to Battle Maps
                </div>
              </div>
              <Button 
                onClick={handleMigrateAll}
                disabled={migrating}
                className="gap-2"
              >
                {migrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Migrate All
                  </>
                )}
              </Button>
            </div>

            {/* Individual Maps */}
            {legacyMaps && legacyMaps.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-gray-700">Individual Maps</h3>
                {legacyMaps.map((map) => (
                  <div 
                    key={map._id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{map.name}</div>
                      <div className="text-xs text-gray-600">
                        {map.width}×{map.height} ({map.cellCount} cells)
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMigrateSingle(map._id)}
                      disabled={migrating}
                    >
                      Migrate
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Migration Results */}
      {migrationResults && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{migrationResults.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{migrationResults.successful}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{migrationResults.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>

            <div className="space-y-2">
              {migrationResults.results.map((result: any, index: number) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{result.name}</div>
                    {result.success && (
                      <div className="text-sm text-green-700">
                        {result.result?.message}
                      </div>
                    )}
                    {!result.success && (
                      <div className="text-sm text-red-700">
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                  {result.success && (
                    <Badge variant="secondary">
                      {result.result?.migratedInstances || 0} instances
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Migration Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p><strong>What gets migrated:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Map dimensions and cell data</li>
            <li>Terrain types and colors</li>
            <li>Map instances and their positions</li>
            <li>Entity/token data</li>
            <li>Ownership and permissions</li>
          </ul>
          <p className="mt-4"><strong>What changes:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Maps are renamed with "(Migrated)" suffix</li>
            <li>Entity positions become battle tokens</li>
            <li>Cell size is auto-calculated for optimal display</li>
          </ul>
          <p className="mt-4 text-yellow-700">
            <strong>Note:</strong> Legacy maps are not deleted during migration. 
            They remain accessible until you manually remove them.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


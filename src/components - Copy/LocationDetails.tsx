import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, Link, useSearchParams, useNavigate } from "react-router-dom";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "@clerk/clerk-react";
import { MapPreview } from "./maps/MapPreview";
import { MapCard } from "./maps/MapCard";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { 
  ArrowLeft, 
  MapPin,
  Users,
  Eye,
  Map,
  Edit,
  Trash2,
  AlertCircle,
  Plus,
  Check
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { useState } from "react";

export default function LocationDetails() {
  const { userId } = useAuth();
  const { locationId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const location = useQuery(api.locations.get, { id: locationId as Id<"locations"> });
  const maps = useQuery(api.maps.getUserMaps, userId ? { clerkId: userId } : "skip") || [];
  const npcs = useQuery(api.npcs.getAllNpcs, {}) || [];
  const updateLocation = useMutation(api.locations.update);

  const [selectedMapId, setSelectedMapId] = useState<Id<"maps"> | undefined>(location?.mapId);
  const [isAssociatingMap, setIsAssociatingMap] = useState(false);

  if (location === undefined) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading location details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (location === null) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Location Not Found</h2>
              <p>The location you're looking for doesn't exist.</p>
              <Button asChild>
                <Link to="/locations">Back to Locations</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const associatedMap = location.mapId ? maps.find(m => m._id === location.mapId) : null;
  const notableNpcs = location.notableNpcIds.map(npcId => 
    npcs.find(npc => npc._id === npcId)
  ).filter(Boolean);

  const handleEdit = () => {
    navigate(`/locations/${locationId}/edit${campaignId ? `?campaignId=${campaignId}` : ''}`);
  };

  const handleBack = () => {
    if (campaignId) {
      navigate(`/campaigns/${campaignId}`);
    } else {
      navigate("/locations");
    }
  };

  const handleAssociateMap = async () => {
    if (!selectedMapId || !userId) return;

    setIsAssociatingMap(true);
    try {
      await updateLocation({
        id: locationId as Id<"locations">,
        mapId: selectedMapId,
      });
      // Refresh the page to show the updated map
      window.location.reload();
    } catch (error) {
      console.error("Error associating map:", error);
    } finally {
      setIsAssociatingMap(false);
    }
  };

  const handleRemoveMap = async () => {
    if (!userId) return;

    setIsAssociatingMap(true);
    try {
      await updateLocation({
        id: locationId as Id<"locations">,
        mapId: undefined,
      });
      // Refresh the page to show the updated state
      window.location.reload();
    } catch (error) {
      console.error("Error removing map:", error);
    } finally {
      setIsAssociatingMap(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {campaignId ? "Back to Campaign" : "Back to Locations"}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{location.name}</h1>
            <p className="text-muted-foreground">
              Location details and information
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Location
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Core details about the location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{location.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <Badge variant="secondary" className="text-sm">
                    {location.type}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <div className="p-4 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">{location.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Additional Details
              </CardTitle>
              <CardDescription>
                Notable NPCs and hidden information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Notable NPCs</label>
                {notableNpcs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {notableNpcs.map((npc: any) => (
                      <div key={npc._id} className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">{npc.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No notable NPCs associated with this location
                  </p>
                )}
              </div>

              <Separator />

              {location.secrets && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Secrets</label>
                  <div className="p-4 bg-muted rounded-md border-l-4 border-yellow-500">
                    <p className="whitespace-pre-wrap text-sm">{location.secrets}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hidden information that players might discover
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Associated Map
              </CardTitle>
              <CardDescription>
                Visual reference for this location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {associatedMap ? (
                <div className="space-y-4">
                  <MapCard
                    map={associatedMap}
                    isSelected={true}
                    compact={false}
                    className="selected-map-card"
                  />
                  
                  <div className="flex gap-2">
                    <Button asChild variant="outline">
                      <Link to={`/maps/${associatedMap._id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Map
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleRemoveMap}
                      disabled={isAssociatingMap}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Map
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {maps.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium">Available Maps</h4>
                          <Button asChild variant="outline">
                            <Link to="/maps/new">
                              <Plus className="h-4 w-4 mr-2" />
                              Create New Map
                            </Link>
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {maps.map((map) => (
                            <MapCard
                              key={map._id}
                              map={map}
                              isSelected={selectedMapId === map._id}
                              onSelect={(mapId) => setSelectedMapId(
                                selectedMapId === mapId ? undefined : mapId
                              )}
                            />
                          ))}
                        </div>
                        
                        {selectedMapId && (
                          <div className="space-y-4">
                            <Separator />
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-muted-foreground">
                                Selected Map Preview
                              </label>
                              <div className="border rounded-md p-4 bg-white dark:bg-gray-800">
                                {(() => {
                                  const selectedMap = maps.find(m => m._id === selectedMapId);
                                  return selectedMap ? (
                                    <MapPreview map={selectedMap} />
                                  ) : (
                                    <div className="flex items-center justify-center p-4 text-muted-foreground">
                                      <p>Map not found</p>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleAssociateMap}
                                disabled={isAssociatingMap}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                {isAssociatingMap ? "Associating..." : "Associate Map"}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => setSelectedMapId(undefined)}
                                disabled={isAssociatingMap}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No maps created yet</p>
                      <p className="text-sm mb-4">
                        Create your first map to associate with this location
                      </p>
                      <Button asChild>
                        <Link to="/maps/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Map
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
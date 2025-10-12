import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { LocationType, locationTypes } from "../types/location.ts";
import { Id } from "../../convex/_generated/dataModel";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { MapPreview } from "./maps/MapPreview";
import { MapCard } from "./maps/MapCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { 
  AlertCircle, 
  ArrowLeft, 
  MapPin,
  Users,
  Eye,
  Plus,
  Map
} from "lucide-react";

interface LocationFormProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export default function LocationForm({ onSubmitSuccess, onCancel }: LocationFormProps) {
  const { userId } = useAuth();
  const { isAdmin } = useRoleAccess();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const createLocation = useMutation(api.locations.create);
  const npcs = useQuery(api.npcs.getAllNpcs, {}) || [];
  const maps = useQuery(api.maps.getUserMaps, userId ? { clerkId: userId } : "skip") || [];

  const [formData, setFormData] = useState({
    name: "",
    type: locationTypes[0] as LocationType,
    description: "",
    notableNpcIds: [] as Id<"npcs">[],
    linkedLocations: [] as Id<"locations">[],
    interactionsAtLocation: [] as Id<"interactions">[],
    imageUrls: [] as string[],
    secrets: "",
    mapId: undefined as Id<"maps"> | undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMap = formData.mapId ? maps.find(m => m._id === formData.mapId) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setErrors({ general: "No user ID available" });
      return;
    }

    // Validate required fields
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await createLocation({
        ...formData,
        clerkId: userId,
      });
      
      // Reset form
      setFormData({
        name: "",
        type: locationTypes[0] as LocationType,
        description: "",
        notableNpcIds: [] as Id<"npcs">[],
        linkedLocations: [] as Id<"locations">[],
        interactionsAtLocation: [] as Id<"interactions">[],
        imageUrls: [] as string[],
        secrets: "",
        mapId: undefined,
      });
      
      // Handle navigation based on user role and context
      if (returnTo === 'campaign-form') {
        // General user flow - return to campaign creation with refresh parameter
        navigate("/campaigns/new?refresh=true");
      } else if (isAdmin) {
        // Admin flow - return to locations list
        navigate("/locations");
      } else {
        // General user flow - return to locations list
        navigate("/locations");
      }
      
      onSubmitSuccess?.();
    } catch (error) {
      console.error("Error creating location:", error);
      setErrors({ general: "Failed to create location. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (returnTo === 'campaign-form') {
      navigate("/campaigns/new?refresh=true");
    } else if (onCancel) {
      onCancel();
    } else {
      navigate("/locations");
    }
  };

  const handleNpcToggle = (npcId: Id<"npcs">) => {
    setFormData(prev => ({
      ...prev,
      notableNpcIds: prev.notableNpcIds.includes(npcId)
        ? prev.notableNpcIds.filter(id => id !== npcId)
        : [...prev.notableNpcIds, npcId]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Locations
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Location</h1>
            <p className="text-muted-foreground">
              Define a new location for your campaign world
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter location name"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as LocationType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the location..."
                    rows={4}
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notable NPCs</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {npcs.map((npc: any) => (
                      <div key={npc._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`npc-${npc._id}`}
                          checked={formData.notableNpcIds.includes(npc._id)}
                          onCheckedChange={() => handleNpcToggle(npc._id)}
                        />
                        <Label htmlFor={`npc-${npc._id}`} className="text-sm cursor-pointer">
                          {npc.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select NPCs that are associated with this location
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="secrets">Secrets</Label>
                  <Textarea
                    id="secrets"
                    value={formData.secrets}
                    onChange={(e) => setFormData({ ...formData, secrets: e.target.value })}
                    placeholder="Any hidden information or secrets about this location..."
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    Hidden information that players might discover
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Available Maps
                </CardTitle>
                <CardDescription>
                  Select a map to associate with this location for visual reference
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {maps.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {maps.map((map) => (
                        <MapCard
                          key={map._id}
                          map={map}
                          isSelected={formData.mapId === map._id}
                          onSelect={(mapId) => setFormData({ 
                            ...formData, 
                            mapId: formData.mapId === mapId ? undefined : mapId 
                          })}
                        />
                      ))}
                    </div>
                    
                    {formData.mapId && (
                      <div className="space-y-2">
                        <Label>Selected Map Preview</Label>
                        <div className="border rounded-md p-4 bg-white dark:bg-gray-800">
                          <MapPreview map={selectedMap!} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No maps created yet</p>
                    <p className="text-sm mb-4">
                      Create your first map to associate with locations
                    </p>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <Button asChild variant="outline">
                    <Link to="/maps/new?returnTo=location-form">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Map
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Location"}
          </Button>
        </div>
      </form>
    </div>
  );
} 
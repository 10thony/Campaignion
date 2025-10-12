import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useRoleAccess } from "../../hooks/useRoleAccess";
import { MapTabContent } from "../maps/MapTabContent";
import { BaseModal, FormTabs, LoadingSpinner } from "./shared";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { 
  MapPin,
  Map,
  Plus,
  Loader2,
  Save,
  Edit,
  X,
  AlertCircle
} from "lucide-react";

interface LocationCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (locationId: Id<"locations">) => void;
  initialData?: {
    id?: Id<"locations">;
    name?: string;
    description?: string;
    type?: string;
    mapId?: Id<"maps">;
  } | null;
  isEditing?: boolean;
}

interface LocationFormData {
  name: string;
  description: string;
  type: "City" | "Town" | "Village" | "Dungeon" | "Forest" | "Mountain" | "Desert" | "Swamp" | "Castle" | "Temple" | "Tavern" | "Shop" | "Other";
  mapId?: Id<"maps">;
}

const LocationCreationModal: React.FC<LocationCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  isEditing = false
}) => {
  const { user } = useUser();
  const { isAdmin } = useRoleAccess();
  const navigate = useNavigate();
  const createLocation = useMutation(api.locations.create);
  const updateLocation = useMutation(api.locations.update);
  const maps = useQuery(api.maps.getUserMaps, user?.id ? { clerkId: user.id } : "skip") || [];
  
  const [formData, setFormData] = useState<LocationFormData>({
    name: "",
    description: "",
    type: "Other",
    mapId: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        type: (initialData.type as LocationFormData["type"]) || "Other",
        mapId: initialData.mapId,
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Location name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Location description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const locationData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        notableNpcIds: [],
        linkedLocations: [],
        interactionsAtLocation: [],
        imageUrls: [],
        secrets: "",
        mapId: formData.mapId,
        clerkId: user.id,
      };

      let locationId;
      if (isEditing && initialData?.id) {
        // Update existing location
        await updateLocation({
          id: initialData.id,
          ...locationData,
        });
        locationId = initialData.id;
      } else {
        // Create new location
        locationId = await createLocation(locationData);
      }

      onSuccess(locationId);
      
      // Handle navigation based on user role
      if (isAdmin) {
        // Admin flow - navigate to locations list
        navigate("/locations");
      } else {
        // General user flow - navigate to campaign creation with refresh parameter
        navigate("/campaigns/new?refresh=true");
      }
      
      handleClose();
    } catch (error) {
      console.error("Error creating/updating location:", error);
      setError(`Failed to ${isEditing ? 'update' : 'create'} location. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      type: "Other",
      mapId: undefined,
    });
    setErrors({});
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const getModalTitle = () => {
    if (isEditing) return "Edit Location";
    return "Create New Location";
  };

  const getModalDescription = () => {
    if (isEditing) return "Edit location details";
    return "Define a new location for your campaign world";
  };

  const handleMapSelected = (mapId: Id<"maps">) => {
    setFormData({
      ...formData,
      mapId: formData.mapId === mapId ? undefined : mapId
    });
  };

  const handleRemoveMap = () => {
    setFormData({
      ...formData,
      mapId: undefined
    });
  };

  const getSelectedMap = () => {
    return maps.find(map => map._id === formData.mapId);
  };

  const tabs = [
    {
      value: "basic",
      label: "Basic Info",
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? "border-destructive" : ""}
              placeholder="Enter location name"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Location Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as LocationFormData["type"] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="City">City</SelectItem>
                <SelectItem value="Town">Town</SelectItem>
                <SelectItem value="Village">Village</SelectItem>
                <SelectItem value="Dungeon">Dungeon</SelectItem>
                <SelectItem value="Forest">Forest</SelectItem>
                <SelectItem value="Mountain">Mountain</SelectItem>
                <SelectItem value="Desert">Desert</SelectItem>
                <SelectItem value="Swamp">Swamp</SelectItem>
                <SelectItem value="Castle">Castle</SelectItem>
                <SelectItem value="Temple">Temple</SelectItem>
                <SelectItem value="Tavern">Tavern</SelectItem>
                <SelectItem value="Shop">Shop</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={errors.description ? "border-destructive" : ""}
              placeholder="Describe the location..."
              rows={4}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>
        </div>
      ),
    },
    {
      value: "map",
      label: "Map",
      icon: <Map className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <Label>Select a map (optional)</Label>
          
          {formData.mapId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <Map className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{getSelectedMap()?.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getSelectedMap()?.width} × {getSelectedMap()?.height} dimensions
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveMap}
                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No map selected</p>
              <p className="text-sm mb-4">Select a map to associate with this location</p>
            </div>
          )}

          {/* Integrated MapTabContent */}
          <MapTabContent
            userId={user?.id || ""}
            onMapSelected={handleMapSelected}
            isSelectMode={true}
            className="mt-4"
          />
        </div>
      ),
    },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      description={getModalDescription()}
      size="4xl"
      maxHeight="90vh"
    >
      <LoadingSpinner isLoading={isSubmitting} overlay text={isEditing ? "Updating location..." : "Creating location..."} />

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormTabs tabs={tabs} defaultValue="basic" />

        <Separator />

        {/* Action Bar */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEditing ? "Update Location" : "Create Location"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default LocationCreationModal; 
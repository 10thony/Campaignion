import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCollapsibleSection } from "../../../hooks/useCollapsibleSection";
import EntitySelectionModal from "../../modals/EntitySelectionModal";
import LocationCreationModal from "../../modals/LocationCreationModal";
import "./LocationsSection.css";

interface LocationsSectionProps {
  campaignId: Id<"campaigns">;
  locationIds?: Id<"locations">[];
  onUpdate: () => void;
  canAdd?: boolean;
  canUnlink?: boolean;
}

type ModalType = "entitySelection" | "locationCreation" | "locationEdit" | null;

interface LocationModalData {
  id?: Id<"locations">;
  name?: string;
  description?: string;
  type?: string;
  mapId?: Id<"maps">;
}

const LocationsSection: React.FC<LocationsSectionProps> = ({
  campaignId,
  locationIds = [],
  onUpdate,
  canAdd = false,
  canUnlink = false,
}) => {
  const { user } = useUser();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationModalData | null>(null);
  const { isCollapsed, toggleCollapsed } = useCollapsibleSection(
    `locations-${campaignId}`,
    false
  );

  const locations = useQuery(api.locations.list);
  const updateCampaign = useMutation(api.campaigns.updateCampaign);

  const campaignLocations = locations?.filter(location => 
    locationIds.includes(location._id)
  ) || [];

  const openEntitySelection = () => {
    setActiveModal("entitySelection");
  };

  const openLocationCreation = () => {
    setSelectedLocation(null);
    setActiveModal("locationCreation");
  };

  const openLocationEdit = (location: any) => {
    setSelectedLocation({
      id: location._id,
      name: location.name,
      description: location.description,
      type: location.type,
      mapId: location.mapId,
    });
    setActiveModal("locationEdit");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedLocation(null);
  };

  const handleEntitySelect = async (entityId: Id<any>) => {
    if (!user?.id) {
      alert("You must be logged in to perform this action.");
      return;
    }
    
    try {
      const currentLocations = locationIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        locationIds: [...currentLocations, entityId] 
      });
      onUpdate();
    } catch (error) {
      console.error("Error linking location:", error);
      alert("Failed to link location. Please try again.");
    }
    
    closeModal();
  };

  const handleLocationCreated = async (locationId: Id<"locations">) => {
    if (!user?.id) {
      alert("You must be logged in to perform this action.");
      return;
    }
    
    try {
      const currentLocations = locationIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        locationIds: [...currentLocations, locationId] 
      });
      onUpdate();
      alert("Location created and linked successfully!");
    } catch (error) {
      console.error("Error linking location:", error);
      alert("Location created but failed to link. You can link it manually.");
    }
    
    closeModal();
  };

  const handleUnlinkEntity = async (entityId: Id<any>) => {
    if (!user?.id) {
      alert("You must be logged in to perform this action.");
      return;
    }
    
    try {
      const currentLocations = locationIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        locationIds: currentLocations.filter(id => id !== entityId) 
      });
      onUpdate();
    } catch (error) {
      console.error("Error unlinking location:", error);
      alert("Failed to unlink location. Please try again.");
    }
  };

  return (
    <div className="locations-section">
      <div className="section-header">
        <div className="header-left clickable" onClick={toggleCollapsed}>
          <button 
            className="collapse-button"
            onClick={(e) => e.stopPropagation()}
            aria-label={isCollapsed ? "Expand locations section" : "Collapse locations section"}
          >
            {isCollapsed ? "▶️" : "▼"}
          </button>
          <h3 className="section-title">🗺️ Locations ({campaignLocations.length})</h3>
        </div>
        <div className="header-actions" onClick={(e) => e.stopPropagation()}>
          {canAdd && (
            <>
              <button 
                className="add-button"
                onClick={openEntitySelection}
              >
                + Link Location
              </button>
              <button 
                className="add-button"
                onClick={openLocationCreation}
              >
                + Create Location
              </button>
            </>
          )}
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="section-content">
          {campaignLocations.length > 0 ? (
            <div className="entities-grid">
              {campaignLocations.map((location: any) => (
                <div key={location._id} className="entity-card">
                  <div 
                    className="entity-info clickable"
                    onClick={() => openLocationEdit(location)}
                  >
                    <h4 className="entity-name">{location.name}</h4>
                    <p className="entity-description">
                      {location.description?.substring(0, 100)}...
                    </p>
                    <span className="entity-type">{location.type}</span>
                  </div>
                  <div className="entity-actions">
                    {canUnlink && (
                      <button 
                        className="unlink-button"
                        onClick={() => handleUnlinkEntity(location._id)}
                      >
                        Unlink
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No locations added to this campaign yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {activeModal === "entitySelection" && (
        <EntitySelectionModal
          isOpen={true}
          onClose={closeModal}
          onSelect={handleEntitySelect}
          entityType="locations"
          title="Link Existing Location"
          currentLinkedIds={locationIds}
        />
      )}

      {(activeModal === "locationCreation" || activeModal === "locationEdit") && (
        <LocationCreationModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={handleLocationCreated}
          initialData={selectedLocation}
          isEditing={activeModal === "locationEdit"}
        />
      )}
    </div>
  );
};

export default LocationsSection; 
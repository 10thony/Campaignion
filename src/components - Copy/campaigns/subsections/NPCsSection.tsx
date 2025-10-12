import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCollapsibleSection } from "../../../hooks/useCollapsibleSection";
// import { useNavigationState } from "../../../hooks/useNavigationState";
import EntitySelectionModal from "../../modals/EntitySelectionModal";
import NPCCreationModal from "../../modals/NPCCreationModal";
import "./NPCsSection.css";

interface NPCsSectionProps {
  campaignId: Id<"campaigns">;
  npcIds?: Id<"npcs">[];
  onUpdate: () => void;
  canAdd?: boolean;
  canUnlink?: boolean;
}

type ModalType = "entitySelection" | "npcCreation" | "characterView" | null;

const NPCsSection: React.FC<NPCsSectionProps> = ({
  campaignId,
  npcIds = [],
  onUpdate,
  canAdd = false,
  canUnlink = false,
}) => {
  const { user } = useUser();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<Id<"playerCharacters"> | Id<"npcs"> | null>(null);
  const { isCollapsed, toggleCollapsed } = useCollapsibleSection(
    `npcs-${campaignId}`,
    false
  );
  // const { navigateToDetail } = useNavigationState();

  const npcs = useQuery(api.npcs.getAllNpcs);
  const updateCampaign = useMutation(api.campaigns.updateCampaign);

  const campaignNpcs = npcs?.filter(npc => 
    npcIds.includes(npc._id)
  ) || [];

  const openEntitySelection = () => {
    setActiveModal("entitySelection");
  };

  const openNPCCreation = () => {
    setActiveModal("npcCreation");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedCharacterId(null);
  };

  const handleEntitySelect = async (entityId: Id<any>) => {
    if (!user?.id) {
      alert("You must be logged in to perform this action.");
      return;
    }
    
    try {
      const currentNpcs = npcIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        npcIds: [...currentNpcs, entityId] 
      });
      onUpdate();
    } catch (error) {
      console.error("Error linking NPC:", error);
      alert("Failed to link NPC. Please try again.");
    }
    
    closeModal();
  };

  const handleNPCCreated = async (characterId: Id<"npcs"> | Id<"playerCharacters">) => {
    if (!user?.id) {
      alert("You must be logged in to perform this action.");
      return;
    }
    
    try {
      const currentNpcs = npcIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        npcIds: [...currentNpcs, characterId as Id<"npcs">] 
      });
      onUpdate();
      alert("NPC created and linked successfully!");
    } catch (error) {
      console.error("Error linking NPC:", error);
      alert("NPC created but failed to link. You can link it manually.");
    }
    
    closeModal();
  };

  const handleUnlinkEntity = async (entityId: Id<any>) => {
    if (!user?.id) {
      alert("You must be logged in to perform this action.");
      return;
    }
    
    try {
      const currentNpcs = npcIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        npcIds: currentNpcs.filter(id => id !== entityId) 
      });
      onUpdate();
    } catch (error) {
      console.error("Error unlinking NPC:", error);
      alert("Failed to unlink NPC. Please try again.");
    }
  };

  const handleNPCClick = (npcId: Id<"npcs">) => {
    // Open the NPC in read-only mode in the modal
    setSelectedCharacterId(npcId);
    setActiveModal("characterView");
  };

  return (
    <div className="npcs-section">
      <div className="section-header">
        <div className="header-left clickable" onClick={toggleCollapsed}>
          <button 
            className="collapse-button"
            onClick={(e) => e.stopPropagation()}
            aria-label={isCollapsed ? "Expand NPCs section" : "Collapse NPCs section"}
          >
            {isCollapsed ? "▶️" : "▼"}
          </button>
          <h3 className="section-title">🎭 NPCs ({campaignNpcs.length})</h3>
        </div>
        <div className="header-actions" onClick={(e) => e.stopPropagation()}>
          {canAdd && (
            <>
              <button 
                className="add-button"
                onClick={openEntitySelection}
              >
                + Link NPC
              </button>
              <button 
                className="add-button"
                onClick={openNPCCreation}
              >
                + Create NPC
              </button>
            </>
          )}
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="section-content">
          {campaignNpcs.length > 0 ? (
            <div className="entities-grid">
              {campaignNpcs.map((npc: any) => (
                <div key={npc._id} className="entity-card">
                  <div 
                    className="entity-info clickable"
                    onClick={() => handleNPCClick(npc._id)}
                  >
                    <h4 className="entity-name">{npc.name}</h4>
                    <p className="entity-description">
                      {npc.race} {npc.class} (Level {npc.level})
                    </p>
                  </div>
                  <div className="entity-actions">
                    {canUnlink && (
                      <button 
                        className="unlink-button"
                        onClick={() => handleUnlinkEntity(npc._id)}
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
              <p>No NPCs added to this campaign yet.</p>
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
          entityType="npcs"
          title="Link Existing NPC"
          currentLinkedIds={npcIds}
        />
      )}

      {activeModal === "npcCreation" && (
        <NPCCreationModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={handleNPCCreated}
          characterType="NonPlayerCharacter"
          campaignId={campaignId}
        />
      )}

      {activeModal === "characterView" && selectedCharacterId && (
        <NPCCreationModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={() => {}} // No action needed for view mode
          characterType="NonPlayerCharacter"
          isReadOnly={true}
          characterId={selectedCharacterId}
          campaignId={campaignId}
        />
      )}
    </div>
  );
};

export default NPCsSection; 
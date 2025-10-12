import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCollapsibleSection } from "../../../hooks/useCollapsibleSection";
import { useNavigationState } from "../../../hooks/useNavigationState";
import EntitySelectionModal from "../../modals/EntitySelectionModal";
import QuestCreationModal from "../../modals/QuestCreationModal";
import "./QuestsSection.css";

interface QuestsSectionProps {
  campaignId: Id<"campaigns">;
  questIds?: Id<"quests">[];
  onUpdate: () => void;
  canAdd?: boolean;
  canUnlink?: boolean;
}

type ModalType = "entitySelection" | null;

const QuestsSection: React.FC<QuestsSectionProps> = ({
  campaignId,
  questIds = [],
  onUpdate,
  canAdd = false,
  canUnlink = false,
}) => {
  const { user } = useUser();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const { isCollapsed, toggleCollapsed } = useCollapsibleSection(
    `quests-${campaignId}`,
    false
  );
  const { navigateToDetail } = useNavigationState();

  const quests = useQuery(api.quests.getAllQuests);
  const updateCampaign = useMutation(api.campaigns.updateCampaign);

  const campaignQuests = quests?.filter(quest => 
    questIds.includes(quest._id)
  ) || [];

  const openEntitySelection = () => {
    setActiveModal("entitySelection");
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleEntitySelect = async (entityId: Id<any>) => {
    if (!user?.id) {
      alert("You must be logged in to perform this action.");
      return;
    }
    
    try {
      const currentQuests = questIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        questIds: [...currentQuests, entityId] 
      });
      onUpdate();
    } catch (error) {
      console.error("Error linking quest:", error);
      alert("Failed to link quest. Please try again.");
    }
    
    closeModal();
  };

  const handleUnlinkEntity = async (entityId: Id<any>) => {
    if (!user?.id) {
      alert("You must be logged in to perform this action.");
      return;
    }
    
    try {
      const currentQuests = questIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        questIds: currentQuests.filter(id => id !== entityId) 
      });
      onUpdate();
    } catch (error) {
      console.error("Error unlinking quest:", error);
      alert("Failed to unlink quest. Please try again.");
    }
  };

  const handleQuestClick = (questId: Id<"quests">) => {
    navigateToDetail(`/quests/${questId}?campaignId=${campaignId}`);
  };

  const handleQuestCreated = () => {
    // The quest will be automatically added to the campaign by the modal
    // We just need to trigger an update to refresh the quest list
    onUpdate();
    setIsQuestModalOpen(false);
  };

  return (
    <div className="quests-section">
      <div className="section-header">
        <div className="header-left clickable" onClick={toggleCollapsed}>
          <button 
            className="collapse-button"
            onClick={(e) => e.stopPropagation()}
            aria-label={isCollapsed ? "Expand quests section" : "Collapse quests section"}
          >
            {isCollapsed ? "▶️" : "▼"}
          </button>
          <h3 className="section-title">📜 Quests ({campaignQuests.length})</h3>
        </div>
        <div className="header-actions" onClick={(e) => e.stopPropagation()}>
          {canAdd && (
            <>
              <button 
                className="add-button"
                onClick={openEntitySelection}
              >
                + Link Quest
              </button>
              <button 
                className="add-button"
                onClick={() => setIsQuestModalOpen(true)}
              >
                + Create Quest
              </button>
            </>
          )}
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="section-content">
          {campaignQuests.length > 0 ? (
            <div className="entities-grid">
              {campaignQuests.map((quest: any) => (
                <div key={quest._id} className="entity-card">
                  <div 
                    className="entity-info clickable"
                    onClick={() => handleQuestClick(quest._id)}
                  >
                    <h4 className="entity-name">{quest.name}</h4>
                    <p className="entity-description">
                      {quest.description?.substring(0, 100)}...
                    </p>
                    <span className="entity-status">{quest.status}</span>
                  </div>
                  <div className="entity-actions">
                    {canUnlink && (
                      <button 
                        className="unlink-button"
                        onClick={() => handleUnlinkEntity(quest._id)}
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
              <p>No quests added to this campaign yet.</p>
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
          entityType="quests"
          title="Link Existing Quest"
          currentLinkedIds={questIds}
        />
      )}

      {/* Quest Creation Modal */}
      <QuestCreationModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        onQuestCreated={handleQuestCreated}
        campaignId={campaignId}
        returnTo="campaign-detail"
      />
    </div>
  );
};

export default QuestsSection; 
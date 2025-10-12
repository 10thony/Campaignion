import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCollapsibleSection } from "../../../hooks/useCollapsibleSection";
// import { useNavigationState } from "../../../hooks/useNavigationState";
import EntitySelectionModal from "../../modals/EntitySelectionModal";
import NPCCreationModal from "../../modals/NPCCreationModal";
import "./PlayerCharactersSection.css";

interface PlayerCharactersSectionProps {
  campaignId: Id<"campaigns">;
  playerCharacterIds?: Id<"playerCharacters">[];
  onUpdate: () => void;
  canAdd?: boolean;
  canUnlink?: boolean;
}

type ModalType = "entitySelection" | "characterCreation" | "characterView" | null;

const PlayerCharactersSection: React.FC<PlayerCharactersSectionProps> = ({
  campaignId,
  playerCharacterIds = [],
  onUpdate,
  canAdd = false,
  canUnlink = false,
}) => {
  const { user } = useUser();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<Id<"playerCharacters"> | Id<"npcs"> | null>(null);
  const { isCollapsed, toggleCollapsed } = useCollapsibleSection(
    `player-characters-${campaignId}`,
    false
  );
  // const { navigateToDetail } = useNavigationState();

  const playerCharacters = useQuery(api.characters.getAllCharacters);
  const updateCampaign = useMutation(api.campaigns.updateCampaign);

  const campaignPlayerCharacters = playerCharacters?.filter(char => 
    playerCharacterIds.includes(char._id)
  ) || [];

  const openEntitySelection = () => {
    setActiveModal("entitySelection");
  };

  const openCharacterCreation = () => {
    setActiveModal("characterCreation");
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
      const currentChars = playerCharacterIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        participantPlayerCharacterIds: [...currentChars, entityId] 
      });
      onUpdate();
    } catch (error) {
      console.error("Error linking player character:", error);
      alert("Failed to link player character. Please try again.");
    }
    
    closeModal();
  };

  const handleCharacterCreated = async (characterId: Id<"npcs"> | Id<"playerCharacters">) => {
    if (!user?.id) {
      alert("You must be logged in to perform this action.");
      return;
    }
    
    try {
      const currentChars = playerCharacterIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        participantPlayerCharacterIds: [...currentChars, characterId as Id<"playerCharacters">] 
      });
      onUpdate();
      alert("Player character created and linked successfully!");
    } catch (error) {
      console.error("Error linking player character:", error);
      alert("Player character created but failed to link. You can link it manually.");
    }
    
    closeModal();
  };

  const handleUnlinkEntity = async (entityId: Id<any>) => {
    if (!user?.id) {
      alert("You must be logged in to perform this action.");
      return;
    }
    
    try {
      const currentChars = playerCharacterIds || [];
      await updateCampaign({ 
        id: campaignId,
        clerkId: user.id,
        participantPlayerCharacterIds: currentChars.filter(id => id !== entityId) 
      });
      onUpdate();
    } catch (error) {
      console.error("Error unlinking player character:", error);
      alert("Failed to unlink player character. Please try again.");
    }
  };

  const handleCharacterClick = (characterId: Id<"playerCharacters">) => {
    // Open the character in read-only mode in the modal
    setSelectedCharacterId(characterId);
    setActiveModal("characterView");
  };

  return (
    <div className="player-characters-section">
      <div className="section-header">
        <div className="header-left clickable" onClick={toggleCollapsed}>
          <button 
            className="collapse-button"
            onClick={(e) => e.stopPropagation()}
            aria-label={isCollapsed ? "Expand player characters section" : "Collapse player characters section"}
          >
            {isCollapsed ? "▶️" : "▼"}
          </button>
          <h3 className="section-title">👤 Player Characters ({campaignPlayerCharacters.length})</h3>
        </div>
        <div className="header-actions" onClick={(e) => e.stopPropagation()}>
          {canAdd && (
            <>
              <button 
                className="add-button"
                onClick={openEntitySelection}
              >
                + Link Character
              </button>
              <button 
                className="add-button"
                onClick={openCharacterCreation}
              >
                + Create Character
              </button>
            </>
          )}
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="section-content">
          {campaignPlayerCharacters.length > 0 ? (
            <div className="entities-grid">
              {campaignPlayerCharacters.map((character: any) => (
                <div key={character._id} className="entity-card">
                  <div 
                    className="entity-info clickable"
                    onClick={() => handleCharacterClick(character._id)}
                  >
                    <h4 className="entity-name">{character.name}</h4>
                    <p className="entity-description">
                      {character.race} {character.class} (Level {character.level})
                    </p>
                  </div>
                  <div className="entity-actions">
                    {canUnlink && (
                      <button 
                        className="unlink-button"
                        onClick={() => handleUnlinkEntity(character._id)}
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
              <p>No player characters added to this campaign yet.</p>
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
          entityType="playerCharacters"
          title="Link Player Character"
          currentLinkedIds={playerCharacterIds}
        />
      )}

      {activeModal === "characterCreation" && (
        <NPCCreationModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={handleCharacterCreated}
          characterType="PlayerCharacter"
          campaignId={campaignId}
        />
      )}

      {activeModal === "characterView" && selectedCharacterId && (
        <NPCCreationModal
          isOpen={true}
          onClose={closeModal}
          onSuccess={() => {}} // No action needed for view mode
          characterType="PlayerCharacter"
          isReadOnly={true}
          characterId={selectedCharacterId}
          campaignId={campaignId}
        />
      )}
    </div>
  );
};

export default PlayerCharactersSection; 
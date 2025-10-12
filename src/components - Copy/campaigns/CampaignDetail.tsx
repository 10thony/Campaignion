import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../convex/_generated/api";
import { useRoleAccess } from "../../hooks/useRoleAccess";
import { useCampaignAccess } from "../../hooks/useCampaignAccess";
import { AdminOnly } from "../AdminOnly";
import { CampaignValidationState, CampaignCreationRequirements } from "../../schemas/campaign";
import InfoSection from "./subsections/InfoSection";
import TimelineSection from "./subsections/TimelineSection";
import PlayerCharactersSection from "./subsections/PlayerCharactersSection";
import NPCsSection from "./subsections/NPCsSection";
import QuestsSection from "./subsections/QuestsSection";
import LocationsSection from "./subsections/LocationsSection";
import BossMonstersSection from "./subsections/BossMonstersSection";
import RegularMonstersSection from "./subsections/RegularMonstersSection";
import EnemyNPCsSection from "./subsections/EnemyNPCsSection";
import InteractionsSection from "./subsections/InteractionsSection";
import JoinRequestsSection from "./subsections/JoinRequestsSection";
import { LiveInteractionCreationForm } from "../live-interactions/LiveInteractionCreationForm";
import JoinRequestModal from "../JoinRequestModal";
import "./CampaignDetail.css";

// Move requirements outside component to prevent recreation on every render
const requirements: CampaignCreationRequirements = {
  timelineEventsRequired: 3,
  playerCharactersRequired: 1,
  npcsRequired: 1,
  questsRequired: 1,
  locationsRequired: 1,
  bossMonstersRequired: 1,
  interactionsRequired: 1,
};

const CampaignDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const { isAdmin } = useRoleAccess();
  
  // For non-admin users, don't pass clerkId to ensure they only see public campaigns
  const campaign = useQuery(
    api.campaigns.getCampaignById,
    id ? { 
      id: id as any, 
      clerkId: isAdmin ? user?.id : undefined 
    } : "skip"
  );

  // Get campaign access control
  const campaignAccess = useCampaignAccess(campaign);
  
  const [validationState, setValidationState] = useState<CampaignValidationState>({
    hasName: false,
    hasTimelineEvents: false,
    hasPlayerCharacters: false,
    hasNPCs: false,
    hasQuests: false,
    hasLocations: false,
    hasBossMonsters: false,
    hasInteractions: false,
  });

  const [showLiveInteractionModal, setShowLiveInteractionModal] = useState(false);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);

  // Query for active interaction
  const activeInteraction = useQuery(
    api.interactions.getActiveInteractionByCampaign,
    id ? { campaignId: id as any } : "skip"
  );

  // These queries are not currently used but may be needed for future features
  const monsters = useQuery(api.monsters.getAllMonsters);
  const interactions = useQuery(
    api.interactions.getInteractionsByCampaign,
    id ? { campaignId: id as any } : "skip"
  );

  // Get user's existing join requests for this campaign
  const existingRequests = useQuery(
    api.joinRequests.getJoinRequestsByUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const updateCampaign = useMutation(api.campaigns.updateCampaign);

  // Calculate boss monsters (CR 10 or higher) - memoized to prevent recalculation
  const getBossMonsterCount = useMemo(() => {
    try {
      if (!campaign || !monsters) return 0;
      const campaignMonsters = monsters.filter(monster => 
        campaign.monsterIds?.includes(monster._id)
      );
      return campaignMonsters.filter(monster => {
        const cr = parseFloat(monster.challengeRating);
        return !isNaN(cr) && cr >= 10;
      }).length;
    } catch (error) {
      console.error('Error calculating boss monster count:', error);
      return 0;
    }
  }, [campaign, monsters]);

  // Update validation state when campaign data changes - memoized to prevent unnecessary updates
  const newValidationState = useMemo(() => {
    if (!campaign) {
      return {
        hasName: false,
        hasTimelineEvents: false,
        hasPlayerCharacters: false,
        hasNPCs: false,
        hasQuests: false,
        hasLocations: false,
        hasBossMonsters: false,
        hasInteractions: false,
      };
    }

    try {
      return {
        hasName: !!campaign.name?.trim(),
        hasTimelineEvents: (campaign.timelineEventIds?.length || 0) >= requirements.timelineEventsRequired,
        hasPlayerCharacters: (campaign.participantPlayerCharacterIds?.length || 0) >= requirements.playerCharactersRequired,
        hasNPCs: (campaign.npcIds?.length || 0) >= requirements.npcsRequired,
        hasQuests: (campaign.questIds?.length || 0) >= requirements.questsRequired,
        hasLocations: (campaign.locationIds?.length || 0) >= requirements.locationsRequired,
        hasBossMonsters: getBossMonsterCount >= requirements.bossMonstersRequired,
        hasInteractions: (interactions?.length || 0) >= requirements.interactionsRequired,
      };
    } catch (error) {
      console.error('Error calculating validation state:', error);
      // Return safe default state in case of error
      return {
        hasName: false,
        hasTimelineEvents: false,
        hasPlayerCharacters: false,
        hasNPCs: false,
        hasQuests: false,
        hasLocations: false,
        hasBossMonsters: false,
        hasInteractions: false,
      };
    }
  }, [campaign, getBossMonsterCount, interactions]);

  // Update validation state only when it actually changes
  useEffect(() => {
    try {
      // Only update if the validation state actually changed
      const hasChanged = Object.keys(newValidationState).some(
        key => validationState[key as keyof CampaignValidationState] !== newValidationState[key as keyof CampaignValidationState]
      );
      
      if (hasChanged) {
        setValidationState(newValidationState);
      }
    } catch (error) {
      console.error('Error updating validation state:', error);
    }
  }, [newValidationState, validationState]);

  const isCampaignComplete = Object.values(validationState).every(Boolean);

  // Check if user can request to join this campaign
  const canRequestToJoin = useMemo(() => {
    if (!user?.id || !campaign) return false;
    
    // User must not be admin (admins don't need to request)
    if (isAdmin) return false;
    
    // Campaign must be public
    if (!campaign.isPublic) return false;
    
    // User must not be the DM
    if (campaign.dmId === user.id) return false;
    
    // User must not already be a participant
    if (campaign.players?.includes(user.id)) return false;
    
    // User must not have a pending or approved request
    const hasExistingRequest = existingRequests?.some(
      request => request.campaignId === campaign._id && 
      (request.status === "PENDING" || request.status === "APPROVED")
    );
    
    return !hasExistingRequest;
  }, [user?.id, campaign, isAdmin, existingRequests]);

  const handleUpdate = () => {
    // Trigger a re-render to update validation state
    // This will be called by child components when they update the campaign
  };

  const handleSaveCampaign = async () => {
    if (!campaign || !isCampaignComplete || !user?.id) return;

    try {
      // Mark campaign as complete or update status
      await updateCampaign({
        id: campaign._id,
        clerkId: user.id,
        // Add any completion fields here
      });
      
      alert("Campaign saved successfully!");
    } catch (error) {
      console.error("Error saving campaign:", error);
      alert("Failed to save campaign. Please try again.");
    }
  };

  const handleJoinRequestSuccess = () => {
    // Refresh the page to update the UI
    window.location.reload();
  };

  // Check if user has access to this campaign
  if (!campaign) {
    return (
      <div className="campaign-detail-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading campaign details...</p>
        </div>
      </div>
    );
  }

  // For non-admin users, ensure they can only access public campaigns
  if (!isAdmin && !campaign.isPublic) {
    return (
      <div className="campaign-detail-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>This campaign is private and not available for public viewing.</p>
          <button className="back-button" onClick={() => navigate("/campaigns")}>
            ← Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-detail-container">
      {/* Header Section */}
      <div className="detail-header">
        <div className="header-content">
          <h1 className="campaign-title">{campaign.name || "Untitled Campaign"}</h1>
          <div className="campaign-badges">
            <div className={`visibility-badge ${campaign.isPublic ? 'public' : 'private'}`}>
              {campaign.isPublic ? '🌐 Public' : '🔒 Private'}
            </div>
            {campaign.dmId === user?.id && (
              <div className="role-badge dm">👑 DM</div>
            )}
            {user?.id && campaign.players?.includes(user.id) && (
              <div className="role-badge player">🎲 Player</div>
            )}
            {isAdmin && (
              <div className="role-badge admin">⚡ Admin</div>
            )}
          </div>
          <div className="campaign-meta">
            <div className="meta-item">
              <span className="meta-icon">📅</span>
              <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">👥</span>
              <span>{campaign.participantPlayerCharacterIds?.length || 0} Player Characters</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">📜</span>
              <span>{campaign.questIds?.length || 0} Quests</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">🎲</span>
              <span>{campaign.players?.length || 0} Players</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="back-button" onClick={() => navigate("/campaigns")}>
            ← Back to Campaigns
          </button>
          {canRequestToJoin && (
            <button 
              className="join-request-button"
              onClick={() => setShowJoinRequestModal(true)}
            >
              🎲 Request to Join
            </button>
          )}
         
          <AdminOnly>
            <button 
              className="delete-button danger"
              onClick={() => {
                if (confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
                  // TODO: Implement delete functionality
                  console.log("Delete campaign:", campaign._id);
                }
              }}
            >
              🗑️ Delete Campaign
            </button>
          </AdminOnly>
        </div>
      </div>

      {/* Live Interaction Section */}
      {(isAdmin || campaign.dmId === user?.id) && (
        <div className="live-interaction-section">
          {activeInteraction ? (
            <div className="active-interaction-status">
              <div className="status-header">
                <h3>🎲 Active Live Interaction</h3>
                <span className={`status-badge ${activeInteraction.status.toLowerCase()}`}>
                  {activeInteraction.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="interaction-info">
                <p><strong>Name:</strong> {activeInteraction.name}</p>
                <p><strong>Status:</strong> {activeInteraction.status.replace(/_/g, ' ')}</p>
                {activeInteraction.currentInitiativeIndex !== undefined && (
                  <p><strong>Current Turn:</strong> {activeInteraction.currentInitiativeIndex + 1} of {activeInteraction.initiativeOrder?.length || 0}</p>
                )}
              </div>
              <div className="interaction-actions">
                <button 
                  className="join-interaction-button"
                  onClick={() => navigate(`/campaigns/${campaign._id}/live-interaction`)}
                >
                  🎮 Join Live Interaction
                </button>
              </div>
            </div>
          ) : (
            <div className="no-active-interaction">
              <h3>🎲 Live Interactions</h3>
              <p>No active live interaction for this campaign.</p>
              <button 
                className="start-interaction-button"
                onClick={() => setShowLiveInteractionModal(true)}
              >
                🚀 Start Live Interaction
              </button>
            </div>
          )}
        </div>
      )}

      {/* Validation Status - Only show for admins or campaign owners */}
      {(isAdmin || campaign.dmId === user?.id) && (
        <div className={`validation-status ${isCampaignComplete ? 'complete' : 'incomplete'}`}>
          <div className="validation-header">
            <h3 className="validation-title">
              {isCampaignComplete ? '✅ Campaign Complete' : '⚠️ Campaign Incomplete'}
            </h3>
            <div className="validation-progress">
              {Object.values(validationState).filter(Boolean).length} / {Object.keys(validationState).length} requirements met
            </div>
          </div>
          
          <div className="validation-items">
            <div className={`validation-item ${validationState.hasName ? 'complete' : 'incomplete'}`}>
              <span className="validation-icon">{validationState.hasName ? '✅' : '❌'}</span>
              <span className="validation-text">Campaign name is set</span>
            </div>
            <div className={`validation-item ${validationState.hasTimelineEvents ? 'complete' : 'incomplete'}`}>
              <span className="validation-icon">{validationState.hasTimelineEvents ? '✅' : '❌'}</span>
              <span className="validation-text">Timeline events ({campaign.timelineEventIds?.length || 0}/{requirements.timelineEventsRequired})</span>
            </div>
            <div className={`validation-item ${validationState.hasPlayerCharacters ? 'complete' : 'incomplete'}`}>
              <span className="validation-icon">{validationState.hasPlayerCharacters ? '✅' : '❌'}</span>
              <span className="validation-text">Player characters ({campaign.participantPlayerCharacterIds?.length || 0}/{requirements.playerCharactersRequired})</span>
            </div>
            <div className={`validation-item ${validationState.hasNPCs ? 'complete' : 'incomplete'}`}>
              <span className="validation-icon">{validationState.hasNPCs ? '✅' : '❌'}</span>
              <span className="validation-text">NPCs ({campaign.npcIds?.length || 0}/{requirements.npcsRequired})</span>
            </div>
            <div className={`validation-item ${validationState.hasQuests ? 'complete' : 'incomplete'}`}>
              <span className="validation-icon">{validationState.hasQuests ? '✅' : '❌'}</span>
              <span className="validation-text">Quests ({campaign.questIds?.length || 0}/{requirements.questsRequired})</span>
            </div>
            <div className={`validation-item ${validationState.hasLocations ? 'complete' : 'incomplete'}`}>
              <span className="validation-icon">{validationState.hasLocations ? '✅' : '❌'}</span>
              <span className="validation-text">Locations ({campaign.locationIds?.length || 0}/{requirements.locationsRequired})</span>
            </div>
            <div className={`validation-item ${validationState.hasBossMonsters ? 'complete' : 'incomplete'}`}>
              <span className="validation-icon">{validationState.hasBossMonsters ? '✅' : '❌'}</span>
              <span className="validation-text">Boss monsters ({getBossMonsterCount}/{requirements.bossMonstersRequired})</span>
            </div>
            <div className={`validation-item ${validationState.hasInteractions ? 'complete' : 'incomplete'}`}>
              <span className="validation-icon">{validationState.hasInteractions ? '✅' : '❌'}</span>
              <span className="validation-text">Interactions ({interactions?.length || 0}/{requirements.interactionsRequired})</span>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Sections */}
      <div className="campaign-sections">
        <InfoSection
          campaignId={campaign._id}
          name={campaign.name}
          description={campaign.description}
          worldSetting={campaign.worldSetting}
          isPublic={campaign.isPublic}
          onUpdate={handleUpdate}
          canEdit={campaignAccess.canEdit}
        />

        <TimelineSection
          campaignId={campaign._id}
          timelineEventIds={campaign.timelineEventIds}
          onUpdate={handleUpdate}
          canAdd={campaignAccess.canAdd}
          canEdit={campaignAccess.canEdit}
        />

        <PlayerCharactersSection
          campaignId={campaign._id}
          playerCharacterIds={campaign.participantPlayerCharacterIds}
          onUpdate={handleUpdate}
          canAdd={campaignAccess.canAdd}
          canUnlink={campaignAccess.canUnlink}
        />

        <NPCsSection
          campaignId={campaign._id}
          npcIds={campaign.npcIds}
          onUpdate={handleUpdate}
          canAdd={campaignAccess.canAdd}
          canUnlink={campaignAccess.canUnlink}
        />

        <QuestsSection
          campaignId={campaign._id}
          questIds={campaign.questIds}
          onUpdate={handleUpdate}
          canAdd={campaignAccess.canAdd}
          canUnlink={campaignAccess.canUnlink}
        />

        <LocationsSection
          campaignId={campaign._id}
          locationIds={campaign.locationIds}
          onUpdate={handleUpdate}
          canAdd={campaignAccess.canAdd}
          canUnlink={campaignAccess.canUnlink}
        />

        <BossMonstersSection
          campaignId={campaign._id}
          monsterIds={campaign.monsterIds}
          onUpdate={handleUpdate}
          canAdd={campaignAccess.canAdd}
          canUnlink={campaignAccess.canUnlink}
        />

        <RegularMonstersSection
          campaignId={campaign._id}
          monsterIds={campaign.monsterIds}
          onUpdate={handleUpdate}
          canAdd={campaignAccess.canAdd}
          canUnlink={campaignAccess.canUnlink}
        />

        <EnemyNPCsSection
          campaignId={campaign._id}
          npcIds={campaign.npcIds}
          onUpdate={handleUpdate}
          canAdd={campaignAccess.canAdd}
          canUnlink={campaignAccess.canUnlink}
        />

        <InteractionsSection
          campaignId={campaign._id}
          onUpdate={handleUpdate}
          canAdd={campaignAccess.canAdd}
          canEdit={campaignAccess.canEdit}
        />

        {/* Join Requests Section - Only show for DM/admin */}
        {(isAdmin || campaign.dmId === user?.id) && (
          <JoinRequestsSection
            campaignId={campaign._id}
            onRequestProcessed={handleUpdate}
          />
        )}
      </div>

      {/* Save Button - Only show for admins or campaign owners */}
      {(isAdmin || campaign.dmId === user?.id) && (
        <div className="save-section">
          <button
            className={`save-button ${isCampaignComplete ? 'enabled' : 'disabled'}`}
            onClick={handleSaveCampaign}
            disabled={!isCampaignComplete}
          >
            {isCampaignComplete ? '💾 Save Campaign' : '⚠️ Complete Requirements to Save'}
          </button>
        </div>
      )}

      {/* Live Interaction Creation Modal */}
      {showLiveInteractionModal && (
        <div className="modal-overlay">
          <div className="modal-content live-interaction-modal">
            <div className="modal-header">
              <h2>Create Live Interaction</h2>
              <button 
                className="modal-close"
                onClick={() => setShowLiveInteractionModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <LiveInteractionCreationForm
                campaignId={campaign._id}
                onSuccess={() => {
                  setShowLiveInteractionModal(false);
                  // Refresh the page to show the new active interaction
                  window.location.reload();
                }}
                onCancel={() => setShowLiveInteractionModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Join Request Modal */}
      {showJoinRequestModal && (
        <JoinRequestModal
          campaignId={campaign._id}
          campaignName={campaign.name}
          isOpen={showJoinRequestModal}
          onClose={() => setShowJoinRequestModal(false)}
          onSuccess={handleJoinRequestSuccess}
        />
      )}
    </div>
  );
};

export default CampaignDetail; 
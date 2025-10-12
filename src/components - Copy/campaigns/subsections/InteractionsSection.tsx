import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import "./InteractionsSection.css";

interface InteractionsSectionProps {
  campaignId: Id<"campaigns">;
  onUpdate: () => void;
  canAdd?: boolean;
  canEdit?: boolean;
}

const InteractionsSection: React.FC<InteractionsSectionProps> = ({
  campaignId,
  onUpdate,
  canAdd = false,
  canEdit = false,
}) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInteractions, setSelectedInteractions] = useState<Set<Id<"interactions">>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Use targeted queries instead of getAllInteractions
  const campaignInteractions = useQuery(api.interactions.getInteractionsByCampaign, { campaignId });
  const availableInteractions = useQuery(api.interactions.getAvailableInteractionsForCampaign, { campaignId });
  
  // Mutations
  const createInteraction = useMutation(api.interactions.createInteraction);
  const activateInteraction = useMutation(api.interactions.activateInteraction);
  const linkInteraction = useMutation(api.interactions.linkInteractionToCampaign);
  const unlinkInteraction = useMutation(api.interactions.unlinkInteractionFromCampaign);
  const bulkLinkInteractions = useMutation(api.interactions.bulkLinkInteractionsToCampaign);
  const bulkUnlinkInteractions = useMutation(api.interactions.bulkUnlinkInteractionsFromCampaign);

  // Get active interaction for this campaign
  const activeInteraction = campaignInteractions?.find(interaction => 
    interaction.status !== "COMPLETED" && interaction.status !== "CANCELLED"
  );

  // Filter interactions based on search term
  const filteredCampaignInteractions = campaignInteractions?.filter(interaction =>
    interaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (interaction.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) || [];

  const filteredAvailableInteractions = availableInteractions?.filter(interaction =>
    interaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (interaction.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) || [];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInteractionClick = (interactionId: Id<"interactions">) => {
    navigate(`/interactions/${interactionId}?fromCampaign=${campaignId}`);
  };

  const handleLinkInteraction = async (interactionId: Id<"interactions">) => {
    try {
      await linkInteraction({ campaignId, interactionId });
      onUpdate();
    } catch (error) {
      console.error("Error linking interaction:", error);
    }
  };

  const handleUnlinkInteraction = async (interactionId: Id<"interactions">) => {
    try {
      await unlinkInteraction({ interactionId });
      onUpdate();
    } catch (error) {
      console.error("Error unlinking interaction:", error);
    }
  };

  const handleBulkLink = async () => {
    if (selectedInteractions.size === 0) return;
    
    try {
      await bulkLinkInteractions({ 
        campaignId, 
        interactionIds: Array.from(selectedInteractions) 
      });
      setSelectedInteractions(new Set());
      onUpdate();
    } catch (error) {
      console.error("Error bulk linking interactions:", error);
    }
  };

  const handleBulkUnlink = async () => {
    if (selectedInteractions.size === 0) return;
    
    try {
      await bulkUnlinkInteractions({ 
        interactionIds: Array.from(selectedInteractions) 
      });
      setSelectedInteractions(new Set());
      onUpdate();
    } catch (error) {
      console.error("Error bulk unlinking interactions:", error);
    }
  };

  const handleSelectInteraction = (interactionId: Id<"interactions">) => {
    const newSelected = new Set(selectedInteractions);
    if (newSelected.has(interactionId)) {
      newSelected.delete(interactionId);
    } else {
      newSelected.add(interactionId);
    }
    setSelectedInteractions(newSelected);
  };

  const handleSelectAll = (interactions: any[]) => {
    if (selectedInteractions.size === interactions.length) {
      setSelectedInteractions(new Set());
    } else {
      setSelectedInteractions(new Set(interactions.map(i => i._id)));
    }
  };

  const handleActivateInteraction = async (interactionId: Id<"interactions">) => {
    try {
      await activateInteraction({ 
        interactionId: interactionId, 
        campaignId: campaignId 
      });
      onUpdate();
    } catch (error) {
      console.error("Error activating interaction:", error);
    }
  };

  const handleJoinLiveInteraction = () => {
    navigate(`/campaigns/${campaignId}/live-interaction`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_INITIATIVE":
        return "yellow";
      case "INITIATIVE_ROLLED":
        return "blue";
      case "WAITING_FOR_PLAYER_TURN":
        return "green";
      case "PROCESSING_PLAYER_ACTION":
        return "purple";
      case "DM_REVIEW":
        return "orange";
      case "COMPLETED":
        return "gray";
      case "CANCELLED":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING_INITIATIVE":
        return "🎲";
      case "INITIATIVE_ROLLED":
        return "📋";
      case "WAITING_FOR_PLAYER_TURN":
        return "⏳";
      case "PROCESSING_PLAYER_ACTION":
        return "⚡";
      case "DM_REVIEW":
        return "👁️";
      case "COMPLETED":
        return "✅";
      case "CANCELLED":
        return "❌";
      default:
        return "❓";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.name.trim()) {
      newErrors.push("Interaction name is required");
    }
    
    if (!formData.description.trim()) {
      newErrors.push("Interaction description is required");
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleCreateInteraction = async () => {
    if (!validateForm()) return;

    try {
      await createInteraction({
        campaignId,
        name: formData.name,
        description: formData.description,
        clerkId: user!.id,
      });

      setFormData({
        name: "",
        description: "",
      });
      setErrors([]);
      setIsCreating(false);
      onUpdate();
    } catch (error) {
      console.error("Error creating interaction:", error);
      setErrors(["Failed to create interaction. Please try again."]);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      description: "",
    });
    setErrors([]);
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <div className="interactions-section">
        <div className="section-header">
          <h3 className="section-title">💬 Create New Interaction</h3>
          <div className="header-actions">
            <button className="save-button" onClick={handleCreateInteraction}>
              💾 Create Interaction
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              ❌ Cancel
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="form-errors">
            {errors.map((error, index) => (
              <div key={index} className="error-message">{error}</div>
            ))}
          </div>
        )}

        <div className="form-content">
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Interaction Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter interaction name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Description *</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the interaction between characters, NPCs, or quests"
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="interactions-section">
      <div className="section-header">
        <div className="header-left clickable" onClick={() => setIsCollapsed(!isCollapsed)}>
          <button 
            className="collapse-button"
            onClick={(e) => e.stopPropagation()}
            aria-label={isCollapsed ? "Expand interactions section" : "Collapse interactions section"}
          >
            {isCollapsed ? "▶️" : "▼"}
          </button>
          <h3 className="section-title">
            💬 Interactions ({campaignInteractions?.length || 0} linked)
            {activeInteraction && (
              <span className={`active-status-badge status-${getStatusColor(activeInteraction.status)}`}>
                {getStatusIcon(activeInteraction.status)} Active
              </span>
            )}
          </h3>
        </div>
        <div className="header-actions" onClick={(e) => e.stopPropagation()}>
          {activeInteraction && (
            <button 
              className="join-live-button"
              onClick={handleJoinLiveInteraction}
            >
              🎮 Join Live
            </button>
          )}
          {canAdd && (
            <button className="add-button" onClick={() => setIsCreating(true)}>
              ➕ Add Interaction
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="interactions-content">
          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search interactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <div className="filter-info">
              <span className="filter-count">
                {filteredCampaignInteractions.length} linked, {filteredAvailableInteractions.length} available
              </span>
            </div>
          </div>

          {/* Linked Interactions Section */}
          <div className="linked-interactions-section">
            <div className="section-subheader">
              <h4 className="subsection-title">
                📎 Linked Interactions ({filteredCampaignInteractions.length})
              </h4>
              {canEdit && filteredCampaignInteractions.length > 0 && (
                <div className="bulk-actions">
                  <button
                    className="select-all-button"
                    onClick={() => handleSelectAll(filteredCampaignInteractions)}
                  >
                    {selectedInteractions.size === filteredCampaignInteractions.length ? "Deselect All" : "Select All"}
                  </button>
                  {selectedInteractions.size > 0 && (
                    <button
                      className="bulk-unlink-button"
                      onClick={handleBulkUnlink}
                    >
                      🔗 Unlink Selected ({selectedInteractions.size})
                    </button>
                  )}
                </div>
              )}
            </div>

            {filteredCampaignInteractions.length === 0 ? (
              <div className="empty-state">
                <p>No linked interactions found. Link interactions from the available section below.</p>
              </div>
            ) : (
              <div className="interactions-list">
                {filteredCampaignInteractions.map((interaction) => {
                  const isActive = interaction.status !== "COMPLETED" && interaction.status !== "CANCELLED";
                  const isActiveInteraction = activeInteraction?._id === interaction._id;
                  const isSelected = selectedInteractions.has(interaction._id);
                  
                  return (
                    <div 
                      key={interaction._id} 
                      className={`interaction-item ${isActiveInteraction ? 'active-interaction' : ''} ${isSelected ? 'selected-interaction' : ''}`}
                    >
                      {canEdit && (
                        <div className="interaction-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectInteraction(interaction._id)}
                            className="interaction-select-checkbox"
                          />
                        </div>
                      )}
                      <div 
                        className="interaction-content"
                        onClick={() => handleInteractionClick(interaction._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="interaction-header">
                          <div className="interaction-title-section">
                            <h4 className="interaction-name">{interaction.name}</h4>
                            <span className={`status-badge status-${getStatusColor(interaction.status)}`}>
                              {getStatusIcon(interaction.status)} {formatStatus(interaction.status)}
                            </span>
                          </div>
                          <div className="interaction-meta">
                            <span className="interaction-date">
                              {new Date(interaction.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="interaction-description">
                          {interaction.description}
                        </div>
                        <div className="interaction-participants">
                          {interaction.playerCharacterIds && interaction.playerCharacterIds.length > 0 && (
                            <span className="participant-badge">
                              👥 {interaction.playerCharacterIds.length} Characters
                            </span>
                          )}
                          {interaction.npcIds && interaction.npcIds.length > 0 && (
                            <span className="participant-badge">
                              🎭 {interaction.npcIds.length} NPCs
                            </span>
                          )}
                          {interaction.monsterIds && interaction.monsterIds.length > 0 && (
                            <span className="participant-badge">
                              🐉 {interaction.monsterIds.length} Monsters
                            </span>
                          )}
                        </div>
                        <div className="interaction-actions">
                          <div className="interaction-quick-actions">
                            {isActive && !isActiveInteraction && canEdit && (
                              <button
                                className="activate-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivateInteraction(interaction._id);
                                }}
                              >
                                🚀 Activate
                              </button>
                            )}
                            {isActiveInteraction && (
                              <button
                                className="join-live-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJoinLiveInteraction();
                                }}
                              >
                                🎮 Join Live
                              </button>
                            )}
                          </div>
                          <div className="interaction-link-actions">
                            {canEdit && (
                              <button
                                className="unlink-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnlinkInteraction(interaction._id);
                                }}
                              >
                                🔗 Unlink
                              </button>
                            )}
                          </div>
                          <div className="view-details-hint">
                            <span className="hint-text">Click to view details →</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Interactions Section */}
          <div className="available-interactions-section">
            <div className="section-subheader">
              <h4 className="subsection-title">
                📋 Available Interactions ({filteredAvailableInteractions.length})
              </h4>
              {canEdit && filteredAvailableInteractions.length > 0 && (
                <div className="bulk-actions">
                  <button
                    className="select-all-button"
                    onClick={() => handleSelectAll(filteredAvailableInteractions)}
                  >
                    {selectedInteractions.size === filteredAvailableInteractions.length ? "Deselect All" : "Select All"}
                  </button>
                  {selectedInteractions.size > 0 && (
                    <button
                      className="bulk-link-button"
                      onClick={handleBulkLink}
                    >
                      🔗 Link Selected ({selectedInteractions.size})
                    </button>
                  )}
                </div>
              )}
            </div>

            {filteredAvailableInteractions.length === 0 ? (
              <div className="empty-state">
                <p>No available interactions to link. Create new interactions to get started.</p>
                <div className="interaction-suggestions">
                  <div className="suggestion-item">
                    <span className="suggestion-icon">👥</span>
                    <span className="suggestion-text">Character Meeting</span>
                  </div>
                  <div className="suggestion-item">
                    <span className="suggestion-icon">⚔️</span>
                    <span className="suggestion-text">Combat Encounter</span>
                  </div>
                  <div className="suggestion-item">
                    <span className="suggestion-icon">🤝</span>
                    <span className="suggestion-text">Negotiation</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="interactions-list">
                {filteredAvailableInteractions.map((interaction) => {
                  const isSelected = selectedInteractions.has(interaction._id);
                  
                  return (
                    <div 
                      key={interaction._id} 
                      className={`interaction-item available-interaction ${isSelected ? 'selected-interaction' : ''}`}
                    >
                      {canEdit && (
                        <div className="interaction-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectInteraction(interaction._id)}
                            className="interaction-select-checkbox"
                          />
                        </div>
                      )}
                      <div 
                        className="interaction-content"
                        onClick={() => handleInteractionClick(interaction._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="interaction-header">
                          <div className="interaction-title-section">
                            <h4 className="interaction-name">{interaction.name}</h4>
                            <span className={`status-badge status-${getStatusColor(interaction.status)}`}>
                              {getStatusIcon(interaction.status)} {formatStatus(interaction.status)}
                            </span>
                          </div>
                          <div className="interaction-meta">
                            <span className="interaction-date">
                              {new Date(interaction.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="interaction-description">
                          {interaction.description}
                        </div>
                        <div className="interaction-participants">
                          {interaction.playerCharacterIds && interaction.playerCharacterIds.length > 0 && (
                            <span className="participant-badge">
                              👥 {interaction.playerCharacterIds.length} Characters
                            </span>
                          )}
                          {interaction.npcIds && interaction.npcIds.length > 0 && (
                            <span className="participant-badge">
                              🎭 {interaction.npcIds.length} NPCs
                            </span>
                          )}
                          {interaction.monsterIds && interaction.monsterIds.length > 0 && (
                            <span className="participant-badge">
                              🐉 {interaction.monsterIds.length} Monsters
                            </span>
                          )}
                        </div>
                        <div className="interaction-actions">
                          <div className="interaction-link-actions">
                            {canEdit && (
                              <button
                                className="link-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLinkInteraction(interaction._id);
                                }}
                              >
                                🔗 Link to Campaign
                              </button>
                            )}
                          </div>
                          <div className="view-details-hint">
                            <span className="hint-text">Click to view details →</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractionsSection; 
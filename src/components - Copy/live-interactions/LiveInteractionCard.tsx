import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import "./LiveInteractionCard.css";

interface LiveInteractionCardProps {
  interaction: any; // Using any for now, should be properly typed
  onJoin: () => void;
  onView: () => void;
}

const LiveInteractionCard: React.FC<LiveInteractionCardProps> = ({
  interaction,
  onJoin,
  onView
}) => {
  // Get campaign details
  const campaign = useQuery(
    api.campaigns.getCampaignById,
    interaction.campaignId ? { 
      id: interaction.campaignId,
      clerkId: undefined // We'll handle this properly later
    } : "skip"
  );

  // Get participant counts
  const participantCount = 
    (interaction.playerCharacterIds?.length || 0) +
    (interaction.npcIds?.length || 0) +
    (interaction.monsterIds?.length || 0);

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
      default:
        return "❓";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="live-interaction-card">
      <div className="card-header">
        <div className="interaction-title">
          <h3>{interaction.name}</h3>
          <span className={`status-badge status-${getStatusColor(interaction.status)}`}>
            {getStatusIcon(interaction.status)} {formatStatus(interaction.status)}
          </span>
        </div>
        <div className="card-actions">
          <button className="action-button view" onClick={onView}>
            👁️ View
          </button>
          <button className="action-button join" onClick={onJoin}>
            🎮 Join
          </button>
        </div>
      </div>

      <div className="card-content">
        {interaction.description && (
          <p className="interaction-description">
            {interaction.description.length > 100 
              ? `${interaction.description.substring(0, 100)}...`
              : interaction.description
            }
          </p>
        )}

        <div className="interaction-meta">
          {campaign && (
            <div className="meta-item">
              <span className="meta-icon">📚</span>
              <span className="meta-label">Campaign:</span>
              <span className="meta-value">{campaign.name}</span>
            </div>
          )}

          <div className="meta-item">
            <span className="meta-icon">👥</span>
            <span className="meta-label">Participants:</span>
            <span className="meta-value">{participantCount}</span>
          </div>

          {interaction.currentInitiativeIndex !== undefined && (
            <div className="meta-item">
              <span className="meta-icon">🔄</span>
              <span className="meta-label">Turn:</span>
              <span className="meta-value">
                {interaction.currentInitiativeIndex + 1} of {interaction.initiativeOrder?.length || 0}
              </span>
            </div>
          )}

          <div className="meta-item">
            <span className="meta-icon">📅</span>
            <span className="meta-label">Created:</span>
            <span className="meta-value">
              {new Date(interaction.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Progress indicator for initiative */}
        {interaction.initiativeOrder && interaction.currentInitiativeIndex !== undefined && (
          <div className="progress-section">
            <div className="progress-label">
              Initiative Progress
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${((interaction.currentInitiativeIndex + 1) / interaction.initiativeOrder.length) * 100}%` 
                }}
              ></div>
            </div>
            <div className="progress-text">
              {interaction.currentInitiativeIndex + 1} / {interaction.initiativeOrder.length} turns
            </div>
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="footer-actions">
          <button className="footer-button secondary" onClick={onView}>
            View Details
          </button>
          <button className="footer-button primary" onClick={onJoin}>
            Join Live Interaction
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveInteractionCard; 
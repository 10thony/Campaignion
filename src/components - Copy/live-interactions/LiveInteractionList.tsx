import React, { useState } from "react";
import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import LiveInteractionCard from "./LiveInteractionCard";
import "./LiveInteractionList.css";

interface LiveInteractionListProps {
  userId?: Id<"users">;
  isDM?: boolean;
}

const LiveInteractionList: React.FC<LiveInteractionListProps> = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [filterCampaign, setFilterCampaign] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const activeInteractions = useQuery(api.interactions.subscribeToActiveInteractions);
  
  // Get campaigns for filtering
  const campaigns = useQuery(api.campaigns.getAllCampaigns, { 
    clerkId: user?.id || undefined 
  });

  const handleJoinInteraction = (campaignId: Id<"campaigns">) => {
    navigate(`/campaigns/${campaignId}/live-interaction`);
  };

  const handleViewInteraction = (interactionId: Id<"interactions">) => {
    navigate(`/interactions/${interactionId}`);
  };

  const filteredInteractions = activeInteractions?.filter(interaction => {
    // Filter by campaign
    if (filterCampaign !== "all" && interaction.campaignId !== filterCampaign) {
      return false;
    }
    
    // Filter by status
    if (filterStatus !== "all" && interaction.status !== filterStatus) {
      return false;
    }
    
    return true;
  }) || [];

  if (!activeInteractions) {
    return (
      <div className="live-interaction-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading active interactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-interaction-list-container">
      <div className="list-header">
        <div className="header-content">
          <h1 className="page-title">Active Live Interactions</h1>
          <p className="page-description">
            Manage and join active live interactions across your campaigns
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="create-interaction-button"
            onClick={() => navigate("/interactions/create")}
          >
            ➕ Create New Interaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="campaign-filter">Campaign:</label>
          <select 
            id="campaign-filter"
            value={filterCampaign}
            onChange={(e) => setFilterCampaign(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Campaigns</option>
            {campaigns?.map(campaign => (
              <option key={campaign._id} value={campaign._id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select 
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING_INITIATIVE">Pending Initiative</option>
            <option value="INITIATIVE_ROLLED">Initiative Rolled</option>
            <option value="WAITING_FOR_PLAYER_TURN">Waiting for Player Turn</option>
            <option value="PROCESSING_PLAYER_ACTION">Processing Player Action</option>
            <option value="DM_REVIEW">DM Review</option>
          </select>
        </div>

        <div className="filter-stats">
          <span className="stat-item">
            Total: {activeInteractions.length}
          </span>
          <span className="stat-item">
            Filtered: {filteredInteractions.length}
          </span>
        </div>
      </div>

      {/* Interactions Grid */}
      <div className="interactions-grid">
        {filteredInteractions.length > 0 ? (
          filteredInteractions.map(interaction => (
            <LiveInteractionCard 
              key={interaction._id}
              interaction={interaction}
              onJoin={() => interaction.campaignId && handleJoinInteraction(interaction.campaignId)}
              onView={() => handleViewInteraction(interaction._id)}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎲</div>
            <h3>No Active Interactions</h3>
            <p>
              {filterCampaign !== "all" || filterStatus !== "all" 
                ? "No interactions match your current filters."
                : "There are no active live interactions at the moment."
              }
            </p>
            <button 
              className="create-interaction-button"
              onClick={() => navigate("/interactions/create")}
            >
              Create Your First Interaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveInteractionList; 
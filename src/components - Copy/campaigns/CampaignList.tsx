import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../convex/_generated/api";
import { useRoleAccess } from "../../hooks/useRoleAccess";
import { AdminOnly } from "../AdminOnly";
import "./CampaignList.css";

const CampaignList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { isAdmin, canCreateCampaign } = useRoleAccess();
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const pageSize = 10;

  // Get user's database ID - always call this hook
  const userRecord = useQuery(api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );

  // For non-admin users, only pass clerkId if they're authenticated
  // This ensures they only see public campaigns
  const campaigns = useQuery(api.campaigns.getAllCampaigns, { 
    clerkId: isAdmin ? user?.id : undefined 
  });

  // Sample data generation mutations
  const populateSampleTimelineEvents = useMutation(api.timelineEvents.populateSampleTimelineEvents);
  const generateSampleQuests = useMutation(api.quests.generateSampleQuests);

  const toggleCampaignExpansion = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const handleCampaignClick = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const handleGenerateSampleData = async () => {
    if (!user?.id || !userRecord?._id) return;
    
    setIsGeneratingSample(true);
    try {
      // Generate sample timeline events (which creates a sample campaign)
      const timelineResult = await populateSampleTimelineEvents({ 
        creatorId: userRecord._id 
      });

      // Generate sample quests
      const questsResult = await generateSampleQuests({ 
        clerkId: user.id 
      });

      console.log("Sample data generation successful:", { timelineResult, questsResult });
      alert("Successfully generated sample campaign with timeline events and quests!");
      
      // Refresh the page to show the new data
      window.location.reload();
    } catch (error) {
      console.error("Error generating sample data:", error);
      alert("Error generating sample data. Please try again.");
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getBossMonsterCount = (_campaign: any) => {
    // TODO: Implement boss monster counting logic
    // For now, return 0 as placeholder
    return 0;
  };

  if (!campaigns || userRecord === undefined) {
    return (
      <div className="campaigns-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  // Check if any of the queries returned an error
  if (campaigns === null || userRecord === null) {
    return (
      <div className="campaigns-container">
        <div className="error">Error loading campaigns. Please try again later.</div>
      </div>
    );
  }

  // Filter campaigns for non-admin users to only show public ones
  const filteredCampaigns = isAdmin 
    ? campaigns 
    : campaigns.filter((campaign: any) => campaign.isPublic);

  const totalPages = Math.ceil(filteredCampaigns.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const currentCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  return (
    <div className="campaigns-container">
      <div className="campaigns-header">
        <div className="header-content">
          <h2 className="campaigns-title">Campaigns</h2>
          <p className="campaigns-subtitle">
            {isAdmin 
              ? "Manage and organize all D&D campaigns" 
              : "Browse publicly available campaigns"
            }
          </p>
        </div>
        {canCreateCampaign() && (
          <button
            className="create-button"
            onClick={() => navigate("/campaigns/new")}
          >
            <span className="button-icon">+</span>
            Create New Campaign
          </button>
        )}
      </div>

      {filteredCampaigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No Campaigns Available</h3>
          <p>
            {isAdmin 
              ? "No campaigns have been created yet." 
              : "No public campaigns are available at the moment."
            }
          </p>
          <div className="empty-state-actions">
            {canCreateCampaign() && (
              <button
                className="create-button"
                onClick={() => navigate("/campaigns/new")}
              >
                Create Your First Campaign
              </button>
            )}
            <button
              onClick={handleGenerateSampleData}
              disabled={isGeneratingSample}
              className="btn btn-secondary"
              style={{ marginLeft: '10px' }}
            >
              {isGeneratingSample ? "Generating..." : "Generate Sample Data"}
            </button>
          </div>
          <div className="admin-note">
            <p><em>You can generate sample campaigns with timeline events and quests to get started quickly.</em></p>
          </div>
        </div>
      ) : (
        <>
          <div className="campaigns-list">
            {currentCampaigns.map((campaign: any) => (
              <div key={campaign._id} className="campaign-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-lg">
                <div 
                  className="campaign-header flex justify-between items-center p-5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => toggleCampaignExpansion(campaign._id)}
                >
                  <div className="campaign-title-section">
                    <h3 className="campaign-name">{campaign.name}</h3>
                    <div className="campaign-badges">
                      <div className={`visibility-badge ${campaign.isPublic ? 'public' : 'private'}`}>
                        {campaign.isPublic ? '🌐 Public' : '🔒 Private'}
                      </div>
                      {campaign.dmId === user?.id && (
                        <div className="role-badge dm">👑 DM</div>
                      )}
                      {campaign.players?.includes(user?.id) && (
                        <div className="role-badge player">🎲 Player</div>
                      )}
                      {isAdmin && (
                        <div className="role-badge admin">⚡ Admin</div>
                      )}
                    </div>
                  </div>
                  <div className="campaign-meta">
                    <span className="campaign-date">
                      Created {formatDate(campaign.createdAt)}
                    </span>
                    <div className="campaign-quick-actions">
                      <button
                        className="quick-view-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCampaignClick(campaign._id);
                        }}
                        title="View Campaign Details"
                      >
                        👁️
                      </button>
                      <span className="expand-indicator">
                        {expandedCampaigns.has(campaign._id) ? "▼" : "▶"}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedCampaigns.has(campaign._id) && (
                  <div className="campaign-details p-5 bg-gray-50 dark:bg-gray-800 transition-all duration-300">
                    {campaign.description && (
                      <p className="campaign-description text-gray-700 dark:text-gray-300 mb-4 leading-relaxed transition-colors duration-200">
                        {campaign.description}
                      </p>
                    )}
                    
                    <div className="campaign-stats">
                      <div className="stat-item flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                        <span className="stat-label">Player Characters:</span>
                        <span className="stat-value">
                          {campaign.participantPlayerCharacterIds?.length || 0}
                        </span>
                      </div>
                      <div className="stat-item flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                        <span className="stat-label">NPCs:</span>
                        <span className="stat-value">
                          {campaign.npcIds?.length || 0}
                        </span>
                      </div>
                      <div className="stat-item flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                        <span className="stat-label">Quests:</span>
                        <span className="stat-value">
                          {campaign.questIds?.length || 0}
                        </span>
                      </div>
                      <div className="stat-item flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                        <span className="stat-label">Locations:</span>
                        <span className="stat-value">
                          {campaign.locationIds?.length || 0}
                        </span>
                      </div>
                      <div className="stat-item flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                        <span className="stat-label">Boss Monsters:</span>
                        <span className="stat-value">
                          {getBossMonsterCount(campaign)}
                        </span>
                      </div>
                      <div className="stat-item flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                        <span className="stat-label">Timeline Events:</span>
                        <span className="stat-value">
                          {campaign.timelineEventIds?.length || 0}
                        </span>
                      </div>
                    </div>

                    <div className="campaign-actions">
                      <button
                        className="view-button primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCampaignClick(campaign._id);
                        }}
                      >
                        📖 View Details
                      </button>
                      <AdminOnly>
                        <button
                          className="delete-button danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement delete confirmation
                            console.log("Delete campaign:", campaign._id);
                          }}
                        >
                          🗑️ Delete Campaign
                        </button>
                      </AdminOnly>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                ← Previous
              </button>
              
              <div className="page-info">
                Page {currentPage + 1} of {totalPages}
              </div>
              
              <button
                className="pagination-button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CampaignList; 
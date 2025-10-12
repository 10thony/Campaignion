import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useNavigate, useSearchParams } from "react-router-dom";
// import { useDarkMode } from "../contexts/DarkModeContext";
import TimelineEventCreationForm from "./TimelineEventCreationForm";
import BackToCampaign from "./BackToCampaign";
import "./TimelineEventDetail.css";

interface TimelineEventDetailProps {
  timelineEventId: Id<"timelineEvents">;
}

const TimelineEventDetail: React.FC<TimelineEventDetailProps> = ({ timelineEventId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  // const { isDarkMode } = useDarkMode();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  const timelineEvent = useQuery(api.timelineEvents.getTimelineEventById, { id: timelineEventId });
  const deleteTimelineEvent = useMutation(api.timelineEvents.deleteTimelineEvent);
  
  const campaign = useQuery(
    api.campaigns.getCampaignById,
    timelineEvent?.campaignId ? { id: timelineEvent.campaignId } : "skip"
  );
  
  const locations = useQuery(api.locations.list);
  const npcs = useQuery(api.npcs.getAllNpcs);
  const factions = useQuery(api.factions.getFactions, {});
  const quests = useQuery(api.quests.getAllQuests);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this timeline event? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteTimelineEvent({ id: timelineEventId });
        navigate("/timeline-events");
      } catch (error) {
        console.error("Error deleting timeline event:", error);
        alert("Failed to delete timeline event. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSubmitSuccess = () => {
    setIsEditing(false);
  };

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  if (!timelineEvent) {
    return (
      <div className="timeline-event-detail-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading timeline event details...</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="timeline-event-detail-container">
        <TimelineEventCreationForm
          onSubmitSuccess={handleSubmitSuccess}
          onCancel={handleCancel}
          editingTimelineEventId={timelineEventId}
        />
      </div>
    );
  }

  const relatedLocations = locations?.filter((location: any) => 
    timelineEvent.relatedLocationIds?.includes(location._id)
  ) || [];

  const relatedNpcs = npcs?.filter((npc: any) => 
    timelineEvent.relatedNpcIds?.includes(npc._id)
  ) || [];

  const relatedFactions = factions?.filter((faction: any) => 
    timelineEvent.relatedFactionIds?.includes(faction._id)
  ) || [];

  const relatedQuests = quests?.filter((quest: any) => 
    timelineEvent.relatedQuestIds?.includes(quest._id)
  ) || [];

  return (
    <div className="timeline-event-detail-container">
      {/* Header Section */}
      <div className="detail-header">
        <div className="header-content">
          <h1 className="timeline-event-title">{timelineEvent.title}</h1>
          <div className="timeline-event-meta">
            <div className="meta-item">
              <span className="meta-icon">📅</span>
              <span>{new Date(timelineEvent.date).toLocaleDateString()}</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">🏷️</span>
              <span>{timelineEvent.type || "Custom"}</span>
            </div>
            {campaign && (
              <div className="meta-item">
                <span className="meta-icon">🎭</span>
                <span>{campaign.name}</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-icon">📝</span>
              <span>Created {new Date(timelineEvent.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {campaignId ? (
            <BackToCampaign campaignId={campaignId} />
          ) : (
            <button className="back-button" onClick={() => navigate("/timeline-events")}>
              ← Back to Timeline Events
            </button>
          )}
        </div>
      </div>

      {/* Description Section */}
      <div className="timeline-event-description">
        <h3 className="section-title">Description</h3>
        <p className="description-content">{timelineEvent.description}</p>
      </div>

      {/* Related Entities Sections */}
      <div className="timeline-event-sections">
        {/* Related Quests Section */}
        <div className="section">
          <div 
            className="section-header"
            onClick={() => toggleSection("quests")}
            style={{ cursor: "pointer" }}
          >
            <h3 className="section-title">📜 Related Quests ({relatedQuests.length})</h3>
            <span className="collapse-indicator">
              {collapsedSections.has("quests") ? "▼" : "▲"}
            </span>
          </div>
          {!collapsedSections.has("quests") && (
            <div className="section-content">
              {relatedQuests.length > 0 ? (
                <div className="entities-grid">
                  {relatedQuests.map((quest: any) => (
                    <div key={quest._id} className="entity-card">
                      <div className="entity-info">
                        <h4 className="entity-name">{quest.name}</h4>
                        <p className="entity-description">{quest.description || "No description"}</p>
                        <span className="entity-status">{quest.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No quests related to this timeline event.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Locations Section */}
        <div className="section">
          <div 
            className="section-header"
            onClick={() => toggleSection("locations")}
            style={{ cursor: "pointer" }}
          >
            <h3 className="section-title">🗺️ Related Locations ({relatedLocations.length})</h3>
            <span className="collapse-indicator">
              {collapsedSections.has("locations") ? "▼" : "▲"}
            </span>
          </div>
          {!collapsedSections.has("locations") && (
            <div className="section-content">
              {relatedLocations.length > 0 ? (
                <div className="entities-grid">
                  {relatedLocations.map((location: any) => (
                    <div key={location._id} className="entity-card">
                      <div className="entity-info">
                        <h4 className="entity-name">{location.name}</h4>
                        <p className="entity-description">{location.description}</p>
                        <span className="entity-status">{location.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No locations related to this timeline event.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related NPCs Section */}
        <div className="section">
          <div 
            className="section-header"
            onClick={() => toggleSection("npcs")}
            style={{ cursor: "pointer" }}
          >
            <h3 className="section-title">🎭 Related NPCs ({relatedNpcs.length})</h3>
            <span className="collapse-indicator">
              {collapsedSections.has("npcs") ? "▼" : "▲"}
            </span>
          </div>
          {!collapsedSections.has("npcs") && (
            <div className="section-content">
              {relatedNpcs.length > 0 ? (
                <div className="entities-grid">
                  {relatedNpcs.map((npc: any) => (
                    <div key={npc._id} className="entity-card">
                      <div className="entity-info">
                        <h4 className="entity-name">{npc.name}</h4>
                        <p className="entity-description">
                          {npc.race} {npc.class} (Level {npc.level})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No NPCs related to this timeline event.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Factions Section */}
        <div className="section">
          <div 
            className="section-header"
            onClick={() => toggleSection("factions")}
            style={{ cursor: "pointer" }}
          >
            <h3 className="section-title">🏛️ Related Factions ({relatedFactions.length})</h3>
            <span className="collapse-indicator">
              {collapsedSections.has("factions") ? "▼" : "▲"}
            </span>
          </div>
          {!collapsedSections.has("factions") && (
            <div className="section-content">
              {relatedFactions.length > 0 ? (
                <div className="entities-grid">
                  {relatedFactions.map((faction: any) => (
                    <div key={faction._id} className="entity-card">
                      <div className="entity-info">
                        <h4 className="entity-name">{faction.name}</h4>
                        <p className="entity-description">{faction.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No factions related to this timeline event.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="edit-button"
          onClick={handleEdit}
          disabled={isDeleting}
        >
          ✏️ Edit Timeline Event
        </button>
        <button
          className="delete-button"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "🗑️ Deleting..." : "🗑️ Delete Timeline Event"}
        </button>
      </div>
    </div>
  );
};

export default TimelineEventDetail; 
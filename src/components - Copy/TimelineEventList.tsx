import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {  Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import TimelineEventCreationForm from "./TimelineEventCreationForm";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import "./TimelineEventList.css";

const TimelineEventList: React.FC = () => {
  const { isAdmin } = useRoleAccess();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTimelineEvent, setEditingTimelineEvent] = useState<Id<"timelineEvents"> | null>(null);
  const [isDeleting, setIsDeleting] = useState<Id<"timelineEvents"> | null>(null);
  const [isPopulating, setIsPopulating] = useState(false);
  const timelineEvents = useQuery(api.timelineEvents.getAllTimelineEvents);
  const deleteTimelineEvent = useMutation(api.timelineEvents.deleteTimelineEvent);
  const populateSampleEvents = useMutation(api.timelineEvents.populateSampleTimelineEvents);
  
  // Get current user's Convex ID
  const { user } = useUser();
  const convexUser = useQuery(api.users.getUserByClerkId, 
    user ? { clerkId: user.id } : "skip"
  );

  const handleDelete = async (id: Id<"timelineEvents">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this timeline event? This action cannot be undone.")) {
      setIsDeleting(id);
      try {
        await deleteTimelineEvent({ id });
      } catch (error) {
        console.error("Error deleting timeline event:", error);
        alert("Failed to delete timeline event. Please try again.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleEdit = (id: Id<"timelineEvents">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTimelineEvent(id);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingTimelineEvent(null);
  };

  const handleSubmitSuccess = () => {
    setIsCreating(false);
    setEditingTimelineEvent(null);
  };

  const handlePopulateSampleData = async () => {
    if (!convexUser) {
      alert("User not found. Please try again.");
      return;
    }

    if (window.confirm("This will add 3 sample timeline events to the database. Continue?")) {
      setIsPopulating(true);
      try {
        const result = await populateSampleEvents({ creatorId: convexUser._id });
        alert(`Sample timeline events have been added successfully! Created ${result.timelineEventIds.length} events in campaign "${result.campaignId}".`);
      } catch (error) {
        console.error("Error populating sample data:", error);
        alert("Failed to populate sample data. Please try again.");
      } finally {
        setIsPopulating(false);
      }
    }
  };

  if (!timelineEvents) {
    return (
      <div className="timeline-events-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading timeline events...</p>
        </div>
      </div>
    );
  }

  if (isCreating || editingTimelineEvent) {
    return (
      <div className="timeline-events-container">
        <TimelineEventCreationForm
          onSubmitSuccess={handleSubmitSuccess}
          onCancel={handleCancel}
          editingTimelineEventId={editingTimelineEvent}
        />
      </div>
    );
  }

  return (
    <div className="timeline-events-container">
      <div className="timeline-events-header">
        <div className="header-content">
          <h2 className="timeline-events-title">Timeline Events</h2>
          <p className="timeline-events-subtitle">
            Manage and organize important events in your campaign timeline
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="create-button"
        >
          <span className="button-icon">+</span>
          Create New Timeline Event
        </Button>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No Timeline Events Yet</h3>
          <p>Get started by creating your first timeline event for your campaign.</p>
          <div className="empty-state-actions">
            <Button
              onClick={() => setIsCreating(true)}
              className="create-button"
            >
              Create Your First Timeline Event
            </Button>
            {isAdmin && (
              <Button
                onClick={handlePopulateSampleData}
                disabled={isPopulating}
                variant="outline"
                className="populate-sample-button"
              >
                {isPopulating ? "🔄 Adding Sample Data..." : "📚 Add Sample Timeline Events"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="timeline-events-grid">
          {timelineEvents.map((timelineEvent) => (
            <div key={timelineEvent._id} className="timeline-event-card-link-wrapper">
              <Link
                to={`/timeline-events/${timelineEvent._id}`}
                className="timeline-event-card-link"
                aria-label={`View details for ${timelineEvent.title}`}
              >
                <Card className="clickable-card timeline-event-card">
                  <CardHeader className="timeline-event-header">
                    <div className="timeline-event-title-section">
                      <CardTitle className="timeline-event-name">{timelineEvent.title}</CardTitle>
                      <Badge variant="secondary" className="timeline-event-type-badge">
                        {timelineEvent.type || "Custom"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="timeline-event-content">
                    <p className="timeline-event-description">
                      {timelineEvent.description.length > 150 
                        ? `${timelineEvent.description.substring(0, 150)}...` 
                        : timelineEvent.description
                      }
                    </p>
                    
                    <Separator className="my-2" />
                    
                    <div className="timeline-event-details">
                      <div className="timeline-event-meta">
                        <Badge variant="outline" className="event-date">
                          📅 {new Date(timelineEvent.date).toLocaleDateString()}
                        </Badge>
                        {timelineEvent.relatedQuestIds && timelineEvent.relatedQuestIds.length > 0 && (
                          <Badge variant="outline" className="quest-link">
                            📜 {timelineEvent.relatedQuestIds.length} Quests
                          </Badge>
                        )}
                      </div>
                      
                      <div className="related-entities-info">
                        <Badge variant="outline" className="related-count">
                          🗺️ {timelineEvent.relatedLocationIds?.length || 0} Locations
                        </Badge>
                        <Badge variant="outline" className="related-count">
                          🎭 {timelineEvent.relatedNpcIds?.length || 0} NPCs
                        </Badge>
                        <Badge variant="outline" className="related-count">
                          🏛️ {timelineEvent.relatedFactionIds?.length || 0} Factions
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  
                  <div className="timeline-event-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEdit(timelineEvent._id, e)}
                      title="Edit this timeline event"
                      className="edit-button"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDelete(timelineEvent._id, e)}
                      disabled={isDeleting === timelineEvent._id}
                      title="Delete this timeline event"
                      className="delete-button"
                    >
                      {isDeleting === timelineEvent._id ? "🗑️ Deleting..." : "🗑️ Delete"}
                    </Button>
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineEventList; 
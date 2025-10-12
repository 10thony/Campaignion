import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import BackToCampaign from "./BackToCampaign";
import "./QuestDetail.css";

const QuestDetail: React.FC = () => {
  const navigate = useNavigate();
  const { questId } = useParams<{ questId: string }>();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const quest = useQuery(api.quests.getQuestById, { id: questId as Id<"quests"> });
  const tasks = useQuery(api.questTasks.getQuestTasksByQuest, { questId: questId as Id<"quests"> });
  const locations = useQuery(api.locations.list);
  const items = useQuery(api.items.getItems);
  const npcs = useQuery(api.npcs.getAllNpcs);
  const characters = useQuery(api.characters.getAllCharacters);
  
  const updateQuestStatus = useMutation(api.quests.updateQuestStatus);

  const handleStatusChange = async (newStatus: "NotStarted" | "InProgress" | "Completed" | "Failed") => {
    if (!questId) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateQuestStatus({
        id: questId as Id<"quests">,
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating quest status:", error);
      alert("Failed to update quest status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NotStarted":
        return "status-not-started";
      case "InProgress":
        return "status-in-progress";
      case "Completed":
        return "status-completed";
      case "Failed":
        return "status-failed";
      default:
        return "status-unknown";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "NotStarted":
        return "Not Started";
      case "InProgress":
        return "In Progress";
      case "Completed":
        return "Completed";
      case "Failed":
        return "Failed";
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Fetch":
        return "📦";
      case "Kill":
        return "⚔️";
      case "Speak":
        return "💬";
      case "Explore":
        return "🗺️";
      case "Puzzle":
        return "🧩";
      case "Deliver":
        return "📮";
      case "Escort":
        return "👥";
      case "Custom":
        return "🎯";
      default:
        return "📋";
    }
  };

  const getItemName = (itemId: Id<"items">) => {
    return items?.find(item => item._id === itemId)?.name || "Unknown Item";
  };

  const getNpcName = (npcId: Id<"npcs">) => {
    return npcs?.find(npc => npc._id === npcId)?.name || "Unknown NPC";
  };

  const getCharacterName = (characterId: Id<"playerCharacters">) => {
    return characters?.find(char => char._id === characterId)?.name || "Unknown Character";
  };

  const getLocationName = (locationId: Id<"locations">) => {
    return locations?.find(loc => loc._id === locationId)?.name || "Unknown Location";
  };

  if (!quest) {
    return <div className="loading">Loading quest...</div>;
  }

  return (
    <div className="quest-detail">
      <div className="quest-header">
        <div className="quest-header-content">
          <h1>{quest.name}</h1>
          <div className="quest-status-section">
            <span className={`quest-status ${getStatusColor(quest.status)}`}>
              {getStatusText(quest.status)}
            </span>
            <select
              className="status-selector"
              value={quest.status}
              onChange={(e) => handleStatusChange(e.target.value as "NotStarted" | "InProgress" | "Completed" | "Failed")}
              disabled={isUpdatingStatus}
            >
              <option value="NotStarted">Not Started</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
            {isUpdatingStatus && <span className="status-updating">Updating...</span>}
          </div>
        </div>
        {campaignId ? (
          <BackToCampaign campaignId={campaignId} />
        ) : (
          <button
            className="back-btn"
            onClick={() => navigate("/quests")}
          >
            ← Back to Quests
          </button>
        )}
      </div>

      <div className="quest-content">
        {/* Quest Information */}
        <div className="quest-info-section">
          <h2>Quest Information</h2>
          {quest.description && (
            <div className="info-group">
              <label>Description:</label>
              <p>{quest.description}</p>
            </div>
          )}
          
          <div className="info-grid">
            {quest.locationId && (
              <div className="info-group">
                <label>Location:</label>
                <span>{getLocationName(quest.locationId)}</span>
              </div>
            )}
            
            <div className="info-group">
              <label>Created:</label>
              <span>{new Date(quest.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Participants */}
          {quest.participantIds && quest.participantIds.length > 0 && (
            <div className="info-group">
              <label>Participants:</label>
              <div className="tag-list">
                {quest.participantIds.map((charId) => (
                  <span key={charId} className="tag">
                    {getCharacterName(charId)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Involved NPCs */}
          {quest.involvedNpcIds && quest.involvedNpcIds.length > 0 && (
            <div className="info-group">
              <label>Involved NPCs:</label>
              <div className="tag-list">
                {quest.involvedNpcIds.map((npcId) => (
                  <span key={npcId} className="tag">
                    {getNpcName(npcId)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Required Items */}
          {quest.requiredItemIds && quest.requiredItemIds.length > 0 && (
            <div className="info-group">
              <label>Required Items:</label>
              <div className="tag-list">
                {quest.requiredItemIds.map((itemId) => (
                  <span key={itemId} className="tag">
                    {getItemName(itemId)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rewards */}
          {quest.rewards && (
            <div className="info-group">
              <label>Rewards:</label>
              <div className="rewards-list">
                {quest.rewards.xp && (
                  <span className="reward-item">XP: {quest.rewards.xp}</span>
                )}
                {quest.rewards.gold && (
                  <span className="reward-item">Gold: {quest.rewards.gold}</span>
                )}
                {quest.rewards.itemIds && quest.rewards.itemIds.length > 0 && (
                  <div className="reward-items">
                    <span>Items:</span>
                    {quest.rewards.itemIds.map((itemId) => (
                      <span key={itemId} className="tag">
                        {getItemName(itemId)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
          <div className="tasks-header">
            <h2>Quest Tasks</h2>
            <button
              className="add-task-btn"
              onClick={() => navigate(`/quests/${questId}/tasks/new`)}
            >
              Add New Task
            </button>
          </div>

          {!tasks || tasks.length === 0 ? (
            <div className="no-tasks">
              <p>No tasks created yet. Add your first task to get started!</p>
            </div>
          ) : (
            <div className="tasks-grid">
              {tasks.map((task) => (
                <div key={task._id} className="task-card">
                  <div className="task-header">
                    <div className="task-title">
                      <span className="task-icon">{getTypeIcon(task.type)}</span>
                      <h3>{task.title}</h3>
                    </div>
                    <span className={`task-status ${getStatusColor(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  
                  <div className="task-meta">
                    <div className="task-type">
                      <span className="meta-label">Type:</span>
                      <span>{task.type}</span>
                    </div>
                    
                    {task.locationId && (
                      <div className="task-location">
                        <span className="meta-label">Location:</span>
                        <span>{getLocationName(task.locationId)}</span>
                      </div>
                    )}
                    
                    {task.targetNpcId && (
                      <div className="task-target">
                        <span className="meta-label">Target:</span>
                        <span>{getNpcName(task.targetNpcId)}</span>
                      </div>
                    )}
                  </div>

                  {task.assignedTo && task.assignedTo.length > 0 && (
                    <div className="task-assignees">
                      <span className="meta-label">Assigned to:</span>
                      <div className="tag-list">
                        {task.assignedTo.map((charId) => (
                          <span key={charId} className="tag small">
                            {getCharacterName(charId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {task.requiredItemIds && task.requiredItemIds.length > 0 && (
                    <div className="task-requirements">
                      <span className="meta-label">Required:</span>
                      <div className="tag-list">
                        {task.requiredItemIds.map((itemId) => (
                          <span key={itemId} className="tag small">
                            {getItemName(itemId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestDetail; 
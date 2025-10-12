import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import "./EntitySelectionModal.css";

interface EntitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (entityId: Id<any>) => void;
  entityType: "quests" | "questTasks" | "locations" | "npcs" | "monsters" | "playerCharacters" | "timelineEvents";
  title: string;
  currentLinkedIds?: Id<any>[];
}

const EntitySelectionModal: React.FC<EntitySelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  entityType,
  title,
  currentLinkedIds = []
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<Id<any> | null>(null);

  // Fetch entities based on type
  const quests = useQuery(api.quests.getAllQuests);
  const questTasks = useQuery(api.questTasks.getAllQuestTasks);
  const locations = useQuery(api.locations.list);
  const npcs = useQuery(api.npcs.getAllNpcs);
  const monsters = useQuery(api.monsters.getAllMonsters);
  const playerCharacters = useQuery(api.characters.getAllCharacters);
  const timelineEvents = useQuery(api.timelineEvents.getAllTimelineEvents);

  const getEntities = () => {
    switch (entityType) {
      case "quests":
        return quests || [];
      case "questTasks":
        return questTasks || [];
      case "locations":
        return locations || [];
      case "npcs":
        return npcs || [];
      case "monsters":
        return monsters || [];
      case "playerCharacters":
        return playerCharacters || [];
      case "timelineEvents":
        return timelineEvents || [];
      default:
        return [];
    }
  };

  const entities = getEntities();

  // Filter entities based on search term and exclude already linked ones
  const filteredEntities = entities.filter((entity: any) => {
    const matchesSearch = entity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const notAlreadyLinked = !currentLinkedIds.includes(entity._id);
    return matchesSearch && notAlreadyLinked;
  });

  const handleSelect = (entityId: Id<any>) => {
    setSelectedEntity(entityId);
  };

  const handleConfirm = () => {
    if (selectedEntity) {
      onSelect(selectedEntity);
      onClose();
      setSelectedEntity(null);
      setSearchTerm("");
    }
  };

  const handleCancel = () => {
    onClose();
    setSelectedEntity(null);
    setSearchTerm("");
  };

  const getEntityDisplayName = (entity: any) => {
    switch (entityType) {
      case "quests":
        return entity.name;
      case "questTasks":
        return entity.title;
      case "locations":
        return entity.name;
      case "npcs":
        return entity.name;
      case "monsters":
        return entity.name;
      case "playerCharacters":
        return entity.name;
      case "timelineEvents":
        return entity.title;
      default:
        return "Unknown";
    }
  };

  const getEntityDescription = (entity: any) => {
    switch (entityType) {
      case "quests":
        return entity.description || "No description";
      case "questTasks":
        return entity.description || "No description";
      case "locations":
        return entity.description || "No description";
      case "npcs":
        return `${entity.race} ${entity.class} (Level ${entity.level})`;
      case "monsters":
        return `${entity.size} ${entity.type} (CR ${entity.challengeRating})`;
      case "playerCharacters":
        return `${entity.race} ${entity.class} (Level ${entity.level})`;
      case "timelineEvents":
        return `${entity.type || "Custom"} - ${new Date(entity.date).toLocaleDateString()}`;
      default:
        return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="entity-selection-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="entities-list">
            {filteredEntities.length === 0 ? (
              <div className="empty-state">
                <p>No available entities found.</p>
              </div>
            ) : (
              filteredEntities.map((entity: any) => (
                <div
                  key={entity._id}
                  className={`entity-item ${selectedEntity === entity._id ? 'selected' : ''}`}
                  onClick={() => handleSelect(entity._id)}
                >
                  <div className="entity-info">
                    <h4 className="entity-name">{getEntityDisplayName(entity)}</h4>
                    <p className="entity-description">{getEntityDescription(entity)}</p>
                  </div>
                  {selectedEntity === entity._id && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="confirm-button"
            onClick={handleConfirm}
            disabled={!selectedEntity}
          >
            Link Entity
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntitySelectionModal; 
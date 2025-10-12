import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import "./FactionList.css";

const FactionList: React.FC = () => {
  const navigate = useNavigate();
  const factions = useQuery(api.factions.getFactions, {});
  const deleteFaction = useMutation(api.factions.deleteFaction);
  const [isDeleting, setIsDeleting] = useState<Id<"factions"> | null>(null);

  const handleCreateFaction = () => {
    navigate("/factions/new");
  };

  const handleEditFaction = (factionId: Id<"factions">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/factions/${factionId}/edit`);
  };

  const handleDeleteFaction = async (factionId: Id<"factions">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this faction?")) {
      setIsDeleting(factionId);
      try {
        await deleteFaction({ factionId });
      } catch (error) {
        console.error("Error deleting faction:", error);
        alert("Failed to delete faction");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  if (factions === undefined) {
    return (
      <div className="factions-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading factions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="factions-container">
      <div className="factions-header">
        <div className="header-content">
          <h1 className="factions-title">Factions</h1>
          <p className="factions-subtitle">
            Manage the factions and organizations in your campaign world
          </p>
        </div>
        <Button onClick={handleCreateFaction} className="create-button">
          <span className="button-icon">+</span>
          Create Faction
        </Button>
      </div>

      {factions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏛️</div>
          <h3>No Factions Yet</h3>
          <p>Create your first faction to get started with managing organizations in your campaign.</p>
          <Button onClick={handleCreateFaction} className="create-button">
            <span className="button-icon">+</span>
            Create Your First Faction
          </Button>
        </div>
      ) : (
        <div className="factions-grid">
          {factions.map((faction) => (
            <div key={faction._id} className="faction-card-link-wrapper">
              <Link
                to={`/factions/${faction._id}`}
                className="faction-card-link"
                aria-label={`View details for ${faction.name}`}
              >
                <Card className="clickable-card faction-card">
                  <CardHeader className="faction-header">
                    <div className="faction-title-section">
                      <CardTitle className="faction-name">{faction.name}</CardTitle>
                      <div className="faction-meta">
                        {faction.leaders && faction.leaders.length > 0 && (
                          <Badge variant="outline" className="leader-count">
                            {faction.leaders.length} Leader{faction.leaders.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {faction.allies && faction.allies.length > 0 && (
                          <Badge variant="outline" className="ally-count">
                            {faction.allies.length} Allied Faction{faction.allies.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="faction-content">
                    <p className="faction-description">
                      {faction.description.length > 150
                        ? `${faction.description.substring(0, 150)}...`
                        : faction.description}
                    </p>

                    {faction.goals && faction.goals.length > 0 && (
                      <div className="faction-goals">
                        <strong>Goals:</strong>
                        <ul>
                          {faction.goals.slice(0, 2).map((goal, index) => (
                            <li key={index}>{goal}</li>
                          ))}
                          {faction.goals.length > 2 && (
                            <li>...and {faction.goals.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>

                  <div className="faction-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEditFaction(faction._id, e)}
                      title="Edit this faction"
                      className="edit-button"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDeleteFaction(faction._id, e)}
                      disabled={isDeleting === faction._id}
                      title="Delete this faction"
                      className="delete-button"
                    >
                      {isDeleting === faction._id ? "🗑️ Deleting..." : "🗑️ Delete"}
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

export default FactionList; 
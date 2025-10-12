import React from "react";
import { useQuery } from "convex/react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import "./FactionDetail.css";

const FactionDetail: React.FC = () => {
  const { factionId } = useParams<{ factionId: string }>();
  const navigate = useNavigate();
  
  const faction = useQuery(api.factions.getFactionById, {
    factionId: factionId as Id<"factions">,
  });

  const handleEdit = () => {
    navigate(`/factions/${factionId}/edit`);
  };

  const handleBack = () => {
    navigate("/factions");
  };

  if (faction === undefined) {
    return (
      <div className="faction-detail-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading faction details...</p>
        </div>
      </div>
    );
  }

  if (!faction) {
    return (
      <div className="faction-detail-container">
        <div className="error-state">
          <h2>Faction Not Found</h2>
          <p>The faction you're looking for doesn't exist.</p>
          <button onClick={handleBack} className="btn-primary">
            Back to Factions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="faction-detail-container">
      <div className="detail-header">
        <button onClick={handleBack} className="back-button">
          ← Back to Factions
        </button>
        <div className="header-actions">
          <button onClick={handleEdit} className="edit-button">
            Edit Faction
          </button>
        </div>
      </div>

      <div className="faction-content">
        <div className="faction-header">
          <h1 className="faction-title">{faction.name}</h1>
          <div className="faction-meta">
            <span className="created-date">
              Created: {faction.createdAt ? new Date(faction.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
            {faction.updatedAt && (
              <span className="updated-date">
                Updated: {new Date(faction.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="faction-sections">
          {/* Description Section */}
          <div className="detail-section">
            <h2 className="section-title">Description</h2>
            <div className="section-content">
              <p className="faction-description">{faction.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* Goals Section */}
          {Array.isArray(faction.goals) && faction.goals.length > 0 && (
            <div className="detail-section">
              <h2 className="section-title">Goals</h2>
              <div className="section-content">
                <ul className="goals-list">
                  {faction.goals.map((goal, index) => (
                    <li key={index} className="goal-item">
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Leaders Section */}
          {Array.isArray(faction.leaders) && faction.leaders.length > 0 && (
            <div className="detail-section">
              <h2 className="section-title">Leaders</h2>
              <div className="section-content">
                <div className="leaders-grid">
                  {faction.leaders.filter((leader) => leader !== null).map((leader) => (
                    <div key={leader._id} className="leader-card">
                      <h4 className="leader-name">{leader.name}</h4>
                      <p className="leader-details">
                        {leader.race} {leader.class}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Allied Factions Section */}
          {Array.isArray(faction.allies) && faction.allies.length > 0 && (
            <div className="detail-section">
              <h2 className="section-title">Allied Factions</h2>
              <div className="section-content">
                <div className="factions-grid">
                  {faction.allies.filter((ally) => ally !== null).map((ally) => (
                    <div key={ally._id} className="faction-card">
                      <h4 className="faction-name">{ally.name}</h4>
                      <p className="faction-description">
                        {ally.description && ally.description.length > 100
                          ? `${ally.description.substring(0, 100)}...`
                          : ally.description || 'No description.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Enemy Factions Section */}
          {Array.isArray(faction.enemies) && faction.enemies.length > 0 && (
            <div className="detail-section">
              <h2 className="section-title">Enemy Factions</h2>
              <div className="section-content">
                <div className="factions-grid">
                  {faction.enemies.filter((enemy) => enemy !== null).map((enemy) => (
                    <div key={enemy._id} className="faction-card enemy">
                      <h4 className="faction-name">{enemy.name}</h4>
                      <p className="faction-description">
                        {enemy.description && enemy.description.length > 100
                          ? `${enemy.description.substring(0, 100)}...`
                          : enemy.description || 'No description.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reputation Section */}
          {Array.isArray(faction.reputation) && faction.reputation.length > 0 && (
            <div className="detail-section">
              <h2 className="section-title">Reputation</h2>
              <div className="section-content">
                <div className="reputation-list">
                  {faction.reputation.map((rep, index) => (
                    <div key={index} className="reputation-item">
                      <span className="character-name">
                        Character ID: {rep.playerCharacterId}
                      </span>
                      <span className="reputation-score">
                        Score: {rep.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactionDetail; 
import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import MonsterForm from "./MonsterForm";
import BackToCampaign from "./BackToCampaign";
import "./MonsterDetail.css";

const MonsterDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const monster = useQuery(api.monsters.getMonsterById, { id: id as Id<"monsters"> });
  const deleteMonster = useMutation(api.monsters.deleteMonster);

  const handleDelete = async () => {
    if (!monster || !window.confirm("Are you sure you want to delete this monster? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMonster({ id: monster._id });
      navigate("/monsters");
    } catch (error) {
      console.error("Error deleting monster:", error);
      alert("Failed to delete monster. Please try again.");
    } finally {
      setIsDeleting(false);
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

  if (!monster) {
    return (
      <div className="monster-detail-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading monster details...</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="monster-detail-container">
        <MonsterForm
          onSubmitSuccess={handleSubmitSuccess}
          onCancel={handleCancel}
          editingMonsterId={monster._id}
        />
      </div>
    );
  }

  const getModifier = (score: number) => {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  return (
    <div className="monster-detail-container">
      <div className="monster-detail-header">
        <div className="header-content">
          <h1 className="monster-name">{monster.name}</h1>
          <div className="monster-subtitle">
            {monster.size} {monster.type}, {monster.alignment}
          </div>
        </div>
        <div className="header-actions">
          {campaignId && <BackToCampaign campaignId={campaignId} />}
          <button
            className="edit-button"
            onClick={handleEdit}
            title="Edit this monster"
          >
            ✏️ Edit
          </button>
          <button
            className="delete-button"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete this monster"
          >
            {isDeleting ? "🗑️ Deleting..." : "🗑️ Delete"}
          </button>
        </div>
      </div>

      <div className="monster-detail-content">
        {/* Basic Information */}
        <div className="detail-section">
          <h2 className="section-title">Basic Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Challenge Rating:</span>
              <span className="info-value">{monster.challengeRating}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Experience Points:</span>
              <span className="info-value">{monster.experiencePoints?.toLocaleString() || "N/A"}</span>
            </div>
            {monster.source && (
              <div className="info-item">
                <span className="info-label">Source:</span>
                <span className="info-value">{monster.source}</span>
              </div>
            )}
            {monster.page && (
              <div className="info-item">
                <span className="info-label">Page:</span>
                <span className="info-value">{monster.page}</span>
              </div>
            )}
          </div>
        </div>

        {/* Combat Statistics */}
        <div className="detail-section">
          <h2 className="section-title">Combat Statistics</h2>
          <div className="combat-stats">
            <div className="stat-card">
              <div className="stat-value">{monster.armorClass}</div>
              <div className="stat-label">Armor Class</div>
              {monster.armorType && <div className="stat-note">{monster.armorType}</div>}
            </div>
            <div className="stat-card">
              <div className="stat-value">{monster.hitPoints}</div>
              <div className="stat-label">Hit Points</div>
              <div className="stat-note">{monster.hitDice.count}{monster.hitDice.die}</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">+{monster.proficiencyBonus}</div>
              <div className="stat-label">Proficiency Bonus</div>
            </div>
          </div>
        </div>

        {/* Ability Scores */}
        <div className="detail-section">
          <h2 className="section-title">Ability Scores</h2>
          <div className="ability-scores">
            {Object.entries(monster.abilityScores).map(([ability, score]) => (
              <div key={ability} className="ability-score">
                <div className="ability-name">{ability.toUpperCase()}</div>
                <div className="ability-value">{score}</div>
                <div className="ability-modifier">{getModifier(score)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div className="detail-section">
          <h2 className="section-title">Speed</h2>
          <div className="speed-info">
            {Object.entries(monster.speed).map(([movementType, speed]) => 
              speed && (
                <span key={movementType} className="speed-item">
                  {movementType.charAt(0).toUpperCase() + movementType.slice(1)} {speed}
                </span>
              )
            )}
          </div>
        </div>

        {/* Senses */}
        <div className="detail-section">
          <h2 className="section-title">Senses</h2>
          <div className="senses-info">
            {monster.senses.darkvision && (
              <span className="sense-item">Darkvision {monster.senses.darkvision}</span>
            )}
            {monster.senses.blindsight && (
              <span className="sense-item">Blindsight {monster.senses.blindsight}</span>
            )}
            {monster.senses.tremorsense && (
              <span className="sense-item">Tremorsense {monster.senses.tremorsense}</span>
            )}
            {monster.senses.truesight && (
              <span className="sense-item">Truesight {monster.senses.truesight}</span>
            )}
            <span className="sense-item">Passive Perception {monster.senses.passivePerception}</span>
          </div>
          {monster.languages && (
            <div className="languages-info">
              <strong>Languages:</strong> {monster.languages}
            </div>
          )}
        </div>

        {/* Saving Throws */}
        {monster.savingThrows && monster.savingThrows.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Saving Throws</h2>
            <div className="saving-throws">
              {monster.savingThrows.map((save, index) => (
                <span key={index} className="save-item">{save}</span>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {monster.skills && monster.skills.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Skills</h2>
            <div className="skills">
              {monster.skills.map((skill, index) => (
                <span key={index} className="skill-item">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Damage Vulnerabilities */}
        {monster.damageVulnerabilities && monster.damageVulnerabilities.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Damage Vulnerabilities</h2>
            <div className="damage-info">
              {monster.damageVulnerabilities.map((vulnerability, index) => (
                <span key={index} className="damage-item vulnerability">{vulnerability}</span>
              ))}
            </div>
          </div>
        )}

        {/* Damage Resistances */}
        {monster.damageResistances && monster.damageResistances.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Damage Resistances</h2>
            <div className="damage-info">
              {monster.damageResistances.map((resistance, index) => (
                <span key={index} className="damage-item resistance">{resistance}</span>
              ))}
            </div>
          </div>
        )}

        {/* Damage Immunities */}
        {monster.damageImmunities && monster.damageImmunities.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Damage Immunities</h2>
            <div className="damage-info">
              {monster.damageImmunities.map((immunity, index) => (
                <span key={index} className="damage-item immunity">{immunity}</span>
              ))}
            </div>
          </div>
        )}

        {/* Condition Immunities */}
        {monster.conditionImmunities && monster.conditionImmunities.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Condition Immunities</h2>
            <div className="condition-info">
              {monster.conditionImmunities.map((condition, index) => (
                <span key={index} className="condition-item">{condition}</span>
              ))}
            </div>
          </div>
        )}

        {/* Traits */}
        {monster.traits && monster.traits.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Traits</h2>
            <div className="traits">
              {monster.traits.map((trait, index) => (
                <div key={index} className="trait">
                  <h3 className="trait-name">{trait.name}</h3>
                  <p className="trait-description">{trait.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {monster.actions && monster.actions.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Actions</h2>
            <div className="actions">
              {monster.actions.map((action, index) => (
                <div key={index} className="action">
                  <h3 className="action-name">{action.name}</h3>
                  <p className="action-description">{action.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reactions */}
        {monster.reactions && monster.reactions.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Reactions</h2>
            <div className="reactions">
              {monster.reactions.map((reaction, index) => (
                <div key={index} className="reaction">
                  <h3 className="reaction-name">{reaction.name}</h3>
                  <p className="reaction-description">{reaction.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legendary Actions */}
        {monster.legendaryActions && monster.legendaryActions.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Legendary Actions</h2>
            <div className="legendary-actions">
              {monster.legendaryActions.map((action, index) => (
                <div key={index} className="legendary-action">
                  <h3 className="legendary-action-name">{action.name}</h3>
                  <p className="legendary-action-description">{action.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lair Actions */}
        {monster.lairActions && monster.lairActions.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Lair Actions</h2>
            <div className="lair-actions">
              {monster.lairActions.map((action, index) => (
                <div key={index} className="lair-action">
                  <h3 className="lair-action-name">{action.name}</h3>
                  <p className="lair-action-description">{action.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regional Effects */}
        {monster.regionalEffects && monster.regionalEffects.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Regional Effects</h2>
            <div className="regional-effects">
              {monster.regionalEffects.map((effect, index) => (
                <div key={index} className="regional-effect">
                  <h3 className="regional-effect-name">{effect.name}</h3>
                  <p className="regional-effect-description">{effect.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Environment */}
        {monster.environment && monster.environment.length > 0 && (
          <div className="detail-section">
            <h2 className="section-title">Environment</h2>
            <div className="environment">
              {monster.environment.map((env, index) => (
                <span key={index} className="environment-item">{env}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonsterDetail; 
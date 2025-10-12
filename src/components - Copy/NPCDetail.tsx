import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import BackToCampaign from "./BackToCampaign";
import "./CharacterDetail.css";

const NPCDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  
  const npc = useQuery(api.npcs.getNpcById, { id: id as Id<"npcs"> });
  
  if (!npc) {
    return (
      <div className="character-detail">
        <div className="loading">Loading NPC details...</div>
      </div>
    );
  }

  return (
    <div className="character-detail">
      <div className="detail-header">
        {campaignId && <BackToCampaign campaignId={campaignId} />}
        <h1 className="character-name">{npc.name}</h1>
      </div>
      
      <div className="character-content">
        <div className="character-basic-info">
          <div className="info-grid">
            <div className="info-item">
              <label>Race:</label>
              <span>{npc.race}</span>
            </div>
            <div className="info-item">
              <label>Class:</label>
              <span>{npc.class}</span>
            </div>
            <div className="info-item">
              <label>Level:</label>
              <span>{npc.level}</span>
            </div>
            <div className="info-item">
              <label>Background:</label>
              <span>{npc.background}</span>
            </div>
            {npc.alignment && (
              <div className="info-item">
                <label>Alignment:</label>
                <span>{npc.alignment}</span>
              </div>
            )}
          </div>
        </div>

        <div className="character-section">
          <h3>Ability Scores</h3>
          <div className="ability-scores">
            <div className="ability-score">
              <span className="ability-name">STR</span>
              <span className="ability-value">{npc.abilityScores.strength}</span>
            </div>
            <div className="ability-score">
              <span className="ability-name">DEX</span>
              <span className="ability-value">{npc.abilityScores.dexterity}</span>
            </div>
            <div className="ability-score">
              <span className="ability-name">CON</span>
              <span className="ability-value">{npc.abilityScores.constitution}</span>
            </div>
            <div className="ability-score">
              <span className="ability-name">INT</span>
              <span className="ability-value">{npc.abilityScores.intelligence}</span>
            </div>
            <div className="ability-score">
              <span className="ability-name">WIS</span>
              <span className="ability-value">{npc.abilityScores.wisdom}</span>
            </div>
            <div className="ability-score">
              <span className="ability-name">CHA</span>
              <span className="ability-value">{npc.abilityScores.charisma}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NPCDetail; 
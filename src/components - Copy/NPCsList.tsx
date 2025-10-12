import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { PlayerCharacter } from "../types/character";
import { getAbilityModifier } from "../types/dndRules";
import CharacterForm from "./CharacterForm";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import "./CharacterList.css";

const NPCsList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { user } = useUser();
  const npcs = useQuery(api.npcs.getAllNpcs);
  const deleteNpc = useMutation(api.npcs.deleteNpc);
  const importNpcData = useMutation(api.npcs.importNpcData);

  // Check if we should show creation form based on query parameter
  useEffect(() => {
    const shouldCreate = searchParams.get('create') === 'true';
    if (shouldCreate) {
      setIsCreating(true);
    }
  }, [searchParams]);

  console.log("NPCs data:", npcs); // Debug log

  const handleDelete = async (npcId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this NPC?")) {
      try {
        await deleteNpc({ id: npcId as any });
      } catch (error) {
        console.error("Error deleting NPC:", error);
      }
    }
  };

  const handleImportData = async () => {
    if (!user) {
      alert("You must be logged in to import NPCs.");
      return;
    }

    setIsImporting(true);
    try {
      const result = await importNpcData({ clerkId: user.id });
      console.log("Import successful:", result);
      alert(`Successfully imported ${result.npcs.length} NPCs!`);
    } catch (error) {
      console.error("Error importing data:", error);
      alert("Error importing data. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    const returnTo = searchParams.get('returnTo');
    if (returnTo === 'campaign-form') {
      window.location.href = "/campaigns/new";
    } else {
      setIsCreating(false);
      // Clear the create query parameter if it exists
      if (searchParams.get('create') === 'true') {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('create');
        window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
      }
    }
  };

  const handleSubmitSuccess = () => {
    const returnTo = searchParams.get('returnTo');
    if (returnTo === 'campaign-form') {
      window.location.href = "/campaigns/new";
    } else {
      setIsCreating(false);
      // Clear the create query parameter if it exists
      if (searchParams.get('create') === 'true') {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('create');
        window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
      }
    }
  };

  if (isCreating) {
    const returnTo = searchParams.get('returnTo');
    return (
      <div className="character-list">
        <div className="character-list-header">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="back-button"
          >
            {returnTo === 'campaign-form' ? "← Back to Campaign Form" : "← Back to NPCs"}
          </Button>
        </div>
        <CharacterForm 
          onSuccess={handleSubmitSuccess}
          defaultCharacterType="NonPlayerCharacter"
        />
      </div>
    );
  }

  if (npcs === undefined) {
    console.log("NPCs are undefined - still loading"); // Debug log
    return (
      <div className="character-list">
        <div className="loading">Loading NPCs...</div>
      </div>
    );
  }

  if (npcs === null) {
    console.log("NPCs are null - error occurred"); // Debug log
    return (
      <div className="character-list">
        <div className="error">Error loading NPCs. Please try again later.</div>
      </div>
    );
  }

  console.log("Number of NPCs:", npcs.length); // Debug log

  return (
    <div className="character-list">
      <div className="character-list-header">
        <div className="header-content">
          <h2 className="character-list-title">Your NPCs</h2>
          <p className="character-list-subtitle">
            Manage and organize all non-player characters in your campaign
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="create-button"
        >
          <span className="button-icon">+</span>
          Create New NPC
        </Button>
      </div>

      {npcs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No NPCs Yet</h3>
          <p>Create your first D&D NPC to get started!</p>
          <div className="empty-state-buttons">
            <Button
              onClick={() => setIsCreating(true)}
              className="create-button"
            >
              Create Your First NPC
            </Button>
            <Button
              onClick={handleImportData}
              disabled={isImporting}
              variant="outline"
              className="import-button"
            >
              {isImporting ? "🔄 Importing..." : "📥 Generate Sample NPCs"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="characters-grid">
          {npcs.map((npc: PlayerCharacter) => (
            <div key={npc._id} className="character-card-link-wrapper">
              <Link
                to={`/characters/${npc._id}`}
                className="character-card-link"
                aria-label={`View details for ${npc.name}`}
              >
                <Card className="clickable-card character-card">
                  <CardHeader className="character-card-header">
                    <div className="character-title-section">
                      <div className="character-name-section">
                        <Avatar className="character-avatar">
                          <AvatarFallback>
                            {npc.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle className="character-name">{npc.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="character-type-badge">
                        {npc.characterType}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="character-card-content">
                    <div className="character-identity">
                      <Badge variant="outline" className="race">
                        {npc.race}
                      </Badge>
                      <Badge variant="outline" className="class">
                        {npc.class}
                      </Badge>
                      <Badge variant="outline" className="level">
                        Level {npc.level}
                      </Badge>
                      {npc.alignment && (
                        <Badge variant="outline" className="alignment">
                          {npc.alignment}
                        </Badge>
                      )}
                    </div>
                    
                    {npc.background && (
                      <p className="character-background">
                        {npc.background}
                      </p>
                    )}
                    
                    <Separator className="my-2" />
                    
                    <div className="character-stats">
                      <div className="stat-group">
                        <div className="stat">
                          <span className="stat-label">HP</span>
                          <span className="stat-value">{npc.hitPoints}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">AC</span>
                          <span className="stat-value">{npc.armorClass}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Prof</span>
                          <span className="stat-value">
                            +{npc.proficiencyBonus}
                          </span>
                        </div>
                      </div>

                      <div className="ability-scores-summary">
                        {Object.entries(npc.abilityScores).map(
                          ([ability, score]) => (
                            <div key={ability} className="ability-summary">
                              <span className="ability-name">
                                {ability.slice(0, 3).toUpperCase()}
                              </span>
                              <span className="ability-score">{score}</span>
                              <span className="ability-modifier">
                                {getAbilityModifier(score) >= 0 ? "+" : ""}
                                {getAbilityModifier(score)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="character-proficiencies">
                      <div className="proficiency-group">
                        <strong>Saving Throws:</strong>
                        <span>{npc.savingThrows.join(", ")}</span>
                      </div>
                      <div className="proficiency-group">
                        <strong>Skills:</strong>
                        <span>{npc.skills.slice(0, 3).join(", ")}</span>
                        {npc.skills.length > 3 && (
                          <span className="more-skills">
                            {" "}
                            +{npc.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="character-created">
                      Created: {new Date(npc.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                  
                  <div className="character-actions">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDelete(npc._id!, e)}
                      title="Delete this NPC"
                      className="delete-button"
                    >
                      🗑️ Delete
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

export default NPCsList; 
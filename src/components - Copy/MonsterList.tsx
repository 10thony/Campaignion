import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import {  useSearchParams, Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import MonsterForm from "./MonsterForm";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import "./MonsterList.css";

// Import the monsters data with proper typing
import monstersData from "../data/monsters";
import { MonsterData } from "../types/monsters";

const MonsterList: React.FC = () => {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [editingMonster, setEditingMonster] = useState<Id<"monsters"> | null>(null);
  const [isDeleting, setIsDeleting] = useState<Id<"monsters"> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const monsters = useQuery(api.monsters.getAllMonsters);
  const deleteMonster = useMutation(api.monsters.deleteMonster);
  const bulkCreateMonsters = useMutation(api.monsters.bulkCreateMonsters);

  // Check if we should show creation form based on query parameter
  useEffect(() => {
    const shouldCreate = searchParams.get('create') === 'true';
    if (shouldCreate) {
      setIsCreating(true);
    }
  }, [searchParams]);

  const handleDelete = async (id: Id<"monsters">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this monster? This action cannot be undone.")) {
      setIsDeleting(id);
      try {
        await deleteMonster({ id });
      } catch (error) {
        console.error("Error deleting monster:", error);
        alert("Failed to delete monster. Please try again.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleEdit = (id: Id<"monsters">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingMonster(id);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingMonster(null);
    // Clear the create query parameter if it exists
    if (searchParams.get('create') === 'true') {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('create');
      window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
    }
  };

  const handleSubmitSuccess = () => {
    setIsCreating(false);
    setEditingMonster(null);
    // Clear the create query parameter if it exists
    if (searchParams.get('create') === 'true') {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('create');
      window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
    }
  };

  const handleImportMonsters = async () => {
    if (!user) {
      alert("You must be logged in to import monsters.");
      return;
    }

    if (window.confirm("This will import sample monsters. Continue?")) {
      setIsImporting(true);
      try {
        const transformedMonsters = monstersData.map((monster: MonsterData) => {
          return {
            campaignId: undefined,
            name: monster.name,
            source: monster.source || undefined,
            page: monster.page || undefined,
            size: monster.size,
            type: monster.type,
            tags: monster.tags || undefined,
            alignment: monster.alignment,
            armorClass: monster.armorClass,
            armorType: monster.armorType || undefined,
            hitPoints: monster.hitPoints,
            hitDice: monster.hitDice,
            proficiencyBonus: monster.proficiencyBonus,
            speed: monster.speed,
            abilityScores: monster.abilityScores,
            savingThrows: monster.savingThrows || undefined,
            skills: monster.skills || undefined,
            damageVulnerabilities: monster.damageVulnerabilities || undefined,
            damageResistances: monster.damageResistances || undefined,
            damageImmunities: monster.damageImmunities || undefined,
            conditionImmunities: monster.conditionImmunities || undefined,
            senses: monster.senses,
            languages: monster.languages || undefined,
            challengeRating: monster.challengeRating,
            experiencePoints: monster.experiencePoints ? Number(monster.experiencePoints) : undefined,
            traits: monster.traits || undefined,
            actions: monster.actions || undefined,
            reactions: monster.reactions || undefined,
            legendaryActions: monster.legendaryActions || undefined,
            lairActions: monster.lairActions || undefined,
            regionalEffects: monster.regionalEffects || undefined,
            environment: monster.environment || undefined,
          };
        });

        console.log("Transformed monsters count:", transformedMonsters.length);
        console.log("Sample transformed monster:", transformedMonsters[0]);

        await bulkCreateMonsters({ 
          monsters: transformedMonsters,
          clerkId: user.id,
        });
        console.log("Bulk create completed successfully");
        alert(`Successfully imported ${monstersData.length} monsters!`);
      } catch (error) {
        console.error("Error importing monsters:", error);
        alert("Failed to import monsters. Please try again.");
      } finally {
        setIsImporting(false);
      }
    }
  };

  if (!monsters) {
    return (
      <div className="monsters-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading monsters...</p>
        </div>
      </div>
    );
  }

  if (isCreating || editingMonster) {
    return (
      <div className="monsters-container">
        <MonsterForm
          onSubmitSuccess={handleSubmitSuccess}
          onCancel={handleCancel}
          editingMonsterId={editingMonster}
        />
      </div>
    );
  }

  return (
    <div className="monsters-container">
      <div className="monsters-header">
        <div className="header-content">
          <h2 className="monsters-title">Monsters</h2>
          <p className="monsters-subtitle">
            Manage and organize all monsters for your campaigns
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="create-button"
        >
          <span className="button-icon">+</span>
          Create New Monster
        </Button>
      </div>

      {monsters.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👹</div>
          <h3>No Monsters Yet</h3>
          <p>Get started by creating your first monster or importing sample monsters.</p>
          <div className="empty-state-buttons">
            <Button
              onClick={() => setIsCreating(true)}
              className="create-button"
            >
              Create Your First Monster
            </Button>
            <Button
              onClick={handleImportMonsters}
              disabled={isImporting}
              variant="outline"
              className="import-button"
            >
              {isImporting ? "🔄 Importing..." : "📥 Import Sample Monsters"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="monsters-grid">
          {monsters.map((monster) => (
            <div key={monster._id} className="monster-card-link-wrapper">
              <Link
                to={`/monsters/${monster._id}`}
                className="monster-card-link"
                aria-label={`View details for ${monster.name}`}
              >
                <Card className="clickable-card monster-card">
                  <CardHeader className="monster-header">
                    <div className="monster-title-section">
                      <CardTitle className="monster-name">{monster.name}</CardTitle>
                      <Badge variant="secondary" className="monster-type-badge">
                        {monster.type}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="monster-cr-badge">
                      CR {monster.challengeRating}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="monster-details">
                    <div className="monster-meta">
                      <Badge variant="outline" className="monster-size">
                        {monster.size}
                      </Badge>
                      <Badge variant="outline" className="monster-alignment">
                        {monster.alignment}
                      </Badge>
                      {monster.source && (
                        <Badge variant="outline" className="source-book">
                          📖 {monster.source}
                        </Badge>
                      )}
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="monster-stats">
                      <div className="stat-item">
                        <span className="stat-label">HP:</span>
                        <span className="stat-value">{monster.hitPoints}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">AC:</span>
                        <span className="stat-value">{monster.armorClass}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">XP:</span>
                        <span className="stat-value">{monster.experiencePoints?.toLocaleString() || "N/A"}</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <div className="monster-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEdit(monster._id, e)}
                      title="Edit this monster"
                      className="edit-button"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDelete(monster._id, e)}
                      disabled={isDeleting === monster._id}
                      title="Delete this monster"
                      className="delete-button"
                    >
                      {isDeleting === monster._id ? "🗑️ Deleting..." : "🗑️ Delete"}
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

export default MonsterList; 
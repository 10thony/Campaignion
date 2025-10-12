import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import InteractionCreationForm from "./InteractionCreationForm";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import "./InteractionList.css";

const InteractionList: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Id<"interactions"> | null>(null);
  const [isDeleting, setIsDeleting] = useState<Id<"interactions"> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useUser();
  const interactions = useQuery(api.interactions.getAllInteractions);
  const deleteInteraction = useMutation(api.interactions.deleteInteraction);
  const generateSampleInteractions = useMutation(api.interactions.generateSampleInteractions);

  const handleDelete = async (id: Id<"interactions">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this interaction? This action cannot be undone.")) {
      setIsDeleting(id);
      try {
        await deleteInteraction({ id });
      } catch (error) {
        console.error("Error deleting interaction:", error);
        alert("Failed to delete interaction. Please try again.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleEdit = (id: Id<"interactions">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingInteraction(id);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingInteraction(null);
  };

  const handleSubmitSuccess = () => {
    setIsCreating(false);
    setEditingInteraction(null);
  };

  const handleGenerateSampleData = async () => {
    if (!user?.id) return;
    
    setIsGenerating(true);
    try {
      const result = await generateSampleInteractions({ clerkId: user.id });
      console.log("Sample interactions generated:", result);
      alert(`Successfully generated ${result.count} sample interactions!`);
    } catch (error) {
      console.error("Error generating sample interactions:", error);
      alert("Error generating sample interactions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!interactions) {
    return (
      <div className="interactions-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading interactions...</p>
        </div>
      </div>
    );
  }

  if (isCreating || editingInteraction) {
    return (
      <div className="interactions-container">
        <InteractionCreationForm
          onSubmitSuccess={handleSubmitSuccess}
          onCancel={handleCancel}
          editingInteractionId={editingInteraction}
        />
      </div>
    );
  }

  return (
    <div className="interactions-container">
      <div className="interactions-header">
        <div className="header-content">
          <h2 className="interactions-title">Interactions</h2>
          <p className="interactions-subtitle">
            Manage and organize all interactions between characters, NPCs, and quests
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="create-button"
        >
          <span className="button-icon">+</span>
          Create New Interaction
        </Button>
      </div>

      {interactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No Interactions Yet</h3>
          <p>Get started by creating your first interaction for your campaign.</p>
          <div className="empty-state-actions">
            <Button
              onClick={() => setIsCreating(true)}
              className="create-button"
            >
              Create Your First Interaction
            </Button>
            <Button
              onClick={handleGenerateSampleData}
              disabled={isGenerating}
              variant="outline"
              className="generate-button"
            >
              {isGenerating ? "Generating..." : "Generate Sample Data"}
            </Button>
          </div>
          <div className="admin-note">
            <p><em>You can generate sample interactions to get started quickly.</em></p>
          </div>
        </div>
      ) : (
        <div className="interactions-grid">
          {interactions.map((interaction) => (
            <div key={interaction._id} className="interaction-card-link-wrapper">
              <Link
                to={`/interactions/${interaction._id}`}
                className="interaction-card-link"
                aria-label={`View details for ${interaction.name}`}
              >
                <Card className="clickable-card interaction-card">
                  <CardHeader className="interaction-header">
                    <div className="interaction-title-section">
                      <CardTitle className="interaction-name">{interaction.name}</CardTitle>
                      <Badge variant="secondary" className="interaction-type-badge">
                        Interaction
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="interaction-content">
                    {interaction.description && (
                      <p className="interaction-description">
                        {interaction.description.length > 150 
                          ? `${interaction.description.substring(0, 150)}...` 
                          : interaction.description
                        }
                      </p>
                    )}
                    
                    <Separator className="my-2" />
                    
                    <div className="interaction-details">
                      <div className="interaction-meta">
                        {interaction.relatedQuestId && (
                          <Badge variant="outline" className="quest-link">
                            📜 Linked to Quest
                          </Badge>
                        )}
                        {interaction.questTaskId && (
                          <Badge variant="outline" className="quest-link">
                            ✅ Linked to Task
                          </Badge>
                        )}
                      </div>
                      
                      <div className="participants-info">
                        <Badge variant="outline" className="participants-count">
                          👥 {interaction.playerCharacterIds?.length || 0} Characters
                        </Badge>
                        <Badge variant="outline" className="participants-count">
                          🎭 {interaction.npcIds?.length || 0} NPCs
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  
                  <div className="interaction-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEdit(interaction._id, e)}
                      title="Edit this interaction"
                      className="edit-button"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDelete(interaction._id, e)}
                      disabled={isDeleting === interaction._id}
                      title="Delete this interaction"
                      className="delete-button"
                    >
                      {isDeleting === interaction._id ? "🗑️ Deleting..." : "🗑️ Delete"}
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

export default InteractionList; 
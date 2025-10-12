import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import {  useSearchParams, Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import QuestForm from "./QuestForm";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import "./QuestList.css";

const QuestList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Id<"quests"> | null>(null);
  const [isDeleting, setIsDeleting] = useState<Id<"quests"> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { user } = useUser();
  const quests = useQuery(api.quests.getAllQuests);
  const deleteQuest = useMutation(api.quests.deleteQuest);
  const generateSampleQuests = useMutation(api.quests.generateSampleQuests);

  // Check if we should show creation form based on query parameter
  useEffect(() => {
    const shouldCreate = searchParams.get('create') === 'true';
    if (shouldCreate) {
      setIsCreating(true);
    }
  }, [searchParams]);

  const handleDelete = async (id: Id<"quests">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this quest? This action cannot be undone.")) {
      setIsDeleting(id);
      try {
        await deleteQuest({ id });
      } catch (error) {
        console.error("Error deleting quest:", error);
        alert("Failed to delete quest. Please try again.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleEdit = (id: Id<"quests">, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingQuest(id);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingQuest(null);
    // Clear the create query parameter if it exists
    if (searchParams.get('create') === 'true') {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('create');
      window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
    }
  };

  const handleSubmitSuccess = () => {
    setIsCreating(false);
    setEditingQuest(null);
    // Clear the create query parameter if it exists
    if (searchParams.get('create') === 'true') {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('create');
      window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
    }
  };

  const handleGenerateSampleQuests = async () => {
    if (!user) {
      alert("You must be logged in to generate sample quests.");
      return;
    }

    if (window.confirm("This will create 5 sample quests with 15 total quest tasks. Continue?")) {
      setIsGenerating(true);
      try {
        const result = await generateSampleQuests({ clerkId: user.id });
        alert(`Successfully created ${result.questsCreated} quests with ${result.tasksCreated} tasks!`);
      } catch (error) {
        console.error("Error generating sample quests:", error);
        alert("Failed to generate sample quests. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "NotStarted":
        return "secondary";
      case "InProgress":
        return "default";
      case "Completed":
        return "default";
      case "Failed":
        return "destructive";
      default:
        return "outline";
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

  if (!quests) {
    return (
      <div className="quest-list">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading quests...</p>
        </div>
      </div>
    );
  }

  if (isCreating || editingQuest) {
    return (
      <div className="quest-list">
        <QuestForm
          mode={editingQuest ? 'edit' : 'create'}
          editingQuestId={editingQuest}
          onSubmitSuccess={handleSubmitSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="quest-list">
      <div className="quest-list-header">
        <div className="header-content">
          <h1>Quests</h1>
          <p className="quests-subtitle">
            Manage and organize all your quests and adventures
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="create-quest-btn"
        >
          <span className="button-icon">+</span>
          Create New Quest
        </Button>
      </div>

      {quests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <h3>No Quests Yet</h3>
          <p>Get started by creating your first quest for your adventures.</p>
          <div className="empty-state-buttons">
            <Button
              onClick={() => setIsCreating(true)}
              className="create-quest-btn"
            >
              Create Your First Quest
            </Button>
            <Button
              onClick={handleGenerateSampleQuests}
              disabled={isGenerating}
              variant="outline"
              className="generate-sample-btn"
            >
              {isGenerating ? "Generating..." : "Generate Sample Quests"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="quests-grid">
          {quests.map((quest) => (
            <div key={quest._id} className="quest-card-link-wrapper">
              <Link
                to={`/quests/${quest._id}`}
                className="quest-card-link"
                aria-label={`View details for ${quest.name}`}
              >
                <Card className="clickable-card quest-card">
                  <CardHeader className="quest-card-header">
                    <div className="quest-title-section">
                      <CardTitle className="quest-name">{quest.name}</CardTitle>
                      <Badge variant={getStatusVariant(quest.status)} className="quest-status">
                        {getStatusText(quest.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="quest-card-content">
                    {quest.description && (
                      <p className="quest-description">
                        {quest.description.length > 100
                          ? `${quest.description.substring(0, 100)}...`
                          : quest.description}
                      </p>
                    )}
                    
                    <Separator className="my-2" />
                    
                    <div className="quest-meta">
                      <Badge variant="outline" className="quest-tasks">
                        {quest.taskIds.length} task{quest.taskIds.length !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant="outline" className="quest-date">
                        {new Date(quest.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardContent>
                  
                  <div className="quest-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEdit(quest._id, e)}
                      title="Edit this quest"
                      className="edit-button"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDelete(quest._id, e)}
                      disabled={isDeleting === quest._id}
                      title="Delete this quest"
                      className="delete-button"
                    >
                      {isDeleting === quest._id ? "🗑️ Deleting..." : "🗑️ Delete"}
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

export default QuestList; 
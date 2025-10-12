import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import './PlayerActionInterface.css';

interface PlayerActionInterfaceProps {
  interactionId: Id<"interactions">;
  playerCharacterId: Id<"playerCharacters">;
  isCurrentTurn: boolean;
}

export const PlayerActionInterface: React.FC<PlayerActionInterfaceProps> = ({
  interactionId,
  playerCharacterId,
  isCurrentTurn
}) => {
  const [actionDescription, setActionDescription] = useState('');
  const [actionType, setActionType] = useState<'Dialogue' | 'CombatAction' | 'PuzzleInput' | 'Custom'>('Dialogue');
  const [associatedItemId, setAssociatedItemId] = useState<Id<"items"> | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedActions, setSubmittedActions] = useState<any[]>([]);

  // Queries
  const playerCharacter = useQuery(api.characters.getCharacterById, { id: playerCharacterId });
  const characterActions = useQuery(
    api.playerActions.getPlayerActionsByCharacter,
    { playerCharacterId }
  );
  const characterItems = useQuery(api.items.getItems);

  // Mutations
  const submitPlayerAction = useMutation(api.interactions.submitPlayerAction);

  useEffect(() => {
    if (characterActions) {
      setSubmittedActions(characterActions);
    }
  }, [characterActions]);

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actionDescription.trim()) {
      alert('Please enter an action description');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await submitPlayerAction({
        interactionId,
        playerCharacterId,
        actionDescription: actionDescription.trim(),
        actionType,
        associatedItemId,
      });

      // Reset form
      setActionDescription('');
      setActionType('Dialogue');
      setAssociatedItemId(undefined);
      
      // Add to local state for immediate feedback
      const newAction = {
        _id: `temp-${Date.now()}`,
        actionDescription: actionDescription.trim(),
        actionType,
        submittedAt: Date.now(),
        status: 'PENDING',
      };
      setSubmittedActions(prev => [newAction, ...prev]);
      
    } catch (error) {
      console.error('Error submitting action:', error);
      alert('Failed to submit action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'Dialogue':
        return '💬';
      case 'CombatAction':
        return '⚔️';
      case 'PuzzleInput':
        return '🧩';
      case 'Custom':
        return '✨';
      default:
        return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'DM_REVIEW':
        return 'status-review';
      case 'RESOLVED':
        return 'status-resolved';
      case 'SKIPPED':
        return 'status-skipped';
      default:
        return 'status-pending';
    }
  };

  if (!playerCharacter) {
    return <div className="player-action-interface loading">Loading character data...</div>;
  }

  return (
    <div className="player-action-interface">
      <div className="interface-header">
        <h3>Action Interface</h3>
        <div className="character-info">
          <span className="character-name">{playerCharacter.name}</span>
          <span className="character-class">{playerCharacter.class}</span>
        </div>
        {isCurrentTurn && (
          <div className="turn-indicator">
            <span className="turn-badge">Your Turn!</span>
          </div>
        )}
      </div>

      {isCurrentTurn ? (
        <form onSubmit={handleSubmitAction} className="action-form">
          <div className="form-group">
            <label htmlFor="actionType">Action Type</label>
            <select
              id="actionType"
              value={actionType}
              onChange={(e) => setActionType(e.target.value as any)}
              className="form-select"
            >
              <option value="Dialogue">💬 Dialogue</option>
              <option value="CombatAction">⚔️ Combat Action</option>
              <option value="PuzzleInput">🧩 Puzzle Input</option>
              <option value="Custom">✨ Custom</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="actionDescription">Action Description</label>
            <textarea
              id="actionDescription"
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              placeholder="Describe what you want to do..."
              className="form-textarea"
              rows={4}
              required
            />
          </div>

          {characterItems && characterItems.length > 0 && (
            <div className="form-group">
              <label htmlFor="associatedItem">Use Item (Optional)</label>
              <select
                id="associatedItem"
                value={associatedItemId || ''}
                onChange={(e) => setAssociatedItemId(e.target.value ? e.target.value as Id<"items"> : undefined)}
                className="form-select"
              >
                <option value="">No item</option>
                {characterItems?.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting || !actionDescription.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Action'}
          </button>
        </form>
      ) : (
        <div className="waiting-message">
          <p>Waiting for your turn...</p>
          <div className="waiting-animation">⏳</div>
        </div>
      )}

      <div className="action-history">
        <h4>Recent Actions</h4>
        <div className="action-list">
          {submittedActions.slice(0, 5).map((action) => (
            <div key={action._id} className={`action-item ${getStatusColor(action.status)}`}>
              <div className="action-header">
                <span className="action-icon">
                  {getActionTypeIcon(action.actionType)}
                </span>
                <span className="action-type">{action.actionType}</span>
                <span className="action-time">
                  {new Date(action.submittedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="action-description">{action.actionDescription}</div>
              <div className="action-status">
                Status: <span className={`status-${action.status.toLowerCase()}`}>
                  {action.status.replace(/_/g, ' ')}
                </span>
              </div>
              {action.dmNotes && (
                <div className="dm-notes">
                  <strong>DM Notes:</strong> {action.dmNotes}
                </div>
              )}
            </div>
          ))}
          {submittedActions.length === 0 && (
            <div className="no-actions">
              <p>No actions submitted yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
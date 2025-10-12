import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import './DMActionReviewPanel.css';

interface DMActionReviewPanelProps {
  interactionId: Id<"interactions">;
}

export const DMActionReviewPanel: React.FC<DMActionReviewPanelProps> = ({
  interactionId
}) => {
  const [selectedActionId, setSelectedActionId] = useState<Id<"playerActions"> | null>(null);
  const [dmNotes, setDmNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const pendingActions = useQuery(
    api.playerActions.getPendingPlayerActions,
    { interactionId }
  );
  const selectedAction = useQuery(
    api.playerActions.getPlayerActionById,
    selectedActionId ? { id: selectedActionId } : 'skip'
  );
  const interaction = useQuery(
    api.interactions.getInteractionWithParticipants,
    { interactionId }
  );

  // Mutations
  const resolvePlayerAction = useMutation(api.interactions.resolvePlayerAction);
  const advanceTurn = useMutation(api.interactions.advanceTurn);

  const handleResolveAction = async (status: 'RESOLVED' | 'SKIPPED') => {
    if (!selectedActionId) return;

    setIsProcessing(true);
    
    try {
      await resolvePlayerAction({
        actionId: selectedActionId,
        status,
        dmNotes: dmNotes.trim() || undefined,
        interactionId,
      });

      // Reset form
      setSelectedActionId(null);
      setDmNotes('');
      
    } catch (error) {
      console.error('Error resolving action:', error);
      alert('Failed to resolve action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdvanceTurn = async () => {
    try {
      await advanceTurn({ interactionId });
    } catch (error) {
      console.error('Error advancing turn:', error);
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

  const getPlayerCharacterName = (characterId: Id<"playerCharacters">) => {
    return interaction?.participants.playerCharacters?.find(
      pc => pc?._id === characterId
    )?.name || 'Unknown Character';
  };



  if (!pendingActions) {
    return <div className="dm-action-review-panel loading">Loading actions...</div>;
  }

  return (
    <div className="dm-action-review-panel">
      <div className="panel-header">
        <h3>Action Review Panel</h3>
        <div className="action-count">
          Pending: {pendingActions.length}
        </div>
      </div>

      <div className="panel-content">
        <div className="actions-list">
          <h4>Pending Actions</h4>
          {pendingActions.length === 0 ? (
            <div className="no-pending-actions">
              <p>No pending actions to review.</p>
            </div>
          ) : (
            <div className="action-items">
              {pendingActions.map((action) => (
                <div
                  key={action._id}
                  className={`action-item ${selectedActionId === action._id ? 'selected' : ''}`}
                  onClick={() => setSelectedActionId(action._id)}
                >
                  <div className="action-header">
                    <span className="action-icon">
                      {getActionTypeIcon(action.actionType)}
                    </span>
                    <span className="action-type">{action.actionType}</span>
                    <span className="action-time">
                      {new Date(action.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="action-character">
                    {getPlayerCharacterName(action.playerCharacterId)}
                  </div>
                  <div className="action-description">
                    {action.actionDescription}
                  </div>
                  {action.associatedItemId && (
                    <div className="action-item-used">
                      Using: Item
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedAction && (
          <div className="action-detail-panel">
            <h4>Review Action</h4>
            
            <div className="action-detail">
              <div className="detail-section">
                <label>Character:</label>
                <span>{getPlayerCharacterName(selectedAction.playerCharacterId)}</span>
              </div>
              
              <div className="detail-section">
                <label>Action Type:</label>
                <span className="action-type-badge">
                  {getActionTypeIcon(selectedAction.actionType)} {selectedAction.actionType}
                </span>
              </div>
              
              <div className="detail-section">
                <label>Description:</label>
                <div className="action-description-full">
                  {selectedAction.actionDescription}
                </div>
              </div>
              
              {selectedAction.associatedItemId && (
                <div className="detail-section">
                  <label>Item Used:</label>
                  <span>Item</span>
                </div>
              )}
              
              <div className="detail-section">
                <label>Submitted:</label>
                <span>{new Date(selectedAction.submittedAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="dm-notes-section">
              <label htmlFor="dmNotes">DM Notes (Optional):</label>
              <textarea
                id="dmNotes"
                value={dmNotes}
                onChange={(e) => setDmNotes(e.target.value)}
                placeholder="Add notes about the resolution..."
                className="dm-notes-textarea"
                rows={3}
              />
            </div>

            <div className="action-buttons">
              <button
                className="btn-resolve"
                onClick={() => handleResolveAction('RESOLVED')}
                disabled={isProcessing}
              >
                ✅ Resolve
              </button>
              <button
                className="btn-skip"
                onClick={() => handleResolveAction('SKIPPED')}
                disabled={isProcessing}
              >
                ⏭️ Skip
              </button>
            </div>
          </div>
        )}

        <div className="control-section">
          <h4>Turn Management</h4>
          <button
            className="btn-advance-turn"
            onClick={handleAdvanceTurn}
            disabled={pendingActions.length > 0}
          >
            Advance Turn
          </button>
          {pendingActions.length > 0 && (
            <p className="warning-text">
              ⚠️ Resolve all pending actions before advancing turn
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 
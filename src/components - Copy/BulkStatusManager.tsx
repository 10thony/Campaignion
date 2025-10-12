import React, { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useLiveInteraction } from '../contexts/LiveInteractionContext';
import { useErrorRecovery } from '../utils/errorRecovery';
import './BulkStatusManager.css';

interface BulkStatusManagerProps {
  onComplete?: (results: BulkOperationResult[]) => void;
  onCancel?: () => void;
  isOpen: boolean;
}

interface InteractionItem {
  id: Id<"interactions">;
  name: string;
  status: string;
  campaignName?: string;
  participantCount: number;
  lastUpdated: number;
}

interface BulkOperationResult {
  interactionId: Id<"interactions">;
  success: boolean;
  error?: string;
  newStatus?: string;
}

interface BulkOperation {
  type: 'status-update' | 'activate' | 'deactivate' | 'complete' | 'cancel';
  targetStatus?: string;
  interactions: InteractionItem[];
}

const BulkStatusManager: React.FC<BulkStatusManagerProps> = ({
  onComplete,
  onCancel,
  isOpen
}) => {
  const [selectedInteractions, setSelectedInteractions] = useState<Set<Id<"interactions">>>(new Set());
  const [operationType, setOperationType] = useState<BulkOperation['type']>('status-update');
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<BulkOperationResult[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    campaign: 'all',
    search: ''
  });

  const { optimisticUpdate, rollbackUpdate } = useLiveInteraction();
  const { handleError, retryWithBackoff } = useErrorRecovery();

  const updateInteractionOptimistic = useMutation(api.interactions.updateInteractionOptimistic);

  // Fetch interactions
  const interactions = useQuery(api.interactions.subscribeToActiveInteractions);
  const campaigns = useQuery(api.campaigns.getAllCampaigns, { clerkId: undefined });

  // Process interactions data
  const processedInteractions = useMemo(() => {
    if (!interactions) return [];

    return interactions.map(interaction => ({
      id: interaction._id,
      name: interaction.name,
      status: interaction.status,
      campaignName: campaigns?.find(c => c._id === interaction.campaignId)?.name,
      participantCount: (interaction.participantPlayerCharacterIds?.length || 0) +
                       (interaction.participantNpcIds?.length || 0) +
                       (interaction.participantMonsterIds?.length || 0),
      lastUpdated: interaction.updatedAt || interaction._creationTime
    }));
  }, [interactions, campaigns]);

  // Filter interactions
  const filteredInteractions = useMemo(() => {
    return processedInteractions.filter(interaction => {
      if (filters.status !== 'all' && interaction.status !== filters.status) return false;
      if (filters.campaign !== 'all' && interaction.campaignName !== filters.campaign) return false;
      if (filters.search && !interaction.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [processedInteractions, filters]);

  // Handle selection
  const toggleSelection = useCallback((interactionId: Id<"interactions">) => {
    setSelectedInteractions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(interactionId)) {
        newSet.delete(interactionId);
      } else {
        newSet.add(interactionId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedInteractions(new Set(filteredInteractions.map(i => i.id)));
  }, [filteredInteractions]);

  const clearSelection = useCallback(() => {
    setSelectedInteractions(new Set());
  }, []);

  const selectByStatus = useCallback((status: string) => {
    const statusInteractions = filteredInteractions.filter(i => i.status === status);
    setSelectedInteractions(new Set(statusInteractions.map(i => i.id)));
  }, [filteredInteractions]);

  // Handle bulk operation
  const executeBulkOperation = useCallback(async () => {
    if (selectedInteractions.size === 0) return;

    const selectedItems = filteredInteractions.filter(i => selectedInteractions.has(i.id));
    setIsProcessing(true);
    setProgress({ current: 0, total: selectedItems.length });
    setResults([]);

    const operationResults: BulkOperationResult[] = [];

    for (let i = 0; i < selectedItems.length; i++) {
      const interaction = selectedItems[i];
      setProgress({ current: i + 1, total: selectedItems.length });

      try {
        let newStatus = targetStatus;

        // Determine target status based on operation type
        switch (operationType) {
          case 'activate':
            newStatus = 'PENDING_INITIATIVE';
            break;
          case 'deactivate':
            newStatus = 'CANCELLED';
            break;
          case 'complete':
            newStatus = 'COMPLETED';
            break;
          case 'cancel':
            newStatus = 'CANCELLED';
            break;
          case 'status-update':
            newStatus = targetStatus;
            break;
        }

        if (!newStatus) {
          throw new Error('No target status specified');
        }

        // Create optimistic update
        optimisticUpdate(interaction.id, {
          status: newStatus,
          updatedAt: Date.now()
        });

        // Perform the actual update
        await retryWithBackoff(async () => {
          await updateInteractionOptimistic({
            id: interaction.id,
            status: newStatus as any
          });
        });

        operationResults.push({
          interactionId: interaction.id,
          success: true,
          newStatus
        });

      } catch (error) {
        // Rollback optimistic update
        rollbackUpdate(interaction.id);
        
        // Handle error
        await handleError(error, 'BulkStatusManager');
        
        operationResults.push({
          interactionId: interaction.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setResults(operationResults);
    setIsProcessing(false);
    onComplete?.(operationResults);
  }, [
    selectedInteractions,
    filteredInteractions,
    operationType,
    targetStatus,
    optimisticUpdate,
    rollbackUpdate,
    handleError,
    retryWithBackoff,
    updateInteractionOptimistic,
    onComplete
  ]);

  // Status options
  const statusOptions = [
    { value: 'PENDING_INITIATIVE', label: 'Pending Initiative' },
    { value: 'INITIATIVE_ROLLED', label: 'Initiative Rolled' },
    { value: 'WAITING_FOR_PLAYER_TURN', label: 'Waiting for Player Turn' },
    { value: 'PROCESSING_PLAYER_ACTION', label: 'Processing Player Action' },
    { value: 'DM_REVIEW', label: 'DM Review' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const campaignOptions = useMemo(() => {
    const campaigns = processedInteractions
      .map(i => i.campaignName)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    
    return campaigns.map(campaign => ({ value: campaign, label: campaign }));
  }, [processedInteractions]);

  if (!isOpen) return null;

  const selectedCount = selectedInteractions.size;
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  return (
    <div className="bulk-status-manager">
      <div className="manager-overlay" onClick={onCancel} />
      <div className="manager-container">
        <div className="manager-header">
          <h2>Bulk Status Manager</h2>
          <button className="manager-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="manager-content">
          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Statuses</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Campaign:</label>
              <select
                value={filters.campaign}
                onChange={(e) => setFilters(prev => ({ ...prev, campaign: e.target.value }))}
              >
                <option value="all">All Campaigns</option>
                {campaignOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Search:</label>
              <input
                type="text"
                placeholder="Search interactions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>

          {/* Selection Controls */}
          <div className="selection-controls">
            <div className="selection-info">
              {selectedCount} of {filteredInteractions.length} selected
            </div>
            <div className="selection-actions">
              <button onClick={selectAll} disabled={filteredInteractions.length === 0}>
                Select All
              </button>
              <button onClick={clearSelection} disabled={selectedCount === 0}>
                Clear Selection
              </button>
              <div className="quick-select">
                <button onClick={() => selectByStatus('PENDING_INITIATIVE')}>
                  Select Pending
                </button>
                <button onClick={() => selectByStatus('WAITING_FOR_PLAYER_TURN')}>
                  Select Active
                </button>
              </div>
            </div>
          </div>

          {/* Operation Configuration */}
          <div className="operation-config">
            <div className="operation-type">
              <label>Operation Type:</label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as BulkOperation['type'])}
              >
                <option value="status-update">Update Status</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="complete">Complete</option>
                <option value="cancel">Cancel</option>
              </select>
            </div>

            {operationType === 'status-update' && (
              <div className="target-status">
                <label>Target Status:</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                >
                  <option value="">Select Status</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Interactions List */}
          <div className="interactions-list">
            <div className="list-header">
              <div className="header-checkbox">
                <input
                  type="checkbox"
                  checked={selectedCount === filteredInteractions.length && filteredInteractions.length > 0}
                  onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                />
              </div>
              <div className="header-name">Name</div>
              <div className="header-status">Status</div>
              <div className="header-campaign">Campaign</div>
              <div className="header-participants">Participants</div>
              <div className="header-updated">Last Updated</div>
            </div>

            <div className="list-body">
              {filteredInteractions.map(interaction => (
                <div
                  key={interaction.id}
                  className={`list-item ${selectedInteractions.has(interaction.id) ? 'selected' : ''}`}
                >
                  <div className="item-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedInteractions.has(interaction.id)}
                      onChange={() => toggleSelection(interaction.id)}
                    />
                  </div>
                  <div className="item-name">{interaction.name}</div>
                  <div className="item-status">
                    <span className={`status-badge status-${interaction.status.toLowerCase()}`}>
                      {interaction.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="item-campaign">{interaction.campaignName || '—'}</div>
                  <div className="item-participants">{interaction.participantCount}</div>
                  <div className="item-updated">
                    {new Date(interaction.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress and Results */}
          {isProcessing && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <div className="progress-text">
                Processing {progress.current} of {progress.total} interactions...
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="results-section">
              <h3>Operation Results</h3>
              <div className="results-summary">
                <div className="result-success">✓ {successCount} successful</div>
                <div className="result-error">✗ {errorCount} failed</div>
              </div>
              {errorCount > 0 && (
                <div className="error-details">
                  {results.filter(r => !r.success).map((result, index) => (
                    <div key={index} className="error-item">
                      <strong>{result.interactionId}:</strong> {result.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="manager-actions">
          <button
            className="action-button secondary-button"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className="action-button primary-button"
            onClick={executeBulkOperation}
            disabled={selectedCount === 0 || isProcessing || (operationType === 'status-update' && !targetStatus)}
          >
            {isProcessing ? 'Processing...' : `Execute (${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkStatusManager; 
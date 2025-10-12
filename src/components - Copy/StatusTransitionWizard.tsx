import React, { useState, useEffect, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useLiveInteraction } from '../contexts/LiveInteractionContext';
import { useErrorRecovery } from '../utils/errorRecovery';
import './StatusTransitionWizard.css';

interface StatusTransitionWizardProps {
  interactionId: Id<"interactions">;
  currentStatus: string;
  onComplete?: (newStatus: string) => void;
  onCancel?: () => void;
  isOpen: boolean;
}

interface TransitionStep {
  id: string;
  title: string;
  description: string;
  validation?: (data: any) => { isValid: boolean; error?: string };
  required?: boolean;
  component: React.ComponentType<{
    data: any;
    onChange: (data: any) => void;
    isValid: boolean;
  }>;
}

interface TransitionData {
  newStatus: string;
  reason?: string;
  participants?: any[];
  initiativeOrder?: any[];
  rewards?: any[];
  notes?: string;
}

const StatusTransitionWizard: React.FC<StatusTransitionWizardProps> = ({
  interactionId,
  currentStatus,
  onComplete,
  onCancel,
  isOpen
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [transitionData, setTransitionData] = useState<TransitionData>({
    newStatus: currentStatus
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<TransitionData[]>([]);

  const { optimisticUpdate, rollbackUpdate } = useLiveInteraction();
  const { handleError, retryWithBackoff } = useErrorRecovery();
  
  const updateInteractionOptimistic = useMutation(api.interactions.updateInteractionOptimistic);

  // Define transition steps based on current status
  const getTransitionSteps = useCallback((fromStatus: string): TransitionStep[] => {
    const baseSteps: TransitionStep[] = [
      {
        id: 'status-selection',
        title: 'Select New Status',
        description: 'Choose the new status for this interaction',
        required: true,
        validation: (data) => {
          if (!data.newStatus || data.newStatus === fromStatus) {
            return { isValid: false, error: 'Please select a different status' };
          }
          return { isValid: true };
        },
        component: StatusSelectionStep
      }
    ];

    // Add specific steps based on target status
    if (transitionData.newStatus === 'INITIATIVE_ROLLED') {
      baseSteps.push({
        id: 'initiative-setup',
        title: 'Initiative Setup',
        description: 'Configure initiative order for participants',
        required: true,
        validation: (data) => {
          if (!data.initiativeOrder || data.initiativeOrder.length === 0) {
            return { isValid: false, error: 'Initiative order is required' };
          }
          return { isValid: true };
        },
        component: InitiativeSetupStep
      });
    }

    if (transitionData.newStatus === 'COMPLETED') {
      baseSteps.push(
        {
          id: 'rewards',
          title: 'Rewards & XP',
          description: 'Configure rewards and experience points for participants',
          required: false,
          component: RewardsStep
        },
        {
          id: 'completion-notes',
          title: 'Completion Notes',
          description: 'Add notes about the interaction completion',
          required: false,
          component: CompletionNotesStep
        }
      );
    }

    if (transitionData.newStatus === 'CANCELLED') {
      baseSteps.push({
        id: 'cancellation-reason',
        title: 'Cancellation Reason',
        description: 'Provide a reason for cancelling the interaction',
        required: true,
        validation: (data) => {
          if (!data.reason || data.reason.trim().length < 10) {
            return { isValid: false, error: 'Please provide a reason (minimum 10 characters)' };
          }
          return { isValid: true };
        },
        component: CancellationReasonStep
      });
    }

    return baseSteps;
  }, [transitionData.newStatus]);

  const steps = getTransitionSteps(currentStatus);
  const currentStepData = steps[currentStep];

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    if (!currentStepData) return true;

    const validation = currentStepData.validation;
    if (!validation) return true;

    const result = validation(transitionData);
    if (!result.isValid) {
      setValidationErrors(prev => ({
        ...prev,
        [currentStepData.id]: result.error || 'Validation failed'
      }));
      return false;
    }

    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[currentStepData.id];
      return newErrors;
    });
    return true;
  }, [currentStepData, transitionData]);

  // Handle step navigation
  const goToNextStep = useCallback(() => {
    if (!validateCurrentStep()) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, validateCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  // Handle data changes
  const handleDataChange = useCallback((newData: Partial<TransitionData>) => {
    setTransitionData(prev => {
      const updated = { ...prev, ...newData };
      setHistory(prevHistory => [...prevHistory, prev]);
      return updated;
    });
  }, []);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const previousData = history[history.length - 1];
      setTransitionData(previousData);
      setHistory(prev => prev.slice(0, -1));
    }
  }, [history]);

  // Handle completion
  const handleComplete = useCallback(async () => {
    if (!validateCurrentStep()) return;

    setIsProcessing(true);
    
    try {
      // Create optimistic update
      optimisticUpdate(interactionId, {
        status: transitionData.newStatus,
        updatedAt: Date.now()
      });

      // Perform the actual update
      await retryWithBackoff(async () => {
        await updateInteractionOptimistic({
          id: interactionId,
          status: transitionData.newStatus as any
        });
      });

      onComplete?.(transitionData.newStatus);
    } catch (error) {
      // Rollback optimistic update
      rollbackUpdate(interactionId);
      
      // Handle error
      await handleError(error, 'StatusTransitionWizard');
      
      // Show error to user
      setValidationErrors(prev => ({
        ...prev,
        general: 'Failed to update status. Please try again.'
      }));
    } finally {
      setIsProcessing(false);
    }
  }, [
    validateCurrentStep,
    interactionId,
    transitionData,
    optimisticUpdate,
    rollbackUpdate,
    currentStatus,
    handleError,
    retryWithBackoff,
    updateInteractionOptimistic,
    onComplete
  ]);

  // Reset wizard when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setTransitionData({ newStatus: currentStatus });
      setValidationErrors({});
      setHistory([]);
    }
  }, [isOpen, currentStatus]);

  if (!isOpen) return null;

  const hasErrors = Object.keys(validationErrors).length > 0;
  const canGoNext = currentStepData?.required !== false || validateCurrentStep();
  const canUndo = history.length > 0;

  return (
    <div className="status-transition-wizard">
      <div className="wizard-overlay" onClick={onCancel} />
      <div className="wizard-container">
        <div className="wizard-header">
          <h2>Status Transition Wizard</h2>
          <button className="wizard-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="wizard-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="progress-steps">
            {steps.map((step, index) => (
              <button
                key={step.id}
                className={`progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => goToStep(index)}
                disabled={index > currentStep}
              >
                <span className="step-number">{index + 1}</span>
                <span className="step-title">{step.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="wizard-content">
          {currentStepData && (
            <div className="step-content">
              <div className="step-header">
                <h3>{currentStepData.title}</h3>
                <p>{currentStepData.description}</p>
              </div>

              <div className="step-body">
                <currentStepData.component
                  data={transitionData}
                  onChange={handleDataChange}
                  isValid={!validationErrors[currentStepData.id]}
                />
              </div>

              {validationErrors[currentStepData.id] && (
                <div className="validation-error">
                  {validationErrors[currentStepData.id]}
                </div>
              )}
            </div>
          )}

          {validationErrors.general && (
            <div className="general-error">
              {validationErrors.general}
            </div>
          )}
        </div>

        <div className="wizard-actions">
          <div className="action-left">
            {canUndo && (
              <button 
                className="wizard-button undo-button"
                onClick={handleUndo}
                disabled={isProcessing}
              >
                ↩ Undo
              </button>
            )}
          </div>

          <div className="action-right">
            {currentStep > 0 && (
              <button 
                className="wizard-button secondary-button"
                onClick={goToPreviousStep}
                disabled={isProcessing}
              >
                ← Previous
              </button>
            )}
            
            <button 
              className="wizard-button primary-button"
              onClick={goToNextStep}
              disabled={!canGoNext || isProcessing || hasErrors}
            >
              {isProcessing ? 'Processing...' : 
               currentStep === steps.length - 1 ? 'Complete' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const StatusSelectionStep: React.FC<{
  data: TransitionData;
  onChange: (data: Partial<TransitionData>) => void;
  isValid: boolean;
}> = ({ data, onChange }) => {
  const statusOptions = [
    { value: 'PENDING_INITIATIVE', label: 'Pending Initiative', description: 'Waiting for initiative rolls' },
    { value: 'INITIATIVE_ROLLED', label: 'Initiative Rolled', description: 'Initiative order established' },
    { value: 'WAITING_FOR_PLAYER_TURN', label: 'Waiting for Player Turn', description: 'Waiting for player actions' },
    { value: 'PROCESSING_PLAYER_ACTION', label: 'Processing Player Action', description: 'Processing submitted actions' },
    { value: 'DM_REVIEW', label: 'DM Review', description: 'DM reviewing actions' },
    { value: 'COMPLETED', label: 'Completed', description: 'Interaction finished' },
    { value: 'CANCELLED', label: 'Cancelled', description: 'Interaction cancelled' }
  ];

  return (
    <div className="status-selection">
      <div className="status-options">
        {statusOptions.map(option => (
          <label key={option.value} className="status-option">
            <input
              type="radio"
              name="newStatus"
              value={option.value}
              checked={data.newStatus === option.value}
              onChange={(e) => onChange({ newStatus: e.target.value })}
            />
            <div className="option-content">
              <div className="option-label">{option.label}</div>
              <div className="option-description">{option.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

const InitiativeSetupStep: React.FC<{
  data: TransitionData;
  onChange: (data: Partial<TransitionData>) => void;
  isValid: boolean;
}> = ({ onChange }) => {
  // This would be a more complex component for setting up initiative
  return (
    <div className="initiative-setup">
      <p>Initiative setup component would go here</p>
      <button onClick={() => onChange({ initiativeOrder: [] })}>
        Auto-generate Initiative
      </button>
    </div>
  );
};

const RewardsStep: React.FC<{
  data: TransitionData;
  onChange: (data: Partial<TransitionData>) => void;
  isValid: boolean;
}> = ({ onChange }) => {
  return (
    <div className="rewards-step">
      <p>Rewards configuration would go here</p>
      <button onClick={() => onChange({ rewards: [] })}>
        Configure Rewards
      </button>
    </div>
  );
};

const CompletionNotesStep: React.FC<{
  data: TransitionData;
  onChange: (data: Partial<TransitionData>) => void;
  isValid: boolean;
}> = ({ data, onChange }) => {
  return (
    <div className="completion-notes">
      <label>
        Completion Notes:
        <textarea
          value={data.notes || ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Add notes about the interaction completion..."
          rows={4}
        />
      </label>
    </div>
  );
};

const CancellationReasonStep: React.FC<{
  data: TransitionData;
  onChange: (data: Partial<TransitionData>) => void;
  isValid: boolean;
}> = ({ data, onChange, isValid }) => {
  return (
    <div className="cancellation-reason">
      <label>
        Cancellation Reason:
        <textarea
          value={data.reason || ''}
          onChange={(e) => onChange({ reason: e.target.value })}
          placeholder="Please provide a reason for cancelling this interaction..."
          rows={4}
          className={!isValid ? 'error' : ''}
        />
      </label>
    </div>
  );
};

export default StatusTransitionWizard; 
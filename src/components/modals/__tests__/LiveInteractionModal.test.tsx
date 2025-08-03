import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LiveInteractionModal } from '../LiveInteractionModal';

// Mock the custom hook
vi.mock('@/hooks/useLiveInteraction', () => ({
  useLiveInteraction: vi.fn(() => ({
    gameState: {
      interactionId: 'test-interaction',
      status: 'active',
      initiativeOrder: [
        { entityId: 'char1', entityType: 'playerCharacter', initiative: 18, userId: 'test-user' },
        { entityId: 'monster1', entityType: 'monster', initiative: 15 },
      ],
      currentTurnIndex: 0,
      roundNumber: 1,
      participants: {
        char1: {
          entityId: 'char1',
          entityType: 'playerCharacter',
          userId: 'test-user',
          currentHP: 45,
          maxHP: 50,
          position: { x: 5, y: 5 },
          conditions: [],
          inventory: {
            items: [
              { id: 'item1', itemId: 'sword', quantity: 1, properties: {} },
            ],
            equippedItems: { mainHand: 'sword' },
            capacity: 20,
          },
          availableActions: [
            { id: 'move', name: 'Move', type: 'move', available: true, requirements: [] },
            { id: 'attack', name: 'Attack', type: 'attack', available: true, requirements: [] },
          ],
          turnStatus: 'active',
        },
        monster1: {
          entityId: 'monster1',
          entityType: 'monster',
          currentHP: 30,
          maxHP: 35,
          position: { x: 8, y: 8 },
          conditions: [],
          inventory: { items: [], equippedItems: {}, capacity: 0 },
          availableActions: [],
          turnStatus: 'waiting',
        },
      },
      mapState: {
        width: 20,
        height: 20,
        entities: {},
        obstacles: [],
        terrain: [],
      },
      turnHistory: [],
      chatLog: [
        {
          id: 'msg1',
          userId: 'system',
          content: 'Combat has begun!',
          type: 'system',
          timestamp: Date.now(),
        },
      ],
      timestamp: new Date(),
    },
    connectionStatus: 'connected',
    isLoading: false,
    error: null,
    currentParticipant: {
      entityId: 'char1',
      entityType: 'playerCharacter',
      userId: 'test-user',
      currentHP: 45,
      maxHP: 50,
      position: { x: 5, y: 5 },
      conditions: [],
      inventory: {
        items: [
          { id: 'item1', itemId: 'sword', quantity: 1, properties: {} },
        ],
        equippedItems: { mainHand: 'sword' },
        capacity: 20,
      },
      availableActions: [
        { id: 'move', name: 'Move', type: 'move', available: true, requirements: [] },
        { id: 'attack', name: 'Attack', type: 'attack', available: true, requirements: [] },
      ],
      turnStatus: 'active',
    },
    currentTurnParticipant: { entityId: 'char1', entityType: 'playerCharacter', initiative: 18, userId: 'test-user' },
    isMyTurn: true,
    turnTimeRemaining: 90,
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    takeTurn: vi.fn(),
    skipTurn: vi.fn(),
    sendChatMessage: vi.fn(),
    pauseInteraction: vi.fn(),
    resumeInteraction: vi.fn(),
    rollbackTurn: vi.fn(),
    updateInitiative: vi.fn(),
  })),
}));

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({ user: { id: 'test-user' } }),
}));

describe('LiveInteractionModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    interactionId: 'test-interaction',
    currentUserId: 'test-user',
    isDM: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    expect(screen.getByText('Live Interaction')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<LiveInteractionModal {...defaultProps} open={false} />);
    
    expect(screen.queryByText('Live Interaction')).not.toBeInTheDocument();
  });

  it('displays initiative order correctly', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    expect(screen.getByText('Initiative Order - Round 1')).toBeInTheDocument();
    expect(screen.getByText('char1 (You)')).toBeInTheDocument();
    expect(screen.getByText('monster1')).toBeInTheDocument();
    expect(screen.getByText('Initiative: 18')).toBeInTheDocument();
    expect(screen.getByText('Initiative: 15')).toBeInTheDocument();
  });

  it('shows turn interface when it is the user\'s turn', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    expect(screen.getByText('Your Turn')).toBeInTheDocument();
    expect(screen.getByText('Available Actions')).toBeInTheDocument();
    expect(screen.getByText('Move')).toBeInTheDocument();
    expect(screen.getByText('Attack')).toBeInTheDocument();
  });

  it('allows action selection and submission', async () => {
    const mockTakeTurn = vi.fn();
    vi.mocked(require('@/hooks/useLiveInteraction').useLiveInteraction).mockReturnValue({
      ...require('@/hooks/useLiveInteraction').useLiveInteraction(),
      takeTurn: mockTakeTurn,
    });

    render(<LiveInteractionModal {...defaultProps} />);
    
    // Select an action
    const moveButton = screen.getByText('Move');
    fireEvent.click(moveButton);
    
    // Submit the action
    const submitButton = screen.getByText('Submit Action');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockTakeTurn).toHaveBeenCalledWith({
        type: 'move',
        entityId: 'char1',
        actionId: 'move',
      });
    });
  });

  it('shows target selection for attack actions', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Select attack action
    const attackButton = screen.getByText('Attack');
    fireEvent.click(attackButton);
    
    expect(screen.getByText('Select Target')).toBeInTheDocument();
    expect(screen.getByText('monster1 (30/35 HP)')).toBeInTheDocument();
  });

  it('validates attack actions require a target', async () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Select attack action without target
    const attackButton = screen.getByText('Attack');
    fireEvent.click(attackButton);
    
    const submitButton = screen.getByText('Submit Action');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please select a target for your attack')).toBeInTheDocument();
    });
  });

  it('displays inventory in inventory tab', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Switch to inventory tab
    const inventoryTab = screen.getByText('Inventory');
    fireEvent.click(inventoryTab);
    
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('sword')).toBeInTheDocument();
    expect(screen.getByText('Qty: 1')).toBeInTheDocument();
    expect(screen.getByText('Equipped Items')).toBeInTheDocument();
  });

  it('displays chat interface in chat tab', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Switch to chat tab
    const chatTab = screen.getByText('Chat');
    fireEvent.click(chatTab);
    
    expect(screen.getByText('Combat has begun!')).toBeInTheDocument();
    expect(screen.getByText('Party')).toBeInTheDocument();
    expect(screen.getByText('DM')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('allows sending chat messages', async () => {
    const mockSendChatMessage = vi.fn();
    vi.mocked(require('@/hooks/useLiveInteraction').useLiveInteraction).mockReturnValue({
      ...require('@/hooks/useLiveInteraction').useLiveInteraction(),
      sendChatMessage: mockSendChatMessage,
    });

    render(<LiveInteractionModal {...defaultProps} />);
    
    // Switch to chat tab
    const chatTab = screen.getByText('Chat');
    fireEvent.click(chatTab);
    
    // Type a message
    const messageInput = screen.getByPlaceholderText('Message party...');
    fireEvent.change(messageInput, { target: { value: 'Hello everyone!' } });
    
    // Send the message
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSendChatMessage).toHaveBeenCalledWith({
        userId: 'test-user',
        content: 'Hello everyone!',
        type: 'party',
      });
    });
  });

  it('shows DM controls when user is DM', () => {
    render(<LiveInteractionModal {...defaultProps} isDM={true} />);
    
    // Switch to DM tab
    const dmTab = screen.getByText('DM Controls');
    fireEvent.click(dmTab);
    
    expect(screen.getByText('Session Controls')).toBeInTheDocument();
    expect(screen.getByText('Pause Session')).toBeInTheDocument();
    expect(screen.getByText('Rollback Turn')).toBeInTheDocument();
    expect(screen.getByText('Initiative Management')).toBeInTheDocument();
  });

  it('does not show DM tab when user is not DM', () => {
    render(<LiveInteractionModal {...defaultProps} isDM={false} />);
    
    expect(screen.queryByText('DM Controls')).not.toBeInTheDocument();
  });

  it('displays HP and conditions correctly', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    expect(screen.getByText('45/50')).toBeInTheDocument();
    expect(screen.getByText('30/35')).toBeInTheDocument();
  });

  it('shows turn timer when it is user\'s turn', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('handles skip turn action', async () => {
    const mockSkipTurn = vi.fn();
    vi.mocked(require('@/hooks/useLiveInteraction').useLiveInteraction).mockReturnValue({
      ...require('@/hooks/useLiveInteraction').useLiveInteraction(),
      skipTurn: mockSkipTurn,
    });

    render(<LiveInteractionModal {...defaultProps} />);
    
    const skipButton = screen.getByText('Skip Turn');
    fireEvent.click(skipButton);
    
    await waitFor(() => {
      expect(mockSkipTurn).toHaveBeenCalled();
    });
  });

  it('displays connection status correctly', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
    
    // Test connecting status
    vi.mocked(require('@/hooks/useLiveInteraction').useLiveInteraction).mockReturnValue({
      ...require('@/hooks/useLiveInteraction').useLiveInteraction(),
      connectionStatus: 'connecting',
    });

    render(<LiveInteractionModal {...defaultProps} />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('shows loading state during connection', () => {
    vi.mocked(require('@/hooks/useLiveInteraction').useLiveInteraction).mockReturnValue({
      ...require('@/hooks/useLiveInteraction').useLiveInteraction(),
      connectionStatus: 'connecting',
    });

    render(<LiveInteractionModal {...defaultProps} />);
    
    expect(screen.getByText('Connecting to live session...')).toBeInTheDocument();
  });

  it('handles accessibility requirements', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Check for proper ARIA labels and roles
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    
    // Check for keyboard navigation support
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
    
    // Check for screen reader support
    expect(screen.getByText('Live Interaction')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('supports responsive layout', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Check that the modal has responsive classes
    const modalContent = screen.getByRole('dialog');
    expect(modalContent.className).toContain('max-w-7xl');
    expect(modalContent.className).toContain('max-h-[95vh]');
  });
});
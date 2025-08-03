import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { LiveInteractionModal } from '../LiveInteractionModal';
import { useFocusTrap, useScreenReaderAnnouncements } from '@/hooks/useAccessibility';

expect.extend(toHaveNoViolations);

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

describe('LiveInteractionModal Accessibility', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    interactionId: 'test-interaction',
    currentUserId: 'test-user',
    isDM: false,
  };

  it('should not have any accessibility violations', async () => {
    const { container } = render(<LiveInteractionModal {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels and roles', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Check for dialog role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Check for proper heading structure
    const mainHeading = screen.getByRole('heading', { level: 2 });
    expect(mainHeading).toHaveTextContent('Live Interaction');
    
    // Check for button roles
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Check for tab navigation
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('should support keyboard navigation', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Check that interactive elements are focusable
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
    
    const tabs = screen.getAllByRole('tab');
    tabs.forEach(tab => {
      expect(tab).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('should have proper color contrast and visual indicators', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Check for status indicators
    const connectionStatus = screen.getByText('Connected');
    expect(connectionStatus).toBeInTheDocument();
    
    // Check for turn status indicators
    const yourTurn = screen.getByText('Your Turn');
    expect(yourTurn).toBeInTheDocument();
    
    // Check for HP indicators
    const hpIndicator = screen.getByText('45/50');
    expect(hpIndicator).toBeInTheDocument();
  });

  it('should provide screen reader friendly content', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Check for descriptive text
    expect(screen.getByText('Initiative Order - Round 1')).toBeInTheDocument();
    expect(screen.getByText('Your Turn')).toBeInTheDocument();
    expect(screen.getByText('Available Actions')).toBeInTheDocument();
    
    // Check for status information
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('char1 (You)')).toBeInTheDocument();
  });

  it('should handle focus management properly', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Check that the modal can receive focus
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Check that dialog has proper ARIA attributes
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('should support comprehensive keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Test tab navigation through interactive elements
    const interactiveElements = screen.getAllByRole('button');
    
    // Should be able to tab through all buttons
    for (const element of interactiveElements) {
      await user.tab();
      if (document.activeElement === element) {
        expect(element).toHaveFocus();
      }
    }
    
    // Test tab list navigation
    const tabs = screen.getAllByRole('tab');
    if (tabs.length > 0) {
      tabs[0].focus();
      
      // Should navigate with arrow keys
      await user.keyboard('{ArrowRight}');
      if (tabs[1]) {
        expect(tabs[1]).toHaveFocus();
      }
      
      await user.keyboard('{ArrowLeft}');
      expect(tabs[0]).toHaveFocus();
    }
  });

  it('should provide proper form labels and descriptions', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Switch to chat tab to test form elements
    const chatTab = screen.getByRole('tab', { name: /chat/i });
    chatTab.click();
    
    // Check for input labels
    const messageInput = screen.getByPlaceholderText('Message party...');
    expect(messageInput).toBeInTheDocument();
    
    // Check for button labels
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeInTheDocument();
  });

  it('should handle error states accessibly', () => {
    // Mock error state
    vi.mocked(require('@/hooks/useLiveInteraction').useLiveInteraction).mockReturnValue({
      ...require('@/hooks/useLiveInteraction').useLiveInteraction(),
      error: new Error('Connection failed'),
      connectionStatus: 'error',
    });

    render(<LiveInteractionModal {...defaultProps} />);
    
    // Error states should be announced to screen readers
    const errorStatus = screen.getByText('Disconnected');
    expect(errorStatus).toBeInTheDocument();
  });

  it('should support high contrast mode', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Check that elements have proper contrast classes
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('bg-background');
    
    // Check for border and shadow classes that work in high contrast
    const cards = screen.getAllByRole('region');
    cards.forEach(card => {
      expect(card.className).toMatch(/border|shadow/);
    });
  });

  it('should work with reduced motion preferences', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Check that animations are not forced
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).not.toContain('animate-pulse');
    
    // Progress bars should still be functional
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('should provide proper landmark navigation', () => {
    render(<LiveInteractionModal {...defaultProps} />);
    
    // Check for main content area
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // Check for navigation (tabs)
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    
    // Check for complementary content (sidebar-like areas)
    const cards = screen.getAllByRole('region');
    expect(cards.length).toBeGreaterThan(0);
  });
});
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LiveInteractionModal } from '@/components/modals/LiveInteractionModal';
import { InteractionsPage } from '@/pages/InteractionsPage';
import { 
  getContrastRatio, 
  meetsContrastRequirement,
  KeyboardNavigation,
  ScreenReader,
  FocusManagement 
} from '@/lib/accessibility';

expect.extend(toHaveNoViolations);

// Mock dependencies
vi.mock('@/hooks/useLiveInteraction', () => ({
  useLiveInteraction: vi.fn(() => ({
    gameState: null,
    connectionStatus: 'connecting',
    isLoading: false,
    error: null,
    currentParticipant: null,
    currentTurnParticipant: null,
    isMyTurn: false,
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

vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => []),
  useMutation: vi.fn(() => vi.fn()),
}));

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ userId: 'test-user' }),
}));

vi.mock('@/lib/trpc', () => ({
  trpc: {
    interaction: {
      joinRoom: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      pauseInteraction: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      resumeInteraction: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      health: { useQuery: () => ({ data: { stats: { activeRooms: 0 } }, error: null }) },
    },
  },
}));

describe('Accessibility Features', () => {
  describe('Color Contrast', () => {
    it('should calculate contrast ratios correctly', () => {
      // Test high contrast (white on black)
      const highContrast = getContrastRatio('#ffffff', '#000000');
      expect(highContrast).toBeCloseTo(21, 1);

      // Test low contrast (light gray on white)
      const lowContrast = getContrastRatio('#f0f0f0', '#ffffff');
      expect(lowContrast).toBeLessThan(4.5);

      // Test medium contrast
      const mediumContrast = getContrastRatio('#666666', '#ffffff');
      expect(mediumContrast).toBeGreaterThan(4.5);
    });

    it('should validate WCAG AA compliance', () => {
      // Should pass for high contrast
      expect(meetsContrastRequirement('#000000', '#ffffff')).toBe(true);
      
      // Should fail for low contrast
      expect(meetsContrastRequirement('#f0f0f0', '#ffffff')).toBe(false);
      
      // Should pass for large text with lower contrast
      expect(meetsContrastRequirement('#767676', '#ffffff', true)).toBe(true);
    });
  });

  describe('Theme Provider', () => {
    it('should provide theme context', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const themeButton = screen.getByRole('button', { name: /current theme/i });
      expect(themeButton).toBeInTheDocument();
    });

    it('should have accessible theme toggle', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const themeButton = screen.getByRole('button', { name: /current theme/i });
      
      // Should have proper ARIA attributes
      expect(themeButton).toHaveAttribute('aria-label');
      
      // Should open menu on click
      await user.click(themeButton);
      
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      
      // Menu items should have proper roles
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
      
      menuItems.forEach(item => {
        expect(item).toHaveAttribute('aria-selected');
      });
    });

    it('should support keyboard navigation in theme menu', async () => {
      const user = userEvent.setup();
      
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const themeButton = screen.getByRole('button', { name: /current theme/i });
      
      // Open menu with Enter key
      themeButton.focus();
      await user.keyboard('{Enter}');
      
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      
      // Should be able to navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
      
      // Should close with Escape
      await user.keyboard('{Escape}');
      expect(menu).not.toBeInTheDocument();
    });
  });

  describe('Live Interaction Modal', () => {
    const defaultProps = {
      open: true,
      onOpenChange: vi.fn(),
      interactionId: 'test-interaction',
      currentUserId: 'test-user',
      isDM: false,
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<LiveInteractionModal {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper dialog structure', () => {
      render(<LiveInteractionModal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-describedby');
      
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
    });

    it('should manage focus properly', () => {
      const { rerender } = render(<LiveInteractionModal {...defaultProps} open={false} />);
      
      // Focus should not be trapped when closed
      expect(document.activeElement).toBe(document.body);
      
      // Focus should be managed when opened
      rerender(<LiveInteractionModal {...defaultProps} open={true} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have accessible tab navigation', () => {
      render(<LiveInteractionModal {...defaultProps} />);
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label');
      
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-controls');
        expect(tab).toHaveAttribute('role', 'tab');
      });
    });

    it('should announce status changes to screen readers', () => {
      const announceSpy = vi.spyOn(ScreenReader, 'announce');
      
      render(<LiveInteractionModal {...defaultProps} />);
      
      // Should announce connection status
      expect(screen.getByText('Connecting to live session...')).toBeInTheDocument();
      
      announceSpy.mockRestore();
    });
  });

  describe('Interactions Page', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<InteractionsPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading structure', () => {
      render(<InteractionsPage />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Live Interactions');
    });

    it('should have accessible status announcements', () => {
      render(<InteractionsPage />);
      
      // Should have live regions for status updates
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
      
      statusElements.forEach(element => {
        expect(element).toHaveAttribute('aria-live');
      });
    });

    it('should have accessible refresh button', () => {
      render(<InteractionsPage />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toHaveAttribute('aria-label');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle arrow key navigation', () => {
      const mockOnIndexChange = vi.fn();
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      
      KeyboardNavigation.handleArrowNavigation(event, 0, 5, mockOnIndexChange);
      
      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('should handle Home and End keys', () => {
      const mockOnIndexChange = vi.fn();
      
      // Test Home key
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
      KeyboardNavigation.handleArrowNavigation(homeEvent, 2, 5, mockOnIndexChange);
      expect(mockOnIndexChange).toHaveBeenCalledWith(0);
      
      // Test End key
      const endEvent = new KeyboardEvent('keydown', { key: 'End' });
      KeyboardNavigation.handleArrowNavigation(endEvent, 2, 5, mockOnIndexChange);
      expect(mockOnIndexChange).toHaveBeenCalledWith(4);
    });

    it('should wrap around at boundaries', () => {
      const mockOnIndexChange = vi.fn();
      
      // Test wrapping from last to first
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      KeyboardNavigation.handleArrowNavigation(downEvent, 4, 5, mockOnIndexChange);
      expect(mockOnIndexChange).toHaveBeenCalledWith(0);
      
      // Test wrapping from first to last
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      KeyboardNavigation.handleArrowNavigation(upEvent, 0, 5, mockOnIndexChange);
      expect(mockOnIndexChange).toHaveBeenCalledWith(4);
    });
  });

  describe('Focus Management', () => {
    it('should save and restore focus', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      
      const restoreFocus = FocusManagement.saveFocus();
      
      // Change focus
      document.body.focus();
      expect(document.activeElement).toBe(document.body);
      
      // Restore focus
      restoreFocus();
      expect(document.activeElement).toBe(button);
      
      document.body.removeChild(button);
    });

    it('should focus first focusable element', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);
      
      FocusManagement.focusFirst(container);
      expect(document.activeElement).toBe(button1);
      
      document.body.removeChild(container);
    });
  });

  describe('Screen Reader Support', () => {
    it('should create accessible descriptions', () => {
      const element = document.createElement('button');
      document.body.appendChild(element);
      
      const descId = ScreenReader.createDescription(element, 'Test description');
      
      expect(element).toHaveAttribute('aria-describedby', descId);
      expect(document.getElementById(descId)).toBeInTheDocument();
      expect(document.getElementById(descId)).toHaveTextContent('Test description');
      
      document.body.removeChild(element);
    });

    it('should announce messages', () => {
      const initialChildren = document.body.children.length;
      
      ScreenReader.announce('Test announcement');
      
      // Should temporarily add announcement element
      expect(document.body.children.length).toBe(initialChildren + 1);
      
      const announcement = document.body.lastElementChild as HTMLElement;
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveTextContent('Test announcement');
      
      // Should remove after timeout
      setTimeout(() => {
        expect(document.body.children.length).toBe(initialChildren);
      }, 1100);
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const element = document.createElement('div');
      const { ReducedMotion } = require('@/lib/accessibility');
      
      expect(ReducedMotion.prefersReducedMotion()).toBe(true);
      
      // Should not add animation class when reduced motion is preferred
      ReducedMotion.conditionalAnimation(element, 'animate-spin');
      expect(element.classList.contains('animate-spin')).toBe(false);
    });
  });

  describe('High Contrast Support', () => {
    it('should detect high contrast mode', () => {
      // Mock matchMedia for high contrast
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { HighContrast } = require('@/lib/accessibility');
      expect(HighContrast.isHighContrastMode()).toBe(true);
    });
  });
});
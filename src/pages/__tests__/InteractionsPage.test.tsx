import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
import { InteractionsPage } from '../InteractionsPage';

// Mock dependencies
vi.mock('@clerk/clerk-react');
vi.mock('convex/react');
vi.mock('../../components/modals/LiveInteractionModal', () => ({
  LiveInteractionModal: ({ open, onOpenChange }: any) => 
    open ? <div data-testid="live-modal">Live Modal</div> : null
}));

// Mock tRPC completely
vi.mock('../../lib/trpc', () => ({
  trpc: {
    interaction: {
      joinRoom: {
        useMutation: vi.fn()
      },
      pauseInteraction: {
        useMutation: vi.fn()
      },
      resumeInteraction: {
        useMutation: vi.fn()
      },
      health: {
        useQuery: vi.fn()
      }
    }
  }
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseQuery = vi.mocked(useQuery);
const mockUseMutation = vi.mocked(useMutation);

describe('InteractionsPage', () => {
  const mockInteractions = [
    {
      _id: 'interaction-1',
      name: 'Test Combat',
      description: 'A test combat encounter',
      dmUserId: 'dm-user-1',
      liveStatus: {
        status: 'idle' as const,
        participantCount: 0,
        currentTurn: null,
        lastActivity: new Date('2024-01-01T10:00:00Z'),
      }
    },
    {
      _id: 'interaction-2',
      name: 'Live Battle',
      description: 'An active battle',
      dmUserId: 'dm-user-1',
      liveStatus: {
        status: 'live' as const,
        participantCount: 3,
        currentTurn: 'player-1',
        lastActivity: new Date('2024-01-01T10:30:00Z'),
      }
    },
    {
      _id: 'interaction-3',
      name: 'Paused Encounter',
      description: 'A paused encounter',
      dmUserId: 'dm-user-2',
      liveStatus: {
        status: 'paused' as const,
        participantCount: 2,
        currentTurn: 'player-2',
        lastActivity: new Date('2024-01-01T09:45:00Z'),
      }
    }
  ];

  const mockJoinRoomMutation = vi.fn();
  const mockPauseInteractionMutation = vi.fn();
  const mockResumeInteractionMutation = vi.fn();
  const mockUpdateInteractionStatus = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      userId: 'test-user-1',
      getToken: vi.fn(),
    } as any);

    mockUseQuery.mockReturnValue(mockInteractions);
    mockUseMutation.mockReturnValue(mockUpdateInteractionStatus);

    // Import and mock tRPC after the module is mocked
    const { trpc } = await import('../../lib/trpc');
    
    // Mock tRPC hooks
    vi.mocked(trpc.interaction.joinRoom.useMutation).mockReturnValue({
      mutateAsync: mockJoinRoomMutation,
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
    } as any);

    vi.mocked(trpc.interaction.pauseInteraction.useMutation).mockReturnValue({
      mutateAsync: mockPauseInteractionMutation,
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
    } as any);

    vi.mocked(trpc.interaction.resumeInteraction.useMutation).mockReturnValue({
      mutateAsync: mockResumeInteractionMutation,
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
    } as any);

    vi.mocked(trpc.interaction.health.useQuery).mockReturnValue({
      data: {
        status: 'ok',
        timestamp: '2024-01-01T10:00:00Z',
        service: 'live-interaction-system',
        stats: { activeRooms: 2 }
      },
      error: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);
  });

  it('renders the interactions page with title and description', () => {
    render(<InteractionsPage />);
    
    expect(screen.getByText('Live Interactions')).toBeInTheDocument();
    expect(screen.getByText('Manage and join live D&D interactions')).toBeInTheDocument();
  });

  it('displays live server connection status', () => {
    render(<InteractionsPage />);
    
    expect(screen.getByText(/Live server connected/)).toBeInTheDocument();
    expect(screen.getByText(/2 active rooms/)).toBeInTheDocument();
  });

  it('shows loading spinner when interactions are not loaded', () => {
    mockUseQuery.mockReturnValue(null);
    
    render(<InteractionsPage />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays empty state when no interactions exist', () => {
    mockUseQuery.mockReturnValue([]);
    
    render(<InteractionsPage />);
    
    expect(screen.getByText('No Interactions Found')).toBeInTheDocument();
    expect(screen.getByText('Create interactions in your campaigns to see them here.')).toBeInTheDocument();
  });

  it('renders interaction cards with correct information', () => {
    render(<InteractionsPage />);
    
    // Check first interaction
    expect(screen.getByText('Test Combat')).toBeInTheDocument();
    expect(screen.getByText('A test combat encounter')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.getByText('0 connected')).toBeInTheDocument();

    // Check second interaction
    expect(screen.getByText('Live Battle')).toBeInTheDocument();
    expect(screen.getByText('3 connected')).toBeInTheDocument();
    expect(screen.getByText('live')).toBeInTheDocument();
  });

  it('shows join button for live interactions', () => {
    render(<InteractionsPage />);
    
    const joinButtons = screen.getAllByText('Join');
    expect(joinButtons).toHaveLength(1); // Only the live interaction should have a join button
  });

  it('shows rejoin button for paused interactions', () => {
    render(<InteractionsPage />);
    
    expect(screen.getByText('Rejoin')).toBeInTheDocument();
  });

  it('shows DM controls for interactions owned by current user', () => {
    // Mock user as DM for first two interactions
    mockUseAuth.mockReturnValue({
      userId: 'dm-user-1',
      getToken: vi.fn(),
    } as any);

    render(<InteractionsPage />);
    
    // Should see play button for idle interaction
    const playButtons = screen.getAllByTitle('Start Live Session');
    expect(playButtons).toHaveLength(1);

    // Should see pause button for live interaction
    const pauseButtons = screen.getAllByTitle('Pause Session');
    expect(pauseButtons).toHaveLength(1);
  });

  it('does not show DM controls for interactions not owned by current user', () => {
    render(<InteractionsPage />);
    
    // User is not DM for any interactions, so should see waiting message
    expect(screen.getByText('Waiting for DM to start session')).toBeInTheDocument();
  });

  it('shows join button for live interactions when server is healthy', () => {
    render(<InteractionsPage />);
    
    const joinButton = screen.getByText('Join');
    expect(joinButton).toBeInTheDocument();
    // Button should be enabled when health check passes (default mock)
  });

  it('shows DM controls when user is DM', () => {
    mockUseAuth.mockReturnValue({
      userId: 'dm-user-1',
      getToken: vi.fn(),
    } as any);

    render(<InteractionsPage />);
    
    // Verify DM controls are visible
    const startButton = screen.getByTitle('Start Live Session');
    expect(startButton).toBeInTheDocument();
  });

  it('shows pause controls for live interactions when user is DM', () => {
    mockUseAuth.mockReturnValue({
      userId: 'dm-user-1',
      getToken: vi.fn(),
    } as any);

    render(<InteractionsPage />);
    
    // Verify pause button is visible for live interaction
    const pauseButton = screen.getByTitle('Pause Session');
    expect(pauseButton).toBeInTheDocument();
  });

  it('handles manual refresh', () => {
    render(<InteractionsPage />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Button should be disabled during refresh
    expect(refreshButton).toBeDisabled();
  });

  it('shows error state when live server is unavailable', async () => {
    const { trpc } = await import('../../lib/trpc');
    
    vi.mocked(trpc.interaction.health.useQuery).mockReturnValue({
      data: null,
      error: new Error('Connection failed'),
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as any);

    render(<InteractionsPage />);
    
    expect(screen.getByText(/Live server unavailable/)).toBeInTheDocument();
    
    // Join buttons should be disabled
    const joinButton = screen.getByText('Join');
    expect(joinButton).toBeDisabled();
  });

  it('formats last activity time correctly', () => {
    // Mock current time
    vi.setSystemTime(new Date('2024-01-01T10:35:00Z'));

    render(<InteractionsPage />);
    
    // Should show "5m ago" for the live interaction (10:30 -> 10:35)
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('displays current turn information when available', () => {
    render(<InteractionsPage />);
    
    expect(screen.getByText('Current turn: player-1')).toBeInTheDocument();
    expect(screen.getByText('Current turn: player-2')).toBeInTheDocument();
  });
});
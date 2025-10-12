import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAuth } from '@clerk/clerk-react';
import { useAuthentication } from '../components/providers/AuthenticationProvider';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LiveInteractionModal } from '../components/modals/LiveInteractionModal';
// tRPC import removed - migrated to Convex
import {
  Play,
  Pause,
  Square,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

export function InteractionsPage() {
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const { isAuthenticated, isLoading: isAuthProviderLoading } = useAuthentication();
  const [selectedInteraction, setSelectedInteraction] = useState<string | null>(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [selectedCampaign] = useState<Id<"campaigns"> | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [componentError, setComponentError] = useState<Error | null>(null);

  // Error boundary effect to catch and handle component errors
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('InteractionsPage Error:', error.error);
      // Only set component error for non-auth related errors
      if (error.error && !error.error.message?.includes('authentication') && !error.error.message?.includes('Not authenticated')) {
        setComponentError(error.error);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('InteractionsPage Promise Rejection:', event.reason);
      // Handle Convex authentication errors gracefully
      if (event.reason && (
        event.reason.message?.includes('Not authenticated') ||
        event.reason.message?.includes('Unauthenticated') ||
        event.reason.code === 'Unauthenticated'
      )) {
        // Don't set component error for auth issues - let auth provider handle them
        return;
      }
      setComponentError(event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Convex queries - only run when authentication is complete
  const interactions = useQuery(
    api.interactions.getAllInteractionsWithLiveStatus, 
    isAuthenticated && isAuthLoaded ? { campaignId: selectedCampaign } : "skip"
  );

  const updateInteractionStatus = useMutation(api.interactions.updateInteractionStatus);

  // Convex mutations for live room management with error handling
  const joinRoomMutation = useMutation(api.liveSystemAPI.quickJoinRoom);
  const pauseRoomMutation = useMutation(api.liveSystemAPI.pauseLiveRoom);
  const resumeRoomMutation = useMutation(api.liveSystemAPI.resumeLiveRoom);

  // Health check using Convex system health with error boundary
  const healthData = useQuery(
    api.liveSystemAPI.getComprehensiveSystemHealth,
    isAuthenticated && isAuthLoaded ? {} : "skip"
  );
  const healthError = healthData === null ? new Error("System health unavailable") : null;

  // Auto-refresh interactions every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      // Trigger a refetch of interactions
      setTimeout(() => setIsRefreshing(false), 1000);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle joining a live interaction
  const handleJoinInteraction = async (interactionId: string) => {
    try {
      // For now, we'll use a placeholder entity ID
      // In a real implementation, this would come from the user's selected character
      const result = await joinRoomMutation({
        interactionId: interactionId as Id<"interactions">,
        entityId: `character-${userId}`,
        entityType: 'playerCharacter'
      });

      if (result.success) {
        setSelectedInteraction(interactionId);
        setIsLiveModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to join interaction:', error);
      // TODO: Show error toast
    }
  };

  // Handle DM status changes via Convex live system
  const handleStatusChange = async (
    interactionId: Id<"interactions">,
    newStatus: 'idle' | 'live' | 'paused' | 'completed'
  ) => {
    try {
      if (newStatus === 'live') {
        // First update Convex status
        await updateInteractionStatus({
          interactionId,
          status: newStatus,
        });
        // The live system will automatically create the room if needed
      } else if (newStatus === 'paused') {
        // Use Convex live system to pause
        await pauseRoomMutation({
          interactionId,
          reason: 'DM paused interaction'
        });
        // Also update Convex interaction status
        await updateInteractionStatus({
          interactionId,
          status: newStatus,
        });
      } else if (newStatus === 'completed') {
        // Update Convex status
        await updateInteractionStatus({
          interactionId,
          status: newStatus,
        });
      } else {
        // Resume interaction
        await resumeRoomMutation({
          interactionId,
        });
        await updateInteractionStatus({
          interactionId,
          status: 'live',
        });
      }
    } catch (error) {
      console.error('Failed to update interaction status:', error);
      // TODO: Show error toast
    }
  };

  // Check if user is DM for an interaction
  const isDMForInteraction = (interaction: any) => {
    return interaction.dmUserId === userId;
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'live':
        return 'default'; // Green
      case 'paused':
        return 'secondary'; // Yellow
      case 'completed':
        return 'outline'; // Gray
      default:
        return 'secondary'; // Default
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Play className="w-3 h-3" />;
      case 'paused':
        return <Pause className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  // Format last activity time
  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Display error state if component error occurred
  if (componentError) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-center mb-4">
            There was an error loading the interactions page. Please refresh the page or try again later.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while authentication is being established
  if (!isAuthLoaded || isAuthProviderLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" data-testid="loading-spinner" />
            <p className="text-muted-foreground">
              {!isAuthLoaded ? 'Loading authentication...' : 
               !isAuthenticated ? 'Authenticating...' : 
               'Loading interactions...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!interactions) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" data-testid="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Live Interactions</h1>
          <p className="text-muted-foreground">
            Manage and join live D&D interactions
          </p>
          {healthError && (
            <div 
              className="flex items-center gap-2 mt-2 text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              Live server unavailable - some features may not work
            </div>
          )}
          {healthData && (
            <div 
              className="flex items-center gap-2 mt-2 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
              Live system connected ({healthData?.detailedStatus?.liveRooms?.active || 0} active rooms)
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          aria-label={isRefreshing ? 'Refreshing interactions...' : 'Refresh interactions list'}
        >
          <RefreshCw 
            className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} 
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {interactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold mb-2">No Interactions Found</h3>
            <p className="text-muted-foreground text-center">
              Create interactions in your campaigns to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label="Available interactions"
        >
          {interactions.map((interaction) => (
            <Card 
              key={interaction._id} 
              className="hover:shadow-md transition-shadow"
              role="listitem"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{interaction.name}</CardTitle>
                    {interaction.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {interaction.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(interaction.liveStatus.status)}
                    className="flex items-center gap-1"
                  >
                    {getStatusIcon(interaction.liveStatus.status)}
                    {interaction.liveStatus.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Participant count and current turn */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{interaction.liveStatus.participantCount} connected</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatLastActivity(interaction.liveStatus.lastActivity)}</span>
                    </div>
                  </div>

                  {/* Current turn indicator */}
                  {interaction.liveStatus.currentTurn && (
                    <div className="text-xs text-muted-foreground">
                      Current turn: {interaction.liveStatus.currentTurn}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    {/* Player join buttons */}
                    {(interaction.liveStatus.status === 'live' || interaction.liveStatus.status === 'paused') && (
                      <Button
                        size="sm"
                        onClick={() => handleJoinInteraction(interaction._id)}
                        className="flex-1"
                        disabled={healthError !== undefined}
                      >
                        {interaction.liveStatus.status === 'live' ? 'Join' : 'Rejoin'}
                      </Button>
                    )}

                    {/* DM Controls */}
                    {isDMForInteraction(interaction) && (
                      <div className="flex gap-1">
                        {interaction.liveStatus.status === 'idle' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(interaction._id, 'live')}
                            disabled={healthError !== undefined}
                            title="Start Live Session"
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}

                        {interaction.liveStatus.status === 'live' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(interaction._id, 'paused')}
                            disabled={healthError !== undefined}
                            title="Pause Session"
                          >
                            <Pause className="w-3 h-3" />
                          </Button>
                        )}

                        {interaction.liveStatus.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(interaction._id, 'live')}
                            disabled={healthError !== undefined}
                            title="Resume Session"
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}

                        {(interaction.liveStatus.status === 'live' || interaction.liveStatus.status === 'paused') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(interaction._id, 'completed')}
                            title="Complete Session"
                          >
                            <Square className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Show message if not DM and interaction is idle */}
                    {!isDMForInteraction(interaction) && interaction.liveStatus.status === 'idle' && (
                      <div className="flex-1 text-center text-sm text-muted-foreground py-2">
                        Waiting for DM to start session
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Live Interaction Modal */}
      {selectedInteraction && (
        <LiveInteractionModal
          interactionId={selectedInteraction as Id<"interactions">}
          open={isLiveModalOpen}
          onOpenChange={(open) => {
            setIsLiveModalOpen(open);
            if (!open) {
              setSelectedInteraction(null);
            }
          }}
          currentUserId={userId || ''}
          isDM={interactions?.find(i => i._id === selectedInteraction)?.dmUserId === userId}
        />
      )}
    </div>
  );
}
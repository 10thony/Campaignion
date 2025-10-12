import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { DiceRoller } from './DiceRoller';
import { CombatStateManager } from './CombatStateManager';
import { InteractionTemplates } from './InteractionTemplates';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import './LiveInteractionDashboard.css';

interface LiveInteractionDashboardProps {
  campaignId: Id<"campaigns">;
  userId: Id<"users">;
  isDM: boolean;
}

export const LiveInteractionDashboard: React.FC<LiveInteractionDashboardProps> = ({
  campaignId,
  isDM
}) => {
  const [selectedInteractionId, setSelectedInteractionId] = useState<Id<"interactions"> | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'combat' | 'dice' | 'templates'>('main');

  // Queries
  const activeInteraction = useQuery(api.interactions.getActiveInteractionByCampaign, { campaignId });
  const interactionWithParticipants = useQuery(
    api.interactions.getInteractionWithParticipants,
    selectedInteractionId ? { interactionId: selectedInteractionId } : 'skip'
  );
  const initiativeOrder = useQuery(
    api.interactions.getInitiativeOrder,
    selectedInteractionId ? { interactionId: selectedInteractionId } : 'skip'
  );
  const pendingActions = useQuery(
    api.playerActions.getPendingPlayerActions,
    selectedInteractionId ? { interactionId: selectedInteractionId } : 'skip'
  );

  // Mutations
  const advanceTurn = useMutation(api.interactions.advanceTurn);
  const completeInteraction = useMutation(api.interactions.completeInteraction);
  const cancelInteraction = useMutation(api.interactions.cancelInteraction);

  useEffect(() => {
    if (activeInteraction) {
      setSelectedInteractionId(activeInteraction._id);
    }
  }, [activeInteraction]);

  const handleAdvanceTurn = async () => {
    if (selectedInteractionId) {
      try {
        await advanceTurn({ interactionId: selectedInteractionId });
      } catch (error) {
        console.error('Error advancing turn:', error);
      }
    }
  };

  const handleCompleteInteraction = async () => {
    if (selectedInteractionId) {
      try {
        await completeInteraction({ interactionId: selectedInteractionId });
        setSelectedInteractionId(null);
      } catch (error) {
        console.error('Error completing interaction:', error);
      }
    }
  };

  const handleCancelInteraction = async () => {
    if (selectedInteractionId) {
      try {
        await cancelInteraction({ interactionId: selectedInteractionId });
        setSelectedInteractionId(null);
      } catch (error) {
        console.error('Error cancelling interaction:', error);
      }
    }
  };

  if (!activeInteraction) {
    return (
      <div className="live-interaction-dashboard">
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-4xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold mb-2">No Active Interaction</h2>
            <p className="text-muted-foreground mb-6">
              There is currently no active live interaction for this campaign.
            </p>
            {isDM && (
              <Button>
                Start New Interaction
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentParticipant = initiativeOrder?.currentParticipant;
  const isCurrentTurnPlayer = currentParticipant?.entityType === 'playerCharacter';

  return (
    <div className="live-interaction-dashboard space-y-6">
      {/* Dashboard Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Live Interaction: {activeInteraction.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={
                  activeInteraction.status === 'WAITING_FOR_PLAYER_TURN' ? 'default' :
                  activeInteraction.status === 'DM_REVIEW' ? 'secondary' :
                  activeInteraction.status === 'COMPLETED' ? 'outline' : 'destructive'
                }>
                  {activeInteraction.status?.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Advanced Features Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="main">📊 Main Dashboard</TabsTrigger>
          <TabsTrigger value="combat">⚔️ Combat State</TabsTrigger>
          <TabsTrigger value="dice">🎲 Dice Roller</TabsTrigger>
          <TabsTrigger value="templates">📋 Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Initiative Order */}
            <Card>
              <CardHeader>
                <CardTitle>Initiative Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {initiativeOrder?.initiativeOrder.map((participant, index) => (
                    <div
                      key={`${participant.entityId}-${index}`}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border",
                        index === initiativeOrder.currentIndex && "bg-primary/10 border-primary"
                      )}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {participant.entityType === 'playerCharacter' && 
                            interactionWithParticipants?.participants.playerCharacters?.find(
                              pc => pc?._id === participant.entityId
                            )?.name || 'Unknown Player'}
                          {participant.entityType === 'npc' && 
                            interactionWithParticipants?.participants.npcs?.find(
                              npc => npc?._id === participant.entityId
                            )?.name || 'Unknown NPC'}
                          {participant.entityType === 'monster' && 
                            interactionWithParticipants?.participants.monsters?.find(
                              monster => monster?._id === participant.entityId
                            )?.name || 'Unknown Monster'}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {participant.entityType}
                        </div>
                      </div>
                      <Badge variant="outline">{participant.initiativeRoll}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Turn Display */}
            <Card>
              <CardHeader>
                <CardTitle>Current Turn</CardTitle>
              </CardHeader>
              <CardContent>
                {currentParticipant ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {currentParticipant.entityType === 'playerCharacter' ? 'PC' : 
                           currentParticipant.entityType === 'npc' ? 'NPC' : 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {currentParticipant.entityType === 'playerCharacter' && 
                            interactionWithParticipants?.participants.playerCharacters?.find(
                              pc => pc?._id === currentParticipant.entityId
                            )?.name || 'Unknown Player'}
                          {currentParticipant.entityType === 'npc' && 
                            interactionWithParticipants?.participants.npcs?.find(
                              npc => npc?._id === currentParticipant.entityId
                            )?.name || 'Unknown NPC'}
                          {currentParticipant.entityType === 'monster' && 
                            interactionWithParticipants?.participants.monsters?.find(
                              monster => monster?._id === currentParticipant.entityId
                            )?.name || 'Unknown Monster'}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {currentParticipant.entityType}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <strong>Initiative:</strong> {currentParticipant.initiativeRoll}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No current turn
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Actions ({pendingActions?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingActions?.map((action) => (
                  <div key={action._id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{action.actionType}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(action.submittedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm">{action.actionDescription}</div>
                  </div>
                ))}
                {(!pendingActions || pendingActions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending actions
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combat" className="space-y-6">
          {selectedInteractionId && (
            <Card>
              <CardContent className="p-6">
                <CombatStateManager interactionId={selectedInteractionId} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dice" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <DiceRoller
                mode="combat"
                interactionId={selectedInteractionId || undefined}
                onRollComplete={(result) => {
                  console.log('Dice roll result:', result);
                  // TODO: Integrate with combat state
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <InteractionTemplates
                campaignId={campaignId}
                onTemplateSelect={(template) => {
                  console.log('Template selected:', template);
                  // TODO: Apply template to current interaction
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Control Panel - Always visible */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isDM && (
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleAdvanceTurn}
                  disabled={!selectedInteractionId}
                >
                  Advance Turn
                </Button>
                
                <Button 
                  variant="default"
                  onClick={handleCompleteInteraction}
                  disabled={!selectedInteractionId}
                >
                  Complete Interaction
                </Button>
                
                <Button 
                  variant="destructive"
                  onClick={handleCancelInteraction}
                  disabled={!selectedInteractionId}
                >
                  Cancel Interaction
                </Button>
              </div>
            )}

            {!isDM && isCurrentTurnPlayer && (
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="font-medium mb-2">It's your turn!</p>
                <Button>
                  Submit Action
                </Button>
              </div>
            )}

            {!isDM && !isCurrentTurnPlayer && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-muted-foreground">Waiting for current player's turn...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import './QuickAccessPanel.css';

interface QuickAccessItem {
  id: string;
  type: 'interaction' | 'campaign' | 'character' | 'item' | 'monster' | 'npc';
  title: string;
  subtitle?: string;
  icon: string;
  path: string;
  status?: string;
  timestamp: number;
  metadata?: any;
}

interface QuickAccessPanelProps {
  isVisible?: boolean;
  onToggle?: () => void;
  maxRecentItems?: number;
  enableSearch?: boolean;
}

export const QuickAccessPanel: React.FC<QuickAccessPanelProps> = ({
  isVisible = false,
  maxRecentItems = 5,
  enableSearch = true
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentItems, setRecentItems] = useState<QuickAccessItem[]>([]);
  const [searchResults, setSearchResults] = useState<QuickAccessItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Queries for data
  const activeInteractions = useQuery(api.interactions.subscribeToActiveInteractions);
  const campaigns = useQuery(api.campaigns.getAllCampaigns, { clerkId: user?.id ?? '' });
  const characters = useQuery(api.characters.getAllCharacters);
  const items = useQuery(api.items.getItems);
  const monsters = useQuery(api.monsters.getAllMonsters);
  const npcs = useQuery(api.npcs.getAllNpcs);

  // Load recent items from localStorage
  useEffect(() => {
    const loadRecentItems = () => {
      try {
        const stored = localStorage.getItem('quick-access-recent');
        if (stored) {
          const items = JSON.parse(stored);
          setRecentItems(items.slice(0, maxRecentItems));
        }
      } catch (error) {
        console.error('Error loading recent items:', error);
      }
    };

    loadRecentItems();
  }, [maxRecentItems]);

  // Save recent items to localStorage
  const saveRecentItem = (item: QuickAccessItem) => {
    try {
      const existing = recentItems.filter(i => i.id !== item.id);
      const updated = [item, ...existing].slice(0, maxRecentItems);
      setRecentItems(updated);
      localStorage.setItem('quick-access-recent', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent item:', error);
    }
  };

  // Handle item click
  const handleItemClick = (item: QuickAccessItem) => {
    saveRecentItem(item);
    navigate(item.path);
    setIsExpanded(false);
    setSearchQuery('');
  };

  // Search functionality
  useEffect(() => {
    if (!enableSearch || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, enableSearch, activeInteractions, campaigns, characters, items, monsters, npcs]);

  const performSearch = (query: string) => {
    setIsSearching(true);
    const results: QuickAccessItem[] = [];
    const lowerQuery = query.toLowerCase();

    // Search active interactions
    activeInteractions?.forEach(interaction => {
      if (interaction.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `interaction-${interaction._id}`,
          type: 'interaction',
          title: interaction.name,
          subtitle: `Status: ${interaction.status.replace(/_/g, ' ')}`,
          icon: '⚡',
          path: `/interactions/${interaction._id}`,
          status: interaction.status,
          timestamp: interaction.updatedAt || interaction.createdAt,
          metadata: { interaction }
        });
      }
    });

    // Search campaigns
    campaigns?.forEach(campaign => {
      if (campaign.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `campaign-${campaign._id}`,
          type: 'campaign',
          title: campaign.name,
          subtitle: `DM: ${campaign.dmId || 'Unknown'}`,
          icon: '📚',
          path: `/campaigns/${campaign._id}`,
          timestamp: campaign.updatedAt || campaign.createdAt,
          metadata: { campaign }
        });
      }
    });

    // Search characters
    characters?.forEach(character => {
      if (character.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `character-${character._id}`,
          type: 'character',
          title: character.name,
          subtitle: `${character.race} ${character.class}`,
          icon: '👤',
          path: `/characters/${character._id}`,
          timestamp: character.updatedAt || character.createdAt,
          metadata: { character }
        });
      }
    });

    // Search items
    items?.forEach((item: any) => {
      if (item.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `item-${item._id}`,
          type: 'item',
          title: item.name,
          subtitle: item.type,
          icon: '⚔️',
          path: `/items/${item._id}`,
          timestamp: item.updatedAt || item.createdAt,
          metadata: { item }
        });
      }
    });

    // Search monsters
    monsters?.forEach(monster => {
      if (monster.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `monster-${monster._id}`,
          type: 'monster',
          title: monster.name,
          subtitle: `CR ${monster.challengeRating}`,
          icon: '🐉',
          path: `/monsters/${monster._id}`,
          timestamp: monster.updatedAt || monster.createdAt,
          metadata: { monster }
        });
      }
    });

    // Search NPCs
    npcs?.forEach((npc: any) => {
      if (npc.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `npc-${npc._id}`,
          type: 'npc',
          title: npc.name,
          subtitle: npc.role || 'NPC',
          icon: '👤',
          path: `/npcs/${npc._id}`,
          timestamp: npc.updatedAt || npc.createdAt,
          metadata: { npc }
        });
      }
    });

    setSearchResults(results);
    setIsSearching(false);
  };

  const quickActions = [
    {
      id: 'new-interaction',
      title: 'New Interaction',
      icon: '⚡',
      path: '/interactions/new',
      type: 'action' as const
    },
    {
      id: 'new-campaign',
      title: 'New Campaign',
      icon: '📚',
      path: '/campaigns/new',
      type: 'action' as const
    },
    {
      id: 'new-character',
      title: 'New Character',
      icon: '👤',
      path: '/characters/new',
      type: 'action' as const
    },
    {
      id: 'dice-roller',
      title: 'Dice Roller',
      icon: '🎲',
      path: '/dice-roller',
      type: 'action' as const
    }
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    navigate(action.path);
    setIsExpanded(false);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'PENDING_INITIATIVE':
        return 'secondary';
      case 'INITIATIVE_ROLLED':
        return 'outline';
      case 'WAITING_FOR_PLAYER_TURN':
        return 'default';
      case 'PROCESSING_PLAYER_ACTION':
        return 'secondary';
      case 'DM_REVIEW':
        return 'outline';
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button
        variant="default"
        size="lg"
        className={cn(
          "quick-access-fab",
          isVisible && "visible",
          "rounded-full w-14 h-14 shadow-lg"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Quick Access"
      >
        <span className="fab-icon text-xl">⚡</span>
      </Button>

      {/* Expanded Panel */}
      {isExpanded && (
        <Card className="quick-access-panel">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Quick Access</CardTitle>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search */}
            {enableSearch && (
              <div className="search-section">
                <Input
                  type="text"
                  placeholder="Search interactions, campaigns, characters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {isSearching && (
                  <div className="flex justify-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map(action => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="quick-action-button h-auto p-3 flex flex-col items-center gap-1"
                    onClick={() => handleQuickAction(action)}
                  >
                    <span className="action-icon text-lg">{action.icon}</span>
                    <span className="action-title text-xs">{action.title}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className="search-results-section">
                <h4 className="text-sm font-medium mb-2">
                  Search Results ({searchResults.length})
                </h4>
                <div className="space-y-2">
                  {searchResults.map(item => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="search-result-item w-full justify-start h-auto p-3"
                      onClick={() => handleItemClick(item)}
                    >
                      <span className="result-icon mr-2">{item.icon}</span>
                      <div className="result-content flex-1 text-left">
                        <div className="result-title font-medium">{item.title}</div>
                        {item.subtitle && (
                          <div className="result-subtitle text-xs text-muted-foreground">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      {item.status && (
                        <Badge variant={getStatusVariant(item.status)} className="ml-2">
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </Button>
                  ))}
                  {searchResults.length === 0 && !isSearching && (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      No results found for "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Items */}
            {!searchQuery && recentItems.length > 0 && (
              <div className="recent-items-section">
                <h4 className="text-sm font-medium mb-2">Recent Items</h4>
                <div className="space-y-2">
                  {recentItems.map(item => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="recent-item w-full justify-start h-auto p-3"
                      onClick={() => handleItemClick(item)}
                    >
                      <span className="item-icon mr-2">{item.icon}</span>
                      <div className="item-content flex-1 text-left">
                        <div className="item-title font-medium">{item.title}</div>
                        {item.subtitle && (
                          <div className="item-subtitle text-xs text-muted-foreground">
                            {item.subtitle}
                          </div>
                        )}
                        <div className="item-time text-xs text-muted-foreground">
                          {formatTimestamp(item.timestamp)}
                        </div>
                      </div>
                      {item.status && (
                        <Badge variant={getStatusVariant(item.status)} className="ml-2">
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Interactions */}
            {!searchQuery && activeInteractions && activeInteractions.length > 0 && (
              <div className="active-interactions-section">
                <Separator className="my-4" />
                <h4 className="text-sm font-medium mb-2">
                  Active Interactions ({activeInteractions.length})
                </h4>
                <div className="space-y-2">
                  {activeInteractions.slice(0, 3).map(interaction => (
                    <Button
                      key={interaction._id}
                      variant="ghost"
                      className="active-interaction-item w-full justify-start h-auto p-3"
                      onClick={() => handleItemClick({
                        id: `interaction-${interaction._id}`,
                        type: 'interaction',
                        title: interaction.name,
                        subtitle: `Campaign: ${interaction.campaignId || 'Standalone'}`,
                        icon: '⚡',
                        path: `/interactions/${interaction._id}`,
                        status: interaction.status,
                        timestamp: interaction.updatedAt || interaction.createdAt,
                        metadata: { interaction }
                      })}
                    >
                      <span className="interaction-icon mr-2">⚡</span>
                      <div className="interaction-content flex-1 text-left">
                        <div className="interaction-title font-medium">{interaction.name}</div>
                        <div className="interaction-status">
                          <Badge variant={getStatusVariant(interaction.status)}>
                            {interaction.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}; 
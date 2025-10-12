import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import './SmartBreadcrumbs.css';

interface BreadcrumbItemData {
  id: string;
  label: string;
  path: string;
  icon?: string;
  isActive: boolean;
  metadata?: any;
}

interface SmartBreadcrumbsProps {
  maxItems?: number;
  showHistory?: boolean;
  enableDeepLinking?: boolean;
}

export const SmartBreadcrumbs: React.FC<SmartBreadcrumbsProps> = ({
  maxItems = 5,
  showHistory = true,
  enableDeepLinking = true
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItemData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<BreadcrumbItemData[]>([]);

  // Queries for dynamic breadcrumb data
  const campaigns = useQuery(api.campaigns.getAllCampaigns, { clerkId: undefined });
  const interactions = useQuery(api.interactions.getAllInteractions);

  // Parse current path and generate breadcrumbs
  useEffect(() => {
    const generateBreadcrumbs = (): BreadcrumbItemData[] => {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const items: BreadcrumbItemData[] = [];
      
      // Always start with home
      items.push({
        id: 'home',
        label: 'Home',
        path: '/',
        icon: '🏠',
        isActive: location.pathname === '/'
      });

      let currentPath = '';
      
      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;
        
        // Handle different route types
        const breadcrumbItem = createBreadcrumbItem(segment, currentPath, pathSegments, i);
        if (breadcrumbItem) {
          items.push(breadcrumbItem);
        }
      }

      return items;
    };

    const newBreadcrumbs = generateBreadcrumbs();
    setBreadcrumbs(newBreadcrumbs);

    // Add to navigation history
    if (showHistory && newBreadcrumbs.length > 0) {
      const lastItem = newBreadcrumbs[newBreadcrumbs.length - 1];
      if (lastItem && !navigationHistory.find(item => item.path === lastItem.path)) {
        setNavigationHistory(prev => [lastItem, ...prev.slice(0, 9)]); // Keep last 10 items
      }
    }
  }, [location.pathname, campaigns, interactions, showHistory, navigationHistory]);

  const createBreadcrumbItem = (
    segment: string,
    currentPath: string,
    pathSegments: string[],
    index: number
  ): BreadcrumbItemData | null => {
    // Handle different route patterns
    switch (pathSegments[0]) {
      case 'campaigns':
        return handleCampaignRoute(segment, currentPath, pathSegments, index);
      case 'interactions':
        return handleInteractionRoute(segment, currentPath, pathSegments, index);
      case 'live-interactions':
        return handleLiveInteractionRoute(segment, currentPath, pathSegments, index);
      case 'characters':
        return handleCharacterRoute(segment, currentPath, pathSegments, index);
      case 'items':
        return handleItemRoute(segment, currentPath, pathSegments, index);
      case 'monsters':
        return handleMonsterRoute(segment, currentPath, pathSegments, index);
      case 'npcs':
        return handleNPCRoute(segment, currentPath, pathSegments, index);
      case 'quests':
        return handleQuestRoute(segment, currentPath, pathSegments, index);
      default:
        return createGenericBreadcrumbItem(segment, currentPath, index);
    }
  };

  const handleCampaignRoute = (
    _segment: string,
    currentPath: string,
    pathSegments: string[],
    index: number
  ): BreadcrumbItemData | null => {
    if (index === 0) {
      return {
        id: 'campaigns',
        label: 'Campaigns',
        path: '/campaigns',
        icon: '📚',
        isActive: currentPath === '/campaigns'
      };
    }

    if (index === 1 && pathSegments[1]) {
      const campaign = campaigns?.find(c => c._id === pathSegments[1]);
      return {
        id: `campaign-${pathSegments[1]}`,
        label: campaign?.name || 'Campaign',
        path: currentPath,
        icon: '🎲',
        isActive: currentPath === location.pathname,
        metadata: { type: 'campaign', id: pathSegments[1] }
      };
    }

    if (index === 2 && pathSegments[2] === 'live-interaction') {
      return {
        id: 'live-interaction',
        label: 'Live Interaction',
        path: currentPath,
        icon: '⚡',
        isActive: currentPath === location.pathname
      };
    }

    return null;
  };

  const handleInteractionRoute = (
    _segment: string,
    currentPath: string,
    pathSegments: string[],
    index: number
  ): BreadcrumbItemData | null => {
    if (index === 0) {
      return {
        id: 'interactions',
        label: 'Interactions',
        path: '/interactions',
        icon: '🤝',
        isActive: currentPath === '/interactions'
      };
    }

    if (index === 1 && pathSegments[1]) {
      const interaction = interactions?.find(i => i._id === pathSegments[1]);
      return {
        id: `interaction-${pathSegments[1]}`,
        label: interaction?.name || 'Interaction',
        path: currentPath,
        icon: '🎭',
        isActive: currentPath === location.pathname,
        metadata: { type: 'interaction', id: pathSegments[1] }
      };
    }

    return null;
  };

  const handleLiveInteractionRoute = (
    _segment: string,
    currentPath: string,
    _pathSegments: string[],
    index: number
  ): BreadcrumbItemData | null => {
    if (index === 0) {
      return {
        id: 'live-interactions',
        label: 'Live Interactions',
        path: '/live-interactions',
        icon: '⚡',
        isActive: currentPath === '/live-interactions'
      };
    }

    return null;
  };

  const handleCharacterRoute = (
    _segment: string,
    currentPath: string,
    _pathSegments: string[],
    index: number
  ): BreadcrumbItemData | null => {
    if (index === 0) {
      return {
        id: 'characters',
        label: 'Characters',
        path: '/characters',
        icon: '👥',
        isActive: currentPath === '/characters'
      };
    }

    return null;
  };

  const handleItemRoute = (
    _segment: string,
    currentPath: string,
    _pathSegments: string[],
    index: number
  ): BreadcrumbItemData | null => {
    if (index === 0) {
      return {
        id: 'items',
        label: 'Items',
        path: '/items',
        icon: '📦',
        isActive: currentPath === '/items'
      };
    }

    return null;
  };

  const handleMonsterRoute = (
    _segment: string,
    currentPath: string,
    _pathSegments: string[],
    index: number
  ): BreadcrumbItemData | null => {
    if (index === 0) {
      return {
        id: 'monsters',
        label: 'Monsters',
        path: '/monsters',
        icon: '👹',
        isActive: currentPath === '/monsters'
      };
    }

    return null;
  };

  const handleNPCRoute = (
    _segment: string,
    currentPath: string,
    _pathSegments: string[],
    index: number
  ): BreadcrumbItemData | null => {
    if (index === 0) {
      return {
        id: 'npcs',
        label: 'NPCs',
        path: '/npcs',
        icon: '👤',
        isActive: currentPath === '/npcs'
      };
    }

    return null;
  };

  const handleQuestRoute = (
    _segment: string,
    currentPath: string,
    _pathSegments: string[],
    index: number
  ): BreadcrumbItemData | null => {
    if (index === 0) {
      return {
        id: 'quests',
        label: 'Quests',
        path: '/quests',
        icon: '📜',
        isActive: currentPath === '/quests'
      };
    }

    return null;
  };

  const createGenericBreadcrumbItem = (
    segment: string,
    currentPath: string,
    _index: number
  ): BreadcrumbItemData => {
    return {
      id: segment,
      label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      path: currentPath,
      icon: '📄',
      isActive: currentPath === location.pathname
    };
  };

  const handleBreadcrumbClick = (item: BreadcrumbItemData) => {
    if (enableDeepLinking && item.path !== location.pathname) {
      navigate(item.path);
    }
  };

  const handleHistoryItemClick = (item: BreadcrumbItemData) => {
    navigate(item.path);
    setShowDropdown(false);
  };

  const getVisibleBreadcrumbs = (): BreadcrumbItemData[] => {
    if (breadcrumbs.length <= maxItems) {
      return breadcrumbs;
    }

    const firstItem = breadcrumbs[0];
    const lastItem = breadcrumbs[breadcrumbs.length - 1];
    const middleItems = breadcrumbs.slice(1, -1);
    const visibleMiddleItems = middleItems.slice(-(maxItems - 2));

    return [firstItem, ...visibleMiddleItems, lastItem];
  };

  const visibleBreadcrumbs = getVisibleBreadcrumbs();

  return (
    <div className="smart-breadcrumbs">
      <Breadcrumb>
        <BreadcrumbList>
          {visibleBreadcrumbs.map((item, index) => (
            <React.Fragment key={item.id}>
              <BreadcrumbItem>
                {item.isActive ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {item.icon && <span>{item.icon}</span>}
                    <span>{item.label}</span>
                    {item.metadata && (
                      <Badge variant="secondary" className="text-xs">
                        {item.metadata.type}
                      </Badge>
                    )}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink 
                    onClick={() => handleBreadcrumbClick(item)}
                    className="flex items-center gap-2 cursor-pointer hover:text-primary"
                  >
                    {item.icon && <span>{item.icon}</span>}
                    <span>{item.label}</span>
                    {item.metadata && (
                      <Badge variant="outline" className="text-xs">
                        {item.metadata.type}
                      </Badge>
                    )}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < visibleBreadcrumbs.length - 1 && (
                <BreadcrumbSeparator />
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Navigation History Dropdown */}
      {showHistory && navigationHistory.length > 0 && (
        <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="ml-2"
            >
              📚 History
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {navigationHistory.map((item) => (
              <DropdownMenuItem 
                key={item.id}
                onClick={() => handleHistoryItemClick(item)}
                className="flex items-center gap-2"
              >
                {item.icon && <span>{item.icon}</span>}
                <span className="truncate">{item.label}</span>
                {item.metadata && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    {item.metadata.type}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}; 
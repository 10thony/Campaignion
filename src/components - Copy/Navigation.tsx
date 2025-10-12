import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import DarkModeToggle from "./DarkModeToggle";
import { AdminOnly } from "./AdminOnly";
import NotificationsIcon from "./NotificationsIcon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import "./Navigation.css";

interface NavigationProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { user } = useUser();
  const userRole = useQuery(api.users.getUserRole, { 
    clerkId: user?.id || "" 
  });

  // Query for active interactions to show indicator
  const activeInteractions = useQuery(api.interactions.subscribeToActiveInteractions);

  const isAdmin = userRole === "admin";
  const isAuthenticated = !!user;

  const toggleNavigation = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    {
      path: "/campaigns",
      label: "Campaigns",
      icon: "📚",
      title: "Campaigns"
    },
    {
      path: "/characters",
      label: "Characters",
      icon: "👥",
      title: "Characters"
    },
    {
      path: "/live-interactions",
      label: "Live Interactions",
      icon: "🎲",
      title: "Live Interactions",
      hasIndicator: true,
      indicatorCount: activeInteractions?.length || 0
    }
  ];

  const adminNavItems = [
    {
      path: "/items",
      label: "Items",
      icon: "📦",
      title: "Items"
    },
    {
      path: "/actions",
      label: "Actions",
      icon: "⚔️",
      title: "Actions"
    },
    {
      path: "/interactions",
      label: "Interactions",
      icon: "💬",
      title: "Interactions"
    },
    {
      path: "/locations",
      label: "Locations",
      icon: "🗺️",
      title: "Locations"
    },
    {
      path: "/quests",
      label: "Quests",
      icon: "📜",
      title: "Quests"
    },
    {
      path: "/maps",
      label: "Maps",
      icon: "🗺️",
      title: "Maps"
    },
    {
      path: "/monsters",
      label: "Monsters",
      icon: "👹",
      title: "Monsters"
    },
    {
      path: "/npcs",
      label: "NPCs",
      icon: "👤",
      title: "NPCs"
    },
    {
      path: "/factions",
      label: "Factions",
      icon: "🏛️",
      title: "Factions"
    },
    {
      path: "/timeline-events",
      label: "Timeline Events",
      icon: "📅",
      title: "Timeline Events"
    }
  ];

  const adminToolsItems = [
    {
      path: "/admin/users",
      label: "User Management",
      icon: "👥",
      title: "User Management"
    },
    {
      path: "/admin/analytics",
      label: "Analytics",
      icon: "📊",
      title: "Analytics"
    }
  ];

  return (
    <>
      <Button 
        variant="ghost"
        size="sm"
        className="nav-toggle"
        onClick={toggleNavigation}
        aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
      >
        {isCollapsed ? "☰" : "✕"}
      </Button>
      <nav className={cn("navigation", isCollapsed && "collapsed")}>
        <div className="nav-container">
          <span className="nav-brand" />
          <div className="nav-links">
            {/* Main Navigation Items */}
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "nav-link",
                  location.pathname.startsWith(item.path) && "active"
                )}
                title={item.title}
              >
                <span className="nav-link-content">
                  {isCollapsed ? item.icon : item.label}
                  {item.hasIndicator && item.indicatorCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="active-indicator"
                    >
                      {item.indicatorCount}
                    </Badge>
                  )}
                </span>
              </Link>
            ))}
            
            {/* Admin-only navigation items */}
            {isAdmin && (
              <>
                {adminNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "nav-link",
                      location.pathname.startsWith(item.path) && "active"
                    )}
                    title={item.title}
                  >
                    {isCollapsed ? item.icon : item.label}
                  </Link>
                ))}
              </>
            )}
            
            {/* Admin Tools Section */}
            <AdminOnly>
              <Separator className="nav-separator" />
              <div className="nav-section-title">
                {isCollapsed ? "⚡" : "Admin Tools"}
              </div>
              {adminToolsItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "nav-link",
                    location.pathname.startsWith(item.path) && "active"
                  )}
                  title={item.title}
                >
                  {isCollapsed ? item.icon : item.label}
                </Link>
              ))}
            </AdminOnly>
            
            <DarkModeToggle isCollapsed={isCollapsed} />
            {isAuthenticated && (
              <>
                <NotificationsIcon />
                <SignOutButton>
                  <Button 
                    variant="ghost" 
                    className="nav-link sign-out" 
                    title="Sign Out"
                  >
                    {isCollapsed ? "🚪" : "Sign Out"}
                  </Button>
                </SignOutButton>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;

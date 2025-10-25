import { useState } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ThemeToggle } from './theme/ThemeToggle'
import { Link, useRouterState } from '@tanstack/react-router'
import { 
  Menu, 
  X, 
  Scroll, 
  Users, 
  Swords, 
  BookOpen, 
  Package, 
  Map, 
  MapPin,
  Sparkles,
  FlaskConical,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigationItems = [
  { path: '/campaigns', label: 'Campaigns', icon: Scroll },
  { path: '/characters', label: 'Characters', icon: Users },
  { path: '/monsters', label: 'Monsters', icon: Swords },
  { path: '/quests', label: 'Quests', icon: BookOpen },
  { path: '/items', label: 'Items', icon: Package },
  { path: '/actions', label: 'Actions', icon: Zap },
  { path: '/battle-map', label: 'Battle Map', icon: Map, badge: 'Enhanced' },
  { path: '/maps', label: 'Maps', icon: MapPin, badge: 'Legacy' },
  { path: '/interactions', label: 'Interactions', icon: Sparkles },
  { path: '/live-demo', label: 'Live Demo', icon: FlaskConical },
] as const

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const router = useRouterState()
  const currentPath = router.location.pathname

  const handleLinkClick = () => {
    // Auto-collapse sidebar on mobile after clicking a link
    if (window.innerWidth < 1024) {
      setIsCollapsed(true)
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="glass"
        size="icon"
        className={cn(
          "fixed top-4 z-50 transition-all duration-300 hover:shadow-glow",
          isCollapsed ? "left-4" : "left-[260px] lg:left-[260px]"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen glass border-r transition-all duration-300 z-40 flex flex-col",
          isCollapsed ? "w-0 -translate-x-full" : "w-64"
        )}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Brand */}
          <div className="p-6 border-b border-border/50">
            <Link to="/" className="block hover:opacity-80 transition-all duration-300 hover:scale-105">
              <h1 className="text-xl font-bold mb-1 text-gradient">Campaignion</h1>
              <p className="text-xs text-muted-foreground">D&D 5e Campaign Manager</p>
            </Link>
          </div>

          {/* Navigation */}
          <SignedIn>
            <nav className="p-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.path
                
                return (
                  <Link key={item.path} to={item.path} onClick={handleLinkClick}>
                    <Button
                      variant={isActive ? 'gradient' : 'ghost'}
                      className={cn(
                        "w-full justify-start gap-3 transition-all duration-300",
                        isActive && "shadow-glow"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge === 'Enhanced' && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 animate-pulse">
                          New
                        </Badge>
                      )}
                      {item.badge === 'Legacy' && (
                        <Badge variant="outline" className="text-xs">
                          Old
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </SignedIn>

          <SignedOut>
            <div className="p-4">
              <SignInButton mode="modal">
                <Button variant="gradient" className="w-full">Sign in</Button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>

        {/* Footer */}
        <SignedIn>
          <div className="border-t border-border/50 p-4">
            <div className="flex items-center justify-between gap-2">
              <ThemeToggle />
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 rounded-lg"
                  }
                }}
              />
            </div>
          </div>
        </SignedIn>
      </aside>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  )
}


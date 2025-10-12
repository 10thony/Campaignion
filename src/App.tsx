import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { ThemeToggle } from './components/theme/ThemeToggle'
import { Outlet, Link, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useSyncUser } from './lib/clerkService'

const navigationItems = [
  { path: '/campaigns', label: 'Campaigns' },
  { path: '/monsters', label: 'Monsters' },
  { path: '/characters', label: 'Characters' },
  { path: '/quests', label: 'Quests' },
  { path: '/items', label: 'Items' },
  { path: '/battle-map', label: 'Battle Map', badge: 'Enhanced' },
  { path: '/maps', label: 'Maps', badge: 'Legacy' },
  { path: '/interactions', label: 'Interactions' },
  { path: '/live-demo', label: 'Live Demo' },
] as const

function App() {
  useSyncUser()
  const router = useRouterState()
  const currentPath = router.location.pathname

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <h1 className="text-xl font-bold">Campaignion</h1>
                <p className="text-sm text-muted-foreground">D&D 5e Campaign Manager</p>
              </Link>
            </div>
            
            <SignedIn>
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex space-x-2">
                  {navigationItems.map((item) => (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant={currentPath === item.path ? 'default' : 'ghost'}
                        size="sm"
                        className="capitalize gap-2"
                      >
                        {item.label}
                        {item.badge === 'Enhanced' && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
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
                  ))}
                </div>
                <ThemeToggle />
                <UserButton />
              </div>
            </SignedIn>
            
            <SignedOut>
              <div className="flex items-center">
                <SignInButton mode="modal">
                  <Button>Sign in</Button>
                </SignInButton>
              </div>
            </SignedOut>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      
      {/* Add Router DevTools in development */}
      {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
    </div>
  )
}

export default App
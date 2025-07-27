import { useState } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card'
import { Button } from './components/ui/button'
import { CampaignsPage } from './pages/CampaignsPage'
import { MonstersPage } from './pages/MonstersPage'
import { CharactersPage } from './pages/CharactersPage'
import { QuestsPage } from './pages/QuestsPage'
import { ItemsPage } from './pages/ItemsPage'

type Page = 'home' | 'campaigns' | 'characters' | 'monsters' | 'quests' | 'items' | 'locations' | 'maps'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  const renderPage = () => {
    switch (currentPage) {
      case 'campaigns':
        return <CampaignsPage />
      case 'monsters':
        return <MonstersPage />
      case 'characters':
        return <CharactersPage />
      case 'quests':
        return <QuestsPage />
      case 'items':
        return <ItemsPage />
      case 'locations':
        return <div className="container mx-auto py-6"><h1 className="text-3xl font-bold">Locations (Coming Soon)</h1></div>
      case 'maps':
        return <div className="container mx-auto py-6"><h1 className="text-3xl font-bold">Maps (Coming Soon)</h1></div>
      default:
        return (
          <>
            <SignedOut>
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Welcome to Campaignion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      The ultimate D&D 5e campaign management tool. Create campaigns, manage characters, 
                      track quests, and run epic adventures.
                    </p>
                    <SignInButton mode="modal">
                      <Button className="w-full">Get Started</Button>
                    </SignInButton>
                  </CardContent>
                </Card>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="px-4 py-6 sm:px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentPage('campaigns')}>
                    <CardHeader>
                      <CardTitle>Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Manage your D&D campaigns and adventures.
                      </p>
                      <Button>View Campaigns</Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentPage('characters')}>
                    <CardHeader>
                      <CardTitle>Characters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Create and manage player characters and NPCs.
                      </p>
                      <Button>View Characters</Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentPage('monsters')}>
                    <CardHeader>
                      <CardTitle>Monsters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Browse and create monsters for your encounters.
                      </p>
                      <Button>View Monsters</Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentPage('quests')}>
                    <CardHeader>
                      <CardTitle>Quests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Track quest progress and manage objectives.
                      </p>
                      <Button>View Quests</Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentPage('items')}>
                    <CardHeader>
                      <CardTitle>Items & Equipment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Manage magical items, weapons, and equipment.
                      </p>
                      <Button>View Items</Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentPage('locations')}>
                    <CardHeader>
                      <CardTitle>Locations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Explore and manage campaign locations.
                      </p>
                      <Button>View Locations</Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentPage('maps')}>
                    <CardHeader>
                      <CardTitle>Maps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Create and edit battle maps and world maps.
                      </p>
                      <Button>View Maps</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </SignedIn>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => setCurrentPage('home')}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <h1 className="text-xl font-bold">Campaignion</h1>
                <p className="text-sm text-muted-foreground">D&D 5e Campaign Manager</p>
              </button>
            </div>
            
            <SignedIn>
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex space-x-2">
                  {(['campaigns', 'monsters', 'characters', 'quests', 'items'] as const).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="capitalize"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
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
        {renderPage()}
      </main>
    </div>
  )
}

export default App 
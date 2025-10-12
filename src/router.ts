import { createRouter, createRoute, createRootRoute, Outlet, ErrorComponent } from '@tanstack/react-router'
import { CampaignsPage } from './pages/CampaignsPage'
import { CharactersPage } from './pages/CharactersPage'
import { MonstersPage } from './pages/MonstersPage'
import { QuestsPage } from './pages/QuestsPage'
import { ItemsPage } from './pages/ItemsPage'
import { MapsPage } from './pages/MapsPage'
import { InteractionsPage } from './pages/InteractionsPage'
import { LiveInteractionDemo } from './components/LiveInteractionDemo'
import { HomePage } from './pages/HomePage'
import { ImportDebugPage } from './pages/ImportDebugPage'
import { LocationsPage } from './pages/LocationsPage'
import { BattleMapPage } from './pages/BattleMapPage'
import { RootErrorComponent } from './components/ErrorBoundary'
import App from './App'

// Create the root route using App as the layout
const rootRoute = createRootRoute({
  component: App,
  errorComponent: RootErrorComponent,
})

// Create individual routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const campaignsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/campaigns',
  component: CampaignsPage,
})

const charactersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/characters',
  component: CharactersPage,
})

const monstersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/monsters',
  component: MonstersPage,
})

const questsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/quests',
  component: QuestsPage,
})

const itemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/items',
  component: ItemsPage,
})

const mapsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/maps',
  component: MapsPage,
})

const interactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/interactions',
  component: InteractionsPage,
})

const liveDemoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/live-demo',
  component: LiveInteractionDemo,
})

const importDebugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/import-debug',
  component: ImportDebugPage,
})

const locationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/locations',
  component: LocationsPage,
})

const battleMapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/battle-map',
  component: BattleMapPage,
})

// Create the route tree
const routeTree = rootRoute.addChildren([
  homeRoute,
  campaignsRoute,
  charactersRoute,
  monstersRoute,
  questsRoute,
  itemsRoute,
  mapsRoute,
  interactionsRoute,
  liveDemoRoute,
  importDebugRoute,
  locationsRoute,
  battleMapRoute,
])

// Create the router
export const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
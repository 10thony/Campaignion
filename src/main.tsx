import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { convex } from './lib/convex'
// tRPC imports removed - migrated to Convex
import { ThemeProvider } from './components/theme/ThemeProvider'
import { AuthenticationProvider } from './components/providers/AuthenticationProvider'
import { router } from './router'
import './index.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key")
}

// Query client for any remaining React Query usage
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthenticationProvider>
          <QueryClientProvider client={queryClient}>
            <DndProvider backend={HTML5Backend}>
              <ThemeProvider defaultTheme="system" storageKey="campaignion-ui-theme">
                <RouterProvider router={router} />
              </ThemeProvider>
            </DndProvider>
          </QueryClientProvider>
        </AuthenticationProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>,
) 
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { convex } from './lib/convex'
import { trpc, createTRPCClient } from './lib/trpc'
import { ThemeProvider } from './components/theme/ThemeProvider'
import App from './App'
import './index.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key")
}

// Create query client for tRPC
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create tRPC client with auth
function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  
  const trpcClient = React.useMemo(() => {
    return createTRPCClient(async () => {
      const token = await getToken();
      return token ? `Bearer ${token}` : '';
    });
  }, [getToken]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <TRPCProvider>
          <ThemeProvider defaultTheme="system" storageKey="campaignion-ui-theme">
            <App />
          </ThemeProvider>
        </TRPCProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </React.StrictMode>,
) 
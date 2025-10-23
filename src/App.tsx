import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useSyncUser } from './lib/clerkService'
import { Sidebar } from './components/Sidebar'
import { cn } from './lib/utils'

function App() {
  useSyncUser()
  // Start collapsed on mobile, expanded on desktop
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Modern background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />
      
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      
      <main 
        className={cn(
          "min-h-screen transition-all duration-300 py-6 px-4 sm:px-6 lg:px-8 relative z-10",
          isSidebarCollapsed ? "lg:ml-0" : "lg:ml-64"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      
      {/* Add Router DevTools in development */}
      {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
    </div>
  )
}

export default App
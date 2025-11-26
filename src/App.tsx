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
      {/* Vibrant blue-reddish gradient - Cerulean to Cherry Rose spectrum */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2e6f95]/20 via-[#723c70]/15 to-[#b7094c]/18 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tl from-[#0091ad]/12 via-transparent to-[#a01a58]/14 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(23,128,161,0.18),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(160,26,88,0.16),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(69,94,137,0.12),transparent_45%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(137,43,100,0.10),transparent_40%)] pointer-events-none" />
      
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
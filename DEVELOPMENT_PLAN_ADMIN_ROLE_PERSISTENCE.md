# Development Plan: Admin Role Persistence Issue

## Problem Statement

The user reports that despite seeing the "Setting up admin privileges..." notification, the admin role is not persisting in the UI. Specifically:

1. **Admin navigation button** (👑 Admin) is not appearing in the navigation bar
2. **Sample data panels** are not visible on entity pages
3. **Admin page** shows "Admin Access Required" instead of the admin dashboard

## Root Cause Analysis

### 1. **Timing Issue: React Query Cache vs Database Updates**

**Problem**: The `useAdminPermissions` hook uses `useQuery(api.users.getCurrentUser)` which caches the user data. When the `AutoAdminProvider` updates the user's role in the database, the React Query cache doesn't automatically invalidate, so the UI continues to show the old cached data.

**Evidence**:
- `useAdminPermissions` hook: `const user = useQuery(api.users.getCurrentUser)`
- `AutoAdminProvider` calls `forceUserToAdmin` mutation
- React Query cache holds the old user data with `role: "user"`

### 2. **Missing Cache Invalidation**

**Problem**: After the `forceUserToAdmin` mutation completes, there's no mechanism to invalidate the `getCurrentUser` query cache, so the UI doesn't reflect the updated role.

### 3. **Race Condition Between AutoAdminProvider and useAdminPermissions**

**Problem**: The `AutoAdminProvider` runs on every page load, but the `useAdminPermissions` hook might be called before the admin promotion completes, leading to inconsistent state.

## Solution Strategy

### Phase 1: Immediate Fix - Cache Invalidation

#### 1.1 Update AutoAdminProvider to Invalidate Cache
**File**: `src/components/AutoAdminProvider.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useMutation, useQueryClient } from 'convex/react'
import { api } from '../../convex/_generated/api'

const TARGET_ADMIN_CLERK_ID = "user_2z9b8vd97dQR6ddsQwYI9y7yi72"

export function AutoAdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const createUser = useMutation(api.users.createUser)
  const forceUserToAdmin = useMutation(api.users.forceUserToAdmin)
  const queryClient = useQueryClient()
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false)

  useEffect(() => {
    const setupUser = async () => {
      if (!isLoaded || !user) return
      
      try {
        setIsSettingUpAdmin(true)
        
        // Always ensure user exists in database
        await createUser({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          imageUrl: user.imageUrl || undefined,
        })

        // If this is the target admin user, force them to admin
        if (user.id === TARGET_ADMIN_CLERK_ID) {
          console.log('Auto-promoting target user to admin:', user.id)
          await forceUserToAdmin({
            clerkId: user.id
          })
          console.log('Admin promotion completed for:', user.id)
          
          // Invalidate the getCurrentUser query to refresh the cache
          await queryClient.invalidateQueries({ queryKey: ['api.users.getCurrentUser'] })
          console.log('Cache invalidated for getCurrentUser')
        }
      } catch (error) {
        console.error('Error setting up user:', error)
      } finally {
        setIsSettingUpAdmin(false)
      }
    }

    setupUser()
  }, [isLoaded, user, createUser, forceUserToAdmin, queryClient])

  return (
    <>
      {isSettingUpAdmin && user?.id === TARGET_ADMIN_CLERK_ID && (
        <div className="fixed top-4 right-4 bg-blue-100 border border-blue-300 text-blue-800 px-3 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">Setting up admin privileges...</span>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
```

#### 1.2 Alternative: Force Refetch in useAdminPermissions
**File**: `src/hooks/useAdminPermissions.ts`

```typescript
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function useAdminPermissions() {
  const user = useQuery(api.users.getCurrentUser, {}, { 
    refetchInterval: 2000, // Refetch every 2 seconds during admin setup
    refetchIntervalInBackground: false 
  })
  
  return {
    isAdmin: user?.role === 'admin',
    isLoading: user === undefined,
    user
  }
}
```

### Phase 2: Enhanced Debugging and Monitoring

#### 2.1 Add Debug Logging to useAdminPermissions
**File**: `src/hooks/useAdminPermissions.ts`

```typescript
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

export function useAdminPermissions() {
  const user = useQuery(api.users.getCurrentUser)
  
  // Debug logging
  console.log('useAdminPermissions - Current user:', {
    userId: user?._id,
    clerkId: user?.clerkId,
    email: user?.email,
    role: user?.role,
    isAdmin: user?.role === 'admin',
    isLoading: user === undefined
  })
  
  return {
    isAdmin: user?.role === 'admin',
    isLoading: user === undefined,
    user
  }
}
```

#### 2.2 Add Debug Logging to App.tsx
**File**: `src/App.tsx`

```typescript
function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const { isAdmin, isLoading: adminLoading, user } = useAdminPermissions()

  // Debug logging
  console.log('App - Admin state:', {
    isAdmin,
    adminLoading,
    userRole: user?.role,
    userEmail: user?.email,
    currentPage
  })

  // ... rest of component
}
```

### Phase 3: Robust Admin State Management

#### 3.1 Create Admin State Context
**File**: `src/contexts/AdminContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

interface AdminContextType {
  isAdmin: boolean
  isLoading: boolean
  user: any
  refreshAdminStatus: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const user = useQuery(api.users.getCurrentUser)
  const [forceRefresh, setForceRefresh] = useState(0)

  const refreshAdminStatus = () => {
    setForceRefresh(prev => prev + 1)
  }

  useEffect(() => {
    if (clerkUser?.id === "user_2z9b8vd97dQR6ddsQwYI9y7yi72" && user?.role !== 'admin') {
      // If target admin user but not admin, trigger refresh
      const interval = setInterval(() => {
        refreshAdminStatus()
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [clerkUser?.id, user?.role])

  const value = {
    isAdmin: user?.role === 'admin',
    isLoading: !clerkLoaded || user === undefined,
    user,
    refreshAdminStatus
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
```

#### 3.2 Update App.tsx to Use Admin Context
**File**: `src/App.tsx`

```typescript
import { AdminProvider, useAdmin } from './contexts/AdminContext'

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const { isAdmin, isLoading: adminLoading } = useAdmin()

  // ... rest of component logic
}

function App() {
  return (
    <AdminProvider>
      <AutoAdminProvider>
        <AppContent />
      </AutoAdminProvider>
    </AdminProvider>
  )
}
```

### Phase 4: Database Verification and Fallback

#### 4.1 Add Database Verification Query
**File**: `convex/users.ts`

```typescript
// Verify admin status for debugging
export const verifyAdminStatus = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .first();

    return {
      found: !!user,
      role: user?.role,
      email: user?.email,
      clerkId: user?.clerkId
    };
  },
});
```

#### 4.2 Add Debug Component
**File**: `src/components/AdminDebugPanel.tsx`

```typescript
import { useQuery } from 'convex/react'
import { useUser } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { api } from '../../convex/_generated/api'

export function AdminDebugPanel() {
  const { user } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser)
  const adminStatus = useQuery(api.users.verifyAdminStatus, 
    { clerkId: user?.id || '' }
  )

  if (!user || user.id !== "user_2z9b8vd97dQR6ddsQwYI9y7yi72") {
    return null
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">Admin Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="space-y-2">
          <div><strong>Clerk ID:</strong> {user.id}</div>
          <div><strong>Current User Role:</strong> {currentUser?.role || 'undefined'}</div>
          <div><strong>Database Role:</strong> {adminStatus?.role || 'undefined'}</div>
          <div><strong>User Found:</strong> {adminStatus?.found ? 'Yes' : 'No'}</div>
          <div><strong>Email:</strong> {adminStatus?.email || 'undefined'}</div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Phase 5: Testing and Validation

#### 5.1 Test Cases
1. **Fresh Sign-in Test**
   - Sign out completely
   - Sign in with target admin user
   - Verify admin privileges appear within 5 seconds

2. **Page Refresh Test**
   - Sign in as admin
   - Refresh the page
   - Verify admin privileges persist

3. **Cache Invalidation Test**
   - Monitor browser console for cache invalidation logs
   - Verify `getCurrentUser` query refetches after admin promotion

4. **Database Verification Test**
   - Use debug panel to verify database state
   - Confirm role is actually "admin" in database

#### 5.2 Validation Checklist
- [ ] Admin navigation button appears after sign-in
- [ ] Sample data panels are visible on entity pages
- [ ] Admin page shows user management dashboard
- [ ] Console logs show successful admin promotion
- [ ] Console logs show cache invalidation
- [ ] Database contains correct admin role
- [ ] No race conditions between components

### Phase 6: Implementation Priority

#### 6.1 Immediate (Phase 1)
1. **Add cache invalidation** to AutoAdminProvider
2. **Add debug logging** to useAdminPermissions and App.tsx
3. **Test the fix** with fresh sign-in

#### 6.2 Short-term (Phase 2-3)
1. **Implement AdminContext** for better state management
2. **Add database verification** queries
3. **Create debug panel** for troubleshooting

#### 6.3 Long-term (Phase 4+)
1. **Optimize cache strategy** for better performance
2. **Add admin role persistence** across sessions
3. **Implement role change notifications**

## Expected Outcome

After implementing Phase 1 (cache invalidation), the user should see:

1. **Immediate admin privileges** after the "Setting up admin privileges..." notification disappears
2. **👑 Admin button** in the navigation bar
3. **Sample data panels** on all entity pages (Campaigns, Characters, Monsters, Items, Quests)
4. **Admin dashboard** accessible via the Admin button

The key insight is that **React Query caching** is preventing the UI from reflecting the database changes, and we need to explicitly invalidate the cache after the admin role is updated. 
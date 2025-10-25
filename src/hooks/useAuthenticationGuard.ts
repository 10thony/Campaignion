import { useUser, useAuth } from '@clerk/clerk-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { DatabaseUser } from '../lib/clerkService'
import React from 'react'

/**
 * Critical authentication guard hook that ALL modals must use
 * Returns loading state and user data - components should handle loading gracefully
 * 
 * As a DM, I know that access control is paramount for campaign management.
 * This hook ensures only authenticated users can access any modal functionality.
 */
export function useAuthenticationGuard(): {
  user: NonNullable<ReturnType<typeof useUser>['user']> | null
  isSignedIn: boolean
  isLoading: boolean
} {
  const { user, isSignedIn } = useUser()
  const { isLoaded } = useAuth()
  
  // Return loading state while Clerk is still loading
  if (!isLoaded) {
    return { user: null, isSignedIn: false, isLoading: true }
  }
  
  // Return authentication state once loaded
  if (!isSignedIn || !user) {
    return { user: null, isSignedIn: false, isLoading: false }
  }
  
  return { user, isSignedIn: true, isLoading: false }
}

/**
 * Enhanced authentication hook with database user context
 * Provides full user data including role and permissions
 */
export function useAuthenticatedUser(): {
  user: NonNullable<ReturnType<typeof useUser>['user']> | null
  databaseUser: DatabaseUser | null
  isLoading: boolean
  isSignedIn: boolean
} {
  const { user, isSignedIn, isLoading: authLoading } = useAuthenticationGuard()
  
  // Get database user record with role information
  const databaseUser = useQuery(api.users.getCurrentUser, isSignedIn ? {} : "skip")
  
  // Ensure admin role for app creator
  const ensureAdminRole = useMutation(api.users.ensureAdminRole)
  
  // If user exists but doesn't have admin role, try to ensure admin role
  React.useEffect(() => {
    if (databaseUser && databaseUser.role === "user") {
      ensureAdminRole().catch(console.error)
    }
  }, [databaseUser, ensureAdminRole])
  
  return {
    user,
    databaseUser: databaseUser || null,
    isLoading: authLoading || (isSignedIn && databaseUser === undefined),
    isSignedIn
  }
}

/**
 * Modal access control hook with authorization logic
 * Implements campaign-specific permissions for modal states
 */
export function useModalAccess(
  mode: "read" | "create" | "edit",
  entityType: string,
  entity?: { _id?: string; campaignId?: string; dmId?: string }
) {
  const { user, databaseUser, isLoading, isSignedIn } = useAuthenticatedUser()
  
  // Get user's campaigns for permission checking
  const userCampaigns = useQuery(api.campaigns.getMyCampaigns)
  
  // If still loading, return loading state
  if (isLoading) {
    return { 
      user, 
      databaseUser: null, 
      canAccess: false,
      isAdmin: false,
      isCampaignMaster: () => false,
      isPlayer: () => false,
      isLoading: true
    }
  }
  
  // If no database user, throw error with helpful message
  if (!databaseUser) {
    throw new Error("User profile not found. Please try refreshing the page or contact support.")
  }
  
  const canAccess = (() => {
    // Admins have full access to everything
    if (databaseUser.role === 'admin') return true
    
    // For campaign creation, any authenticated user can create campaigns
    if (entityType === "campaign" && mode === "create") {
      return true
    }
    
    // For campaign-scoped entities, check campaign permissions
    if (entity?.campaignId) {
      const campaign = userCampaigns?.find(c => c._id === entity.campaignId)
      if (!campaign) return false
      
      const isDM = campaign.dmId === databaseUser.clerkId
      const isPlayer = campaign.participantUserIds?.includes(databaseUser._id)
      
      switch (mode) {
        case "read":
          return isDM || isPlayer
        case "create":
        case "edit":
          return isDM
        default:
          return false
      }
    }
    
    // For campaign entities without campaignId (like when editing a campaign itself)
    if (entityType === "campaign" && entity?._id) {
      const campaign = userCampaigns?.find(c => c._id === entity._id)
      if (!campaign) return false
      
      const isDM = campaign.dmId === databaseUser.clerkId
      
      switch (mode) {
        case "read":
          return isDM || campaign.participantUserIds?.includes(databaseUser._id)
        case "edit":
          return isDM
        default:
          return false
      }
    }
    
    // For non-campaign entities, require admin or ownership
    switch (mode) {
      case "read":
        return true // All authenticated users can read
      case "create":
        return true // All authenticated users can create
      case "edit":
        return databaseUser.role === 'admin' // Only admins can edit non-campaign entities
      default:
        return false
    }
  })()
  
  if (!canAccess) {
    throw new Error(`Insufficient permissions for ${mode} access to ${entityType}`)
  }
  
  return { 
    user, 
    databaseUser, 
    canAccess,
    isAdmin: databaseUser?.role === 'admin',
    isCampaignMaster: (campaignId: string) => {
      const campaign = userCampaigns?.find(c => c._id === campaignId)
      return campaign?.dmId === databaseUser?.clerkId
    },
    isPlayer: (campaignId: string) => {
      const campaign = userCampaigns?.find(c => c._id === campaignId)
      return campaign?.participantUserIds?.includes(databaseUser?._id || "")
    },
    isLoading: false
  }
}
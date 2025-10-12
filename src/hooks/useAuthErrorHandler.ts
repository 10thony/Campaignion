import { useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useConvexAuth } from 'convex/react'

interface AuthError {
  code: string
  message: string
  originalError?: Error
}

interface UseAuthErrorHandlerOptions {
  onSessionExpired?: () => void
  onUnauthorized?: () => void
  onAuthError?: (error: AuthError) => void
  showToast?: (message: string, type: 'error' | 'warning' | 'info') => void
}

export function useAuthErrorHandler({
  onSessionExpired,
  onUnauthorized,
  onAuthError,
  showToast
}: UseAuthErrorHandlerOptions = {}) {
  const { isLoaded: isClerkLoaded, isSignedIn, signOut, getToken } = useAuth()
  const { isLoading: isConvexLoading, isAuthenticated: isConvexAuthenticated } = useConvexAuth()

  const handleAuthError = useCallback((error: any) => {
    console.error('Authentication error:', error)
    
    const authError: AuthError = {
      code: error.code || 'UNKNOWN_AUTH_ERROR',
      message: error.message || 'An authentication error occurred',
      originalError: error
    }

    // Handle different types of authentication errors
    switch (error.code) {
      case 'Unauthenticated':
      case 'UNAUTHENTICATED':
        showToast?.('Your session has expired. Please sign in again.', 'warning')
        onSessionExpired?.()
        break
        
      case 'UNAUTHORIZED':
        showToast?.('You are not authorized to perform this action.', 'error')
        onUnauthorized?.()
        break
        
      case 'INVALID_TOKEN':
      case 'TOKEN_EXPIRED':
        showToast?.('Your session token is invalid. Please sign in again.', 'warning')
        onSessionExpired?.()
        break
        
      case 'NETWORK_ERROR':
        showToast?.('Network error. Please check your connection and try again.', 'error')
        break
        
      default:
        // Handle Convex authentication errors that might come as strings
        if (typeof error === 'string') {
          if (error.includes('Unauthenticated') || error.includes('authentication')) {
            showToast?.('Authentication error. Please sign in again.', 'warning')
            onSessionExpired?.()
          } else {
            showToast?.('An unexpected error occurred.', 'error')
          }
        } else {
          showToast?.('An unexpected authentication error occurred.', 'error')
        }
        break
    }

    onAuthError?.(authError)
  }, [onSessionExpired, onUnauthorized, onAuthError, showToast])

  // Monitor authentication state
  useEffect(() => {
    if (isClerkLoaded && !isConvexLoading) {
      // If Clerk says we're signed in but Convex says we're not authenticated
      if (isSignedIn && !isConvexAuthenticated) {
        console.warn('Authentication state mismatch detected')
        console.log('Clerk state:', { isSignedIn, isLoaded: isClerkLoaded })
        console.log('Convex state:', { isConvexAuthenticated, isLoading: isConvexLoading })
        
        // Try to get the token to debug the issue
        getToken({ template: 'convex', skipCache: true })
          .then((token) => {
            if (token) {
              console.log('Clerk token retrieved successfully for "convex" template')
              // Token exists, so this might be a backend configuration issue
              showToast?.('Authentication configuration issue detected. Please check your Convex auth setup.', 'warning')
            } else {
              console.error('No token received from Clerk')
              showToast?.('Authentication token not available. Please sign in again.', 'warning')
              handleAuthError({
                code: 'NO_TOKEN',
                message: 'No authentication token available from Clerk'
              })
            }
          })
          .catch((error) => {
            console.error('Failed to refresh token:', error)
            showToast?.('Failed to refresh authentication token. Please sign in again.', 'error')
            handleAuthError({
              code: 'TOKEN_REFRESH_FAILED',
              message: 'Failed to refresh authentication token'
            })
          })
      }
    }
  }, [isClerkLoaded, isConvexLoading, isSignedIn, isConvexAuthenticated, getToken, handleAuthError, showToast])

  const signOutUser = useCallback(async () => {
    try {
      await signOut()
      showToast?.('You have been signed out.', 'info')
    } catch (error) {
      console.error('Sign out error:', error)
      showToast?.('Error during sign out. Please refresh the page.', 'error')
    }
  }, [signOut, showToast])

  const refreshSession = useCallback(async () => {
    try {
      await getToken({ skipCache: true })
      showToast?.('Session refreshed successfully.', 'info')
      return true
    } catch (error) {
      console.error('Session refresh failed:', error)
      handleAuthError(error)
      return false
    }
  }, [getToken, showToast, handleAuthError])

  return {
    handleAuthError,
    signOutUser,
    refreshSession,
    isAuthenticated: isSignedIn && isConvexAuthenticated,
    isLoading: !isClerkLoaded || isConvexLoading
  }
}
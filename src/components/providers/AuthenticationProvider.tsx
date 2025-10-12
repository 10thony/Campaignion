import React, { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler'
import { useSessionMonitor } from '@/hooks/useSessionMonitor'
import { SessionExpirationModal } from '@/components/modals/SessionExpirationModal'
import { useAuth } from '@clerk/clerk-react'

interface AuthenticationContextType {
  handleAuthError: (error: any) => void
  showSessionWarning: boolean
  isAuthenticated: boolean
  isLoading: boolean
  signOutUser: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthenticationContext = createContext<AuthenticationContextType | undefined>(undefined)

interface AuthenticationProviderProps {
  children: React.ReactNode
  showToast?: (message: string, type: 'error' | 'warning' | 'info') => void
}

export function AuthenticationProvider({ 
  children, 
  showToast 
}: AuthenticationProviderProps) {
  const { signOut, isLoaded: isAuthLoaded } = useAuth()
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0)

  // Custom toast function if none provided
  const defaultShowToast = useCallback((message: string, type: 'error' | 'warning' | 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`)
    // You can replace this with your preferred toast library
    // For example: toast[type](message) if using react-hot-toast
  }, [])

  const toastFn = showToast || defaultShowToast

  const handleSessionExpiring = useCallback((timeLeft: number) => {
    setSessionTimeRemaining(timeLeft)
    setShowSessionModal(true)
  }, [])

  const handleSessionExpired = useCallback(() => {
    setShowSessionModal(false)
    toastFn('Your session has expired. Please sign in again.', 'warning')
    signOut()
  }, [toastFn, signOut])

  const handleSessionRefreshed = useCallback(() => {
    setShowSessionModal(false)
    toastFn('Session extended successfully.', 'info')
  }, [toastFn])

  // Session monitoring
  const { sessionInfo, refreshSession, formatTimeRemaining } = useSessionMonitor({
    warningTimeMinutes: 5,
    checkIntervalSeconds: 30,
    onSessionExpiring: handleSessionExpiring,
    onSessionExpired: handleSessionExpired,
    onSessionRefreshed: handleSessionRefreshed
  })

  // Authentication error handling
  const { handleAuthError, signOutUser, isAuthenticated, isLoading } = useAuthErrorHandler({
    onSessionExpired: handleSessionExpired,
    onUnauthorized: () => {
      toastFn('You are not authorized to perform this action.', 'error')
    },
    onAuthError: (error) => {
      console.error('Authentication error:', error)
      // Don't show toast for authentication errors during initial load
      if (error.message?.includes('Not authenticated') && !isAuthLoaded) {
        return
      }
      toastFn('Authentication error occurred. Please try refreshing the page.', 'error')
    },
    showToast: toastFn
  })

  // Global error handler for Convex errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error
      
      // Check if this is a Convex authentication error
      if (error && (
        error.message?.includes('Unauthenticated') ||
        error.message?.includes('authentication') ||
        error.message?.includes('UNAUTHORIZED') ||
        error.code === 'Unauthenticated'
      )) {
        handleAuthError(error)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      
      // Check if this is a Convex authentication error
      if (error && (
        error.message?.includes('Unauthenticated') ||
        error.message?.includes('authentication') ||
        error.message?.includes('UNAUTHORIZED') ||
        error.code === 'Unauthenticated'
      )) {
        handleAuthError(error)
        event.preventDefault() // Prevent the error from being logged to console
      }
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [handleAuthError])

  const handleExtendSession = useCallback(async (): Promise<boolean> => {
    const success = await refreshSession()
    if (success) {
      setShowSessionModal(false)
    }
    return success
  }, [refreshSession])

  const handleModalSignOut = useCallback(() => {
    setShowSessionModal(false)
    signOutUser()
  }, [signOutUser])

  const contextValue: AuthenticationContextType = {
    handleAuthError,
    showSessionWarning: sessionInfo.isExpiringSoon,
    isAuthenticated,
    isLoading,
    signOutUser,
    refreshSession
  }

  return (
    <AuthenticationContext.Provider value={contextValue}>
      {children}
      
      <SessionExpirationModal
        isOpen={showSessionModal}
        timeRemaining={sessionTimeRemaining}
        onExtendSession={handleExtendSession}
        onSignOut={handleModalSignOut}
        onClose={() => setShowSessionModal(false)}
        autoSignOutAfter={60}
      />
    </AuthenticationContext.Provider>
  )
}

export function useAuthentication() {
  const context = useContext(AuthenticationContext)
  if (context === undefined) {
    throw new Error('useAuthentication must be used within an AuthenticationProvider')
  }
  return context
}

// Higher-order component to wrap components that need authentication error handling
export function withAuthErrorHandling<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthErrorHandledComponent(props: P) {
    const { handleAuthError } = useAuthentication()
    
    // Wrap any async operations in error handling
    const wrapAsyncCall = useCallback(async (asyncFn: () => Promise<any>) => {
      try {
        return await asyncFn()
      } catch (error) {
        handleAuthError(error)
        throw error
      }
    }, [handleAuthError])

    return (
      <WrappedComponent 
        {...props} 
        wrapAsyncCall={wrapAsyncCall}
        handleAuthError={handleAuthError}
      />
    )
  }
}
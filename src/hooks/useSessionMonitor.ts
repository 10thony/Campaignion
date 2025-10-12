import { useEffect, useCallback, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

interface SessionInfo {
  expiresAt?: number
  timeUntilExpiry?: number
  isExpiringSoon: boolean
  isExpired: boolean
}

interface UseSessionMonitorOptions {
  warningTimeMinutes?: number // Show warning this many minutes before expiry
  checkIntervalSeconds?: number // How often to check session status
  onSessionExpiring?: (timeLeft: number) => void
  onSessionExpired?: () => void
  onSessionRefreshed?: () => void
}

export function useSessionMonitor({
  warningTimeMinutes = 5,
  checkIntervalSeconds = 30,
  onSessionExpiring,
  onSessionExpired,
  onSessionRefreshed
}: UseSessionMonitorOptions = {}) {
  const { isSignedIn, getToken, session } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isExpiringSoon: false,
    isExpired: false
  })
  const intervalRef = useRef<NodeJS.Timeout>()
  const lastWarningRef = useRef<number>(0)

  const checkSessionStatus = useCallback(async () => {
    if (!isSignedIn || !session) {
      setSessionInfo({
        isExpiringSoon: false,
        isExpired: true
      })
      return
    }

    try {
      // Get fresh token to check expiry
      const token = await getToken({ skipCache: false })
      if (!token) {
        setSessionInfo({
          isExpiringSoon: false,
          isExpired: true
        })
        onSessionExpired?.()
        return
      }

      // Decode JWT to get expiry time (basic parsing)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const expiresAt = payload.exp * 1000 // Convert to milliseconds
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now
        const warningThreshold = warningTimeMinutes * 60 * 1000 // Convert to milliseconds

        const isExpired = timeUntilExpiry <= 0
        const isExpiringSoon = timeUntilExpiry <= warningThreshold && timeUntilExpiry > 0

        setSessionInfo({
          expiresAt,
          timeUntilExpiry: Math.max(0, timeUntilExpiry),
          isExpiringSoon,
          isExpired
        })

        // Trigger callbacks
        if (isExpired) {
          onSessionExpired?.()
        } else if (isExpiringSoon) {
          // Only trigger warning once per minute to avoid spam
          const now = Date.now()
          if (now - lastWarningRef.current > 60000) {
            lastWarningRef.current = now
            onSessionExpiring?.(timeUntilExpiry)
          }
        }
      } catch (tokenParseError) {
        console.error('Failed to parse token:', tokenParseError)
        // Token might be malformed, treat as expired
        setSessionInfo({
          isExpiringSoon: false,
          isExpired: true
        })
        onSessionExpired?.()
      }
    } catch (error) {
      console.error('Error checking session status:', error)
      // If we can't get a token, assume session issues
      setSessionInfo({
        isExpiringSoon: false,
        isExpired: true
      })
    }
  }, [isSignedIn, session, getToken, warningTimeMinutes, onSessionExpiring, onSessionExpired])

  const refreshSession = useCallback(async () => {
    try {
      const newToken = await getToken({ skipCache: true })
      if (newToken) {
        onSessionRefreshed?.()
        // Immediately check the new session status
        await checkSessionStatus()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to refresh session:', error)
      return false
    }
  }, [getToken, onSessionRefreshed, checkSessionStatus])

  // Start monitoring when signed in
  useEffect(() => {
    if (isSignedIn) {
      // Check immediately
      checkSessionStatus()

      // Set up interval checking
      intervalRef.current = setInterval(checkSessionStatus, checkIntervalSeconds * 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    } else {
      // Clear interval if not signed in
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
      
      setSessionInfo({
        isExpiringSoon: false,
        isExpired: false
      })
    }
  }, [isSignedIn, checkSessionStatus, checkIntervalSeconds])

  // Format time remaining for display
  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }, [])

  return {
    sessionInfo,
    refreshSession,
    formatTimeRemaining,
    isMonitoring: isSignedIn && !!intervalRef.current
  }
}
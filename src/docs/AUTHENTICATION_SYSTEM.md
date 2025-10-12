# Authentication System Documentation

## Overview

This authentication system provides comprehensive session management, automatic error handling, and user-friendly session expiration handling for the Campaignion D&D application.

## Features

- **Automatic Convex Authentication Error Handling**: Catches and handles authentication errors globally
- **Session Monitoring**: Monitors session expiration and warns users before sessions expire
- **Session Extension**: Allows users to extend their sessions without losing work
- **Auto Sign-out**: Automatically signs users out when sessions expire
- **Global Error Handling**: Catches unhandled authentication errors throughout the app

## Components

### 1. AuthenticationProvider

The main provider that wraps your application and provides authentication context.

```tsx
import { AuthenticationProvider } from '@/components/providers/AuthenticationProvider'

function App() {
  return (
    <AuthenticationProvider showToast={yourToastFunction}>
      {/* Your app components */}
    </AuthenticationProvider>
  )
}
```

### 2. Session Monitoring Hooks

#### `useSessionMonitor`

Monitors session status and triggers warnings/expiration events.

```tsx
import { useSessionMonitor } from '@/hooks/useSessionMonitor'

function MyComponent() {
  const { sessionInfo, refreshSession, formatTimeRemaining } = useSessionMonitor({
    warningTimeMinutes: 5,
    onSessionExpiring: (timeLeft) => console.log('Session expiring in:', timeLeft),
    onSessionExpired: () => console.log('Session expired!')
  })
  
  return (
    <div>
      {sessionInfo.isExpiringSoon && (
        <div>Session expires in: {formatTimeRemaining(sessionInfo.timeUntilExpiry!)}</div>
      )}
    </div>
  )
}
```

#### `useAuthErrorHandler`

Handles authentication errors and provides auth utilities.

```tsx
import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler'

function MyComponent() {
  const { handleAuthError, signOutUser, refreshSession, isAuthenticated } = useAuthErrorHandler({
    onSessionExpired: () => console.log('Session expired'),
    showToast: (message, type) => toast[type](message)
  })
  
  // Use handleAuthError in try/catch blocks
  try {
    await someConvexFunction()
  } catch (error) {
    handleAuthError(error)
  }
}
```

### 3. Enhanced Convex Hooks

#### `useQueryWithAuth` & `useMutationWithAuth`

Drop-in replacements for Convex's `useQuery` and `useMutation` with automatic error handling.

```tsx
import { useQueryWithAuth, useMutationWithAuth } from '@/hooks/useConvexWithAuth'
import { api } from '../../convex/_generated/api'

function MyComponent() {
  // Automatically handles auth errors
  const characters = useQueryWithAuth(api.characters.getMyCharacters)
  const createCharacter = useMutationWithAuth(api.characters.createPlayerCharacter)
  
  const handleCreate = async () => {
    try {
      await createCharacter({ /* character data */ })
    } catch (error) {
      // Auth errors are already handled, this catches other errors
      console.error('Non-auth error:', error)
    }
  }
}
```

#### `useConvexErrorHandler`

For wrapping custom Convex operations.

```tsx
import { useConvexErrorHandler } from '@/hooks/useConvexWithAuth'

function MyComponent() {
  const { wrapConvexCall } = useConvexErrorHandler()
  
  const handleCustomOperation = async () => {
    await wrapConvexCall(async () => {
      // Any Convex operation
      const result = await convexClient.query(api.some.function)
      return result
    })
  }
}
```

### 4. Higher-Order Component

#### `withAuthErrorHandling`

Wraps components to provide automatic auth error handling.

```tsx
import { withAuthErrorHandling } from '@/components/providers/AuthenticationProvider'

interface MyComponentProps {
  // your props
  wrapAsyncCall?: (fn: () => Promise<any>) => Promise<any>
  handleAuthError?: (error: any) => void
}

function MyComponent({ wrapAsyncCall, handleAuthError }: MyComponentProps) {
  const handleOperation = async () => {
    if (wrapAsyncCall) {
      await wrapAsyncCall(async () => {
        // Your async operation
      })
    }
  }
  
  return <div>{/* component content */}</div>
}

export default withAuthErrorHandling(MyComponent)
```

## Session Expiration Modal

The system automatically shows a modal when sessions are about to expire:

- **Warning Time**: Shows 5 minutes before expiration (configurable)
- **Auto Sign-out**: Automatically signs out after 60 seconds if no action taken
- **Options**: Users can extend session or sign out manually

## Error Handling

The system handles these authentication errors automatically:

- `Unauthenticated` - Session expired or invalid
- `UNAUTHORIZED` - User lacks permissions
- `INVALID_TOKEN` - Token is malformed or expired
- `TOKEN_EXPIRED` - Token has expired
- `NETWORK_ERROR` - Connection issues

## Configuration Options

### AuthenticationProvider Props

```tsx
interface AuthenticationProviderProps {
  children: React.ReactNode
  showToast?: (message: string, type: 'error' | 'warning' | 'info') => void
}
```

### useSessionMonitor Options

```tsx
interface UseSessionMonitorOptions {
  warningTimeMinutes?: number // Default: 5
  checkIntervalSeconds?: number // Default: 30
  onSessionExpiring?: (timeLeft: number) => void
  onSessionExpired?: () => void
  onSessionRefreshed?: () => void
}
```

### useAuthErrorHandler Options

```tsx
interface UseAuthErrorHandlerOptions {
  onSessionExpired?: () => void
  onUnauthorized?: () => void
  onAuthError?: (error: AuthError) => void
  showToast?: (message: string, type: 'error' | 'warning' | 'info') => void
}
```

## Migration Guide

### Existing Components

1. **Replace Convex hooks**:
   ```tsx
   // Before
   import { useQuery, useMutation } from 'convex/react'
   
   // After  
   import { useQueryWithAuth, useMutationWithAuth } from '@/hooks/useConvexWithAuth'
   ```

2. **Add error handling to existing try/catch blocks**:
   ```tsx
   import { useAuthentication } from '@/components/providers/AuthenticationProvider'
   
   function MyComponent() {
     const { handleAuthError } = useAuthentication()
     
     try {
       await someOperation()
     } catch (error) {
       handleAuthError(error) // Add this line
       // Your existing error handling
     }
   }
   ```

3. **Use the context for auth state**:
   ```tsx
   import { useAuthentication } from '@/components/providers/AuthenticationProvider'
   
   function MyComponent() {
     const { isAuthenticated, isLoading } = useAuthentication()
     
     if (isLoading) return <Loading />
     if (!isAuthenticated) return <SignIn />
     
     return <YourComponent />
   }
   ```

## Best Practices

1. **Use Enhanced Hooks**: Always use `useQueryWithAuth` and `useMutationWithAuth` instead of the base Convex hooks
2. **Handle Non-Auth Errors**: The system only handles auth errors automatically; handle business logic errors separately
3. **Test Session Expiration**: Test the session expiration flow during development
4. **Monitor Performance**: The session monitoring runs every 30 seconds by default; adjust if needed
5. **Provide Feedback**: Use the `showToast` prop to provide user feedback for all auth events

## Troubleshooting

### Common Issues

1. **Session Modal Not Showing**: Ensure `AuthenticationProvider` is correctly placed in your component tree
2. **Auth Errors Not Handled**: Check that you're using the enhanced hooks or calling `handleAuthError` manually
3. **Multiple Modals**: The system prevents multiple session modals; check for competing auth providers
4. **Token Refresh Failing**: Verify Clerk configuration and network connectivity

### Debug Mode

Add this to your development environment to see auth events:

```tsx
<AuthenticationProvider 
  showToast={(message, type) => {
    console.log(`[AUTH ${type}]: ${message}`)
    // Your toast implementation
  }}
>
```

## Environment Variables

Ensure these are set:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_CONVEX_URL=your_convex_url
```
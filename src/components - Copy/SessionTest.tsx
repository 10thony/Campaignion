import React from 'react';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useSessionLogger } from '../hooks/useSessionLogger';
import { useUser } from '@clerk/clerk-react';

export const SessionTest: React.FC = () => {
  const { user } = useUser();
  const { logActivity } = useSessionLogger();
  const { resetTimer, lastActivity, isWarningShown } = useSessionTimeout({
    timeoutMinutes: 1, // Short timeout for testing
    warningMinutes: 0.5, // 30 seconds warning
    onWarning: () => {
      console.log('Session warning triggered');
      logActivity('session_warning', { message: 'Session warning shown' });
    },
    onTimeout: () => {
      console.log('Session timeout triggered');
      logActivity('session_timeout', { message: 'Session timed out' });
    }
  });

  const handleTestActivity = () => {
    logActivity('test_activity', { message: 'Manual test activity' });
    resetTimer();
  };

  if (!user) {
    return <div>Please sign in to test session management</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Session Management Test</h2>
      <div style={{ marginBottom: '1rem' }}>
        <p><strong>User:</strong> {user.emailAddresses[0]?.emailAddress}</p>
        <p><strong>Last Activity:</strong> {new Date(lastActivity).toLocaleString()}</p>
        <p><strong>Warning Shown:</strong> {isWarningShown ? 'Yes' : 'No'}</p>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <button 
          onClick={handleTestActivity}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Simulate Activity
        </button>
      </div>

      <div style={{ 
        padding: '1rem', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '4px',
        fontSize: '0.875rem'
      }}>
        <h3>Test Instructions:</h3>
        <ul>
          <li>This test uses a 1-minute timeout with 30-second warning</li>
          <li>Stay idle for 30 seconds to see the warning modal</li>
          <li>Stay idle for 1 minute to be automatically logged out</li>
          <li>Click "Simulate Activity" to reset the timer</li>
          <li>Check the browser console for activity logs</li>
        </ul>
      </div>
    </div>
  );
}; 
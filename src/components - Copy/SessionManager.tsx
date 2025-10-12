import React, { useState } from 'react';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { SessionWarningModal } from './SessionWarningModal';

interface SessionManagerProps {
  children: React.ReactNode;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);

  const { resetTimer } = useSessionTimeout({
    timeoutMinutes: 10,
    warningMinutes: 2,
    onWarning: () => setShowWarning(true),
    onTimeout: () => setShowWarning(false)
  });

  const handleExtendSession = () => {
    setShowWarning(false);
    resetTimer();
  };

  const handleLogout = () => {
    setShowWarning(false);
    // Clerk will handle the actual logout
  };

  return (
    <>
      {children}
      <SessionWarningModal
        isOpen={showWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
        remainingSeconds={120} // 2 minutes
      />
    </>
  );
}; 
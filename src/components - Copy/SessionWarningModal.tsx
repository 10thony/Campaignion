import React, { useState, useEffect } from 'react';
import './SessionWarningModal.css';

interface SessionWarningModalProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
  remainingSeconds: number;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  isOpen,
  onExtend,
  onLogout,
  remainingSeconds
}) => {
  const [countdown, setCountdown] = useState(remainingSeconds);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout]);

  if (!isOpen) return null;

  return (
    <div className="session-warning-overlay">
      <div className="session-warning-modal">
        <div className="session-warning-header">
          <h2>Session Timeout Warning</h2>
        </div>
        <div className="session-warning-content">
          <p>Your session will expire in <strong>{countdown}</strong> seconds due to inactivity.</p>
          <p>Would you like to extend your session?</p>
        </div>
        <div className="session-warning-actions">
          <button 
            className="session-warning-extend-btn"
            onClick={onExtend}
          >
            Extend Session
          </button>
          <button 
            className="session-warning-logout-btn"
            onClick={onLogout}
          >
            Sign Out Now
          </button>
        </div>
      </div>
    </div>
  );
}; 
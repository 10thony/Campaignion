import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';

interface DarkModeToggleProps {
  isCollapsed?: boolean;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ isCollapsed = false }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="nav-link dark-mode-toggle"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isCollapsed ? (
        isDarkMode ? "☀️" : "🌙"
      ) : (
        <span className="flex items-center gap-2">
          {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </span>
      )}
    </button>
  );
};

export default DarkModeToggle; 
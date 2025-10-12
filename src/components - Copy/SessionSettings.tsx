import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import './SessionSettings.css';

interface SessionSettings {
  timeoutMinutes: number;
  warningMinutes: number;
  enableIdleDetection: boolean;
}

interface SessionSettingsProps {
  onSettingsChange: (settings: SessionSettings) => void;
  currentSettings: SessionSettings;
}

export const SessionSettings: React.FC<SessionSettingsProps> = ({
  onSettingsChange,
  currentSettings
}) => {
  const { user } = useUser();
  const [settings, setSettings] = useState(currentSettings);

  const handleSettingChange = (key: keyof SessionSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  if (!user) return null;

  return (
    <div className="session-settings">
      <h3>Session Settings</h3>
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.enableIdleDetection}
            onChange={(e) => handleSettingChange('enableIdleDetection', e.target.checked)}
          />
          Enable idle session detection
        </label>
      </div>
      <div className="setting-group">
        <label>
          Session timeout (minutes):
          <input
            type="number"
            min="1"
            max="60"
            value={settings.timeoutMinutes}
            onChange={(e) => handleSettingChange('timeoutMinutes', parseInt(e.target.value))}
            disabled={!settings.enableIdleDetection}
          />
        </label>
      </div>
      <div className="setting-group">
        <label>
          Warning before timeout (minutes):
          <input
            type="number"
            min="1"
            max={settings.timeoutMinutes - 1}
            value={settings.warningMinutes}
            onChange={(e) => handleSettingChange('warningMinutes', parseInt(e.target.value))}
            disabled={!settings.enableIdleDetection}
          />
        </label>
      </div>
    </div>
  );
}; 
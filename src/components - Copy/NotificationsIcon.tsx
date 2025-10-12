import React, { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import NotificationsPanel from "./NotificationsPanel";
import "./Notifications.css";

const NotificationsIcon: React.FC = () => {
  const { user } = useUser();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Get user's notifications
  const notifications = useQuery(
    api.joinRequests.getNotifications,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Calculate unread count
  const unreadCount = notifications?.filter(notification => !notification.isRead).length || 0;

  const handleIconClick = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
  };

  const handleNotificationClick = () => {
    // Panel will handle the click internally
    // This is just for closing the panel if needed
  };

  if (!user?.id) {
    return null;
  }

  return (
    <div className="notifications-container">
      <button
        className="notifications-icon-button"
        onClick={handleIconClick}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <div className="bell-icon">
          🔔
        </div>
        {unreadCount > 0 && (
          <div className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

      {isPanelOpen && (
        <NotificationsPanel
          notifications={notifications || []}
          onClose={handlePanelClose}
          onNotificationClick={handleNotificationClick}
        />
      )}
    </div>
  );
};

export default NotificationsIcon; 
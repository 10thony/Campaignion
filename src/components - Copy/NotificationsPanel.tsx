import React from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import "./Notifications.css";

interface Notification {
  _id: string;
  userClerkId: string;
  type: "JOIN_REQUEST" | "JOIN_APPROVED" | "JOIN_DENIED";
  payload: any;
  isRead: boolean;
  createdAt: number;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onClose,
  onNotificationClick,
}) => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const markNotificationRead = useMutation(api.joinRequests.markNotificationRead);
  const markAllNotificationsRead = useMutation(api.joinRequests.markAllNotificationsRead);

  const handleNotificationClick = async (notification: Notification) => {
    if (!user?.id) return;

    // Mark notification as read
    try {
      await markNotificationRead({
        notificationId: notification._id as any,
        clerkId: user.id,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "JOIN_REQUEST":
        // Navigate to campaign detail for DM
        if (notification.payload.campaignId) {
          navigate(`/campaigns/${notification.payload.campaignId}`);
        }
        break;
      case "JOIN_APPROVED":
      case "JOIN_DENIED":
        // Navigate to campaign detail for player
        if (notification.payload.campaignId) {
          navigate(`/campaigns/${notification.payload.campaignId}`);
        }
        break;
    }

    onNotificationClick();
    onClose();
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;

    try {
      await markAllNotificationsRead({ clerkId: user.id });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "JOIN_REQUEST":
        return "👤";
      case "JOIN_APPROVED":
        return "✅";
      case "JOIN_DENIED":
        return "❌";
      default:
        return "📢";
    }
  };

  const getNotificationTitle = (type: string, payload: any) => {
    switch (type) {
      case "JOIN_REQUEST":
        return `New join request for ${payload.campaignName}`;
      case "JOIN_APPROVED":
        return `Join request approved for ${payload.campaignName}`;
      case "JOIN_DENIED":
        return `Join request denied for ${payload.campaignName}`;
      default:
        return "Notification";
    }
  };

  const getNotificationMessage = (type: string, payload: any) => {
    switch (type) {
      case "JOIN_REQUEST":
        return "A player has requested to join your campaign.";
      case "JOIN_APPROVED":
        return "Your request to join the campaign has been approved!";
      case "JOIN_DENIED":
        return payload.denyReason 
          ? `Your request was denied: ${payload.denyReason}`
          : "Your request to join the campaign was denied.";
      default:
        return "You have a new notification.";
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  return (
    <div className="notifications-panel">
      <div className="panel-header">
        <h3>Notifications</h3>
        {unreadNotifications.length > 0 && (
          <button
            className="mark-all-read-button"
            onClick={handleMarkAllRead}
          >
            Mark all read
          </button>
        )}
        <button
          className="panel-close-button"
          onClick={onClose}
          aria-label="Close notifications"
        >
          ✕
        </button>
      </div>

      <div className="notifications-content">
        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-icon">📭</div>
            <p>No notifications yet</p>
          </div>
        ) : (
          <>
            {/* Unread notifications */}
            {unreadNotifications.length > 0 && (
              <div className="notifications-group">
                <h4 className="group-title">Unread</h4>
                <div className="notifications-list">
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`notification-item unread`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">
                          {getNotificationTitle(notification.type, notification.payload)}
                        </div>
                        <div className="notification-message">
                          {getNotificationMessage(notification.type, notification.payload)}
                        </div>
                        <div className="notification-time">
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Read notifications */}
            {readNotifications.length > 0 && (
              <div className="notifications-group">
                <h4 className="group-title">Read</h4>
                <div className="notifications-list">
                  {readNotifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification._id}
                      className="notification-item read"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">
                          {getNotificationTitle(notification.type, notification.payload)}
                        </div>
                        <div className="notification-message">
                          {getNotificationMessage(notification.type, notification.payload)}
                        </div>
                        <div className="notification-time">
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel; 
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X
} from 'feather-icons-react/build/IconComponents';
import useRealTimeDashboard from '../../hooks/useRealTimeDashboard';
import Image from '../../core/img/image';
import notificationService from '../../services/notificationService';

const ModernNotifications = () => {
  const {
    notifications: realtimeNotifications,
    clearNotifications,
    markNotificationAsRead,
    unreadCount: realtimeUnreadCount
  } = useRealTimeDashboard();

  const [showDropdown, setShowDropdown] = useState(false);
  const [mongoNotifications, setMongoNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch MongoDB notifications on component mount and when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      fetchMongoNotifications();
    }
  }, [showDropdown]);

  // Auto-refresh notifications every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (showDropdown) {
        fetchMongoNotifications();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [showDropdown]);

  const fetchMongoNotifications = async () => {
    setLoading(true);
    try {
      const notifications = await notificationService.getNotifications();
      setMongoNotifications(notifications);
    } catch (error) {
      console.error('Error fetching MongoDB notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return time.toLocaleDateString();
  };

  const markAllAsRead = () => {
    // Mark MongoDB notifications as read
    notificationService.markAllAsRead();
    setMongoNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    // Mark real-time notifications as read
    realtimeNotifications.forEach(notification => {
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
    });
  };

  // Combine MongoDB and real-time notifications
  const allNotifications = [...mongoNotifications, ...realtimeNotifications]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10); // Show latest 10

  // Calculate total unread count
  const mongoUnreadCount = mongoNotifications.filter(n => !n.read).length;
  const totalUnreadCount = mongoUnreadCount + realtimeUnreadCount;

  return (
    <div className="modern-notifications-wrapper position-relative">
      {/* Notification Bell */}
      <button
        className="modern-icon-btn position-relative"
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-expanded={showDropdown}
      >
        <Bell size={20} />
        {totalUnreadCount > 0 && (
          <span className="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Modern Dropdown Menu */}
      {showDropdown && (
        <div className="modern-notifications-dropdown">
          <div className="notification-header">
            <h6 className="mb-0">Notifications</h6>
            <button 
              className="mark-all-read-btn"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          </div>

          <div className="notifications-list">
            {loading ? (
              <div className="no-notifications">
                <Bell className="no-notifications-icon" />
                <p className="no-notifications-text">Loading notifications...</p>
                <small className="no-notifications-subtext">Please wait</small>
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="no-notifications">
                <Bell className="no-notifications-icon" />
                <p className="no-notifications-text">No notifications yet</p>
                <small className="no-notifications-subtext">You're all caught up!</small>
              </div>
            ) : (
              allNotifications.slice(0, 5).map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => {
                    if (mongoNotifications.find(n => n.id === notification.id)) {
                      // MongoDB notification
                      notificationService.markAsRead(notification.id);
                      setMongoNotifications(prev => 
                        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                      );
                    } else {
                      // Real-time notification
                      markNotificationAsRead(notification.id);
                    }
                  }}
                >
                  <div className="notification-avatar">
                    <Image
                      src={notification.avatar || "assets/img/profiles/avatar-01.jpg"}
                      alt="User Avatar"
                      className="avatar-img"
                    />
                  </div>
                  <div className="notification-content">
                    <div className="notification-text">
                      <span className="user-name">{notification.user}</span>
                      <span className="action-text"> {notification.action}</span>
                    </div>
                    {notification.details && (
                      <div className="notification-details">
                        {notification.details}
                      </div>
                    )}
                    <div className="notification-time">
                      {notification.time || formatTimeAgo(notification.timestamp)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="notification-footer">
            <button 
              className="btn btn-outline-secondary cancel-btn"
              onClick={() => setShowDropdown(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary view-all-btn"
              onClick={() => {
                setShowDropdown(false);
                // Navigate to notifications page
              }}
            >
              View all
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div 
          className="notification-overlay"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default ModernNotifications;
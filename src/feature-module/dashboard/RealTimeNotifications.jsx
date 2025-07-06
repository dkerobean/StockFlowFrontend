import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  AlertCircle, 
  TrendingUp, 
  Package, 
  Truck,
  DollarSign,
  Clock
} from 'feather-icons-react/build/IconComponents';
import useRealTimeDashboard from '../../hooks/useRealTimeDashboard';

const RealTimeNotifications = () => {
  const {
    isConnected,
    notifications,
    realTimeAlerts,
    clearNotifications,
    markNotificationAsRead,
    unreadCount
  } = useRealTimeDashboard();

  const [showDropdown, setShowDropdown] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'sale':
        return <DollarSign className="feather-14 text-success" />;
      case 'inventory':
        return <Package className="feather-14 text-warning" />;
      case 'product':
        return <TrendingUp className="feather-14 text-info" />;
      case 'transfer':
        return <Truck className="feather-14 text-primary" />;
      case 'critical':
        return <AlertCircle className="feather-14 text-danger" />;
      default:
        return <Bell className="feather-14 text-secondary" />;
    }
  };

  const getUrgencyClass = (urgency) => {
    switch (urgency) {
      case 'critical':
        return 'border-danger bg-danger-subtle';
      case 'warning':
        return 'border-warning bg-warning-subtle';
      case 'info':
        return 'border-info bg-info-subtle';
      default:
        return 'border-secondary bg-light';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="position-relative">
      {/* Connection Status Indicator */}
      <div className={`position-absolute top-0 end-0 translate-middle badge rounded-pill ${isConnected ? 'bg-success' : 'bg-danger'}`} 
           style={{ fontSize: '8px', zIndex: 1000 }}>
        {isConnected ? '●' : '●'}
      </div>

      {/* Notification Bell */}
      <div className="dropdown">
        <button
          className="btn btn-outline-secondary position-relative"
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          aria-expanded={showDropdown}
        >
          <Bell className="feather-16" />
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="dropdown-menu dropdown-menu-end show" style={{ width: '350px', maxHeight: '400px' }}>
            <div className="dropdown-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Real-time Notifications</h6>
              <div className="d-flex align-items-center">
                <span className={`badge ${isConnected ? 'bg-success' : 'bg-danger'} me-2`}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowDropdown(false)}
                >
                  <X className="feather-12" />
                </button>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            {/* Real-time Alerts */}
            {realTimeAlerts.length > 0 && (
              <>
                <div className="dropdown-header">
                  <small className="text-muted">Live Alerts</small>
                </div>
                {realTimeAlerts.slice(0, 3).map(alert => (
                  <div 
                    key={alert.id} 
                    className={`dropdown-item-text p-3 border-start border-3 ${getUrgencyClass(alert.urgency)}`}
                  >
                    <div className="d-flex align-items-start">
                      <div className="me-2 mt-1">
                        {getNotificationIcon(alert.type)}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-bold">{alert.title}</h6>
                        <p className="mb-1 small">{alert.message}</p>
                        <small className="text-muted d-flex align-items-center">
                          <Clock className="feather-12 me-1" />
                          {formatTimeAgo(alert.timestamp)}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="dropdown-divider"></div>
              </>
            )}

            {/* All Notifications */}
            <div className="dropdown-header d-flex justify-content-between">
              <small className="text-muted">All Notifications</small>
              {notifications.length > 0 && (
                <button 
                  className="btn btn-sm btn-link p-0 text-decoration-none"
                  onClick={clearNotifications}
                >
                  <small>Clear All</small>
                </button>
              )}
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div className="dropdown-item-text text-center py-4">
                  <Bell className="feather-24 text-muted mb-2" />
                  <p className="text-muted mb-0">No notifications yet</p>
                  <small className="text-muted">Real-time updates will appear here</small>
                </div>
              ) : (
                notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`dropdown-item ${notification.read ? 'opacity-75' : ''}`}
                    onClick={() => markNotificationAsRead(notification.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-start">
                      <div className="me-2 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{notification.title}</h6>
                        <p className="mb-1 small text-muted">{notification.message}</p>
                        <small className="text-muted">{formatTimeAgo(notification.timestamp)}</small>
                      </div>
                      {!notification.read && (
                        <div className="ms-2">
                          <span className="badge bg-primary rounded-pill" style={{ width: '8px', height: '8px' }}></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item-text text-center">
                  <button className="btn btn-sm btn-outline-primary">
                    View All Notifications
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 999 }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default RealTimeNotifications;
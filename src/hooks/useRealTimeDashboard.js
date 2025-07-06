import { useState, useEffect } from 'react';
import useSocket from './useSocket';

const useRealTimeDashboard = () => {
  const socket = useSocket();
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Connection status
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔗 Real-time dashboard connected');
      
      // Subscribe to general dashboard updates
      socket.emit('subscribeToAllSales');
      socket.emit('subscribeToProductDefinitions');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Real-time dashboard disconnected');
    });

    // Real-time event handlers
    socket.on('newSale', (sale) => {
      console.log('💰 New sale received:', sale);
      
      // Add notification
      const notification = {
        id: Date.now(),
        type: 'sale',
        title: 'New Sale!',
        message: `Sale of $${sale.total} completed`,
        timestamp: new Date(),
        urgency: 'info'
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
    });

    socket.on('inventoryAdjusted', (inventory) => {
      console.log('📦 Inventory updated:', inventory);
      
      // Add notification based on stock level
      let notification = {
        id: Date.now(),
        type: 'inventory',
        title: 'Inventory Updated',
        message: `Stock adjusted for product ${inventory.productId}`,
        timestamp: new Date(),
        urgency: 'info'
      };

      // Check for low stock alert
      if (inventory.newQuantity < 10) {
        notification = {
          ...notification,
          title: 'Low Stock Alert!',
          message: `Only ${inventory.newQuantity} units left`,
          urgency: 'warning'
        };
      }

      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
      setRealTimeAlerts(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5 alerts
    });

    socket.on('productUpdated', (product) => {
      console.log('🛍️ Product updated:', product);
      
      const notification = {
        id: Date.now(),
        type: 'product',
        title: 'Product Updated',
        message: `${product.name} has been modified`,
        timestamp: new Date(),
        urgency: 'info'
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    });

    socket.on('transferUpdated', (transfer) => {
      console.log('🚚 Transfer updated:', transfer);
      
      const notification = {
        id: Date.now(),
        type: 'transfer',
        title: 'Stock Transfer',
        message: `Transfer ${transfer._id} updated`,
        timestamp: new Date(),
        urgency: 'info'
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    });

    // Critical alerts
    socket.on('criticalAlert', (alert) => {
      console.log('🚨 Critical alert:', alert);
      
      const notification = {
        id: Date.now(),
        type: 'critical',
        title: 'Critical Alert!',
        message: alert.message,
        timestamp: new Date(),
        urgency: 'critical'
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
      setRealTimeAlerts(prev => [notification, ...prev.slice(0, 4)]);
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('newSale');
        socket.off('inventoryAdjusted');
        socket.off('productUpdated');
        socket.off('transferUpdated');
        socket.off('criticalAlert');
      }
    };
  }, [socket]);

  // Helper functions
  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const subscribeToLocation = (locationId) => {
    if (socket && locationId) {
      socket.emit('subscribeToLocation', locationId);
    }
  };

  const unsubscribeFromLocation = (locationId) => {
    if (socket && locationId) {
      socket.emit('unsubscribeFromLocation', locationId);
    }
  };

  // Emit custom events
  const triggerRefresh = () => {
    if (socket) {
      socket.emit('requestDashboardRefresh');
    }
  };

  return {
    isConnected,
    notifications,
    realTimeAlerts,
    clearNotifications,
    markNotificationAsRead,
    subscribeToLocation,
    unsubscribeFromLocation,
    triggerRefresh,
    unreadCount: notifications.filter(n => !n.read).length
  };
};

export default useRealTimeDashboard;
import { toast } from 'react-toastify';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.users = new Map(); // Cache for user data
    this.lastFetchTime = null;
  }

  // Fetch recent sales notifications
  async fetchSalesNotifications() {
    try {
      // Note: In a real implementation, this would use API calls to your backend
      // which would then use MongoDB MCP tools. For now, we'll simulate this
      // by creating notifications based on the data structure we saw in MongoDB
      
      const recentSales = [
        {
          _id: "686bb7645a8539abc3775c60",
          customer: { name: "Walk-in Customer" },
          total: 208800000,
          createdAt: new Date("2025-07-07T12:02:44.130Z"),
          createdBy: "67e29d933cfcd1ae57af9068"
        },
        {
          _id: "685e8d88fabfee1578c7f41f", 
          customer: { name: "John Doe" },
          total: 889,
          createdAt: new Date("2025-06-27T12:24:40.989Z"),
          createdBy: "67e29d933cfcd1ae57af9068"
        },
        {
          _id: "685e877f16dcb577591571dd",
          customer: { name: "Jane Smith" },
          total: 546,
          createdAt: new Date("2025-06-27T11:58:55.841Z"), 
          createdBy: "67e29d933cfcd1ae57af9068"
        }
      ];

      return recentSales.map(sale => ({
        id: sale._id,
        type: 'sale',
        user: sale.customer.name,
        action: 'completed order',
        details: `Order #${sale._id.slice(-6).toUpperCase()}. Total: $${(sale.total / 100).toFixed(2)}`,
        time: this.formatTimeAgo(sale.createdAt),
        timestamp: sale.createdAt,
        avatar: this.getUserAvatar(sale.createdBy),
        read: false
      }));
    } catch (error) {
      console.error('Error fetching sales notifications:', error);
      return [];
    }
  }

  // Fetch user data and create user notifications
  async fetchUserNotifications() {
    try {
      const recentUsers = [
        {
          _id: "67e14dc32caa8111851c76a2",
          name: "admin1 amenyo",
          email: "admin@tempolabs.com",
          role: "admin",
          createdAt: new Date("2025-03-24T12:19:15.917Z"),
          lastLogin: new Date("2025-03-24T12:24:22.520Z")
        },
        {
          _id: "67e29d933cfcd1ae57af9068",
          name: "admin2 amenyo2", 
          email: "admin2@tempolabs.com",
          role: "admin",
          createdAt: new Date("2025-03-25T12:12:03.736Z"),
          lastLogin: new Date("2025-05-13T19:50:18.302Z")
        }
      ];

      // Cache user data for avatars
      recentUsers.forEach(user => {
        this.users.set(user._id, user);
      });

      // Create login notifications for recent activity
      return recentUsers
        .filter(user => user.lastLogin && this.isRecentActivity(user.lastLogin))
        .map(user => ({
          id: `login_${user._id}`,
          type: 'user',
          user: user.name,
          action: 'logged in',
          details: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} access`,
          time: this.formatTimeAgo(user.lastLogin),
          timestamp: user.lastLogin,
          avatar: this.getUserAvatar(user._id),
          read: false
        }));
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  // Fetch inventory/stock notifications
  async fetchInventoryNotifications() {
    try {
      // Simulate low stock and inventory adjustments
      const inventoryAlerts = [
        {
          id: 'inv_001',
          type: 'inventory',
          user: 'System',
          action: 'Low stock alert',
          details: 'Product ABC123 - Only 5 units remaining',
          time: '2 mins ago',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          avatar: null,
          read: false
        },
        {
          id: 'inv_002', 
          type: 'inventory',
          user: 'admin2 amenyo2',
          action: 'adjusted stock for',
          details: 'Product XYZ789 - Quantity updated to 100 units',
          time: '15 mins ago',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          avatar: this.getUserAvatar("67e29d933cfcd1ae57af9068"),
          read: false
        }
      ];

      return inventoryAlerts;
    } catch (error) {
      console.error('Error fetching inventory notifications:', error);
      return [];
    }
  }

  // Main method to fetch all notifications
  async fetchAllNotifications() {
    try {
      const [salesNotifications, userNotifications, inventoryNotifications] = await Promise.all([
        this.fetchSalesNotifications(),
        this.fetchUserNotifications(), 
        this.fetchInventoryNotifications()
      ]);

      // Combine and sort by timestamp
      const allNotifications = [
        ...salesNotifications,
        ...userNotifications,
        ...inventoryNotifications
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      this.notifications = allNotifications.slice(0, 20); // Keep latest 20
      this.lastFetchTime = new Date();

      return this.notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      return [];
    }
  }

  // Get user avatar based on user ID
  getUserAvatar(userId) {
    const user = this.users.get(userId);
    if (user && user.profileImage) {
      return `assets/img/profiles/${user.profileImage}`;
    }
    
    // Return default avatar based on user role or random
    const defaultAvatars = [
      "assets/img/profiles/avatar-01.jpg",
      "assets/img/profiles/avatar-02.jpg", 
      "assets/img/profiles/avatar-03.jpg",
      "assets/img/profiles/avatar-06.jpg",
      "assets/img/profiles/avatar-10.jpg"
    ];
    
    const index = userId ? parseInt(userId.slice(-1), 16) % defaultAvatars.length : 0;
    return defaultAvatars[index];
  }

  // Check if activity is recent (within last 24 hours)
  isRecentActivity(timestamp) {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const hoursDiff = (now - activityTime) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  }

  // Format time ago
  formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
  }

  // Get unread count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
  }

  // Get notifications (cached or fresh)
  async getNotifications(forceRefresh = false) {
    if (!this.lastFetchTime || forceRefresh || this.shouldRefresh()) {
      return await this.fetchAllNotifications();
    }
    return this.notifications;
  }

  // Check if we should refresh (every 5 minutes)
  shouldRefresh() {
    if (!this.lastFetchTime) return true;
    const now = new Date();
    const diffInMinutes = (now - this.lastFetchTime) / (1000 * 60);
    return diffInMinutes >= 5;
  }
}

// Export singleton instance
export default new NotificationService();
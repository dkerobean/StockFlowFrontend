import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class DashboardService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Get admin dashboard statistics
  async getAdminDashboardStats() {
    try {
      const response = await this.api.get('/analytics/dashboard/admin');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      throw error;
    }
  }

  // Get sales dashboard statistics
  async getSalesDashboardStats() {
    try {
      const response = await this.api.get('/analytics/dashboard/sales');
      return response.data;
    } catch (error) {
      console.error('Error fetching sales dashboard stats:', error);
      throw error;
    }
  }

  // Get real-time alerts
  async getRealTimeAlerts(urgency = null, limit = 10) {
    try {
      const params = new URLSearchParams();
      if (urgency) params.append('urgency', urgency);
      if (limit) params.append('limit', limit.toString());
      
      const response = await this.api.get(`/analytics/alerts?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time alerts:', error);
      throw error;
    }
  }

  // Get comprehensive dashboard analytics
  async getComprehensiveDashboardAnalytics() {
    try {
      const response = await this.api.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching comprehensive dashboard analytics:', error);
      throw error;
    }
  }

  // Get inventory analytics
  async getInventoryAnalytics(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await this.api.get(`/analytics/inventory?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      throw error;
    }
  }

  // Get purchase analytics
  async getPurchaseAnalytics(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await this.api.get(`/analytics/purchases?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase analytics:', error);
      throw error;
    }
  }

  // Get optimization recommendations
  async getOptimizationRecommendations() {
    try {
      const response = await this.api.get('/analytics/optimization');
      return response.data;
    } catch (error) {
      console.error('Error fetching optimization recommendations:', error);
      throw error;
    }
  }
}

export default new DashboardService();
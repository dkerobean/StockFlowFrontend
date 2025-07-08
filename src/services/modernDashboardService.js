import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ModernDashboardService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Get comprehensive dashboard statistics
  async getDashboardStats() {
    try {
      const response = await this.api.get('/api/analytics/modern-dashboard');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch dashboard data'
      };
    }
  }

  // Get KPI summary
  async getKPISummary() {
    try {
      const [
        salesResponse,
        purchasesResponse,
        customersResponse,
        suppliersResponse,
        productsResponse,
        invoicesResponse
      ] = await Promise.all([
        this.api.get('/api/analytics/total-sales'),
        this.api.get('/api/analytics/total-purchases'),
        this.api.get('/api/analytics/customers-count'),
        this.api.get('/api/analytics/suppliers-count'),
        this.api.get('/api/analytics/products-count'),
        this.api.get('/api/analytics/invoices-count')
      ]);

      return {
        success: true,
        data: {
          totalSales: salesResponse.data.total || 0,
          totalPurchases: purchasesResponse.data.total || 0,
          totalCustomers: customersResponse.data.count || 0,
          totalSuppliers: suppliersResponse.data.count || 0,
          totalProducts: productsResponse.data.count || 0,
          salesInvoices: invoicesResponse.data.sales || 0,
          purchaseInvoices: invoicesResponse.data.purchases || 0
        }
      };
    } catch (error) {
      console.error('Error fetching KPI summary:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch KPI data'
      };
    }
  }

  // Get recent products
  async getRecentProducts(limit = 5) {
    try {
      const response = await this.api.get(`/api/products/recent?limit=${limit}`);
      return {
        success: true,
        data: response.data.products || []
      };
    } catch (error) {
      console.error('Error fetching recent products:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch recent products'
      };
    }
  }

  // Get top customers
  async getTopCustomers(limit = 5) {
    try {
      const response = await this.api.get(`/api/analytics/top-customers?limit=${limit}`);
      return {
        success: true,
        data: response.data.customers || []
      };
    } catch (error) {
      console.error('Error fetching top customers:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch top customers'
      };
    }
  }

  // Get recent transactions
  async getRecentTransactions(limit = 5) {
    try {
      const response = await this.api.get(`/api/analytics/recent-transactions?limit=${limit}`);
      return {
        success: true,
        data: response.data.transactions || []
      };
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch recent transactions'
      };
    }
  }

  // Get monthly trends
  async getMonthlyTrends(months = 6) {
    try {
      const response = await this.api.get(`/api/analytics/monthly-trends?months=${months}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch monthly trends'
      };
    }
  }

  // Get alerts and notifications
  async getAlerts() {
    try {
      const response = await this.api.get('/api/analytics/alerts');
      return {
        success: true,
        data: response.data.alerts || {
          lowStock: 0,
          expired: 0,
          pending: 0
        }
      };
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch alerts'
      };
    }
  }

  // Get category distribution for pie chart
  async getCategoryDistribution() {
    try {
      const response = await this.api.get('/api/analytics/category-distribution');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching category distribution:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch category distribution'
      };
    }
  }

  // Get sales performance metrics
  async getSalesPerformance() {
    try {
      const response = await this.api.get('/api/analytics/sales-performance');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching sales performance:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch sales performance'
      };
    }
  }

  // Get inventory status
  async getInventoryStatus() {
    try {
      const response = await this.api.get('/api/analytics/inventory-status');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching inventory status:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch inventory status'
      };
    }
  }

  // Get all dashboard data in one call
  async getAllDashboardData() {
    try {
      const [
        kpiData,
        recentProducts,
        topCustomers,
        recentTransactions,
        monthlyTrends,
        alerts
      ] = await Promise.all([
        this.getKPISummary(),
        this.getRecentProducts(5),
        this.getTopCustomers(5),
        this.getRecentTransactions(5),
        this.getMonthlyTrends(6),
        this.getAlerts()
      ]);

      const dashboardData = {
        kpis: kpiData.success ? kpiData.data : {
          totalSales: 0,
          totalPurchases: 0,
          totalCustomers: 0,
          totalSuppliers: 0,
          totalProducts: 0,
          salesInvoices: 0,
          purchaseInvoices: 0
        },
        recentProducts: recentProducts.success ? recentProducts.data : [],
        topCustomers: topCustomers.success ? topCustomers.data : [],
        recentTransactions: recentTransactions.success ? recentTransactions.data : [],
        monthlyTrends: monthlyTrends.success ? monthlyTrends.data : {
          labels: [],
          sales: [],
          purchases: []
        },
        alerts: alerts.success ? alerts.data : {
          lowStock: 0,
          expired: 0,
          pending: 0
        }
      };

      return {
        success: true,
        data: dashboardData
      };
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      return {
        success: false,
        error: 'Failed to fetch complete dashboard data'
      };
    }
  }

  // Helper method to format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Helper method to format date
  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  // Helper method to calculate percentage change
  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}

export default new ModernDashboardService();
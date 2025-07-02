import api from '../core/api';

const salesService = {
  // Get all sales with optional filters
  getSales: async (params = {}) => {
    try {
      const response = await api.get('/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  },

  // Get sale by ID
  getSaleById: async (id) => {
    try {
      const response = await api.get(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error);
      throw error;
    }
  },

  // Create new sale
  createSale: async (saleData) => {
    try {
      const response = await api.post('/sales', saleData);
      return response.data;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  // Update sale
  updateSale: async (id, saleData) => {
    try {
      const response = await api.put(`/sales/${id}`, saleData);
      return response.data;
    } catch (error) {
      console.error(`Error updating sale ${id}:`, error);
      throw error;
    }
  },

  // Delete sale (soft delete)
  deleteSale: async (id) => {
    try {
      const response = await api.delete(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting sale ${id}:`, error);
      throw error;
    }
  },

  // Get sales statistics
  getSalesStats: async () => {
    try {
      const response = await api.get('/sales/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      throw error;
    }
  },

  // Get sales report data
  getSalesReport: async (params = {}) => {
    try {
      const response = await api.get('/reports/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales report:', error);
      throw error;
    }
  },

  // Get sales trends for dashboard
  getSalesTrends: async (params = {}) => {
    try {
      const response = await api.get('/reports/sales-trends', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales trends:', error);
      throw error;
    }
  },

  // Export sales report
  exportSalesReport: async (params = {}, format = 'excel') => {
    try {
      const response = await api.get(`/reports/sales/export/${format}`, { 
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error exporting sales report as ${format}:`, error);
      throw error;
    }
  },

  // Get customers for dropdown
  getCustomers: async () => {
    try {
      const response = await api.get('/customers');
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // Get products for dropdown
  getProducts: async () => {
    try {
      const response = await api.get('/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get locations/warehouses for dropdown
  getLocations: async () => {
    try {
      const response = await api.get('/locations');
      return response.data.locations || response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }
};

export default salesService;
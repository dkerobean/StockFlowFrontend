import api from '../core/api';

const inventoryService = {
  // Get all inventory with optional filters
  getInventory: async (params = {}) => {
    try {
      const response = await api.get('/inventory', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Get inventory by ID
  getInventoryById: async (id) => {
    try {
      const response = await api.get(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching inventory ${id}:`, error);
      throw error;
    }
  },

  // Add inventory record for a product at a location
  addInventoryRecord: async (inventoryData) => {
    try {
      const response = await api.post('/inventory', inventoryData);
      return response.data;
    } catch (error) {
      console.error('Error adding inventory record:', error);
      throw error;
    }
  },

  // Adjust inventory quantity
  adjustInventory: async (id, adjustmentData) => {
    try {
      const response = await api.patch(`/inventory/${id}/adjust`, adjustmentData);
      return response.data;
    } catch (error) {
      console.error(`Error adjusting inventory ${id}:`, error);
      throw error;
    }
  },

  // Get low stock inventory
  getLowStockInventory: async (params = {}) => {
    try {
      const response = await api.get('/inventory/low-stock', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock inventory:', error);
      throw error;
    }
  },

  // Get out of stock inventory
  getOutOfStockInventory: async (params = {}) => {
    try {
      const response = await api.get('/inventory/out-of-stock', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching out of stock inventory:', error);
      throw error;
    }
  },

  // Get expired inventory
  getExpiredInventory: async (params = {}) => {
    try {
      const response = await api.get('/inventory/expired', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching expired inventory:', error);
      throw error;
    }
  },

  // Get comprehensive inventory report data
  getComprehensiveInventoryReport: async (params = {}) => {
    try {
      console.log('🔍 API Base URL:', api.defaults.baseURL);
      console.log('🔍 Calling inventory report with params:', params);
      console.log('🔍 Full URL will be:', `${api.defaults.baseURL}/reports/inventory`);
      
      const response = await api.get('/reports/inventory', { 
        params: {
          ...params,
          // Add cache busting parameter
          _t: Date.now()
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('✅ Inventory report API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching comprehensive inventory report:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    }
  },

  // Export inventory report to PDF
  exportInventoryReportPDF: async (params = {}) => {
    try {
      const response = await api.get('/reports/inventory', { 
        params: { ...params, format: 'pdf' },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting inventory report to PDF:', error);
      throw error;
    }
  },

  // Export inventory report to Excel
  exportInventoryReportExcel: async (params = {}) => {
    try {
      const response = await api.get('/reports/inventory', { 
        params: { ...params, format: 'excel' },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting inventory report to Excel:', error);
      throw error;
    }
  },

  // Get products for dropdown
  getProducts: async () => {
    try {
      console.log('Fetching products from API...');
      const response = await api.get('/products');
      console.log('Products API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Products API error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get locations/warehouses for dropdown
  getLocations: async () => {
    try {
      console.log('Fetching locations from API...');
      const response = await api.get('/locations');
      console.log('Locations API response:', response.data);
      return response.data.locations || response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      console.error('Locations API error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get product categories for dropdown
  getProductCategories: async () => {
    try {
      console.log('Fetching product categories from API...');
      const response = await api.get('/product-categories');
      console.log('Product categories API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching product categories:', error);
      console.error('Product categories API error details:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default inventoryService;
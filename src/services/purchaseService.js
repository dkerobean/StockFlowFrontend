import api from '../core/api';

const purchaseService = {
  // Get all purchases with optional filters
  getPurchases: async (params = {}) => {
    try {
      const response = await api.get('/purchases', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }
  },

  // Get purchase by ID
  getPurchaseById: async (id) => {
    try {
      const response = await api.get(`/purchases/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching purchase ${id}:`, error);
      throw error;
    }
  },

  // Create new purchase
  createPurchase: async (purchaseData) => {
    try {
      const response = await api.post('/purchases', purchaseData);
      return response.data;
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  },

  // Update purchase
  updatePurchase: async (id, purchaseData) => {
    try {
      const response = await api.put(`/purchases/${id}`, purchaseData);
      return response.data;
    } catch (error) {
      console.error(`Error updating purchase ${id}:`, error);
      throw error;
    }
  },

  // Delete purchase (soft delete)
  deletePurchase: async (id) => {
    try {
      const response = await api.delete(`/purchases/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting purchase ${id}:`, error);
      throw error;
    }
  },

  // Receive purchase (update inventory)
  receivePurchase: async (id) => {
    try {
      const response = await api.post(`/purchases/${id}/receive`);
      return response.data;
    } catch (error) {
      console.error(`Error receiving purchase ${id}:`, error);
      throw error;
    }
  },

  // Record payment for purchase
  recordPayment: async (id, paymentData) => {
    try {
      const response = await api.post(`/purchases/${id}/payment`, paymentData);
      return response.data;
    } catch (error) {
      console.error(`Error recording payment for purchase ${id}:`, error);
      throw error;
    }
  },

  // Get purchase statistics
  getPurchaseStats: async () => {
    try {
      const response = await api.get('/purchases/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase stats:', error);
      throw error;
    }
  },

  // Get purchase report data
  getPurchaseReport: async (params = {}) => {
    try {
      const response = await api.get('/purchases/report', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase report:', error);
      throw error;
    }
  },

  // Get suppliers for dropdown
  getSuppliers: async () => {
    try {
      console.log('Fetching suppliers from API...');
      const response = await api.get('/suppliers');
      console.log('Suppliers API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      console.error('Suppliers API error details:', error.response?.data || error.message);
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
  }
};

export default purchaseService;
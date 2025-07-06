import api from '../core/api';

const expenseReportService = {
  // Get comprehensive expense report data
  getComprehensiveExpenseReport: async (params = {}) => {
    try {
      console.log('🔍 API Base URL:', api.defaults.baseURL);
      console.log('🔍 Calling expense report with params:', params);
      console.log('🔍 Full URL will be:', `${api.defaults.baseURL}/reports/expenses`);
      
      const response = await api.get('/reports/expenses', { 
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
      
      console.log('✅ Expense report API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching comprehensive expense report:', error);
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

  // Export expense report to PDF
  exportExpenseReportPDF: async (params = {}) => {
    try {
      const response = await api.get('/reports/expenses', { 
        params: { ...params, format: 'pdf' },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting expense report to PDF:', error);
      throw error;
    }
  },

  // Export expense report to Excel
  exportExpenseReportExcel: async (params = {}) => {
    try {
      const response = await api.get('/reports/expenses', { 
        params: { ...params, format: 'excel' },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting expense report to Excel:', error);
      throw error;
    }
  },

  // Get all expenses with optional filters
  getExpenses: async (params = {}) => {
    try {
      const response = await api.get('/expense', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  // Get expense categories for dropdown
  getExpenseCategories: async () => {
    try {
      console.log('Fetching expense categories from API...');
      const response = await api.get('/categories');
      console.log('Expense categories API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      console.error('Categories API error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get payment methods (static options based on Expense model)
  getPaymentMethods: () => {
    return [
      { value: '', label: 'All Payment Methods' },
      { value: 'Cash', label: 'Cash' },
      { value: 'Credit Card', label: 'Credit Card' },
      { value: 'Bank Transfer', label: 'Bank Transfer' },
      { value: 'Check', label: 'Check' },
      { value: 'Other', label: 'Other' }
    ];
  },

  // Get expense categories as options (includes static defaults from model)
  getStaticCategories: () => {
    return [
      { value: '', label: 'All Categories' },
      { value: 'Supplies', label: 'Supplies' },
      { value: 'Rent', label: 'Rent' },
      { value: 'Utilities', label: 'Utilities' },
      { value: 'Salaries', label: 'Salaries' },
      { value: 'Marketing', label: 'Marketing' },
      { value: 'Travel', label: 'Travel' },
      { value: 'Equipment', label: 'Equipment' },
      { value: 'Software', label: 'Software' },
      { value: 'Taxes', label: 'Taxes' },
      { value: 'Other', label: 'Other' }
    ];
  },

  // Create new expense
  createExpense: async (expenseData) => {
    try {
      const response = await api.post('/expense', expenseData);
      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  // Update expense
  updateExpense: async (id, expenseData) => {
    try {
      const response = await api.put(`/expense/${id}`, expenseData);
      return response.data;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  // Delete expense
  deleteExpense: async (id) => {
    try {
      const response = await api.delete(`/expense/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // Get expense by ID
  getExpenseById: async (id) => {
    try {
      const response = await api.get(`/expense/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expense by ID:', error);
      throw error;
    }
  }
};

export default expenseReportService;
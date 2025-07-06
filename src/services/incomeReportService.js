import api from '../core/api';

const incomeReportService = {
  // Get comprehensive income report data
  getComprehensiveIncomeReport: async (params = {}) => {
    try {
      console.log('🔍 API Base URL:', api.defaults.baseURL);
      console.log('🔍 Calling income report with params:', params);
      console.log('🔍 Full URL will be:', `${api.defaults.baseURL}/reports/income`);
      
      const response = await api.get('/reports/income', { 
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
      
      console.log('✅ Income report API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching comprehensive income report:', error);
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

  // Export income report to PDF
  exportIncomeReportPDF: async (params = {}) => {
    try {
      const response = await api.get('/reports/income', { 
        params: { ...params, format: 'pdf' },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `income_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting income report to PDF:', error);
      throw error;
    }
  },

  // Export income report to Excel
  exportIncomeReportExcel: async (params = {}) => {
    try {
      const response = await api.get('/reports/income', { 
        params: { ...params, format: 'excel' },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `income_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting income report to Excel:', error);
      throw error;
    }
  },

  // Get all incomes with optional filters (if needed)
  getIncomes: async (params = {}) => {
    try {
      const response = await api.get('/income', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching incomes:', error);
      throw error;
    }
  },

  // Get income sources (static options based on Income model)
  getIncomeSources: () => {
    return [
      { value: '', label: 'All Sources' },
      { value: 'Sale', label: 'Sale' },
      { value: 'Service', label: 'Service' },
      { value: 'Investment', label: 'Investment' },
      { value: 'Other', label: 'Other' }
    ];
  },

  // Create new income
  createIncome: async (incomeData) => {
    try {
      const response = await api.post('/income', incomeData);
      return response.data;
    } catch (error) {
      console.error('Error creating income:', error);
      throw error;
    }
  },

  // Update income
  updateIncome: async (id, incomeData) => {
    try {
      const response = await api.put(`/income/${id}`, incomeData);
      return response.data;
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  },

  // Delete income
  deleteIncome: async (id) => {
    try {
      const response = await api.delete(`/income/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  },

  // Get income by ID
  getIncomeById: async (id) => {
    try {
      const response = await api.get(`/income/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching income by ID:', error);
      throw error;
    }
  }
};

export default incomeReportService;
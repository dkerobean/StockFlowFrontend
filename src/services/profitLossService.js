import api from '../core/api';

const profitLossService = {
  // Get comprehensive profit & loss report data
  getComprehensiveProfitLossReport: async (params = {}) => {
    try {
      console.log('🔍 API Base URL:', api.defaults.baseURL);
      console.log('🔍 Calling profit & loss report with params:', params);
      console.log('🔍 Full URL will be:', `${api.defaults.baseURL}/reports/profit-loss`);
      
      const response = await api.get('/reports/profit-loss', { 
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
      
      console.log('✅ Profit & Loss report API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching comprehensive profit & loss report:', error);
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

  // Get detailed transactions for profit & loss analysis
  getDetailedTransactions: async (params = {}) => {
    try {
      const response = await api.get('/reports/profit-loss', { 
        params: {
          ...params,
          includeDetails: 'true',
          // Add cache busting parameter
          _t: Date.now()
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('✅ Detailed P&L transactions API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching detailed P&L transactions:', error);
      throw error;
    }
  },

  // Export profit & loss report to PDF
  exportProfitLossPDF: async (params = {}) => {
    try {
      const response = await api.get('/reports/profit-loss', { 
        params: { ...params, format: 'pdf' },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profit_loss_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting profit & loss report to PDF:', error);
      throw error;
    }
  },

  // Export profit & loss report to Excel
  exportProfitLossExcel: async (params = {}) => {
    try {
      const response = await api.get('/reports/profit-loss', { 
        params: { ...params, format: 'excel' },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profit_loss_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error('Error exporting profit & loss report to Excel:', error);
      throw error;
    }
  },

  // Get income breakdown by source
  getIncomeBreakdown: async (params = {}) => {
    try {
      const response = await profitLossService.getComprehensiveProfitLossReport(params);
      return response.breakdown?.incomeBySource || [];
    } catch (error) {
      console.error('Error fetching income breakdown:', error);
      throw error;
    }
  },

  // Get expense breakdown by category
  getExpenseBreakdown: async (params = {}) => {
    try {
      const response = await profitLossService.getComprehensiveProfitLossReport(params);
      return response.breakdown?.expensesByCategory || [];
    } catch (error) {
      console.error('Error fetching expense breakdown:', error);
      throw error;
    }
  },

  // Get monthly profit & loss trends
  getMonthlyTrends: async (params = {}) => {
    try {
      const response = await profitLossService.getComprehensiveProfitLossReport(params);
      return response.breakdown?.monthlyData || [];
    } catch (error) {
      console.error('Error fetching monthly P&L trends:', error);
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

  // Get expense categories (static options based on Expense model)
  getExpenseCategories: () => {
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

  // Get period comparison options
  getPeriodOptions: () => {
    return [
      { value: 'total', label: 'Total Summary' },
      { value: 'monthly', label: 'Monthly Breakdown' },
      { value: 'quarterly', label: 'Quarterly Analysis' },
      { value: 'yearly', label: 'Yearly Comparison' }
    ];
  },

  // Calculate financial ratios and insights
  calculateFinancialInsights: (summary) => {
    if (!summary) return {};

    const insights = {
      profitabilityStatus: summary.isProfitable ? 'Profitable' : 'Loss',
      profitabilityColor: summary.isProfitable ? 'success' : 'danger',
      marginCategory: 'Low',
      marginColor: 'warning',
      recommendation: 'Monitor performance'
    };

    // Categorize profit margin
    if (summary.profitMargin >= 20) {
      insights.marginCategory = 'Excellent';
      insights.marginColor = 'success';
      insights.recommendation = 'Maintain current strategy';
    } else if (summary.profitMargin >= 10) {
      insights.marginCategory = 'Good';
      insights.marginColor = 'info';
      insights.recommendation = 'Look for optimization opportunities';
    } else if (summary.profitMargin >= 0) {
      insights.marginCategory = 'Fair';
      insights.marginColor = 'warning';
      insights.recommendation = 'Review expenses and pricing';
    } else {
      insights.marginCategory = 'Poor';
      insights.marginColor = 'danger';
      insights.recommendation = 'Urgent action needed - reduce costs or increase revenue';
    }

    // Calculate expense ratio
    insights.expenseRatio = summary.totalIncome > 0 ? 
      parseFloat(((summary.totalExpenses / summary.totalIncome) * 100).toFixed(2)) : 0;

    return insights;
  },

  // Format currency values
  formatCurrency: (value) => {
    if (typeof value !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  },

  // Format percentage values
  formatPercentage: (value) => {
    if (typeof value !== 'number') return '0%';
    return `${value.toFixed(1)}%`;
  },

  // Get month name from number
  getMonthName: (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
  },

  // Generate period comparison data
  generatePeriodComparison: (currentData, previousData) => {
    if (!currentData || !previousData) return null;

    const comparison = {
      income: {
        current: currentData.totalIncome,
        previous: previousData.totalIncome,
        change: currentData.totalIncome - previousData.totalIncome,
        percentChange: previousData.totalIncome > 0 ? 
          ((currentData.totalIncome - previousData.totalIncome) / previousData.totalIncome) * 100 : 0
      },
      expenses: {
        current: currentData.totalExpenses,
        previous: previousData.totalExpenses,
        change: currentData.totalExpenses - previousData.totalExpenses,
        percentChange: previousData.totalExpenses > 0 ? 
          ((currentData.totalExpenses - previousData.totalExpenses) / previousData.totalExpenses) * 100 : 0
      },
      profit: {
        current: currentData.netProfitLoss,
        previous: previousData.netProfitLoss,
        change: currentData.netProfitLoss - previousData.netProfitLoss,
        percentChange: previousData.netProfitLoss !== 0 ? 
          ((currentData.netProfitLoss - previousData.netProfitLoss) / Math.abs(previousData.netProfitLoss)) * 100 : 0
      }
    };

    return comparison;
  }
};

export default profitLossService;
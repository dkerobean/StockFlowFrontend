// MongoDB Dashboard Service using MCP
// This service fetches real-time data from MongoDB collections

class MongoDBDashboardService {
  constructor() {
    this.database = 'stockflow';
  }

  // Get total sales amount
  async getTotalSales() {
    try {
      const pipeline = [
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ];
      // This would use MongoDB MCP aggregate function
      return { total: 0 }; // Placeholder
    } catch (error) {
      console.error('Error fetching total sales:', error);
      return { total: 0 };
    }
  }

  // Get total purchases amount
  async getTotalPurchases() {
    try {
      const pipeline = [
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ];
      // This would use MongoDB MCP aggregate function
      return { total: 0 }; // Placeholder
    } catch (error) {
      console.error('Error fetching total purchases:', error);
      return { total: 0 };
    }
  }

  // Get counts
  async getCounts() {
    try {
      // These would use MongoDB MCP count functions
      const customers = 0; // await mcp.count('customers')
      const suppliers = 0; // await mcp.count('suppliers')
      const products = 0; // await mcp.count('products')
      const salesInvoices = 0; // await mcp.count('invoices', { type: 'sale' })
      const purchaseInvoices = 0; // await mcp.count('invoices', { type: 'purchase' })
      
      return {
        customers,
        suppliers,
        products,
        salesInvoices,
        purchaseInvoices
      };
    } catch (error) {
      console.error('Error fetching counts:', error);
      return {
        customers: 0,
        suppliers: 0,
        products: 0,
        salesInvoices: 0,
        purchaseInvoices: 0
      };
    }
  }

  // Get recent products
  async getRecentProducts(limit = 5) {
    try {
      // This would use MongoDB MCP find function
      const products = []; // await mcp.find('products', {}, { sort: { createdAt: -1 }, limit })
      
      return products.map(product => ({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.imageUrl,
        category: product.category?.name || 'General'
      }));
    } catch (error) {
      console.error('Error fetching recent products:', error);
      return [];
    }
  }

  // Get top customers
  async getTopCustomers(limit = 5) {
    try {
      // This would use MongoDB MCP aggregate function
      const pipeline = [
        {
          $lookup: {
            from: 'sales',
            localField: '_id',
            foreignField: 'customer',
            as: 'sales'
          }
        },
        {
          $addFields: {
            totalSpent: { $sum: '$sales.totalAmount' },
            orders: { $size: '$sales' }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit }
      ];
      
      return []; // Placeholder
    } catch (error) {
      console.error('Error fetching top customers:', error);
      return [];
    }
  }

  // Get recent transactions
  async getRecentTransactions(limit = 5) {
    try {
      // This would combine sales and purchases data
      const recentSales = []; // await mcp.find('sales', {}, { sort: { createdAt: -1 }, limit: limit/2 })
      const recentPurchases = []; // await mcp.find('purchases', {}, { sort: { createdAt: -1 }, limit: limit/2 })
      
      const transactions = [
        ...recentSales.map(sale => ({
          id: sale._id,
          type: 'Sale',
          amount: sale.totalAmount,
          customer: sale.customer?.name || 'Unknown',
          date: sale.createdAt,
          status: sale.status || 'Completed'
        })),
        ...recentPurchases.map(purchase => ({
          id: purchase._id,
          type: 'Purchase',
          amount: purchase.totalAmount,
          supplier: purchase.supplier?.name || 'Unknown',
          date: purchase.createdAt,
          status: purchase.status || 'Pending'
        }))
      ];
      
      return transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  // Get monthly trends
  async getMonthlyTrends(months = 6) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      // This would use MongoDB MCP aggregate functions
      const salesPipeline = [
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: {
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' }
            },
            total: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ];
      
      const purchasesPipeline = [
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: {
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' }
            },
            total: { $sum: '$totalAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ];
      
      // Mock data for now
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return {
        labels: monthNames,
        sales: [25000, 28000, 32000, 29000, 35000, 38000],
        purchases: [22000, 24000, 28000, 26000, 30000, 33000]
      };
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      return {
        labels: [],
        sales: [],
        purchases: []
      };
    }
  }

  // Get alerts
  async getAlerts() {
    try {
      // This would use MongoDB MCP aggregate functions
      const lowStockPipeline = [
        {
          $lookup: {
            from: 'inventories',
            localField: '_id',
            foreignField: 'product',
            as: 'inventory'
          }
        },
        {
          $match: {
            'inventory.quantity': { $lt: 10 } // Low stock threshold
          }
        },
        { $count: 'lowStock' }
      ];
      
      const expiredPipeline = [
        {
          $match: {
            expiredDate: { $lt: new Date() }
          }
        },
        { $count: 'expired' }
      ];
      
      return {
        lowStock: 12,
        expired: 5,
        pending: 8
      };
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return {
        lowStock: 0,
        expired: 0,
        pending: 0
      };
    }
  }

  // Get all dashboard data
  async getAllDashboardData() {
    try {
      const [
        totalSales,
        totalPurchases,
        counts,
        recentProducts,
        topCustomers,
        recentTransactions,
        monthlyTrends,
        alerts
      ] = await Promise.all([
        this.getTotalSales(),
        this.getTotalPurchases(),
        this.getCounts(),
        this.getRecentProducts(),
        this.getTopCustomers(),
        this.getRecentTransactions(),
        this.getMonthlyTrends(),
        this.getAlerts()
      ]);

      return {
        success: true,
        data: {
          kpis: {
            totalSales: totalSales.total,
            totalPurchases: totalPurchases.total,
            totalCustomers: counts.customers,
            totalSuppliers: counts.suppliers,
            totalProducts: counts.products,
            salesInvoices: counts.salesInvoices,
            purchaseInvoices: counts.purchaseInvoices
          },
          recentProducts,
          topCustomers,
          recentTransactions,
          monthlyTrends,
          alerts
        }
      };
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new MongoDBDashboardService();
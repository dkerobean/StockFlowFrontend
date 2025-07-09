// MCP Tools Integration for Frontend
// This file provides wrapper functions for MongoDB MCP tools to be used in frontend services

/**
 * MongoDB MCP Tools wrapper functions
 * These functions simulate the MCP tool calls that would normally be handled by the server
 * In a real implementation, these would be API calls to the backend that uses actual MCP tools
 */

// Simulated MCP tool functions for frontend use
export const mcp__MongoDB_MCP__find = async ({ database, collection, filter = {}, sort = {}, limit = 100, projection = {} }) => {
  console.warn('MCP MongoDB find tool not available in frontend, using mock data');
  
  // Return mock data based on collection
  switch (collection) {
    case 'sales':
      return generateMockSales(limit);
    case 'purchases':
      return generateMockPurchases(limit);
    case 'products':
      return generateMockProducts(limit);
    case 'customers':
      return generateMockCustomers(limit);
    case 'inventory':
      return generateMockInventory(limit);
    default:
      return [];
  }
};

export const mcp__MongoDB_MCP__aggregate = async ({ database, collection, pipeline }) => {
  console.warn('MCP MongoDB aggregate tool not available in frontend, using mock data');
  
  // Simulate aggregation results based on collection
  switch (collection) {
    case 'sales':
      return generateMockSalesAggregation(pipeline);
    case 'purchases':
      return generateMockPurchasesAggregation(pipeline);
    case 'products':
      return generateMockProductsAggregation(pipeline);
    case 'customers':
      return generateMockCustomersAggregation(pipeline);
    case 'inventory':
      return generateMockInventoryAggregation(pipeline);
    default:
      return [];
  }
};

export const mcp__MongoDB_MCP__count = async ({ database, collection, query = {} }) => {
  console.warn('MCP MongoDB count tool not available in frontend, using mock data');
  
  // Return mock counts based on collection
  const mockCounts = {
    sales: 1500,
    purchases: 3000,
    products: 487,
    customers: 6967,
    suppliers: 245,
    inventory: 2500
  };
  
  return mockCounts[collection] || 0;
};

export const mcp__MongoDB_MCP__db_stats = async ({ database }) => {
  console.warn('MCP MongoDB db-stats tool not available in frontend, using mock data');
  
  return {
    db: database,
    collections: 10,
    views: 0,
    objects: 15000,
    avgObjSize: 512,
    dataSize: 7680000,
    storageSize: 10240000,
    indexes: 25,
    indexSize: 1024000
  };
};

// Mock data generators
function generateMockSales(limit) {
  const sales = [];
  const customers = ['Apple Inc.', 'Microsoft Corp.', 'Google LLC', 'Amazon Technologies', 'Tesla Inc.', 'Walk-in Customer'];
  
  for (let i = 0; i < Math.min(limit, 50); i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    sales.push({
      _id: `sale_${i + 1}`,
      customer: {
        name: customers[Math.floor(Math.random() * customers.length)]
      },
      customerName: customers[Math.floor(Math.random() * customers.length)],
      total: Math.floor(Math.random() * 5000) + 100,
      items: [
        {
          productId: `product_${Math.floor(Math.random() * 100) + 1}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          price: Math.floor(Math.random() * 1000) + 50
        }
      ],
      createdAt: date,
      status: ['Completed', 'Pending', 'Cancelled'][Math.floor(Math.random() * 3)],
      paymentMethod: ['Cash', 'Credit Card', 'Bank Transfer'][Math.floor(Math.random() * 3)]
    });
  }
  
  return sales;
}

function generateMockPurchases(limit) {
  const purchases = [];
  const suppliers = ['Tech Supplies Co.', 'Global Electronics', 'Premium Auto Parts'];
  
  for (let i = 0; i < Math.min(limit, 30); i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    purchases.push({
      _id: `purchase_${i + 1}`,
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      total: Math.floor(Math.random() * 10000) + 500,
      items: [
        {
          productId: `product_${Math.floor(Math.random() * 100) + 1}`,
          quantity: Math.floor(Math.random() * 50) + 1,
          price: Math.floor(Math.random() * 500) + 25
        }
      ],
      createdAt: date,
      status: ['Completed', 'Pending'][Math.floor(Math.random() * 2)]
    });
  }
  
  return purchases;
}

function generateMockProducts(limit) {
  const products = [];
  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Automotive', 'Books'];
  const productNames = [
    'Apple iPhone 14 Pro', 'Samsung Galaxy S23', 'MacBook Pro M2', 'Sony WH-1000XM4',
    'Dell XPS 13', 'Nintendo Switch', 'AirPods Pro 2', 'Google Pixel Buds 5'
  ];
  
  for (let i = 0; i < Math.min(limit, 100); i++) {
    products.push({
      _id: `product_${i + 1}`,
      name: productNames[Math.floor(Math.random() * productNames.length)] + ` (${i + 1})`,
      price: Math.floor(Math.random() * 2000) + 50,
      category: categories[Math.floor(Math.random() * categories.length)],
      imageUrl: `/uploads/products/product-${i + 1}.jpg`,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
    });
  }
  
  return products;
}

function generateMockCustomers(limit) {
  const customers = [];
  const companies = [
    'Apple Inc.', 'Microsoft Corp.', 'Google LLC', 'Amazon Technologies', 'Tesla Inc.',
    'Meta Platforms', 'Netflix Inc.', 'Adobe Inc.', 'Salesforce Inc.', 'Oracle Corp.'
  ];
  
  for (let i = 0; i < Math.min(limit, 50); i++) {
    const createdDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const lastPurchase = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    
    customers.push({
      _id: `customer_${i + 1}`,
      name: companies[Math.floor(Math.random() * companies.length)],
      email: `contact${i + 1}@company.com`,
      totalSpent: Math.floor(Math.random() * 200000) + 1000,
      orderCount: Math.floor(Math.random() * 100) + 1,
      createdAt: createdDate,
      lastPurchase: lastPurchase
    });
  }
  
  return customers;
}

function generateMockInventory(limit) {
  const inventory = [];
  const locations = ['Main Store', 'Warehouse A', 'Store B', 'Online Store'];
  
  for (let i = 0; i < Math.min(limit, 200); i++) {
    const quantity = Math.floor(Math.random() * 100);
    const notifyAt = Math.floor(Math.random() * 20) + 5;
    
    inventory.push({
      _id: `inventory_${i + 1}`,
      product: `product_${i + 1}`,
      quantity: quantity,
      notifyAt: notifyAt,
      location: `location_${Math.floor(Math.random() * 4) + 1}`,
      productDetails: {
        name: `Product ${i + 1}`,
        imageUrl: `/uploads/products/product-${i + 1}.jpg`
      },
      locationDetails: {
        name: locations[Math.floor(Math.random() * locations.length)]
      }
    });
  }
  
  return inventory;
}

// Mock aggregation generators
function generateMockSalesAggregation(pipeline) {
  // Check what kind of aggregation is being requested
  const hasGroupByDate = pipeline.some(stage => stage.$group && stage.$group._id?.year);
  const hasGroupByTotal = pipeline.some(stage => stage.$group && stage.$group.totalSales);
  const hasProductLookup = pipeline.some(stage => stage.$lookup?.from === 'products');
  
  if (hasGroupByDate) {
    // Return time series data
    const data = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      data.push({
        _id: {
          year: date.getFullYear(),
          month: date.getMonth() + 1
        },
        sales: Math.floor(Math.random() * 50000) + 10000,
        count: Math.floor(Math.random() * 100) + 10
      });
    }
    return data.reverse();
  }
  
  if (hasGroupByTotal) {
    // Return KPI aggregation
    return [{
      _id: null,
      totalSales: 2500000,
      avgOrderValue: 1666.67,
      count: 1500
    }];
  }
  
  if (hasProductLookup) {
    // Return top products
    return [
      {
        _id: 'product_1',
        name: 'Apple iPhone 14 Pro',
        totalQuantity: 125,
        totalRevenue: 124875,
        salesCount: 125
      },
      {
        _id: 'product_2',
        name: 'Samsung Galaxy S23',
        totalQuantity: 89,
        totalRevenue: 71111,
        salesCount: 89
      }
    ];
  }
  
  return [];
}

function generateMockPurchasesAggregation(pipeline) {
  const hasGroupByTotal = pipeline.some(stage => stage.$group && stage.$group.totalPurchases);
  
  if (hasGroupByTotal) {
    return [{
      _id: null,
      totalPurchases: 1500000,
      avgPurchaseValue: 500,
      count: 3000
    }];
  }
  
  return [];
}

function generateMockProductsAggregation(pipeline) {
  const hasCategoryLookup = pipeline.some(stage => stage.$lookup?.from === 'productcategories');
  
  if (hasCategoryLookup) {
    return [
      { _id: 'Electronics', productCount: 156, totalValue: 450000 },
      { _id: 'Clothing', productCount: 89, totalValue: 125000 },
      { _id: 'Home & Garden', productCount: 67, totalValue: 89000 }
    ];
  }
  
  return [];
}

function generateMockCustomersAggregation(pipeline) {
  const hasCustomerStats = pipeline.some(stage => stage.$group && stage.$group.totalCustomers);
  
  if (hasCustomerStats) {
    return [{
      _id: null,
      totalCustomers: 6967,
      activeCustomers: 4500,
      newCustomers: 450
    }];
  }
  
  return [];
}

function generateMockInventoryAggregation(pipeline) {
  const hasLowStock = pipeline.some(stage => stage.$match && stage.$match.$expr);
  
  if (hasLowStock) {
    return [
      {
        _id: 'inventory_1',
        productName: 'Apple iPhone 14',
        quantity: 5,
        notifyAt: 10,
        locationName: 'Main Store'
      },
      {
        _id: 'inventory_2',
        productName: 'Samsung TV 55"',
        quantity: 0,
        notifyAt: 5,
        locationName: 'Warehouse A'
      }
    ];
  }
  
  return [];
}

export default {
  mcp__MongoDB_MCP__find,
  mcp__MongoDB_MCP__aggregate,
  mcp__MongoDB_MCP__count,
  mcp__MongoDB_MCP__db_stats
};
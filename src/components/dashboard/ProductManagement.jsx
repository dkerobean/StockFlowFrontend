import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Eye, Edit, Trash2 } from 'feather-icons-react';
import enhancedMongoDBDashboardService from '../../services/enhancedMongoDBDashboardService';

const ProductManagement = ({ className = '' }) => {
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('top-selling');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProductData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [topProductsData, lowStockData] = await Promise.all([
        enhancedMongoDBDashboardService.getTopSellingProducts(10),
        enhancedMongoDBDashboardService.getLowStockProducts(10)
      ]);
      
      setTopProducts(topProductsData || []);
      setLowStockProducts(lowStockData || []);
    } catch (err) {
      console.error('Error fetching product data:', err);
      setError('Failed to load product data');
      // Set fallback data
      setTopProducts(getFallbackTopProducts());
      setLowStockProducts(getFallbackLowStockProducts());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackTopProducts = () => [
    {
      _id: '1',
      name: 'Apple iPhone 14 Pro',
      imageUrl: '/uploads/products/iphone-14-pro.jpg',
      price: 999,
      totalQuantity: 125,
      totalRevenue: 124875,
      salesCount: 125,
      trend: 'up',
      trendPercentage: '12.5'
    },
    {
      _id: '2',
      name: 'Samsung Galaxy S23',
      imageUrl: '/uploads/products/galaxy-s23.jpg',
      price: 799,
      totalQuantity: 89,
      totalRevenue: 71111,
      salesCount: 89,
      trend: 'up',
      trendPercentage: '8.3'
    },
    {
      _id: '3',
      name: 'MacBook Pro M2',
      imageUrl: '/uploads/products/macbook-pro.jpg',
      price: 1999,
      totalQuantity: 34,
      totalRevenue: 67966,
      salesCount: 34,
      trend: 'down',
      trendPercentage: '3.2'
    },
    {
      _id: '4',
      name: 'Sony WH-1000XM4',
      imageUrl: '/uploads/products/sony-headphones.jpg',
      price: 349,
      totalQuantity: 156,
      totalRevenue: 54444,
      salesCount: 156,
      trend: 'up',
      trendPercentage: '15.7'
    },
    {
      _id: '5',
      name: 'Dell XPS 13',
      imageUrl: '/uploads/products/dell-xps.jpg',
      price: 1299,
      totalQuantity: 45,
      totalRevenue: 58455,
      salesCount: 45,
      trend: 'up',
      trendPercentage: '6.8'
    }
  ];

  const getFallbackLowStockProducts = () => [
    {
      _id: '1',
      productName: 'Apple iPhone 14',
      productImage: '/uploads/products/iphone-14.jpg',
      quantity: 5,
      notifyAt: 10,
      locationName: 'Main Store',
      status: 'Low Stock'
    },
    {
      _id: '2',
      productName: 'Samsung TV 55"',
      productImage: '/uploads/products/samsung-tv.jpg',
      quantity: 0,
      notifyAt: 5,
      locationName: 'Warehouse A',
      status: 'Out of Stock'
    },
    {
      _id: '3',
      productName: 'Nintendo Switch',
      productImage: '/uploads/products/nintendo-switch.jpg',
      quantity: 3,
      notifyAt: 8,
      locationName: 'Store B',
      status: 'Low Stock'
    },
    {
      _id: '4',
      productName: 'AirPods Pro 2',
      productImage: '/uploads/products/airpods-pro.jpg',
      quantity: 2,
      notifyAt: 15,
      locationName: 'Main Store',
      status: 'Low Stock'
    }
  ];

  useEffect(() => {
    fetchProductData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Out of Stock':
        return 'badge bg-danger';
      case 'Low Stock':
        return 'badge bg-warning text-dark';
      default:
        return 'badge bg-secondary';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') {
      return <TrendingUp size={16} className="text-success" />;
    } else if (trend === 'down') {
      return <TrendingDown size={16} className="text-danger" />;
    }
    return null;
  };

  const renderTopSellingProducts = () => (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Price</th>
            <th scope="col">Sold</th>
            <th scope="col">Revenue</th>
            <th scope="col">Trend</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {topProducts.map((product, index) => (
            <tr key={product._id}>
              <td>
                <div className="d-flex align-items-center">
                  <div className="product-image-wrapper me-3">
                    <img
                      src={product.imageUrl || '/uploads/products/default-product.png'}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = '/uploads/products/default-product.png';
                      }}
                    />
                  </div>
                  <div>
                    <h6 className="mb-0">{product.name}</h6>
                    <small className="text-muted">SKU: {product._id}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className="fw-semibold">
                  {formatCurrency(product.price)}
                </span>
              </td>
              <td>
                <span className="badge bg-primary">{product.totalQuantity}</span>
              </td>
              <td>
                <span className="fw-semibold text-success">
                  {formatCurrency(product.totalRevenue)}
                </span>
              </td>
              <td>
                <div className="d-flex align-items-center">
                  {getTrendIcon(product.trend)}
                  <span className={`ms-1 small ${
                    product.trend === 'up' ? 'text-success' : 'text-danger'
                  }`}>
                    {product.trend === 'up' ? '+' : '-'}{product.trendPercentage}%
                  </span>
                </div>
              </td>
              <td>
                <div className="btn-group" role="group">
                  <button className="btn btn-sm btn-outline-primary" title="View Details">
                    <Eye size={14} />
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" title="Edit">
                    <Edit size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderLowStockProducts = () => (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Current Stock</th>
            <th scope="col">Notify At</th>
            <th scope="col">Location</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {lowStockProducts.map((product, index) => (
            <tr key={product._id} className={product.quantity === 0 ? 'table-danger' : 'table-warning'}>
              <td>
                <div className="d-flex align-items-center">
                  <div className="product-image-wrapper me-3">
                    <img
                      src={product.productImage || '/uploads/products/default-product.png'}
                      alt={product.productName}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = '/uploads/products/default-product.png';
                      }}
                    />
                  </div>
                  <div>
                    <h6 className="mb-0">{product.productName}</h6>
                    <small className="text-muted">ID: {product._id}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className={`badge ${
                  product.quantity === 0 ? 'bg-danger' : 'bg-warning text-dark'
                }`}>
                  {product.quantity}
                </span>
              </td>
              <td>
                <span className="text-muted">{product.notifyAt}</span>
              </td>
              <td>
                <span className="fw-semibold">{product.locationName || 'Unknown'}</span>
              </td>
              <td>
                <span className={getStatusBadgeClass(product.status)}>
                  {product.status}
                </span>
              </td>
              <td>
                <div className="btn-group" role="group">
                  <button className="btn btn-sm btn-outline-primary" title="Restock">
                    <Package size={14} />
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" title="Edit">
                    <Edit size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`card h-100 ${className}`}>
        <div className="card-body">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card h-100 ${className}`}>
      <div className="card-header bg-white border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="card-title mb-1">
              <Package size={20} className="me-2 text-primary" />
              Product Management
            </h5>
            <p className="text-muted small mb-0">Monitor your inventory and sales performance</p>
          </div>
          
          {/* Tab Navigation */}
          <ul className="nav nav-pills" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'top-selling' ? 'active' : ''}`}
                onClick={() => setActiveTab('top-selling')}
                type="button"
              >
                <TrendingUp size={16} className="me-1" />
                Top Selling
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'low-stock' ? 'active' : ''}`}
                onClick={() => setActiveTab('low-stock')}
                type="button"
              >
                <AlertTriangle size={16} className="me-1" />
                Low Stock
                {lowStockProducts.length > 0 && (
                  <span className="badge bg-danger ms-2">{lowStockProducts.length}</span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-warning mb-3" role="alert">
            <strong>Warning:</strong> {error}. Showing sample data.
          </div>
        )}

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'top-selling' && (
            <div className="tab-pane fade show active">
              {topProducts.length > 0 ? (
                renderTopSellingProducts()
              ) : (
                <div className="text-center py-4">
                  <Package size={48} className="text-muted mb-3" />
                  <h6 className="text-muted">No top-selling products found</h6>
                  <p className="text-muted small">Start making sales to see your best performers here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'low-stock' && (
            <div className="tab-pane fade show active">
              {lowStockProducts.length > 0 ? (
                renderLowStockProducts()
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle size={48} className="text-success mb-3" />
                  <h6 className="text-success">All products are well-stocked!</h6>
                  <p className="text-muted small">No products require immediate restocking.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
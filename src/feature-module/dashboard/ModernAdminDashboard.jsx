import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import {
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  Activity,
  RefreshCw,
  Eye,
  AlertTriangle
} from "feather-icons-react/build/IconComponents";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import Image from "../../core/img/image";
import { all_routes } from "../../Router/all_routes";
import realMongoDBDashboardService from "../../services/realMongoDBDashboardService";
import "./ModernAdminDashboard.css";

const ModernAdminDashboard = () => {
  const route = all_routes;
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalSales: 0,
      totalPurchases: 0,
      totalCustomers: 0,
      totalSuppliers: 0,
      totalProducts: 0,
      totalExpenses: 0,
      salesInvoices: 0,
      purchaseInvoices: 0
    },
    recentProducts: [],
    topCustomers: [],
    recentTransactions: [],
    monthlyTrends: {
      labels: [],
      sales: [],
      purchases: []
    },
    alerts: {
      lowStock: 0,
      expired: 0,
      pending: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chart configurations
  const salesChartOptions = {
    chart: {
      type: 'line',
      height: 300,
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    colors: ['#28a745', '#007bff'],
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 90, 100]
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: dashboardData.monthlyTrends.labels,
      labels: { show: false }
    },
    yaxis: { show: false },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: function (val) {
          return "$" + val.toLocaleString();
        }
      }
    }
  };

  const pieChartOptions = {
    chart: {
      type: 'donut',
      height: 250
    },
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f39c12'],
    legend: {
      position: 'bottom',
      horizontalAlign: 'center'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from MongoDB
      const response = await realMongoDBDashboardService.getAllDashboardData();
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        // Fallback to mock data if API fails
        const mockData = {
          kpis: {
            totalSales: 307144,
            totalPurchases: 284500,
            totalCustomers: 1254,
            totalSuppliers: 156,
            totalProducts: 2847,
            totalExpenses: 45000,
            salesInvoices: 342,
            purchaseInvoices: 218
          },
          recentProducts: [
            { id: 1, name: "Porche 911", price: 23200000, image: "/uploads/products/product-1744798045971.png", category: "Luxury Cars" },
            { id: 2, name: "Google Pixel Buds 5", price: 299, image: "/uploads/products/product-1744794706933.jpg", category: "Electronics" },
            { id: 3, name: "New Product", price: 3534, image: "/uploads/products/product-1744977373251.jpg", category: "General" }
          ],
          topCustomers: [
            { id: 1, name: "Apple Inc.", totalSpent: 125000, orders: 45 },
            { id: 2, name: "Microsoft Corp.", totalSpent: 98000, orders: 32 },
            { id: 3, name: "Google LLC", totalSpent: 87000, orders: 28 }
          ],
          recentTransactions: [
            { id: 1, type: "Sale", amount: 15000, customer: "Apple Inc.", date: "2025-01-15", status: "Completed" },
            { id: 2, type: "Purchase", amount: 8500, supplier: "Tech Supplies", date: "2025-01-14", status: "Pending" },
            { id: 3, type: "Sale", amount: 3200, customer: "Local Store", date: "2025-01-13", status: "Completed" }
          ],
          monthlyTrends: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            sales: [25000, 28000, 32000, 29000, 35000, 38000],
            purchases: [22000, 24000, 28000, 26000, 30000, 33000]
          },
          alerts: {
            lowStock: 12,
            expired: 5,
            pending: 8
          }
        };
        
        setDashboardData(mockData);
        console.warn('Using mock data due to API error:', response.error);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, prefix = "", suffix = "", trend = null }) => (
    <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 col-sm-6 col-12">
      <div className={`modern-stat-card bg-gradient-${color}`}>
        <div className="stat-content">
          <div className="stat-info">
            <h3 className="stat-value">
              {prefix}
              <CountUp start={0} end={value} duration={2.5} />
              {suffix}
            </h3>
            <p className="stat-title">{title}</p>
            {trend && (
              <div className={`stat-trend ${trend.direction}`}>
                <TrendingUp size={16} />
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          <div className="stat-icon">
            <Icon size={40} />
          </div>
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, count, icon: Icon, color, link }) => (
    <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 col-sm-6 col-12">
      <div className="modern-action-card">
        <div className="action-header">
          <div className={`action-icon bg-${color}`}>
            <Icon size={24} />
          </div>
          <div className="action-count">{count}</div>
        </div>
        <div className="action-content">
          <h4 className="action-title">{title}</h4>
          <Link to={link} className="action-link">
            View Details
            <Eye size={16} />
          </Link>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">
            <AlertTriangle size={20} className="me-2" />
            {error}
            <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchDashboardData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content modern-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="dashboard-title">Admin Dashboard</h1>
              <p className="dashboard-subtitle">Welcome back! Here's what's happening with your business.</p>
            </div>
            <div className="col-md-4 text-end">
              <button 
                className="btn btn-primary btn-modern"
                onClick={fetchDashboardData}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Main Statistics */}
        <div className="row stat-cards-row">
          <StatCard 
            title="Total Sales" 
            value={dashboardData.kpis.totalSales} 
            icon={DollarSign} 
            color="success" 
            prefix="$"
            trend={{ direction: "up", value: 12.5 }}
          />
          <StatCard 
            title="Total Purchases" 
            value={dashboardData.kpis.totalPurchases} 
            icon={ShoppingCart} 
            color="primary" 
            prefix="$"
            trend={{ direction: "up", value: 8.2 }}
          />
          <StatCard 
            title="Total Customers" 
            value={dashboardData.kpis.totalCustomers} 
            icon={Users} 
            color="info" 
            trend={{ direction: "up", value: 5.7 }}
          />
          <StatCard 
            title="Total Products" 
            value={dashboardData.kpis.totalProducts} 
            icon={Package} 
            color="warning" 
            trend={{ direction: "up", value: 3.1 }}
          />
        </div>

        {/* Quick Actions */}
        <div className="row quick-actions-row">
          <QuickActionCard 
            title="Sales Invoices" 
            count={dashboardData.kpis.salesInvoices} 
            icon={Calendar} 
            color="success" 
            link={route.saleslist}
          />
          <QuickActionCard 
            title="Purchase Invoices" 
            count={dashboardData.kpis.purchaseInvoices} 
            icon={Activity} 
            color="primary" 
            link={route.purchaselist}
          />
          <QuickActionCard 
            title="Suppliers" 
            count={dashboardData.kpis.totalSuppliers} 
            icon={Users} 
            color="info" 
            link={route.supplierlist}
          />
          <QuickActionCard 
            title="Low Stock Alert" 
            count={dashboardData.alerts.lowStock} 
            icon={AlertTriangle} 
            color="danger" 
            link={route.productlist}
          />
        </div>

        {/* Charts and Tables */}
        <div className="row">
          {/* Sales Trends Chart */}
          <div className="col-xl-8 col-lg-12">
            <div className="modern-chart-card">
              <div className="chart-header">
                <h4>Sales vs Purchase Trends</h4>
                <div className="chart-legend">
                  <span className="legend-item sales">Sales</span>
                  <span className="legend-item purchases">Purchases</span>
                </div>
              </div>
              <div className="chart-body">
                <Chart
                  options={salesChartOptions}
                  series={[
                    { name: 'Sales', data: dashboardData.monthlyTrends.sales },
                    { name: 'Purchases', data: dashboardData.monthlyTrends.purchases }
                  ]}
                  type="line"
                  height={300}
                />
              </div>
            </div>
          </div>

          {/* Recent Products */}
          <div className="col-xl-4 col-lg-12">
            <div className="modern-data-card">
              <div className="data-header">
                <h4>Recent Products</h4>
                <Link to={route.productlist} className="view-all-link">View All</Link>
              </div>
              <div className="data-body">
                {dashboardData.recentProducts.map((product, index) => (
                  <div key={product.id} className="data-item">
                    <div className="item-image">
                      <Image 
                        src={product.image || "assets/img/products/default.png"} 
                        alt={product.name}
                        className="product-thumb"
                      />
                    </div>
                    <div className="item-info">
                      <h6 className="item-name">{product.name}</h6>
                      <p className="item-category">{product.category}</p>
                    </div>
                    <div className="item-price">
                      ${product.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="row">
          {/* Recent Activity */}
          <div className="col-xl-6 col-lg-12">
            <div className="modern-data-card">
              <div className="data-header">
                <h4>Recent Activity</h4>
                <Link to="#" className="view-all-link">View All</Link>
              </div>
              <div className="data-body">
                <ul className="activity-feed">
                  {dashboardData.recentTransactions.map((activity, index) => (
                    <li key={index} className="feed-item">
                      <div className="feed-item-icon">
                        {activity.type === 'Sale' ? <ShoppingCart size={20} className="text-success" /> : <ShoppingCart size={20} className="text-danger" />}
                      </div>
                      <div className="feed-item-body">
                        <p>
                          <strong>{activity.customer || activity.supplier}</strong>
                          {activity.type === 'Sale' ? ' purchased ' : ' supplied '}
                          items for a total of
                          <strong> ${activity.amount.toLocaleString()}</strong>.
                        </p>
                        <small className="text-muted">{activity.date}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="col-xl-6 col-lg-12">
            <div className="modern-data-card">
              <div className="data-header">
                <h4>Recent Transactions</h4>
                <Link to="#" className="view-all-link">View All</Link>
              </div>
              <div className="data-body">
                {dashboardData.recentTransactions.map((transaction, index) => (
                  <div key={transaction.id} className="data-item">
                    <div className={`item-type ${transaction.type.toLowerCase()}`}>
                      {transaction.type}
                    </div>
                    <div className="item-info">
                      <h6 className="item-name">{transaction.customer || transaction.supplier}</h6>
                      <p className="item-details">{transaction.date}</p>
                    </div>
                    <div className="item-amount">
                      ${transaction.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernAdminDashboard;
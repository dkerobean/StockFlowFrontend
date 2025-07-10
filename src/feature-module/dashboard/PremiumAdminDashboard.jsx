import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Zap
} from "feather-icons-react/build/IconComponents";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import Image from "../../core/img/image";
import { all_routes } from "../../Router/all_routes";
import mongoDbDashboardService from "../../services/mongoDbDashboardService";
import "./PremiumAdminDashboard.css";

const PremiumAdminDashboard = () => {
  const route = all_routes;
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalPurchaseDue: 0,
      totalSalesDue: 0,
      totalSaleAmount: 0,
      totalExpenseAmount: 0,
      customersCount: 0,
      suppliersCount: 0,
      purchaseInvoicesCount: 0,
      salesInvoicesCount: 0
    },
    chartData: {
      labels: [],
      salesData: [],
      purchaseData: []
    },
    recentProducts: [],
    expiredProducts: [],
    alerts: {
      lowStock: 0,
      expired: 0
    },
    topSellingProducts: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mongoDbDashboardService.getAllDashboardData();
      
      if (response.success) {
        setDashboardData(response.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard data fetch failed:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Chart configurations
  const salesChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#28a745', '#dc3545'],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 8,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        columnWidth: '45%',
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: dashboardData.chartData.labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#8e8da4',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        },
      },
    },
    yaxis: {
      title: { text: 'Amount ($)', style: { color: '#8e8da4' } },
      labels: {
        style: {
          colors: '#8e8da4',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        },
        formatter: function (val) {
          return "$" + (val / 1000).toFixed(0) + "k";
        }
      },
    },
    fill: { opacity: 0.8 },
    tooltip: {
      y: {
        formatter: function (val) {
          return "$" + Math.abs(val).toLocaleString();
        }
      }
    },
    grid: {
      borderColor: '#f1f1f1',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      floating: true,
      offsetY: -25,
      offsetX: -5
    }
  };

  const categoryChartOptions = {
    chart: {
      type: 'donut',
      height: 280
    },
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f39c12', '#9b59b6', '#e74c3c'],
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      offsetY: 0,
      labels: {
        colors: '#373d3f',
        useSeriesColors: false
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: '#373d3f',
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '24px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: '#373d3f',
              offsetY: 16,
              formatter: function (val) {
                return parseInt(val) + '%';
              }
            },
            total: {
              show: true,
              showAlways: false,
              label: 'Total',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 600,
              color: '#373d3f',
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0) + '%';
              }
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { position: 'bottom' }
      }
    }]
  };

  // KPI Card Component
  const KPICard = ({ title, value, prefix = "", suffix = "", icon: Icon, color, trend = null, subtitle = null }) => (
    <div className={`kpi-card kpi-card-${color}`}>
      <div className="kpi-card-header">
        <div className="kpi-icon">
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`kpi-trend ${trend.direction}`}>
            {trend.direction === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="kpi-card-body">
        <div className="kpi-value">
          {prefix}
          <CountUp start={0} end={value} duration={2.5} separator="," />
          {suffix}
        </div>
        <div className="kpi-title">{title}</div>
        {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  // Quick Stats Card Component
  const QuickStatsCard = ({ title, value, icon: Icon, color, link }) => (
    <div className="quick-stats-card">
      <div className="stats-icon-wrapper">
        <div className={`stats-icon stats-icon-${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="stats-content">
        <div className="stats-value">{value}</div>
        <div className="stats-title">{title}</div>
      </div>
      <Link to={link} className="stats-link">
        <ArrowUpRight size={16} />
      </Link>
    </div>
  );

  // Calculate derived metrics
  const profit = dashboardData.kpis.totalSaleAmount - dashboardData.kpis.totalExpenseAmount;
  const inventoryValue = dashboardData.recentProducts.reduce((sum, product) => sum + (product.price || 0), 0);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content premium-dashboard">
          <div className="loading-container">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content premium-dashboard">
          <div className="error-container">
            <AlertTriangle size={48} className="text-danger" />
            <h3>Error Loading Dashboard</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchDashboardData}>
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content premium-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">Welcome, Admin</h1>
            <p className="dashboard-subtitle">
              You have <span className="highlight">{dashboardData.kpis.salesInvoicesCount}</span> orders today
            </p>
          </div>
          <div className="header-right">
            <div className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <button 
              className="btn btn-refresh"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Main KPI Cards */}
        <div className="kpi-grid">
          <KPICard
            title="Total Sales"
            value={dashboardData.kpis.totalSaleAmount}
            prefix="$"
            icon={DollarSign}
            color="success"
            trend={{ direction: 'up', value: 35 }}
            subtitle="vs last month"
          />
          <KPICard
            title="Total Sales Return"
            value={dashboardData.kpis.totalSalesDue}
            prefix="$"
            icon={TrendingUp}
            color="primary"
            trend={{ direction: 'up', value: 39 }}
            subtitle="vs last month"
          />
          <KPICard
            title="Total Purchase"
            value={dashboardData.kpis.totalPurchaseDue}
            prefix="$"
            icon={ShoppingCart}
            color="info"
            trend={{ direction: 'up', value: 41 }}
            subtitle="vs last month"
          />
          <KPICard
            title="Total Purchase Return"
            value={profit > 0 ? profit : 0}
            prefix="$"
            icon={Target}
            color="warning"
            trend={{ direction: profit > 0 ? 'up' : 'down', value: 20 }}
            subtitle="vs last month"
          />
        </div>

        {/* Secondary Stats */}
        <div className="secondary-stats">
          <div className="stats-row">
            <div className="stats-group">
              <div className="stats-header">
                <Zap size={16} />
                <span>Overall Information</span>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <Users size={20} className="text-primary" />
                  <div>
                    <div className="stat-value">{dashboardData.kpis.suppliersCount}</div>
                    <div className="stat-label">Suppliers</div>
                  </div>
                </div>
                <div className="stat-item">
                  <Users size={20} className="text-success" />
                  <div>
                    <div className="stat-value">{dashboardData.kpis.customersCount}</div>
                    <div className="stat-label">Customers</div>
                  </div>
                </div>
                <div className="stat-item">
                  <Package size={20} className="text-info" />
                  <div>
                    <div className="stat-value">{dashboardData.recentProducts.length}</div>
                    <div className="stat-label">Orders</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="customers-overview">
              <div className="overview-header">
                <h4>Customer Overview</h4>
                <div className="today-indicator">Today</div>
              </div>
              <div className="overview-stats">
                <div className="overview-stat">
                  <div className="stat-number">5.5K</div>
                  <div className="stat-label">First Time</div>
                  <div className="stat-trend positive">+18%</div>
                </div>
                <div className="overview-stat">
                  <div className="stat-number">3.5K</div>
                  <div className="stat-label">Return</div>
                  <div className="stat-trend positive">+14%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Tables Row */}
        <div className="charts-row">
          {/* Sales & Purchase Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h4>Sales & Purchase</h4>
              <div className="chart-controls">
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color success"></div>
                    <span>Total Purchase</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color danger"></div>
                    <span>Total Sales</span>
                  </div>
                </div>
                <select className="form-select form-select-sm">
                  <option>1Y</option>
                  <option>6M</option>
                  <option>3M</option>
                  <option>1M</option>
                </select>
              </div>
            </div>
            <div className="chart-body">
              <Chart
                options={salesChartOptions}
                series={[
                  { name: 'Sales', data: dashboardData.chartData.salesData },
                  { name: 'Purchase', data: dashboardData.chartData.purchaseData }
                ]}
                type="bar"
                height={350}
              />
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="products-card">
            <div className="products-header">
              <h4>Top Selling Products</h4>
              <Link to={route.productlist} className="view-all-link">
                View All
              </Link>
            </div>
            <div className="products-list">
              {dashboardData.topSellingProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="product-item">
                  <div className="product-image">
                    <Image 
                      src={product.imageUrl || "assets/img/products/default.png"} 
                      alt={product.name}
                    />
                  </div>
                  <div className="product-info">
                    <h6>{product.name}</h6>
                    <p>{product.totalQuantity} • {product.totalQuantity} Sales</p>
                  </div>
                  <div className="product-actions">
                    <button className="btn btn-sm btn-light">
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Products */}
          <div className="alerts-card">
            <div className="alerts-header">
              <h4>Low Stock Products</h4>
              <Link to={route.productlist} className="view-all-link">
                View All
              </Link>
            </div>
            <div className="alerts-list">
              {dashboardData.recentProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="alert-item">
                  <div className="alert-icon">
                    <AlertTriangle size={16} className="text-warning" />
                  </div>
                  <div className="alert-content">
                    <h6>{product.name}</h6>
                    <p>#{product.sku || `SKU${product.id}`}</p>
                  </div>
                  <div className="alert-status">
                    <span className="badge badge-warning">Low Stock</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="recent-sales-card">
          <div className="sales-header">
            <h4>Recent Sales</h4>
            <div className="sales-controls">
              <div className="date-range">
                <Calendar size={16} />
                <span>06/10/2025 - 07/09/2025</span>
              </div>
              <select className="form-select form-select-sm">
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Yearly</option>
              </select>
            </div>
          </div>
          <div className="sales-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentProducts.map((product, index) => (
                  <tr key={index}>
                    <td>{new Date().toLocaleDateString()}</td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-avatar">
                          <span>{product.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h6>{product.name}</h6>
                          <p>Electronics • ${product.price}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">Completed</span>
                    </td>
                    <td>
                      <strong>${product.price}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumAdminDashboard;
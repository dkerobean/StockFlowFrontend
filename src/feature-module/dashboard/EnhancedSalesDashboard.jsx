import {
  ArrowRight,
  Calendar,
  ChevronUp,
  Clock,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from "feather-icons-react/build/IconComponents";
import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import Chart from "react-apexcharts";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import "bootstrap-daterangepicker/daterangepicker.css";
import DateRangePicker from "react-bootstrap-daterangepicker";
import Image from "../../core/img/image";
import { Link } from "react-router-dom";
import { setToogleHeader } from "../../core/redux/action";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip } from "react-bootstrap";
import { all_routes } from "../../Router/all_routes";
import dashboardService from "../../services/dashboardService";
import RealTimeNotifications from "./RealTimeNotifications";

const FILE_BASE_URL = process.env.REACT_APP_FILE_BASE_URL;

const EnhancedSalesDashboard = () => {
  const route = all_routes;
  const dispatch = useDispatch();
  const data = useSelector((state) => state.toggle_header);
  
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [chartOptions, setChartOptions] = useState({
    series: [
      {
        name: "Sales Analysis",
        data: [],
      },
    ],
    chart: {
      height: 273,
      type: "area",
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    colors: ["#FF9F43"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100]
      }
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      },
    },
    title: {
      text: "",
      align: "left",
    },
    xaxis: {
      categories: [],
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      min: 0,
      tickAmount: 5,
      labels: {
        formatter: (val) => {
          return val > 1000 ? '$' + (val / 1000).toFixed(1) + "K" : '$' + val;
        },
        style: {
          fontSize: '12px'
        }
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return '$' + val.toLocaleString();
        }
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 200
        }
      }
    }]
  });

  // Get current user from localStorage or token
  const getCurrentUser = () => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        setCurrentUser(user.name || 'User');
      } else {
        // Fallback to token parsing or default
        setCurrentUser('Admin');
      }
    } catch (error) {
      console.error('Error getting user info:', error);
      setCurrentUser('User');
    }
  };

  // Fetch sales dashboard data on component mount
  useEffect(() => {
    getCurrentUser();
    fetchSalesData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchSalesData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle date range changes
  const handleDateRangeChange = (start, end) => {
    setDateRange({ startDate: start, endDate: end });
    fetchSalesData(start, end);
  };

  const fetchSalesData = async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use provided dates or current state dates
      const start = startDate || dateRange.startDate;
      const end = endDate || dateRange.endDate;
      
      const response = await dashboardService.getSalesDashboardStats(start, end);
      
      if (response.success && response.data) {
        setSalesData(response.data);
        
        // Update chart data with sales trends
        const chartData = response.data.chartData || {};
        const salesDataArray = chartData.salesData || [];
        const categories = chartData.dates || [];
        
        // Always update chart data, even if empty
        setChartOptions(prev => ({
          ...prev,
          series: [
            {
              name: "Sales Analysis",
              data: salesDataArray.length > 0 ? salesDataArray : [0],
            },
          ],
          xaxis: {
            ...prev.xaxis,
            categories: categories.length > 0 ? categories : ['No Data'],
          },
          yaxis: {
            ...prev.yaxis,
            labels: {
              formatter: (val) => {
                return val > 1000 ? '$' + (val / 1000).toFixed(1) + "K" : '$' + val;
              },
            },
          },
        }));
        
        if (salesDataArray.length === 0) {
          console.warn('No chart data available for selected date range');
        }
      } else {
        console.error('Invalid API response:', response);
        setError(response.message || 'Failed to load sales data');
      }
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderRefreshTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Refresh
    </Tooltip>
  );
  
  const renderCollapseTooltip = (props) => (
    <Tooltip id="refresh-tooltip" {...props}>
      Collapse
    </Tooltip>
  );

  const initialSettings = {
    endDate: dateRange.endDate,
    startDate: dateRange.startDate,
    ranges: {
      "Today": [new Date(), new Date()],
      "Yesterday": [
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date(Date.now() - 24 * 60 * 60 * 1000),
      ],
      "Last 7 Days": [
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date(),
      ],
      "Last 30 Days": [
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(),
      ],
      "This Month": [
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        new Date(),
      ],
      "Last Month": [
        new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      ],
    },
    timePicker: false,
    autoApply: true,
  };

  // Error display
  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <AlertCircle className="feather-16 me-2" />
            <div>
              {error}
              <button 
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={fetchSalesData}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Welcome Section */}
          <div className="welcome d-lg-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center welcome-text">
              <h3 className="d-flex align-items-center">
                <Image src="assets/img/icons/hi.svg" alt="img" />
                &nbsp;Hi {currentUser || 'User'},
              </h3>
              &nbsp;
              <h6>here&apos;s what&apos;s happening with your store today.</h6>
            </div>
            <div className="d-flex align-items-center">
              <div className="position-relative daterange-wraper me-2">
                <div className="input-groupicon calender-input">
                  <DateRangePicker 
                    initialSettings={initialSettings}
                    onApply={(event, picker) => {
                      handleDateRangeChange(picker.startDate.toDate(), picker.endDate.toDate());
                    }}
                  >
                    <input
                      className="form-control col-4 input-range"
                      type="text"
                      value={`${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`}
                      readOnly
                    />
                  </DateRangePicker>
                </div>
                <Calendar className="feather-14" />
              </div>

              <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                <Link 
                  data-bs-toggle="tooltip" 
                  data-bs-placement="top"
                  onClick={fetchSalesData}
                  style={{ cursor: 'pointer' }}
                >
                  <RefreshCw className={`feather feather-rotate-ccw feather-16 ${loading ? 'fa-spin' : ''}`} />
                </Link>
              </OverlayTrigger>

              <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                <Link
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  id="collapse-header"
                  className={data ? "active" : ""}
                  onClick={() => {
                    dispatch(setToogleHeader(!data));
                  }}
                >
                  <ChevronUp />
                </Link>
              </OverlayTrigger>
            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center mb-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {salesData && !loading && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <TrendingUp className="feather-16 me-2" />
              Sales dashboard updated successfully! Last refresh: {new Date().toLocaleTimeString()}
              <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
            </div>
          )}

          {/* Real-time Notifications */}

          {/* Sales Cards - Updated with meaningful KPIs */}
          <div className="row sales-cards">
            <div className="col-xl-6 col-sm-12 col-12">
              <div className="card d-flex align-items-center justify-content-between default-cover mb-4">
                <div>
                  <h6>Total Revenue</h6>
                  <h3>
                    $
                    <CountUp 
                      end={salesData?.kpis?.totalRevenue || 0} 
                      duration={3}
                      separator=","
                    />
                  </h3>
                  <p className="sales-range">
                    <span className={salesData?.kpis?.revenueGrowth >= 0 ? "text-success" : "text-danger"}>
                      <ChevronUp className="feather-16" />
                      {salesData?.kpis?.revenueGrowth || 0}%&nbsp;
                    </span>
                    vs previous period
                  </p>
                </div>
                <Image
                  src="assets/img/icons/weekly-earning.svg"
                  alt="img"
                />
              </div>
            </div>
            
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card color-info bg-primary mb-4">
                <Image
                  src="assets/img/icons/total-sales.svg"
                  alt="img"
                />
                <h3>
                  $<CountUp end={salesData?.kpis?.averageOrderValue || 0} duration={4} separator="," />
                </h3>
                <p>Average Order Value</p>
                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                  <Link 
                    data-bs-toggle="tooltip"
                    onClick={() => fetchSalesData()}
                    style={{ cursor: 'pointer' }}
                  >
                    <RefreshCw className={`feather-16 ${loading ? 'fa-spin' : ''}`} />
                  </Link>
                </OverlayTrigger>
              </div>
            </div>
            
            <div className="col-xl-3 col-sm-6 col-12">
              <div className="card color-info bg-secondary mb-4">
                <Image
                  src="assets/img/icons/purchased-earnings.svg"
                  alt="img"
                />
                <h3>
                  <CountUp end={salesData?.kpis?.totalOrders || 0} duration={4} />
                  <span className="small"> orders</span>
                </h3>
                <p>Total Orders</p>
                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                  <Link 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="top"
                    onClick={() => fetchSalesData()}
                    style={{ cursor: 'pointer' }}
                  >
                    <RefreshCw className={`feather-16 ${loading ? 'fa-spin' : ''}`} />
                  </Link>
                </OverlayTrigger>
              </div>
            </div>
          </div>


          <div className="row">
            {/* Best Sellers Section */}
            <div className="col-sm-12 col-md-12 col-xl-4 d-flex">
              <div className="card flex-fill default-cover w-100 mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">Best Sellers</h4>
                  <div className="dropdown">
                    <Link to="#" className="view-all d-flex align-items-center">
                      View All
                      <span className="ps-2 d-flex align-items-center">
                        <ArrowRight className="feather-16" />
                      </span>
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-borderless best-seller">
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="2" className="text-center">Loading best sellers...</td>
                          </tr>
                        ) : salesData?.bestSellers?.length > 0 ? (
                          salesData.bestSellers.map((product, index) => (
                            <tr key={product.id}>
                              <td>
                                <div className="product-info">
                                  <Link
                                    to={route.productlist}
                                    className="product-img"
                                  >
                                    <Image
                                      src={product.imageUrl ? `${FILE_BASE_URL}${product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`}` : "assets/img/products/default.png"}
                                      alt="product"
                                    />
                                  </Link>
                                  <div className="info">
                                    <Link to={route.productlist}>
                                      {product.name}
                                    </Link>
                                    <p className="dull-text">${product.totalRevenue}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <p className="head-text">Sales</p>
                                {product.totalQuantity}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="2" className="text-center">No best sellers data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Section */}
            <div className="col-sm-12 col-md-12 col-xl-8 d-flex">
              <div className="card flex-fill default-cover w-100 mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">Recent Transactions</h4>
                  <div className="dropdown">
                    <Link to="#" className="view-all d-flex align-items-center">
                      View All
                      <span className="ps-2 d-flex align-items-center">
                        <ArrowRight className="feather-16" />
                      </span>
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-borderless recent-transactions">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Customer</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="text-center">Loading transactions...</td>
                          </tr>
                        ) : salesData?.recentTransactions?.length > 0 ? (
                          salesData.recentTransactions.map((transaction, index) => (
                            <tr key={transaction.id}>
                              <td>{index + 1}</td>
                              <td>
                                <div className="info">
                                  <span className="d-block head-text">{transaction.customer}</span>
                                  <span className="dull-text d-flex align-items-center">
                                    <Clock className="feather-14" />
                                    {new Date(transaction.date).toLocaleTimeString()}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <span className="d-block head-text">{transaction.paymentMethod}</span>
                                <span className="text-blue">#{transaction.id.slice(-8)}</span>
                              </td>
                              <td>
                                <span className={`badge background-less border-${
                                  transaction.status === 'completed' ? 'success' : 
                                  transaction.status === 'cancelled' ? 'danger' : 'primary'
                                }`}>
                                  {transaction.status}
                                </span>
                              </td>
                              <td>${transaction.total.toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center">No recent transactions found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics and Map Section */}
          <div className="row sales-board">
            <div className="col-md-12 col-lg-7 col-sm-12 col-12">
              <div className="card flex-fill default-cover">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Sales Analytics</h5>
                  <div className="graph-sets">
                    <div className="dropdown dropdown-wraper">
                      <button
                        className="btn btn-white btn-sm dropdown-toggle d-flex align-items-center"
                        type="button"
                        id="dropdown-sales"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <Calendar className="feather-14" />
                        2024
                      </button>
                      <ul
                        className="dropdown-menu"
                        aria-labelledby="dropdown-sales"
                      >
                        <li>
                          <Link to="#" className="dropdown-item">
                            2024
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item">
                            2023
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item">
                            2022
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '273px' }}>
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading chart...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="chart-wrapper" style={{ height: '273px', maxHeight: '273px', overflow: 'hidden', width: '100%' }}>
                      <Chart
                        options={chartOptions}
                        series={chartOptions.series}
                        type="area"
                        height={273}
                        width="100%"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-12 col-lg-5 col-sm-12 col-12">
              {/* Sales by Categories */}
              <div className="card default-cover">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Sales by Categories</h5>
                  <div className="graph-sets">
                    <div className="dropdown dropdown-wraper">
                      <button
                        className="btn btn-white btn-sm dropdown-toggle d-flex align-items-center"
                        type="button"
                        id="dropdown-category-sales"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        Last 30 Days
                      </button>
                      <ul
                        className="dropdown-menu"
                        aria-labelledby="dropdown-category-sales"
                      >
                        <li>
                          <Link to="#" className="dropdown-item">
                            Last 30 Days
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item">
                            Last 7 Days
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item">
                            This Month
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {/* Category Sales Data */}
                  {loading ? (
                    <div className="text-center">
                      <div className="spinner-border text-primary" role="status"></div>
                    </div>
                  ) : salesData?.salesByCategory?.length > 0 ? (
                    <div className="category-sales-list">
                      {salesData.salesByCategory.map((category, index) => {
                        const totalRevenue = salesData.salesByCategory.reduce((sum, cat) => sum + cat.revenue, 0);
                        const percentage = totalRevenue > 0 ? ((category.revenue / totalRevenue) * 100).toFixed(1) : 0;
                        
                        return (
                          <div key={index} className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <h6 className="mb-1">{category.category}</h6>
                              <p className="text-muted mb-0">{category.orders} orders • {category.quantity} items</p>
                            </div>
                            <div className="text-end">
                              <h6 className="mb-0">{percentage}%</h6>
                              <p className="text-muted mb-0">${category.revenue.toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p>No category sales data available</p>
                    </div>
                  )}

                  {salesData?.salesByCategory?.length > 0 && (
                    <p className="sales-range mt-3">
                      <span className="text-success">
                        <TrendingUp className="feather-16" />
                        Top category: {salesData.salesByCategory[0]?.category}
                      </span>
                      {" "}with ${salesData.salesByCategory[0]?.revenue?.toLocaleString()} revenue
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EnhancedSalesDashboard;
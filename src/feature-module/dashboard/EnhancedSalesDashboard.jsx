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

const EnhancedSalesDashboard = () => {
  const route = all_routes;
  const dispatch = useDispatch();
  const data = useSelector((state) => state.toggle_header);
  
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    },
    colors: ["#FF9F43"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "straight",
    },
    title: {
      text: "",
      align: "left",
    },
    xaxis: {
      categories: [],
    },
    yaxis: {
      min: 0,
      tickAmount: 5,
      labels: {
        formatter: (val) => {
          return val > 1000 ? (val / 1000).toFixed(1) + "K" : val;
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
    },
  });

  // Fetch sales dashboard data on component mount
  useEffect(() => {
    fetchSalesData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchSalesData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getSalesDashboardStats();
      
      if (response.success) {
        setSalesData(response.data);
        
        // Update chart data with sales trends
        const trendsData = response.data.salesTrends || [];
        setChartOptions(prev => ({
          ...prev,
          series: [
            {
              name: "Sales Analysis",
              data: trendsData.map(trend => trend.sales),
            },
          ],
          xaxis: {
            ...prev.xaxis,
            categories: trendsData.map(trend => new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
          },
        }));
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
    endDate: new Date(),
    ranges: {
      "Last 30 Days": [
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date(),
      ],
      "Last 7 Days": [
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date(),
      ],
      "Last Month": [
        new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      ],
      "This Month": [
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        new Date(),
      ],
      Today: [new Date(), new Date()],
      Yesterday: [
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date(Date.now() - 24 * 60 * 60 * 1000),
      ],
    },
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    timePicker: false,
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
                &nbsp;Hi John Smilga,
              </h3>
              &nbsp;
              <h6>here&apos;s what&apos;s happening with your store today.</h6>
            </div>
            <div className="d-flex align-items-center">
              <div className="position-relative daterange-wraper me-2">
                <div className="input-groupicon calender-input">
                  <DateRangePicker initialSettings={initialSettings}>
                    <input
                      className="form-control col-4 input-range"
                      type="text"
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
          <div className="row mb-3">
            <div className="col-12 d-flex justify-content-end">
              <RealTimeNotifications />
            </div>
          </div>

          {/* Sales Cards */}
          <div className="row sales-cards">
            <div className="col-xl-6 col-sm-12 col-12">
              <div className="card d-flex align-items-center justify-content-between default-cover mb-4">
                <div>
                  <h6>Weekly Earning</h6>
                  <h3>
                    $
                    <CountUp 
                      end={salesData?.kpis?.weeklyEarnings || 95000.45} 
                      duration={3}
                      decimals={2}
                    />
                  </h3>
                  <p className="sales-range">
                    <span className="text-success">
                      <ChevronUp className="feather-16" />
                      48%&nbsp;
                    </span>
                    increase compare to last week
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
                  <CountUp end={salesData?.kpis?.totalSales || 10000} duration={4} />
                  +
                </h3>
                <p>No of Total Sales</p>
                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                  <Link 
                    data-bs-toggle="tooltip"
                    onClick={fetchSalesData}
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
                  <CountUp end={salesData?.kpis?.totalOrders || 800} duration={4} />
                  +
                </h3>
                <p>No of Total Orders</p>
                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                  <Link 
                    data-bs-toggle="tooltip" 
                    data-bs-placement="top"
                    onClick={fetchSalesData}
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
                                      src={product.imageUrl || "assets/img/products/default.png"}
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
                  <div id="sales-analysis" className="chart-set" />
                  <Chart
                    options={chartOptions}
                    series={chartOptions.series}
                    type="area"
                    height={273}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-12 col-lg-5 col-sm-12 col-12">
              {/* Sales by Countries */}
              <div className="card default-cover">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Sales by Countries</h5>
                  <div className="graph-sets">
                    <div className="dropdown dropdown-wraper">
                      <button
                        className="btn btn-white btn-sm dropdown-toggle d-flex align-items-center"
                        type="button"
                        id="dropdown-country-sales"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        This Week
                      </button>
                      <ul
                        className="dropdown-menu"
                        aria-labelledby="dropdown-country-sales"
                      >
                        <li>
                          <Link to="#" className="dropdown-item">
                            This Month
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item">
                            This Year
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {/* Country Sales Data */}
                  {loading ? (
                    <div className="text-center">
                      <div className="spinner-border text-primary" role="status"></div>
                    </div>
                  ) : salesData?.salesByCountry?.length > 0 ? (
                    <div className="country-sales-list">
                      {salesData.salesByCountry.map((country, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <h6 className="mb-1">{country.country}</h6>
                            <p className="text-muted mb-0">{country.orders} orders</p>
                          </div>
                          <div className="text-end">
                            <h6 className="mb-0">{country.sales}%</h6>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p>No country sales data available</p>
                    </div>
                  )}

                  <p className="sales-range mt-3">
                    <span className="text-success">
                      <ChevronUp className="feather-16" />
                      48%&nbsp;
                    </span>
                    increase compare to last week
                  </p>
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
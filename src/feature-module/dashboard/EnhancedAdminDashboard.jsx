import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import {
  File,
  User,
  UserCheck,
  AlertCircle,
  TrendingUp,
  RefreshCw
} from "feather-icons-react/build/IconComponents";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import Image from "../../core/img/image";
import { ArrowRight } from "react-feather";
import { all_routes } from "../../Router/all_routes";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import dashboardService from "../../services/dashboardService";
import RealTimeNotifications from "./RealTimeNotifications";
import useRealTimeDashboard from "../../hooks/useRealTimeDashboard";

const EnhancedAdminDashboard = () => {
  const route = all_routes;
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartOptions, setChartOptions] = useState({
    series: [
      {
        name: "Sales",
        data: [],
      },
      {
        name: "Purchase",
        data: [],
      },
    ],
    colors: ["#28C76F", "#EA5455"],
    chart: {
      type: "bar",
      height: 320,
      stacked: true,
      zoom: {
        enabled: true,
      },
    },
    responsive: [
      {
        breakpoint: 280,
        options: {
          legend: {
            position: "bottom",
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "all",
        columnWidth: "20%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    yaxis: {
      min: -50000,
      max: 50000,
      tickAmount: 5,
    },
    xaxis: {
      categories: [],
    },
    legend: { show: false },
    fill: {
      opacity: 1,
    },
  });

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getAdminDashboardStats();
      
      if (response.success) {
        setDashboardData(response.data);
        
        // Update chart data
        setChartOptions(prev => ({
          ...prev,
          series: [
            {
              name: "Sales",
              data: response.data.chartData?.salesData || [],
            },
            {
              name: "Purchase",
              data: response.data.chartData?.purchaseData || [],
            },
          ],
          xaxis: {
            ...prev.xaxis,
            categories: response.data.chartData?.labels || [],
          },
        }));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const MySwal = withReactContent(Swal);
  const showConfirmationAlert = () => {
    MySwal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      showCancelButton: true,
      confirmButtonColor: "#00ff00",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#ff0000",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        MySwal.fire({
          title: "Deleted!",
          text: "Your file has been deleted.",
          className: "btn btn-success",
          confirmButtonText: "OK",
          customClass: {
            confirmButton: "btn btn-success",
          },
        });
      } else {
        MySwal.close();
      }
    });
  };

  // Error display component
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
                onClick={fetchDashboardData}
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
    <div>
      <div className="page-wrapper">
        <div className="content">
          {loading && (
            <div className="text-center mb-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {dashboardData && !loading && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <TrendingUp className="feather-16 me-2" />
              Dashboard updated successfully! Last refresh: {new Date().toLocaleTimeString()}
              <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
            </div>
          )}

          {/* Real-time Notifications */}
          <div className="row mb-3">
            <div className="col-12 d-flex justify-content-end">
              <RealTimeNotifications />
            </div>
          </div>

          <div className="row">
            {/* KPI Cards */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-widget w-100">
                <div className="dash-widgetimg">
                  <span>
                    <Image
                      src="assets/img/icons/dash1.svg"
                      alt="img"
                    />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    <CountUp 
                      start={0} 
                      end={dashboardData?.kpis?.totalPurchaseDue || 307144} 
                      duration={3} 
                      prefix="$" 
                    />
                  </h5>
                  <h6>Total Purchase Due</h6>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-widget dash1 w-100">
                <div className="dash-widgetimg">
                  <span>
                    <Image
                      src="assets/img/icons/dash2.svg"
                      alt="img"
                    />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    $
                    <CountUp
                      start={0}
                      end={dashboardData?.kpis?.totalSalesDue || 4385}
                      duration={3}
                    />
                  </h5>
                  <h6>Total Sales Due</h6>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-widget dash2 w-100">
                <div className="dash-widgetimg">
                  <span>
                    <Image
                      src="assets/img/icons/dash3.svg"
                      alt="img"
                    />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    $
                    <CountUp
                      start={0}
                      end={dashboardData?.kpis?.totalSaleAmount || 385656.5}
                      duration={3}
                      decimals={1}
                    />
                  </h5>
                  <h6>Total Sale Amount</h6>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-widget dash3 w-100">
                <div className="dash-widgetimg">
                  <span>
                    <Image
                      src="assets/img/icons/dash4.svg"
                      alt="img"
                    />
                  </span>
                </div>
                <div className="dash-widgetcontent">
                  <h5>
                    $
                    <CountUp
                      start={0}
                      end={dashboardData?.kpis?.totalExpenseAmount || 40000}
                      duration={3}
                    />
                  </h5>
                  <h6>Total Expense Amount</h6>
                </div>
              </div>
            </div>

            {/* Count Cards */}
            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count">
                <div className="dash-counts">
                  <h4>{dashboardData?.kpis?.customersCount || 100}</h4>
                  <h5>Customers</h5>
                </div>
                <div className="dash-imgs">
                  <User />
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das1">
                <div className="dash-counts">
                  <h4>{dashboardData?.kpis?.suppliersCount || 110}</h4>
                  <h5>Suppliers</h5>
                </div>
                <div className="dash-imgs">
                  <UserCheck />
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das2">
                <div className="dash-counts">
                  <h4>{dashboardData?.kpis?.purchaseInvoicesCount || 150}</h4>
                  <h5>Purchase Invoice</h5>
                </div>
                <div className="dash-imgs">
                  <Image
                    src="assets/img/icons/file-text-icon-01.svg"
                    className="img-fluid"
                    alt="icon"
                  />
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-sm-6 col-12 d-flex">
              <div className="dash-count das3">
                <div className="dash-counts">
                  <h4>{dashboardData?.kpis?.salesInvoicesCount || 170}</h4>
                  <h5>Sales Invoice</h5>
                </div>
                <div className="dash-imgs">
                  <File />
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Charts Section */}
            <div className="col-xl-7 col-sm-12 col-12 d-flex">
              <div className="card flex-fill">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Purchase &amp; Sales</h5>
                  <div className="d-flex align-items-center">
                    <div className="graph-sets me-3">
                      <ul className="mb-0">
                        <li>
                          <span>Sales</span>
                        </li>
                        <li>
                          <span>Purchase</span>
                        </li>
                      </ul>
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={fetchDashboardData}
                      disabled={loading}
                    >
                      <RefreshCw className={`feather-16 ${loading ? 'fa-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div id="sales_charts" />
                  <Chart
                    options={chartOptions}
                    series={chartOptions.series}
                    type="bar"
                    height={320}
                  />
                </div>
              </div>
            </div>

            {/* Recent Products */}
            <div className="col-xl-5 col-sm-12 col-12 d-flex">
              <div className="card flex-fill default-cover mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">Recent Products</h4>
                  <div className="view-all-link">
                    <Link to="#" className="view-all d-flex align-items-center">
                      View All
                      <span className="ps-2 d-flex align-items-center">
                        <ArrowRight className="feather-16" />
                      </span>
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="table-responsive dataview">
                    <table className="table dashboard-recent-products">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Products</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="3" className="text-center">Loading...</td>
                          </tr>
                        ) : dashboardData?.recentProducts?.length > 0 ? (
                          dashboardData.recentProducts.map((product, index) => (
                            <tr key={product.id}>
                              <td>{index + 1}</td>
                              <td className="productimgname">
                                <Link
                                  to={route.productlist}
                                  className="product-img"
                                >
                                  <Image
                                    src={product.imageUrl || "assets/img/products/default.png"}
                                    alt="product"
                                  />
                                </Link>
                                <Link to={route.productlist}>
                                  {product.name}
                                </Link>
                              </td>
                              <td>${product.price}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">No recent products found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expired Products Section */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title">Expired Products</h4>
              {dashboardData?.alerts?.expired > 0 && (
                <span className="badge bg-warning">
                  <AlertCircle className="feather-12 me-1" />
                  {dashboardData.alerts.expired} expired
                </span>
              )}
            </div>
            <div className="card-body">
              <div className="table-responsive dataview">
                <table className="table dashboard-expired-products">
                  <thead>
                    <tr>
                      <th className="no-sort">
                        <label className="checkboxs">
                          <input type="checkbox" id="select-all" />
                          <span className="checkmarks" />
                        </label>
                      </th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Manufactured Date</th>
                      <th>Expired Date</th>
                      <th className="no-sort">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center">Loading expired products...</td>
                      </tr>
                    ) : dashboardData?.expiredProducts?.length > 0 ? (
                      dashboardData.expiredProducts.map((product, index) => (
                        <tr key={product.id}>
                          <td>
                            <label className="checkboxs">
                              <input type="checkbox" />
                              <span className="checkmarks" />
                            </label>
                          </td>
                          <td>
                            <div className="productimgname">
                              <Link to="#" className="product-img stock-img">
                                <Image
                                  src={product.imageUrl || "assets/img/products/default.png"}
                                  alt="product"
                                />
                              </Link>
                              <Link to="#">{product.name}</Link>
                            </div>
                          </td>
                          <td>
                            <Link to="#">{product.sku}</Link>
                          </td>
                          <td>{new Date(product.manufacturedDate).toLocaleDateString()}</td>
                          <td>{new Date(product.expiredDate).toLocaleDateString()}</td>
                          <td className="action-table-data">
                            <div className="edit-delete-action">
                              <Link className="me-2 p-2" to="#">
                                <i data-feather="edit" className="feather-edit" />
                              </Link>
                              <Link
                                className="confirm-text p-2"
                                to="#"
                                onClick={showConfirmationAlert}
                              >
                                <i
                                  data-feather="trash-2"
                                  className="feather-trash-2"
                                />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">No expired products found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;
import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import {
  File,
  User,
  UserCheck,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  DollarSign,
  Package,
  ShoppingCart,
  Users
} from "feather-icons-react/build/IconComponents";
import Chart from "react-apexcharts";
import { Link } from "react-router-dom";
import Image from "../../core/img/image";
import { ArrowRight } from "react-feather";
import { all_routes } from "../../Router/all_routes";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import dashboardService from "../../services/dashboardService";
import enhancedMongoDBDashboardService from "../../services/enhancedMongoDBDashboardService";
import RealTimeNotifications from "./RealTimeNotifications";
import useRealTimeDashboard from "../../hooks/useRealTimeDashboard";

// Import the new enhanced dashboard components
import KPICard from "../../components/dashboard/KPICard";
import SalesChart from "../../components/dashboard/SalesChart";
import ProductManagement from "../../components/dashboard/ProductManagement";
import CustomerOverview from "../../components/dashboard/CustomerOverview";
import TransactionTable from "../../components/dashboard/TransactionTable";

// Import CSS for enhanced dashboard
import "./EnhancedAdminDashboard.css";
import "../../components/dashboard/KPICard.css";
import "../../components/dashboard/SalesChart.css";
import "../../components/dashboard/ProductManagement.css";
import "../../components/dashboard/CustomerOverview.css";
import "../../components/dashboard/TransactionTable.css";

const EnhancedAdminDashboard = () => {
  const route = all_routes;
  const [dashboardData, setDashboardData] = useState(null);
  const [enhancedData, setEnhancedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Use the existing real-time dashboard hook
  const {
    isConnected: socketConnected,
    notifications,
    realTimeAlerts,
    triggerRefresh
  } = useRealTimeDashboard();

  // Fetch enhanced dashboard data using MongoDB MCP
  useEffect(() => {
    fetchEnhancedDashboardData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchEnhancedDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEnhancedDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch enhanced dashboard data using MCP tools
      const enhancedResponse = await enhancedMongoDBDashboardService.getDashboardData('1M');
      
      if (enhancedResponse) {
        setEnhancedData(enhancedResponse);
        setLastRefresh(new Date());
      }

      // Also fetch legacy dashboard data for compatibility
      try {
        const legacyResponse = await dashboardService.getAdminDashboardStats();
        if (legacyResponse.success) {
          setDashboardData(legacyResponse.data);
        }
      } catch (legacyErr) {
        console.warn('Legacy dashboard data not available:', legacyErr);
      }
      
    } catch (err) {
      console.error('Failed to fetch enhanced dashboard data:', err);
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
          {/* Header Section with Refresh and Notifications */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="page-title mb-1">Admin Dashboard</h1>
                  <p className="text-muted mb-0">
                    Welcome back! Here's what's happening with your business today.
                  </p>
                </div>
                <div className="d-flex align-items-center gap-3">
                  {/* Connection Status Indicator */}
                  <div className="d-flex align-items-center">
                    <div 
                      className={`status-dot me-2 ${socketConnected ? 'connected' : 'disconnected'}`}
                      title={socketConnected ? 'Real-time updates active' : 'Real-time updates disconnected'}
                    />
                    <small className="text-muted">
                      {socketConnected ? 'Live' : 'Offline'}
                    </small>
                  </div>
                  
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => {
                      fetchEnhancedDashboardData();
                      triggerRefresh();
                    }}
                    disabled={loading}
                  >
                    <RefreshCw className={`feather-16 me-2 ${loading ? 'fa-spin' : ''}`} />
                    Refresh
                  </button>
                  <RealTimeNotifications />
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center mb-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2">Loading dashboard data...</p>
            </div>
          )}

          {/* Success Message */}
          {enhancedData && !loading && (
            <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
              <TrendingUp className="feather-16 me-2" />
              Dashboard updated successfully! Last refresh: {lastRefresh.toLocaleTimeString()}
              <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
            </div>
          )}

          {/* Enhanced KPI Cards Section */}
          <div className="row g-4 mb-4">
            <div className="col-xl-3 col-lg-6 col-md-6">
              <KPICard
                title="Total Sales"
                value={enhancedData?.kpis?.totalSales || dashboardData?.kpis?.totalSaleAmount || 0}
                prefix="$"
                icon={<DollarSign />}
                iconBg="success"
                trend="up"
                trendValue="12.5"
                trendText="from last month"
                className="variant-green"
                isLoading={loading}
              />
            </div>
            
            <div className="col-xl-3 col-lg-6 col-md-6">
              <KPICard
                title="Total Products"
                value={enhancedData?.kpis?.totalProducts || dashboardData?.kpis?.totalProducts || 0}
                icon={<Package />}
                iconBg="primary"
                trend="up"
                trendValue="8.2"
                trendText="new this week"
                className="variant-blue"
                isLoading={loading}
              />
            </div>
            
            <div className="col-xl-3 col-lg-6 col-md-6">
              <KPICard
                title="Total Customers"
                value={enhancedData?.kpis?.totalCustomers || dashboardData?.kpis?.customersCount || 0}
                icon={<Users />}
                iconBg="info"
                trend="up"
                trendValue="15.7"
                trendText="growth rate"
                className="variant-purple"
                isLoading={loading}
              />
            </div>
            
            <div className="col-xl-3 col-lg-6 col-md-6">
              <KPICard
                title="Revenue"
                value={enhancedData?.kpis?.revenue || (enhancedData?.kpis?.totalSales - enhancedData?.kpis?.totalPurchases) || 0}
                prefix="$"
                icon={<TrendingUp />}
                iconBg="warning"
                trend="up"
                trendValue="23.1"
                trendText="profit margin"
                className="variant-orange"
                isLoading={loading}
              />
            </div>
          </div>

          {/* Charts and Analytics Section */}
          <div className="row g-4 mb-4">
            {/* Sales Chart - Takes up most of the width */}
            <div className="col-xl-8 col-lg-7">
              <SalesChart className="h-100" />
            </div>
            
            {/* Customer Overview */}
            <div className="col-xl-4 col-lg-5">
              <CustomerOverview className="h-100" />
            </div>
          </div>

          {/* Product Management and Transactions Section */}
          <div className="row g-4 mb-4">
            {/* Product Management */}
            <div className="col-xl-7 col-lg-6">
              <ProductManagement className="h-100" />
            </div>
            
            {/* Transaction Table */}
            <div className="col-xl-5 col-lg-6">
              <TransactionTable className="h-100" />
            </div>
          </div>

          {/* Additional KPI Cards for Legacy Support */}
          <div className="row g-4">
            <div className="col-xl-3 col-lg-6 col-md-6">
              <div className="dash-count w-100">
                <div className="dash-counts">
                  <h4>
                    <CountUp
                      start={0}
                      end={dashboardData?.kpis?.purchaseInvoicesCount || 0}
                      duration={3}
                    />
                  </h4>
                  <h5>Purchase Invoices</h5>
                </div>
                <div className="dash-imgs">
                  <File />
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-lg-6 col-md-6">
              <div className="dash-count das1 w-100">
                <div className="dash-counts">
                  <h4>
                    <CountUp
                      start={0}
                      end={dashboardData?.kpis?.salesInvoicesCount || 0}
                      duration={3}
                    />
                  </h4>
                  <h5>Sales Invoices</h5>
                </div>
                <div className="dash-imgs">
                  <ShoppingCart />
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-lg-6 col-md-6">
              <div className="dash-count das2 w-100">
                <div className="dash-counts">
                  <h4>
                    <CountUp
                      start={0}
                      end={dashboardData?.kpis?.suppliersCount || 0}
                      duration={3}
                    />
                  </h4>
                  <h5>Suppliers</h5>
                </div>
                <div className="dash-imgs">
                  <UserCheck />
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-lg-6 col-md-6">
              <div className="dash-count das3 w-100">
                <div className="dash-counts">
                  <h4>
                    <CountUp
                      start={0}
                      end={enhancedData?.lowStockProducts?.length || dashboardData?.kpis?.lowStockProducts || 0}
                      duration={3}
                    />
                  </h4>
                  <h5>Low Stock Alert</h5>
                </div>
                <div className="dash-imgs">
                  <AlertCircle />
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Last Update Info */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="text-center text-muted">
                <small>
                  Last updated: {lastRefresh.toLocaleString()} | 
                  Data refreshed every 5 minutes | 
                  {enhancedData ? 'Enhanced MongoDB data active' : 'Legacy data mode'} |
                  Real-time: {socketConnected ? 'Connected' : 'Disconnected'} |
                  {notifications.length > 0 && `${notifications.filter(n => !n.read).length} unread notifications`}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;
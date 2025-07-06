import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import Breadcrumbs from "../../core/breadcrumbs";
import Image from "../../core/img/image";
import { Link } from "react-router-dom";
import { Filter, Sliders, Box, ShoppingCart, DollarSign, Package, AlertTriangle, Download, Calendar, User } from "react-feather";
import Select from "react-select";
import purchaseService from "../../services/purchaseService";
import { toast } from "react-toastify";

const PurchaseReport = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [purchaseData, setPurchaseData] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    startDate: '',
    endDate: '',
    supplierId: '',
    locationId: '',
    status: '',
    paymentStatus: ''
  });

  const [pageSizeOptions] = useState([
    { value: 10, label: "10 per page" },
    { value: 25, label: "25 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" }
  ]);

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "ordered", label: "Ordered" },
    { value: "received", label: "Received" },
    { value: "cancelled", label: "Cancelled" },
    { value: "partial", label: "Partial" }
  ];

  const paymentStatusOptions = [
    { value: "", label: "All Payment Status" },
    { value: "unpaid", label: "Unpaid" },
    { value: "partial", label: "Partial" },
    { value: "paid", label: "Paid" }
  ];

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadPurchaseData();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      console.log('🏁 Loading initial data for purchase report...');
      
      // Test backend connectivity first
      try {
        console.log('🔍 Testing backend connectivity...');
        const healthCheck = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/protected`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('🔍 Backend health check response:', healthCheck.status, healthCheck.statusText);
      } catch (healthError) {
        console.error('⚠️ Backend connectivity test failed:', healthError);
        toast.warning('Backend connectivity issue detected. Some features may not work.');
      }
      
      // TEMPORARILY SKIP suppliers and locations loading to test main functionality
      console.log('🚧 Temporarily skipping suppliers/locations loading due to 403 errors');
      console.log('🚧 Setting up basic filter options...');
      
      // Set basic filter options without API calls
      setSuppliers([
        { value: "", label: "All Suppliers" }
      ]);
      
      setLocations([
        { value: "", label: "All Locations" }
      ]);
      
      console.log('✅ Basic filter options set up successfully');
      toast.info('Filter options temporarily limited. Working on resolving supplier/location API access.');
      
      /* COMMENTED OUT UNTIL 403 ISSUE IS RESOLVED
      // Load suppliers and locations for filter dropdowns
      const [suppliersData, locationsData] = await Promise.all([
        purchaseService.getSuppliers(),
        purchaseService.getLocations()
      ]);
      
      console.log('📦 Loaded suppliers:', suppliersData?.length || 0);
      console.log('📍 Loaded locations:', locationsData?.length || 0);
      
      setSuppliers([
        { value: "", label: "All Suppliers" },
        ...(suppliersData?.map(supplier => ({
          value: supplier._id,
          label: supplier.supplierName || supplier.name
        })) || [])
      ]);
      
      setLocations([
        { value: "", label: "All Locations" },
        ...(locationsData?.map(location => ({
          value: location._id,
          label: location.name
        })) || [])
      ]);
      */
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      toast.error('Failed to load filter options. Please check your connection and try again.');
    }
  };

  const loadPurchaseData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting purchase data load...');
      
      const params = {
        page: filters.page,
        limit: filters.limit,
        // Add cache busting parameter
        _t: Date.now(),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.supplierId && { supplierId: filters.supplierId }),
        ...(filters.locationId && { locationId: filters.locationId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus })
      };

      console.log('📋 Request parameters:', params);
      const response = await purchaseService.getComprehensivePurchaseReport(params);
      
      console.log('📊 Setting purchase data:', {
        purchasesCount: response.purchases?.length || 0,
        summary: response.summary,
        pagination: response.pagination
      });
      
      setPurchaseData(response.purchases || []);
      setSummary(response.summary || {});
      setPagination(response.pagination || {});
      
      if (response.purchases?.length > 0) {
        toast.success(`Loaded ${response.purchases.length} purchases successfully`);
      }
    } catch (error) {
      console.error('❌ Error loading purchase data:', error);
      
      let errorMessage = 'Failed to load purchase data';
      
      if (error.response) {
        // Server responded with error
        errorMessage = `Server Error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network Error: Could not connect to server. Please check if the backend is running on port 5000.';
      } else {
        // Something else happened
        errorMessage = `Request Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
      console.error('🔍 Full error details:', {
        name: error.name,
        message: error.message,
        response: error.response,
        request: error.request,
        config: error.config
      });
      
      // Set empty data structure on error
      setPurchaseData([]);
      setSummary({});
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize) => {
    setFilters(prev => ({ ...prev, limit: newSize, page: 1 }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const applyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadPurchaseData();
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      startDate: '',
      endDate: '',
      supplierId: '',
      locationId: '',
      status: '',
      paymentStatus: ''
    });
    setSearchTerm('');
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const params = {
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.supplierId && { supplierId: filters.supplierId }),
        ...(filters.locationId && { locationId: filters.locationId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus })
      };
      await purchaseService.exportPurchaseReportPDF(params);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const params = {
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.supplierId && { supplierId: filters.supplierId }),
        ...(filters.locationId && { locationId: filters.locationId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus })
      };
      await purchaseService.exportPurchaseReportExcel(params);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  const filteredPurchases = purchaseData.filter(purchase => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      purchase.purchaseNumber?.toString().toLowerCase().includes(search) ||
      purchase.supplier?.supplierName?.toLowerCase().includes(search) ||
      purchase.warehouse?.name?.toLowerCase().includes(search) ||
      purchase.status?.toLowerCase().includes(search) ||
      purchase.supplier?.email?.toLowerCase().includes(search)
    );
  });

  // Calculate summary metrics
  const summaryMetrics = {
    totalPurchases: summary.totalPurchases || 0,
    totalAmount: summary.totalAmount || 0,
    totalDue: summary.totalDue || 0,
    avgOrderValue: summary.avgOrderValue || 0,
    pendingOrders: summary.statusBreakdown?.pending?.count || 0,
    unpaidAmount: summary.paymentBreakdown?.unpaid?.totalAmount || 0
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumbs
          maintitle="Purchase Report"
          subtitle="Comprehensive Purchase Analytics & Reporting"
        />
        
        {/* Summary Cards */}
        <div className="row">
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-widget w-100">
              <div className="dash-widgetimg">
                <span>
                  <DollarSign className="text-success" size={24} />
                </span>
              </div>
              <div className="dash-widgetcontent">
                <h5>
                  $
                  <CountUp
                    start={0}
                    end={summaryMetrics.totalAmount}
                    duration={3}
                    decimals={2}
                  />
                </h5>
                <h6>Total Purchase Amount</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-count">
              <div className="dash-counts">
                <h4>
                  <CountUp
                    start={0}
                    end={summaryMetrics.totalPurchases}
                    duration={3}
                  />
                </h4>
                <h5>Total Purchase Orders</h5>
              </div>
              <div className="dash-imgs">
                <ShoppingCart />
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-widget dash1 w-100">
              <div className="dash-widgetimg">
                <span>
                  <Package className="text-primary" size={24} />
                </span>
              </div>
              <div className="dash-widgetcontent">
                <h5>
                  <CountUp
                    start={0}
                    end={summaryMetrics.pendingOrders}
                    duration={3}
                  />
                </h5>
                <h6>Pending Orders</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-count das1">
              <div className="dash-counts">
                <h4>
                  $
                  <CountUp
                    start={0}
                    end={summaryMetrics.totalDue}
                    duration={3}
                    decimals={2}
                  />
                </h4>
                <h5>Amount Due</h5>
              </div>
              <div className="dash-imgs">
                <AlertTriangle className="text-warning" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Purchase Report Table */}
        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search purchases..."
                    className="form-control form-control-sm formsearch"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Link to className="btn btn-searchset">
                    <i data-feather="search" className="feather-search" />
                  </Link>
                </div>
              </div>
              <div className="search-path">
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-info btn-sm d-flex align-items-center gap-1"
                    onClick={handleExportPDF}
                    disabled={exporting}
                  >
                    <Download size={16} />
                    {exporting ? 'Exporting...' : 'PDF'}
                  </button>
                  <button
                    className="btn btn-success btn-sm d-flex align-items-center gap-1"
                    onClick={handleExportExcel}
                    disabled={exporting}
                  >
                    <Download size={16} />
                    {exporting ? 'Exporting...' : 'Excel'}
                  </button>
                  <Link
                    className={`btn btn-filter ${
                      isFilterVisible ? "setclose" : ""
                    }`}
                    id="filter_search"
                  >
                    <Filter
                      className="filter-icon"
                      onClick={toggleFilterVisibility}
                    />
                    <span onClick={toggleFilterVisibility}>
                      <Image
                        src="assets/img/icons/closes.svg"
                        alt="img"
                      />
                    </span>
                  </Link>
                </div>
              </div>
              <div className="form-sort stylewidth">
                <Sliders className="info-img" />
                <Select
                  className="select"
                  options={pageSizeOptions}
                  value={pageSizeOptions.find(option => option.value === filters.limit)}
                  onChange={(option) => handlePageSizeChange(option.value)}
                  placeholder="Page Size"
                />
              </div>
            </div>
            
            {/* Enhanced Filter */}
            <div
              className={`card${isFilterVisible ? " visible" : ""}`}
              id="filter_inputs"
              style={{ display: isFilterVisible ? "block" : "none" }}
            >
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-lg-2">
                    <div className="input-blocks">
                      <Calendar className="info-img" />
                      <input
                        type="date"
                        className="form-control"
                        placeholder="Start Date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="input-blocks">
                      <Calendar className="info-img" />
                      <input
                        type="date"
                        className="form-control"
                        placeholder="End Date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="input-blocks">
                      <User className="info-img" />
                      <Select 
                        className="select" 
                        options={suppliers}
                        value={suppliers.find(option => option.value === filters.supplierId)}
                        onChange={(option) => handleFilterChange('supplierId', option?.value || '')}
                        placeholder="Select Supplier"
                      />
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="input-blocks">
                      <Box className="info-img" />
                      <Select 
                        className="select" 
                        options={locations}
                        value={locations.find(option => option.value === filters.locationId)}
                        onChange={(option) => handleFilterChange('locationId', option?.value || '')}
                        placeholder="Select Location"
                      />
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="input-blocks">
                      <Package className="info-img" />
                      <Select 
                        className="select" 
                        options={statusOptions}
                        value={statusOptions.find(option => option.value === filters.status)}
                        onChange={(option) => handleFilterChange('status', option?.value || '')}
                        placeholder="Status"
                      />
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="input-blocks">
                      <DollarSign className="info-img" />
                      <Select 
                        className="select" 
                        options={paymentStatusOptions}
                        value={paymentStatusOptions.find(option => option.value === filters.paymentStatus)}
                        onChange={(option) => handleFilterChange('paymentStatus', option?.value || '')}
                        placeholder="Payment Status"
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-12">
                    <div className="input-blocks">
                      <button className="btn btn-filters me-2" onClick={applyFilters}>
                        <i className="feather-search me-1" />
                        Apply Filters
                      </button>
                      <button className="btn btn-secondary" onClick={resetFilters}>
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Purchase Table */}
            <div className="table-responsive">
              {loading ? (
                <div className="text-center p-4">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : (
                <table className="table datanew">
                  <thead>
                    <tr>
                      <th className="no-sort">
                        <label className="checkboxs">
                          <input type="checkbox" id="select-all" />
                          <span className="checkmarks" />
                        </label>
                      </th>
                      <th>Purchase #</th>
                      <th>Date</th>
                      <th>Supplier</th>
                      <th>Warehouse</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.length > 0 ? filteredPurchases.map((purchase, index) => (
                      <tr key={purchase._id || index}>
                        <td>
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                        </td>
                        <td>
                          <Link to={`/purchases/${purchase._id}`} className="text-primary">
                            {purchase.purchaseNumber || `#${purchase._id?.slice(-6)}`}
                          </Link>
                        </td>
                        <td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                        <td>
                          <div className="supplier-info">
                            <h6 className="mb-1">{purchase.supplier?.supplierName || 'N/A'}</h6>
                            <p className="text-muted mb-0 small">{purchase.supplier?.email || ''}</p>
                          </div>
                        </td>
                        <td>
                          <span className={purchase.warehouse?.name ? 'text-dark' : 'text-muted'}>
                            {purchase.warehouse?.name || 'No Warehouse Assigned'}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-soft-info">
                            {purchase.items?.length || 0} items
                          </span>
                        </td>
                        <td className="text-success font-weight-bold">
                          ${purchase.grandTotal?.toFixed(2) || '0.00'}
                        </td>
                        <td className="text-info">
                          ${purchase.amountPaid?.toFixed(2) || '0.00'}
                        </td>
                        <td className={purchase.amountDue > 0 ? 'text-warning font-weight-bold' : 'text-muted'}>
                          ${purchase.amountDue?.toFixed(2) || '0.00'}
                        </td>
                        <td>
                          <span className={`badge ${
                            purchase.status === 'received' ? 'badge-soft-success' :
                            purchase.status === 'ordered' ? 'badge-soft-info' :
                            purchase.status === 'pending' ? 'badge-soft-warning' :
                            purchase.status === 'cancelled' ? 'badge-soft-danger' :
                            purchase.status === 'partial' ? 'badge-soft-primary' :
                            'badge-soft-secondary'
                          }`}>
                            {purchase.status || 'pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            purchase.paymentStatus === 'paid' ? 'badge-soft-success' :
                            purchase.paymentStatus === 'partial' ? 'badge-soft-warning' :
                            purchase.paymentStatus === 'unpaid' ? 'badge-soft-danger' :
                            'badge-soft-secondary'
                          }`}>
                            {purchase.paymentStatus || 'unpaid'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="11" className="text-center p-4">
                          {loading ? 'Loading...' : 'No purchases found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Enhanced Pagination */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mt-4 gap-3">
              {/* Results Info & Page Size Selector */}
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3">
                <div className="text-muted">
                  Showing {pagination.totalRecords > 0 ? (((pagination.currentPage - 1) * pagination.limit) + 1) : 0} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords} entries
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Show:</span>
                  <Select
                    value={pageSizeOptions.find(option => option.value === filters.limit)}
                    onChange={(option) => handlePageSizeChange(option.value)}
                    options={pageSizeOptions}
                    className="select-sm"
                    styles={{
                      control: (base) => ({ 
                        ...base, 
                        minHeight: '32px', 
                        minWidth: '120px',
                        fontSize: '14px'
                      }),
                      menuPortal: (base) => ({ ...base, zIndex: 9999 })
                    }}
                    menuPortalTarget={document.body}
                    isSearchable={false}
                  />
                </div>
              </div>
              
              {/* Pagination Navigation */}
              {pagination.totalPages > 1 && (
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1}
                        title="First Page"
                      >
                        «
                      </button>
                    </li>
                    <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        title="Previous Page"
                      >
                        ‹
                      </button>
                    </li>
                    
                    {/* Dynamic Page Numbers with Ellipsis */}
                    {(() => {
                      const totalPages = pagination.totalPages;
                      const currentPage = pagination.currentPage;
                      const pages = [];
                      
                      if (totalPages <= 7) {
                        // Show all pages if 7 or fewer
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Show pages with ellipsis logic
                        if (currentPage <= 4) {
                          // Near the beginning
                          pages.push(1, 2, 3, 4, 5, '...', totalPages);
                        } else if (currentPage >= totalPages - 3) {
                          // Near the end
                          pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                        } else {
                          // In the middle
                          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                        }
                      }
                      
                      return pages.map((page, index) => {
                        if (page === '...') {
                          return (
                            <li key={`ellipsis-${index}`} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          );
                        }
                        return (
                          <li key={page} className={`page-item ${pagination.currentPage === page ? 'active' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          </li>
                        );
                      });
                    })()}
                    
                    <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        title="Next Page"
                      >
                        ›
                      </button>
                    </li>
                    <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        title="Last Page"
                      >
                        »
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReport;

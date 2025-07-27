import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import Breadcrumbs from "../../core/breadcrumbs";
import Image from "../../core/img/image";
import { Link } from "react-router-dom";
import { Filter, Sliders, Box, Package, AlertTriangle, DollarSign, TrendingUp, Download, Search, MapPin } from "react-feather";
import Select from "react-select";
import inventoryService from "../../services/inventoryService";
import { toast } from "react-toastify";
import { getProductImageUrl, getDefaultProductImage } from "../../services/imageService";

const InventoryReport = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    locationId: '',
    categoryId: '',
    stockStatus: '',
    lowStock: false,
    sortBy: 'productName',
    sortOrder: 'asc'
  });

  const [pageSizeOptions] = useState([
    { value: 10, label: "10 per page" },
    { value: 25, label: "25 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" }
  ]);

  const stockStatusOptions = [
    { value: "", label: "All Stock Status" },
    { value: "in_stock", label: "In Stock" },
    { value: "low_stock", label: "Low Stock" },
    { value: "out_of_stock", label: "Out of Stock" }
  ];

  const sortOptions = [
    { value: "productName", label: "Product Name" },
    { value: "quantity", label: "Quantity" },
    { value: "stockValue", label: "Stock Value" },
    { value: "locationName", label: "Location" }
  ];

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadInventoryData();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      console.log('🏁 Loading initial data for inventory report...');
      
      // Load categories and locations for filter dropdowns
      const [categoriesData, locationsData] = await Promise.all([
        inventoryService.getProductCategories(),
        inventoryService.getLocations()
      ]);
      
      console.log('📦 Loaded categories:', categoriesData?.length || 0);
      console.log('📍 Loaded locations:', locationsData?.length || 0);
      
      setCategories([
        { value: "", label: "All Categories" },
        ...(categoriesData?.map(category => ({
          value: category._id,
          label: category.name
        })) || [])
      ]);
      
      setLocations([
        { value: "", label: "All Locations" },
        ...(locationsData?.map(location => ({
          value: location._id,
          label: location.name
        })) || [])
      ]);
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      toast.error('Failed to load filter options. Please check your connection and try again.');
    }
  };

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting inventory data load...');
      
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: searchTerm,
        // Add cache busting parameter
        _t: Date.now(),
        ...(filters.locationId && { locationId: filters.locationId }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.stockStatus && { stockStatus: filters.stockStatus }),
        ...(filters.lowStock && { lowStock: 'true' }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder })
      };

      console.log('📋 Request parameters:', params);
      const response = await inventoryService.getComprehensiveInventoryReport(params);
      
      console.log('📊 Setting inventory data:', {
        inventoryCount: response.inventory?.length || 0,
        summary: response.summary,
        pagination: response.pagination
      });
      
      setInventoryData(response.inventory || []);
      setSummary(response.summary || {});
      setPagination(response.pagination || {});
      
      if (response.inventory?.length > 0) {
        toast.success(`Loaded ${response.inventory.length} inventory items successfully`);
      }
    } catch (error) {
      console.error('❌ Error loading inventory data:', error);
      
      let errorMessage = 'Failed to load inventory data';
      
      if (error.response) {
        errorMessage = `Server Error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Network Error: Could not connect to server. Please check if the backend is running on port 5000.';
      } else {
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
      setInventoryData([]);
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
    loadInventoryData();
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      locationId: '',
      categoryId: '',
      stockStatus: '',
      lowStock: false,
      sortBy: 'productName',
      sortOrder: 'asc'
    });
    setSearchTerm('');
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const params = {
        search: searchTerm,
        ...(filters.locationId && { locationId: filters.locationId }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.stockStatus && { stockStatus: filters.stockStatus }),
        ...(filters.lowStock && { lowStock: 'true' })
      };
      await inventoryService.exportInventoryReportPDF(params);
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
        search: searchTerm,
        ...(filters.locationId && { locationId: filters.locationId }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.stockStatus && { stockStatus: filters.stockStatus }),
        ...(filters.lowStock && { lowStock: 'true' })
      };
      await inventoryService.exportInventoryReportExcel(params);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  const getStockStatusBadge = (status, quantity, notifyAt) => {
    if (quantity === 0) {
      return <span className="badge badge-soft-danger">Out of Stock</span>;
    } else if (quantity <= notifyAt) {
      return <span className="badge badge-soft-warning">Low Stock</span>;
    } else {
      return <span className="badge badge-soft-success">In Stock</span>;
    }
  };

  // Calculate summary metrics
  const summaryMetrics = {
    totalProducts: summary.totalProducts || 0,
    totalQuantity: summary.totalQuantity || 0,
    totalValue: summary.totalValue || 0,
    lowStockItems: summary.lowStockItems || 0,
    outOfStockItems: summary.outOfStockItems || 0,
    stockHealthPercentage: summary.stockHealthPercentage || 0
  };
  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumbs
          maintitle="Inventory Report"
          subtitle="Comprehensive Inventory Analytics & Stock Management"
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
                    end={summaryMetrics.totalValue}
                    duration={3}
                    decimals={2}
                  />
                </h5>
                <h6>Total Inventory Value</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-count">
              <div className="dash-counts">
                <h4>
                  <CountUp
                    start={0}
                    end={summaryMetrics.totalProducts}
                    duration={3}
                  />
                </h4>
                <h5>Total Products</h5>
              </div>
              <div className="dash-imgs">
                <Package />
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-widget dash1 w-100">
              <div className="dash-widgetimg">
                <span>
                  <AlertTriangle className="text-warning" size={24} />
                </span>
              </div>
              <div className="dash-widgetcontent">
                <h5>
                  <CountUp
                    start={0}
                    end={summaryMetrics.lowStockItems}
                    duration={3}
                  />
                </h5>
                <h6>Low Stock Items</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-count das1">
              <div className="dash-counts">
                <h4>
                  <CountUp
                    start={0}
                    end={summaryMetrics.stockHealthPercentage}
                    duration={3}
                  />
                  %
                </h4>
                <h5>Stock Health</h5>
              </div>
              <div className="dash-imgs">
                <TrendingUp className="text-success" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Inventory Report Table */}
        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search products, SKU, or location..."
                    className="form-control form-control-sm formsearch"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Link to className="btn btn-searchset">
                    <Search className="feather-search" />
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
                  <div className="col-lg-3">
                    <div className="input-blocks">
                      <MapPin className="info-img" />
                      <Select 
                        className="select" 
                        options={locations}
                        value={locations.find(option => option.value === filters.locationId)}
                        onChange={(option) => handleFilterChange('locationId', option?.value || '')}
                        placeholder="Select Location"
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="input-blocks">
                      <Box className="info-img" />
                      <Select 
                        className="select" 
                        options={categories}
                        value={categories.find(option => option.value === filters.categoryId)}
                        onChange={(option) => handleFilterChange('categoryId', option?.value || '')}
                        placeholder="Select Category"
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="input-blocks">
                      <Package className="info-img" />
                      <Select 
                        className="select" 
                        options={stockStatusOptions}
                        value={stockStatusOptions.find(option => option.value === filters.stockStatus)}
                        onChange={(option) => handleFilterChange('stockStatus', option?.value || '')}
                        placeholder="Stock Status"
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="input-blocks">
                      <Sliders className="info-img" />
                      <Select 
                        className="select" 
                        options={sortOptions}
                        value={sortOptions.find(option => option.value === filters.sortBy)}
                        onChange={(option) => handleFilterChange('sortBy', option?.value || 'productName')}
                        placeholder="Sort By"
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-12">
                    <div className="input-blocks d-flex gap-2">
                      <div className="form-check">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          id="lowStockFilter"
                          checked={filters.lowStock}
                          onChange={(e) => handleFilterChange('lowStock', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="lowStockFilter">
                          Show only low stock items
                        </label>
                      </div>
                      <button className="btn btn-filters ms-auto me-2" onClick={applyFilters}>
                        <Search className="me-1" size={16} />
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
            
            {/* Inventory Table */}
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
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Quantity</th>
                      <th>Min Stock</th>
                      <th>Unit Price</th>
                      <th>Stock Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryData.length > 0 ? inventoryData.map((item, index) => (
                      <tr key={item._id || index}>
                        <td>
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                        </td>
                        <td className="productimgname">
                          <div className="view-product me-2">
                            <Link to="#">
                              <Image
                                src={getProductImageUrl(item.productImage) || getDefaultProductImage()}
                                alt="product"
                              />
                            </Link>
                          </div>
                          <Link to="#" className="text-primary">
                            {item.productName || 'N/A'}
                          </Link>
                        </td>
                        <td>{item.sku || 'N/A'}</td>
                        <td>{item.categoryName || 'N/A'}</td>
                        <td>
                          <span className={item.locationName ? 'text-dark' : 'text-muted'}>
                            {item.locationName || 'No Location'}
                          </span>
                        </td>
                        <td>
                          <span className={`font-weight-bold ${
                            item.quantity === 0 ? 'text-danger' : 
                            item.quantity <= item.notifyAt ? 'text-warning' : 'text-success'
                          }`}>
                            {item.quantity || 0}
                          </span>
                        </td>
                        <td>{item.minStock || 0}</td>
                        <td className="text-success">${(item.sellingPrice || 0).toFixed(2)}</td>
                        <td className="text-info font-weight-bold">
                          ${(item.stockValue || 0).toFixed(2)}
                        </td>
                        <td>
                          {getStockStatusBadge(item.stockStatus, item.quantity, item.notifyAt)}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="10" className="text-center p-4">
                          {loading ? 'Loading...' : 'No inventory items found'}
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

export default InventoryReport;

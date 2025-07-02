import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import Breadcrumbs from "../../core/breadcrumbs";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import { Link } from "react-router-dom";
import { Filter, Sliders, Box, Zap, ShoppingCart, CreditCard } from "react-feather";
import Select from "react-select";
import salesService from "../../services/salesService";
import { toast } from "react-toastify";

const SalesReport = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25
  });
  const [pageSizeOptions] = useState([
    { value: 10, label: "10 per page" },
    { value: 25, label: "25 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" }
  ]);

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  const options = [
    { value: "sortByDate", label: "Sort by Date" },
    { value: "140923", label: "14 09 23" },
    { value: "110923", label: "11 09 23" },
  ];

  const productOptions = [
    { value: "chooseProduct", label: "Choose Product" },
    { value: "boldV3.2", label: "Bold V3.2" },
    { value: "nikeJordan", label: "Nike Jordan" },
  ];

  const categoryOptions = [
    { value: "chooseCategory", label: "Choose Category" },
    { value: "accessories", label: "Accessories" },
    { value: "shoe", label: "Shoe" },
  ];

  // Load initial data
  useEffect(() => {
    loadSalesData();
  }, [filters]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
      };

      const response = await salesService.getSalesReport(params);
      setSalesData(response.sales || []);
      setSummary(response.summary || {});
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast.error('Failed to load sales data');
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

  const filteredSales = salesData.filter(sale => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      sale.saleId?.toString().toLowerCase().includes(search) ||
      sale.customer?.name?.toLowerCase().includes(search) ||
      sale.location?.name?.toLowerCase().includes(search) ||
      sale.paymentMethod?.toLowerCase().includes(search)
    );
  });

  // Calculate summary metrics from sales data
  const calculateSummaryMetrics = () => {
    if (!salesData || salesData.length === 0) {
      return {
        totalSalesAmount: 0,
        totalTransactions: 0,
        averageOrderValue: 0,
        topPaymentMethod: 'N/A'
      };
    }

    const totalSalesAmount = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalTransactions = salesData.length;
    const averageOrderValue = totalTransactions > 0 ? totalSalesAmount / totalTransactions : 0;
    
    // Find most common payment method
    const paymentMethodCount = {};
    salesData.forEach(sale => {
      const method = sale.paymentMethod || 'Unknown';
      paymentMethodCount[method] = (paymentMethodCount[method] || 0) + 1;
    });
    
    const topPaymentMethod = Object.keys(paymentMethodCount).reduce((a, b) => 
      paymentMethodCount[a] > paymentMethodCount[b] ? a : b, 'N/A'
    );

    return {
      totalSalesAmount,
      totalTransactions,
      averageOrderValue,
      topPaymentMethod: topPaymentMethod.replace('_', ' ').toUpperCase()
    };
  };

  const summaryMetrics = calculateSummaryMetrics();

  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumbs
          maintitle="Sales Report"
          subtitle=" Manage Your Sales Report"
        />
        
        {/* Summary Cards */}
        <div className="row">
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-widget w-100">
              <div className="dash-widgetimg">
                <span>
                  <ImageWithBasePath
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
                    end={summaryMetrics.totalSalesAmount}
                    duration={3}
                    decimals={2}
                  />
                </h5>
                <h6>Total Sales Amount</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-count">
              <div className="dash-counts">
                <h4>
                  <CountUp
                    start={0}
                    end={summaryMetrics.totalTransactions}
                    duration={3}
                  />
                </h4>
                <h5>Total Transactions</h5>
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
                  <ImageWithBasePath
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
                    end={summaryMetrics.averageOrderValue}
                    duration={3}
                    decimals={2}
                  />
                </h5>
                <h6>Average Order Value</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-count das1">
              <div className="dash-counts">
                <h4>{summaryMetrics.topPaymentMethod}</h4>
                <h5>Top Payment Method</h5>
              </div>
              <div className="dash-imgs">
                <CreditCard />
              </div>
            </div>
          </div>
        </div>
        
        {/* Sales Report Table */}
        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search"
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
                    <ImageWithBasePath
                      src="assets/img/icons/closes.svg"
                      alt="img"
                    />
                  </span>
                </Link>
              </div>
              <div className="form-sort stylewidth">
                <Sliders className="info-img" />

                <Select
                  className="select "
                  options={options}
                  placeholder="Sort by Date"
                />
              </div>
            </div>
            {/* /Filter */}
            <div
              className={`card${isFilterVisible ? " visible" : ""}`}
              id="filter_inputs"
              style={{ display: isFilterVisible ? "block" : "none" }}
            >
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-lg-3">
                    <div className="input-blocks">
                      <Box className="info-img" />
                      <Select className="select" options={productOptions} />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="input-blocks">
                      <Zap className="info-img" />
                      <Select className="select" options={categoryOptions} />
                    </div>
                  </div>
                  <div className="col-lg-6 col-sm-6 col-12">
                    <div className="input-blocks">
                      <Link className="btn btn-filters ms-auto">
                        {" "}
                        <i
                          data-feather="search"
                          className="feather-search"
                        />{" "}
                        Search{" "}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Filter */}
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
                      <th>Sale ID</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Location</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.length > 0 ? filteredSales.map((sale, index) => (
                      <tr key={sale._id || index}>
                        <td>
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                        </td>
                        <td>
                          <Link to={`/sales/${sale._id}`} className="text-primary">
                            {sale.saleId || `#${sale._id?.slice(-6)}`}
                          </Link>
                        </td>
                        <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="customer-info">
                            <h6 className="mb-1">{sale.customer?.name || 'Walk-in Customer'}</h6>
                            <p className="text-muted mb-0">{sale.customer?.type || 'Individual'}</p>
                          </div>
                        </td>
                        <td>{sale.location?.name || 'N/A'}</td>
                        <td>
                          <span className="badge badge-soft-info">
                            {sale.items?.length || 0} items
                          </span>
                        </td>
                        <td className="text-success font-weight-bold">
                          ${sale.total?.toFixed(2) || '0.00'}
                        </td>
                        <td>
                          <span className={`badge ${
                            sale.paymentMethod === 'cash' ? 'badge-soft-success' :
                            sale.paymentMethod === 'card' ? 'badge-soft-primary' :
                            sale.paymentMethod === 'mobile_money' ? 'badge-soft-warning' :
                            'badge-soft-secondary'
                          }`}>
                            {sale.paymentMethod?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            sale.status === 'completed' ? 'badge-soft-success' :
                            sale.status === 'pending' ? 'badge-soft-warning' :
                            sale.status === 'cancelled' ? 'badge-soft-danger' :
                            'badge-soft-secondary'
                          }`}>
                            {sale.status || 'completed'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="9" className="text-center p-4">
                          {loading ? 'Loading...' : 'No sales found'}
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
        {/* /product list */}
      </div>
    </div>
  );
};

export default SalesReport;
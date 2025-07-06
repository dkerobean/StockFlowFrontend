import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import Breadcrumbs from "../../core/breadcrumbs";
import Image from "../../core/img/image";
import { Link } from "react-router-dom";
import { Filter, Sliders, DollarSign, FileText, TrendingUp, AlertTriangle, Download, Search, Calendar, CreditCard, Tag } from "react-feather";
import Select from "react-select";
import expenseReportService from "../../services/expenseReportService";
import { toast } from "react-toastify";

const ExpenseReport = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expenseData, setExpenseData] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    startDate: '',
    endDate: '',
    category: '',
    paymentMethod: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [pageSizeOptions] = useState([
    { value: 10, label: "10 per page" },
    { value: 25, label: "25 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" }
  ]);

  const sortOptions = [
    { value: "date", label: "Date" },
    { value: "amount", label: "Amount" },
    { value: "category", label: "Category" },
    { value: "description", label: "Description" }
  ];

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadExpenseData();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      console.log('🏁 Loading initial data for expense report...');
      
      // Load categories and payment methods for filter dropdowns
      const [categoriesData, paymentMethodsData] = await Promise.all([
        expenseReportService.getStaticCategories(),
        expenseReportService.getPaymentMethods()
      ]);
      
      console.log('📦 Loaded categories:', categoriesData?.length || 0);
      console.log('💳 Loaded payment methods:', paymentMethodsData?.length || 0);
      
      setCategories(categoriesData || []);
      setPaymentMethods(paymentMethodsData || []);
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      toast.error('Failed to load filter options. Please check your connection and try again.');
    }
  };

  const loadExpenseData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting expense data load...');
      
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: searchTerm,
        // Add cache busting parameter
        _t: Date.now(),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.category && { category: filters.category }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder })
      };

      console.log('📋 Request parameters:', params);
      const response = await expenseReportService.getComprehensiveExpenseReport(params);
      
      console.log('📊 Setting expense data:', {
        expensesCount: response.expenses?.length || 0,
        summary: response.summary,
        pagination: response.pagination
      });
      
      setExpenseData(response.expenses || []);
      setSummary(response.summary || {});
      setPagination(response.pagination || {});
      
      if (response.expenses?.length > 0) {
        toast.success(`Loaded ${response.expenses.length} expenses successfully`);
      }
    } catch (error) {
      console.error('❌ Error loading expense data:', error);
      
      let errorMessage = 'Failed to load expense data';
      
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
      setExpenseData([]);
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
    loadExpenseData();
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      startDate: '',
      endDate: '',
      category: '',
      paymentMethod: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setSearchTerm('');
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const params = {
        search: searchTerm,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.category && { category: filters.category }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount })
      };
      await expenseReportService.exportExpenseReportPDF(params);
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
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.category && { category: filters.category }),
        ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount })
      };
      await expenseReportService.exportExpenseReportExcel(params);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  // Calculate summary metrics
  const summaryMetrics = {
    totalExpenses: summary.totalExpenses || 0,
    totalAmount: summary.totalAmount || 0,
    avgAmount: summary.avgAmount || 0,
    topCategory: summary.topCategory || 'N/A'
  };
  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumbs
          maintitle="Expense Report"
          subtitle="Comprehensive Expense Analytics & Financial Tracking"
        />
        
        {/* Summary Cards */}
        <div className="row">
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-widget w-100">
              <div className="dash-widgetimg">
                <span>
                  <DollarSign className="text-danger" size={24} />
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
                <h6>Total Expense Amount</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-count">
              <div className="dash-counts">
                <h4>
                  <CountUp
                    start={0}
                    end={summaryMetrics.totalExpenses}
                    duration={3}
                  />
                </h4>
                <h5>Total Expenses</h5>
              </div>
              <div className="dash-imgs">
                <FileText />
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-widget dash1 w-100">
              <div className="dash-widgetimg">
                <span>
                  <TrendingUp className="text-info" size={24} />
                </span>
              </div>
              <div className="dash-widgetcontent">
                <h5>
                  $
                  <CountUp
                    start={0}
                    end={summaryMetrics.avgAmount}
                    duration={3}
                    decimals={2}
                  />
                </h5>
                <h6>Average Expense</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-count das1">
              <div className="dash-counts">
                <h4 className="text-primary">{summaryMetrics.topCategory}</h4>
                <h5>Top Category</h5>
              </div>
              <div className="dash-imgs">
                <Tag className="text-primary" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Expense Report Table */}
        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search expenses, description, category..."
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
                      <Tag className="info-img" />
                      <Select 
                        className="select" 
                        options={categories}
                        value={categories.find(option => option.value === filters.category)}
                        onChange={(option) => handleFilterChange('category', option?.value || '')}
                        placeholder="Select Category"
                      />
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="input-blocks">
                      <CreditCard className="info-img" />
                      <Select 
                        className="select" 
                        options={paymentMethods}
                        value={paymentMethods.find(option => option.value === filters.paymentMethod)}
                        onChange={(option) => handleFilterChange('paymentMethod', option?.value || '')}
                        placeholder="Payment Method"
                      />
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="input-blocks">
                      <DollarSign className="info-img" />
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Min Amount"
                        value={filters.minAmount}
                        onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-2">
                    <div className="input-blocks">
                      <DollarSign className="info-img" />
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Max Amount"
                        value={filters.maxAmount}
                        onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-3">
                    <div className="input-blocks">
                      <Sliders className="info-img" />
                      <Select 
                        className="select" 
                        options={sortOptions}
                        value={sortOptions.find(option => option.value === filters.sortBy)}
                        onChange={(option) => handleFilterChange('sortBy', option?.value || 'date')}
                        placeholder="Sort By"
                      />
                    </div>
                  </div>
                  <div className="col-lg-9">
                    <div className="input-blocks d-flex gap-2">
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
            
            {/* Expense Table */}
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
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Supplier</th>
                      <th>Created By</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseData.length > 0 ? expenseData.map((expense, index) => (
                      <tr key={expense._id || index}>
                        <td>
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                        </td>
                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                        <td>
                          <div className="expense-description">
                            <h6 className="mb-1">{expense.description || 'N/A'}</h6>
                            {expense.receiptUrl && (
                              <small className="text-muted">
                                <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                                  View Receipt
                                </a>
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-soft-primary">
                            {expense.category || 'N/A'}
                          </span>
                        </td>
                        <td className="text-danger font-weight-bold">
                          ${(expense.amount || 0).toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${
                            expense.paymentMethod === 'Cash' ? 'badge-soft-success' :
                            expense.paymentMethod === 'Credit Card' ? 'badge-soft-info' :
                            expense.paymentMethod === 'Bank Transfer' ? 'badge-soft-warning' :
                            expense.paymentMethod === 'Check' ? 'badge-soft-secondary' :
                            'badge-soft-dark'
                          }`}>
                            {expense.paymentMethod || 'N/A'}
                          </span>
                        </td>
                        <td>{expense.supplier?.name || 'N/A'}</td>
                        <td>
                          <span className="text-muted">
                            {expense.createdBy || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted small">
                            {expense.notes ? 
                              (expense.notes.length > 50 ? 
                                `${expense.notes.substring(0, 50)}...` : 
                                expense.notes
                              ) : 'No notes'
                            }
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="9" className="text-center p-4">
                          {loading ? 'Loading...' : 'No expenses found'}
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
                    
                    {/* Dynamic Page Numbers */}
                    {(() => {
                      const totalPages = pagination.totalPages;
                      const currentPage = pagination.currentPage;
                      const pages = [];
                      
                      if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        if (currentPage <= 4) {
                          pages.push(1, 2, 3, 4, 5, '...', totalPages);
                        } else if (currentPage >= totalPages - 3) {
                          pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                        } else {
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

export default ExpenseReport;

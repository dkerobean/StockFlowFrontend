import React, { useState, useEffect } from "react";
import CountUp from "react-countup";
import Breadcrumbs from "../../core/breadcrumbs";
import Image from "../../core/img/image";
import { Link } from "react-router-dom";
// Fixed: Using BarChart instead of BarChart3 (which doesn't exist in react-feather)
import { Filter, Sliders, DollarSign, TrendingUp, TrendingDown, BarChart, PieChart, AlertTriangle, Download, Search, Calendar, Target, Zap, Tag } from "react-feather";
import Select from "react-select";
import profitLossService from "../../services/profitLossService";
import { toast } from "react-toastify";

const ProfitLoss = () => {
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    startDate: '',
    endDate: '',
    includeDetails: false,
    groupBy: 'total'
  });

  const [pageSizeOptions] = useState([
    { value: 10, label: "10 per page" },
    { value: 25, label: "25 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" }
  ]);

  const groupByOptions = [
    { value: "total", label: "Total Summary" },
    { value: "monthly", label: "Monthly Breakdown" },
    { value: "source", label: "By Income Source" },
    { value: "category", label: "By Expense Category" }
  ];

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  // Load data
  useEffect(() => {
    loadProfitLossData();
  }, [filters]);

  const loadProfitLossData = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting profit & loss data load...');
      
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: searchTerm,
        includeDetails: filters.includeDetails,
        groupBy: filters.groupBy,
        // Add cache busting parameter
        _t: Date.now(),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      };

      console.log('📋 Request parameters:', params);
      const response = await profitLossService.getComprehensiveProfitLossReport(params);
      
      console.log('📊 Setting profit & loss data:', {
        summary: response.summary,
        breakdown: response.breakdown,
        transactions: response.transactions?.length || 0,
        pagination: response.pagination
      });
      
      setReportData(response);
      setTransactions(response.transactions || []);
      setPagination(response.pagination || {});
      
      if (response.summary) {
        toast.success('Profit & Loss report loaded successfully');
      }
    } catch (error) {
      console.error('❌ Error loading profit & loss data:', error);
      
      let errorMessage = 'Failed to load profit & loss data';
      
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
      setReportData({});
      setTransactions([]);
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
    loadProfitLossData();
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      startDate: '',
      endDate: '',
      includeDetails: false,
      groupBy: 'total'
    });
    setSearchTerm('');
  };

  const toggleDetailsView = () => {
    setFilters(prev => ({ 
      ...prev, 
      includeDetails: !prev.includeDetails,
      page: 1 
    }));
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const params = {
        search: searchTerm,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.groupBy && { groupBy: filters.groupBy })
      };
      await profitLossService.exportProfitLossPDF(params);
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
        ...(filters.groupBy && { groupBy: filters.groupBy })
      };
      await profitLossService.exportProfitLossExcel(params);
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  // Calculate summary metrics and insights
  const summary = reportData.summary || {};
  const breakdown = reportData.breakdown || {};
  const insights = profitLossService.calculateFinancialInsights(summary);

  const summaryMetrics = {
    totalIncome: summary.totalIncome || 0,
    totalExpenses: summary.totalExpenses || 0,
    netProfitLoss: summary.netProfitLoss || 0,
    profitMargin: summary.profitMargin || 0,
    isProfitable: summary.isProfitable || false,
    incomeTransactions: summary.incomeTransactions || 0,
    expenseTransactions: summary.expenseTransactions || 0
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumbs
          maintitle="Profit & Loss Report"
          subtitle="Comprehensive Financial Performance Analytics & Insights"
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
                    end={summaryMetrics.totalIncome}
                    duration={3}
                    decimals={2}
                  />
                </h5>
                <h6>Total Income</h6>
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
                  $
                  <CountUp
                    start={0}
                    end={summaryMetrics.totalExpenses}
                    duration={3}
                    decimals={2}
                  />
                </h5>
                <h6>Total Expenses</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className={`dash-widget ${summaryMetrics.isProfitable ? 'dash2' : 'dash3'} w-100`}>
              <div className="dash-widgetimg">
                <span>
                  {summaryMetrics.isProfitable ? (
                    <TrendingUp className="text-success" size={24} />
                  ) : (
                    <TrendingDown className="text-danger" size={24} />
                  )}
                </span>
              </div>
              <div className="dash-widgetcontent">
                <h5 className={summaryMetrics.isProfitable ? 'text-success' : 'text-danger'}>
                  $
                  <CountUp
                    start={0}
                    end={Math.abs(summaryMetrics.netProfitLoss)}
                    duration={3}
                    decimals={2}
                  />
                </h5>
                <h6>Net {summaryMetrics.isProfitable ? 'Profit' : 'Loss'}</h6>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 col-12 d-flex">
            <div className="dash-count das1">
              <div className="dash-counts">
                <h4 className={`${insights.marginColor === 'success' ? 'text-success' : insights.marginColor === 'danger' ? 'text-danger' : 'text-warning'}`}>
                  <CountUp
                    start={0}
                    end={summaryMetrics.profitMargin}
                    duration={3}
                    decimals={1}
                  />%
                </h4>
                <h5>Profit Margin</h5>
              </div>
              <div className="dash-imgs">
                <Target className={insights.marginColor === 'success' ? 'text-success' : insights.marginColor === 'danger' ? 'text-danger' : 'text-warning'} />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Insights */}
        {insights && (
          <div className="row mb-4">
            <div className="col-12">
              <div className={`alert alert-${insights.profitabilityColor} alert-dismissible fade show`} role="alert">
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    {summaryMetrics.isProfitable ? (
                      <TrendingUp size={24} />
                    ) : (
                      <TrendingDown size={24} />
                    )}
                  </div>
                  <div>
                    <h6 className="mb-1">Financial Performance: {insights.profitabilityStatus}</h6>
                    <p className="mb-1">
                      Profit Margin: {insights.marginCategory} ({summaryMetrics.profitMargin.toFixed(1)}%) | 
                      Expense Ratio: {insights.expenseRatio}%
                    </p>
                    <small><strong>Recommendation:</strong> {insights.recommendation}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Breakdown Cards */}
        {breakdown.incomeBySource?.length > 0 && (
          <div className="row mb-4">
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title d-flex align-items-center">
                    <PieChart className="me-2" size={20} />
                    Income by Source
                  </h5>
                </div>
                <div className="card-body">
                  {breakdown.incomeBySource.slice(0, 5).map((item, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <span className={`badge badge-soft-${index === 0 ? 'success' : index === 1 ? 'info' : index === 2 ? 'warning' : 'secondary'} me-2`}>
                          {item.source}
                        </span>
                        <small className="text-muted">{item.count} transactions</small>
                      </div>
                      <div className="text-end">
                        <strong>${item.amount.toFixed(2)}</strong>
                        <small className="text-muted d-block">{item.percentage.toFixed(1)}%</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title d-flex align-items-center">
                    <BarChart className="me-2" size={20} />
                    Expenses by Category
                  </h5>
                </div>
                <div className="card-body">
                  {breakdown.expensesByCategory?.slice(0, 5).map((item, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <span className={`badge badge-soft-${index === 0 ? 'danger' : index === 1 ? 'warning' : index === 2 ? 'info' : 'secondary'} me-2`}>
                          {item.category}
                        </span>
                        <small className="text-muted">{item.count} transactions</small>
                      </div>
                      <div className="text-end">
                        <strong>${item.amount.toFixed(2)}</strong>
                        <small className="text-muted d-block">{item.percentage.toFixed(1)}%</small>
                      </div>
                    </div>
                  )) || <p className="text-muted">No expense data available</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Trends */}
        {breakdown.monthlyData?.length > 0 && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title d-flex align-items-center">
                    <TrendingUp className="me-2" size={20} />
                    Monthly Profit & Loss Trends
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Income</th>
                          <th>Expenses</th>
                          <th>Net Profit/Loss</th>
                          <th>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdown.monthlyData.slice(-6).map((item, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{profitLossService.getMonthName(item.month)} {item.year}</strong>
                            </td>
                            <td className="text-success">${item.income.toFixed(2)}</td>
                            <td className="text-warning">${item.expenses.toFixed(2)}</td>
                            <td className={item.netProfit >= 0 ? 'text-success' : 'text-danger'}>
                              <strong>${item.netProfit.toFixed(2)}</strong>
                            </td>
                            <td>
                              {item.netProfit >= 0 ? (
                                <TrendingUp className="text-success" size={16} />
                              ) : (
                                <TrendingDown className="text-danger" size={16} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Transactions Table */}
        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search transactions, description, category..."
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
                    className={`btn btn-sm d-flex align-items-center gap-1 ${filters.includeDetails ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={toggleDetailsView}
                  >
                    <BarChart size={16} />
                    {filters.includeDetails ? 'Hide Details' : 'Show Details'}
                  </button>
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
                  <div className="col-lg-3">
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
                  <div className="col-lg-3">
                    <div className="input-blocks">
                      <Tag className="info-img" />
                      <Select 
                        className="select" 
                        options={groupByOptions}
                        value={groupByOptions.find(option => option.value === filters.groupBy)}
                        onChange={(option) => handleFilterChange('groupBy', option?.value || 'total')}
                        placeholder="Group By"
                      />
                    </div>
                  </div>
                  <div className="col-lg-3">
                    <div className="input-blocks d-flex gap-2">
                      <button className="btn btn-filters me-2" onClick={applyFilters}>
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
            
            {/* Transactions Table - Only show when details are enabled */}
            {filters.includeDetails && (
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
                        <th>Type</th>
                        <th>Description</th>
                        <th>Category/Source</th>
                        <th>Amount</th>
                        <th>Created By</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? transactions.map((transaction, index) => (
                        <tr key={transaction._id || index}>
                          <td>
                            <label className="checkboxs">
                              <input type="checkbox" />
                              <span className="checkmarks" />
                            </label>
                          </td>
                          <td>{new Date(transaction.date).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${
                              transaction.type === 'income' ? 'badge-soft-success' : 'badge-soft-warning'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td>
                            <div className="transaction-description">
                              <h6 className="mb-1">{transaction.description || 'N/A'}</h6>
                              {transaction.relatedSale && (
                                <small className="text-muted">
                                  <Link to={`/sales/${transaction.relatedSale._id}`} className="text-primary">
                                    Sale #{transaction.relatedSale._id?.slice(-6)}
                                  </Link>
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              transaction.type === 'income' ? 'badge-soft-info' : 'badge-soft-secondary'
                            }`}>
                              {transaction.category || transaction.source || 'N/A'}
                            </span>
                          </td>
                          <td className={`font-weight-bold ${transaction.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                            ${Math.abs(transaction.amount || 0).toFixed(2)}
                          </td>
                          <td>
                            <span className="text-muted">
                              {transaction.createdBy?.name || transaction.createdBy || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className="text-muted small">
                              {transaction.notes ? 
                                (transaction.notes.length > 50 ? 
                                  `${transaction.notes.substring(0, 50)}...` : 
                                  transaction.notes
                                ) : 'No notes'
                              }
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="8" className="text-center p-4">
                            {loading ? 'Loading...' : 'No transactions found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            
            {/* Enhanced Pagination - Only show when details are enabled */}
            {filters.includeDetails && pagination.totalPages > 1 && (
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;
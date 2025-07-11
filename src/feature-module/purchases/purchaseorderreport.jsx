import React, { useState, useEffect } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Link } from "react-router-dom";
import Image from "../../core/img/image";
import {
  ChevronUp,
  Filter,
  RotateCcw,
  Sliders,
  StopCircle,
  Search,
} from "feather-icons-react/build/IconComponents";
import { setToogleHeader } from "../../core/redux/action";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { DatePicker } from "antd";
import purchaseService from "../../services/purchaseService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";

const PurchaseOrderReport = () => {
  const dispatch = useDispatch();
  const data = useSelector((state) => state.toggle_header);

  const [reportData, setReportData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const oldandlatestvalue = [
    { value: "date", label: "Sort by Date" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "ordered", label: "Ordered" },
    { value: "received", label: "Received" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const supplierOptions = [
    { value: "", label: "All Suppliers" },
    ...suppliers.map(supplier => ({
      value: supplier._id,
      label: supplier.supplierName
    }))
  ];

  useEffect(() => {
    fetchReportData();
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await purchaseService.getSuppliers();
      setSuppliers(response || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSupplier) params.supplier = selectedSupplier;
      if (selectedStatus) params.status = selectedStatus;
      if (startDate) params.startDate = startDate.format('YYYY-MM-DD');
      if (endDate) params.endDate = endDate.format('YYYY-MM-DD');

      const response = await purchaseService.getPurchaseReport(params);
      setReportData(response || []);
    } catch (error) {
      console.error('Error fetching purchase report:', error);
      toast.error('Failed to fetch purchase report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSearch = () => {
    fetchReportData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getTotalAmount = () => {
    return reportData.reduce((total, item) => total + (item.totalAmount || 0), 0);
  };

  const getTotalQuantity = () => {
    return reportData.reduce((total, item) => total + (item.totalQuantity || 0), 0);
  };

  const renderTooltip = (props) => (
    <Tooltip id="pdf-tooltip" {...props}>
      Pdf
    </Tooltip>
  );
  const renderExcelTooltip = (props) => (
    <Tooltip id="excel-tooltip" {...props}>
      Excel
    </Tooltip>
  );
  const renderPrinterTooltip = (props) => (
    <Tooltip id="printer-tooltip" {...props}>
      Printer
    </Tooltip>
  );
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

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-wrapper">
        <div className="content">
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Purchase Order Report</h4>
                <h6>Analyze your purchase order data</h6>
              </div>
            </div>
            <ul className="table-top-head">
              <li>
                <OverlayTrigger placement="top" overlay={renderTooltip}>
                  <Link>
                    <Image
                      src="assets/img/icons/pdf.svg"
                      alt="img"
                    />
                  </Link>
                </OverlayTrigger>
              </li>
              <li>
                <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
                  <Link data-bs-toggle="tooltip" data-bs-placement="top">
                    <Image
                      src="assets/img/icons/excel.svg"
                      alt="img"
                    />
                  </Link>
                </OverlayTrigger>
              </li>
              <li>
                <OverlayTrigger placement="top" overlay={renderPrinterTooltip}>
                  <Link data-bs-toggle="tooltip" data-bs-placement="top">
                    <i data-feather="printer" className="feather-printer" />
                  </Link>
                </OverlayTrigger>
              </li>
              <li>
                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                  <Link data-bs-toggle="tooltip" data-bs-placement="top" onClick={fetchReportData}>
                    <RotateCcw />
                  </Link>
                </OverlayTrigger>
              </li>
              <li>
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
              </li>
            </ul>
          </div>

          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-lg-3 col-sm-6 col-12">
              <div className="card">
                <div className="card-body">
                  <div className="dash-widget-header">
                    <div className="dash-widget-info">
                      <h6>Total Products</h6>
                      <h3>{formatNumber(reportData.length)}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6 col-12">
              <div className="card">
                <div className="card-body">
                  <div className="dash-widget-header">
                    <div className="dash-widget-info">
                      <h6>Total Quantity</h6>
                      <h3>{formatNumber(getTotalQuantity())}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6 col-12">
              <div className="card">
                <div className="card-body">
                  <div className="dash-widget-header">
                    <div className="dash-widget-info">
                      <h6>Total Amount</h6>
                      <h3>{formatCurrency(getTotalAmount())}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6 col-12">
              <div className="card">
                <div className="card-body">
                  <div className="dash-widget-header">
                    <div className="dash-widget-info">
                      <h6>Avg. Price</h6>
                      <h3>{formatCurrency(reportData.length > 0 ? getTotalAmount() / getTotalQuantity() : 0)}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* /product list */}
          <div className="card">
            <div className="card-body">
              <div className="table-top d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="search-set flex-grow-1" style={{ maxWidth: '450px' }}>
                  <div className="search-input">
                    <input
                      type="text"
                      placeholder="🔍 Search products..."
                      className="form-control formsearch"
                    />
                    <button className="btn btn-searchset" type="button">
                      <Search size={18} />
                    </button>
                  </div>
                </div>
                <div className="search-path">
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div style={{ minWidth: '160px' }}>
                      <Select
                        options={supplierOptions}
                        className="select"
                        placeholder="👤 All Suppliers"
                        value={supplierOptions.find(option => option.value === selectedSupplier) || null}
                        onChange={(option) => setSelectedSupplier(option?.value || '')}
                        isClearable
                        classNamePrefix="react-select"
                      />
                    </div>
                    <div style={{ minWidth: '160px' }}>
                      <Select
                        options={statusOptions}
                        className="select"
                        placeholder="📊 All Status"
                        value={statusOptions.find(option => option.value === selectedStatus) || null}
                        onChange={(option) => setSelectedStatus(option?.value || '')}
                        isClearable
                        classNamePrefix="react-select"
                      />
                    </div>
                    <div style={{ minWidth: '140px' }}>
                      <DatePicker
                        value={startDate}
                        onChange={setStartDate}
                        className="form-control form-control-sm datetimepicker"
                        placeholder="📅 Start Date"
                        dateFormat="dd/MM/yyyy"
                        isClearable
                      />
                    </div>
                    <div style={{ minWidth: '140px' }}>
                      <DatePicker
                        value={endDate}
                        onChange={setEndDate}
                        className="form-control form-control-sm datetimepicker"
                        placeholder="📅 End Date"
                        dateFormat="dd/MM/yyyy"
                        isClearable
                      />
                    </div>
                    <button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={handleFilterSearch}
                      className="btn btn-primary d-flex align-items-center gap-1"
                      style={{ minWidth: '100px', height: '44px' }}
                    >
                      <Search size={14} />
                      Search
                    </button>
                    <button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={() => {
                          setSelectedSupplier(null);
                          setSelectedStatus(null);
                          setStartDate(null);
                          setEndDate(null);
                          fetchReportData();
                          toast.info("Filters reset");
                      }}
                      className="btn btn-outline-secondary d-flex align-items-center gap-1"
                      style={{ minWidth: '100px', height: '44px' }}
                    >
                      <RotateCcw size={14} />
                      Reset
                    </button>
                  </div>
                </div>
              </div>
              {/* /Filter */}
              <div className="table-responsive">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading report...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading purchase report...</p>
                  </div>
                ) : reportData.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-chart-line fa-3x text-muted mb-3"></i>
                    <h5 className="text-muted">No data found</h5>
                    <p className="text-muted">No purchase data matches your criteria</p>
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
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Total Purchased</th>
                      <th>Purchased QTY</th>
                      <th>Avg. Price</th>
                      <th>Current Stock</th>
                      <th>Purchase Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                        </td>
                        <td className="productimgname">
                          <Link className="product-img">
                            {item.productImage ? (
                              <Image
                                src={item.productImage}
                                alt="product"
                              />
                            ) : (
                              <div className="product-placeholder">
                                <i className="fas fa-box"></i>
                              </div>
                            )}
                          </Link>
                          <Link to="#">{item.productName || 'Unknown Product'}</Link>
                        </td>
                        <td className="text-muted">{item.productSku || '-'}</td>
                        <td className="fw-bold">{formatCurrency(item.totalAmount)}</td>
                        <td>{formatNumber(item.totalQuantity)}</td>
                        <td>{formatCurrency(item.averagePrice)}</td>
                        <td>
                          <span className={`badge ${item.currentStock > 0 ? 'badge-success' : 'badge-warning'}`}>
                            {formatNumber(item.currentStock)}
                          </span>
                        </td>
                        <td>{formatNumber(item.purchaseCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </div>
          </div>
          {/* /product list */}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderReport;
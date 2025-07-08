import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../core/breadcrumbs";
import {
    Filter, Edit, Trash2, Search, RotateCcw, Upload, Download,
    Eye, ChevronUp, PlusCircle, X, Calendar, MapPin, Package, Tag,
    Archive, User
} from "react-feather";
import Image from "../../core/img/image";
import Select from "react-select";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import StockTransferModal from "../../core/modals/stocks/stocktransferModal";
import Table from "../../core/pagination/datatable";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify'; // For notifications
import 'react-toastify/dist/ReactToastify.css';
import withReactContent from 'sweetalert2-react-content'; // Import withReactContent
import Swal from 'sweetalert2'; // Import Swal

const API_URL = process.env.REACT_APP_API_URL;

const StockTransfer = () => {
  const [transfers, setTransfers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFromLocation, setSelectedFromLocation] = useState(null);
  const [selectedToLocation, setSelectedToLocation] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchLocations();
    fetchProducts();
    const user = JSON.parse(localStorage.getItem("user"));
    setUserRole(user?.role);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTransfers();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedFromLocation, selectedToLocation, selectedProduct, selectedDate]);

  const fetchTransfers = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = {
        search: searchQuery || undefined,
        fromLocation: selectedFromLocation?.value || undefined,
        toLocation: selectedToLocation?.value || undefined,
        product: selectedProduct?.value || undefined,
        date: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
      };
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await axios.get(`${API_URL}/transfers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });
      setTransfers(response.data);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      toast.error("Failed to fetch transfers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (setter) => (option) => {
    setter(option);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedFromLocation(null);
    setSelectedToLocation(null);
    setSelectedProduct(null);
    setSelectedDate(null);
    toast.info("Filters reset");
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/locations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const locationOptions = (response.data.locations || []).map((location) => ({
        value: location._id,
        label: location.name,
      }));
      setLocations(locationOptions);
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast.error("Failed to fetch locations");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    }
  };

  const handleTransferCreated = () => {
    fetchTransfers();
    toast.success("Stock transfer request has been placed successfully!");
  };

  const handleShipTransfer = async (transferId) => {
    try {
      await axios.patch(`${API_URL}/transfers/${transferId}/ship`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Transfer shipped successfully");
      fetchTransfers();
    } catch (error) {
      console.error("Error shipping transfer:", error);
      toast.error(error.response?.data?.message || "Failed to ship transfer");
    }
  };

  const handleReceiveTransfer = async (transferId) => {
    try {
      await axios.patch(`${API_URL}/transfers/${transferId}/receive`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      toast.success("Transfer received successfully");
      fetchTransfers();
    } catch (error) {
      console.error("Error receiving transfer:", error);
      toast.error(error.response?.data?.message || "Failed to receive transfer");
    }
  };

  const MySwal = withReactContent(Swal); // Initialize MySwal

  const handleCancelTransfer = async (transferId) => {
    const { value: cancellationReason } = await MySwal.fire({
      title: "Cancel Transfer",
      input: "text",
      inputLabel: "Cancellation Reason",
      inputPlaceholder: "Enter reason for cancellation",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to provide a reason for cancellation!";
        }
      },
    });

    if (cancellationReason) {
      try {
        await axios.patch(
          `${API_URL}/transfers/${transferId}/cancel`,
          { cancellationReason },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        toast.success("Transfer cancelled successfully");
        fetchTransfers();
      } catch (error) {
        console.error("Error cancelling transfer:", error);
        toast.error(
          error.response?.data?.message || "Failed to cancel transfer"
        );
      }
    }
  };

  const columns = [
    {
      title: "From Warehouse",
      dataIndex: "fromLocation",
      render: (fromLocation) => fromLocation?.name || "N/A",
      sorter: (a, b) => a.fromLocation?.name?.localeCompare(b.fromLocation?.name),
    },
    {
      title: "To Warehouse",
      dataIndex: "toLocation",
      render: (toLocation) => toLocation?.name || "N/A",
      sorter: (a, b) => a.toLocation?.name?.localeCompare(b.toLocation?.name),
    },
    {
      title: "Product",
      dataIndex: "product",
      render: (product) => product?.name || "N/A",
      sorter: (a, b) => a.product?.name?.localeCompare(b.product?.name),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <span
          className={`badge bg-${
            status === "Pending"
              ? "warning"
              : status === "Shipped"
              ? "info"
              : status === "Received"
              ? "success"
              : "danger"
          }`}
        >
          {status}
        </span>
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "Requested By",
      dataIndex: "requestedBy",
      render: (requestedBy) => requestedBy?.name || "N/A",
      sorter: (a, b) => a.requestedBy?.name?.localeCompare(b.requestedBy?.name),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <td className="action-table-data">
          <div className="edit-delete-action">
            {record.status === "Pending" && (
              <>
                {userRole === "admin" && (
                  <button
                    className="btn btn-sm btn-info me-2"
                    onClick={() => handleShipTransfer(record._id)}
                  >
                    Ship
                  </button>
                )}
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleCancelTransfer(record._id)}
                >
                  Cancel
                </button>
              </>
            )}
            {record.status === "Shipped" && (
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleReceiveTransfer(record._id)}
              >
                Receive
              </button>
            )}
          </div>
        </td>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
      <ToastContainer />
        <Breadcrumbs
          maintitle="Stock Transfer"
          subtitle="Manage your stock transfer"
          addButton="Add New"
          importbutton="Import Transfer"
        />
        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="search-set flex-grow-1" style={{ maxWidth: '450px' }}>
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="🔍 Search transfers..."
                    className="form-control formsearch"
                    value={searchQuery}
                    onChange={handleSearchChange}
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
                      options={[{ value: '', label: 'From Location' }, ...locations]}
                      value={selectedFromLocation}
                      onChange={handleFilterChange(setSelectedFromLocation)}
                      placeholder="📍 From Location"
                      className="select"
                      classNamePrefix="react-select"
                      isClearable
                    />
                  </div>
                  <div style={{ minWidth: '160px' }}>
                    <Select
                      options={[{ value: '', label: 'To Location' }, ...locations]}
                      value={selectedToLocation}
                      onChange={handleFilterChange(setSelectedToLocation)}
                      placeholder="📍 To Location"
                      className="select"
                      classNamePrefix="react-select"
                      isClearable
                    />
                  </div>
                  <div style={{ minWidth: '160px' }}>
                    <Select
                      options={[{ value: '', label: 'All Products' }, ...(products || []).map(p => ({ value: p._id, label: p.name }))]}
                      value={selectedProduct}
                      onChange={handleFilterChange(setSelectedProduct)}
                      placeholder="📦 All Products"
                      className="select"
                      classNamePrefix="react-select"
                      isClearable
                    />
                  </div>
                  <div style={{ minWidth: '140px' }}>
                    <div className="input-groupicon calender-input">
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="📅 Filter by Date"
                        className="form-control form-control-sm datetimepicker"
                        isClearable
                        peekNextMonth
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                      />
                      <span className="addon-icon">
                        <Calendar size={18} />
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={resetFilters}
                    className="d-flex align-items-center gap-1"
                    style={{ minWidth: '120px', height: '44px' }}
                  >
                    <RotateCcw size={14} />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <Table
                className="table datanew"
                columns={columns}
                dataSource={transfers}
                loading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
      <StockTransferModal
        onTransferCreated={handleTransferCreated}
        locations={locations}
        products={products}
      />
    </div>
  );
};

export default StockTransfer;

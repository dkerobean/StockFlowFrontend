import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../core/breadcrumbs";
import { Filter, Sliders } from "react-feather";
import Image from "../../core/img/image";
import Select from "react-select";
import { Link } from "react-router-dom";
import { Archive, Calendar, User, Trash2, Edit } from "react-feather";
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
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchTransfers();
    fetchLocations();
    fetchProducts();
    const user = JSON.parse(localStorage.getItem("user"));
    setUserRole(user?.role);
  }, []);

  const fetchTransfers = async () => {
    try {
      const response = await axios.get(`${API_URL}/transfers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTransfers(response.data);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      toast.error("Failed to fetch transfers");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/locations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const locationOptions = response.data.map((location) => ({
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
      setProducts(response.data);
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
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search"
                    className="form-control form-control-sm formsearch"
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
                    onClick={() => setIsFilterVisible(!isFilterVisible)}
                  />
                  <span onClick={() => setIsFilterVisible(!isFilterVisible)}>
                    <Image
                      src="assets/img/icons/closes.svg"
                      alt="img"
                    />
                  </span>
                </Link>
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

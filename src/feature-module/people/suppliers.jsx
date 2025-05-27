import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../core/breadcrumbs";
import { Link } from "react-router-dom";
import { Filter, Sliders, User, Globe, Edit, Eye, Trash2 } from "react-feather";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import Select from "react-select";
import { Table } from "antd";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import api from '../../core/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      toast.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAdd = () => {
    setCurrentSupplier(null);
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (supplier) => {
    const MySwal = withReactContent(Swal);
    MySwal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      showCancelButton: true,
      confirmButtonColor: "#00ff00",
      confirmButtonText: "Yes, delete it!",
      cancelButtonColor: "#ff0000",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/suppliers/${supplier._id}`);
          toast.success('Supplier has been deleted.');
          fetchSuppliers();
        } catch (err) {
          toast.error('Failed to delete supplier');
        }
      }
    });
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    try {
      if (isEditMode && currentSupplier) {
        await api.put(`/suppliers/${currentSupplier._id}`, data);
        toast.success('Supplier updated successfully');
      } else {
        // Auto-generate code if not provided
        if (!data.code || data.code.trim() === "") {
          data.code = Math.random().toString(36).substring(2, 8).toUpperCase();
        }
        await api.post('/suppliers', data);
        toast.success('Supplier created successfully');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      toast.error('Failed to save supplier');
    }
  };

  const columns = [
    {
      title: "Supplier Name",
      dataIndex: "supplierName",
      render: (text, record) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            <ImageWithBasePath alt="" src={record.image} />
          </Link>
          <Link to="#">{text}</Link>
        </span>
      ),
      sorter: (a, b) => a.supplierName.length - b.supplierName.length,
    },
    {
      title: "Code",
      dataIndex: "code",
      sorter: (a, b) => a.code.length - b.code.length,
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: (a, b) => a.email.length - b.email.length,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      sorter: (a, b) => a.phone.length - b.phone.length,
    },
    {
      title: "Country",
      dataIndex: "country",
      sorter: (a, b) => a.country.length - b.country.length,
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <td className="action-table-data">
          <div className="edit-delete-action">
            <Link className="me-2 p-2" to="#" onClick={() => handleEdit(record)}>
              <Edit className="feather-edit" />
            </Link>
            <Link className="confirm-text p-2" to="#" onClick={() => handleDelete(record)}>
              <Trash2 className="feather-trash-2" />
            </Link>
          </div>
        </td>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="content">
        <Breadcrumbs
          maintitle="Supplier List "
          subtitle="Manage Your Supplier"
          addButton="Add New Supplier"
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
                  className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`}
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
                  options={[]}
                  placeholder="Sort by Date"
                />
              </div>
              <button className="btn btn-primary ms-3" onClick={handleAdd}>
                Add New Supplier
              </button>
            </div>
            <div className="table-responsive">
              <Table
                className="table datanew"
                columns={columns}
                dataSource={suppliers}
                rowKey={(record) => record._id}
                loading={loading}
              />
            </div>
          </div>
        </div>
        {/* Modal for Add/Edit Supplier */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <form onSubmit={handleModalSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{isEditMode ? 'Edit Supplier' : 'Add Supplier'}</h5>
                    <button type="button" className="close" onClick={() => setShowModal(false)}>
                      <span>&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group mb-2">
                      <label>Supplier Name</label>
                      <input name="supplierName" className="form-control" defaultValue={currentSupplier?.supplierName || ''} required />
                    </div>
                    {/* Only show code field in edit mode */}
                    {isEditMode && (
                      <div className="form-group mb-2">
                        <label>Code</label>
                        <input name="code" className="form-control" defaultValue={currentSupplier?.code || ''} required readOnly />
                      </div>
                    )}
                    <div className="form-group mb-2">
                      <label>Email</label>
                      <input name="email" type="email" className="form-control" defaultValue={currentSupplier?.email || ''} required />
                    </div>
                    <div className="form-group mb-2">
                      <label>Phone</label>
                      <input name="phone" className="form-control" defaultValue={currentSupplier?.phone || ''} required />
                    </div>
                    <div className="form-group mb-2">
                      <label>Country</label>
                      <input name="country" className="form-control" defaultValue={currentSupplier?.country || ''} />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {isEditMode ? 'Update' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;

import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../core/breadcrumbs";
import { Link } from "react-router-dom";
import { Filter, Sliders, User, Globe, Edit, Eye, Trash2, Search, RotateCcw, PlusCircle } from "react-feather";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import Select from "react-select";
import { Table, Modal, Button, Form, Input, Row, Col } from "antd";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import api from '../../core/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Custom styles for suppliers
const customStyles = `
  .supplier-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    border: 1px solid #e0e0e0;
  }
  
  .suppliers-loading {
    text-align: center;
    padding: 20px;
  }
  
  .search-highlight {
    background-color: #fff3cd;
    padding: 2px 4px;
    border-radius: 3px;
  }
`;

const Suppliers = () => {
  // Inject custom styles
  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
      setFilteredSuppliers(res.data);
      if (res.data.length > 0) {
        toast.success(`Loaded ${res.data.length} suppliers successfully`);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Search functionality with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredSuppliers(suppliers);
      } else {
        const filtered = suppliers.filter(supplier => 
          supplier.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.country?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSuppliers(filtered);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, suppliers]);

  const handleAdd = () => {
    setCurrentSupplier(null);
    setIsEditMode(false);
    form.resetFields();
    setShowModal(true);
  };

  const handleEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setIsEditMode(true);
    form.setFieldsValue({
      supplierName: supplier.supplierName,
      code: supplier.code,
      email: supplier.email,
      phone: supplier.phone,
      country: supplier.country || '',
    });
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
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          await api.delete(`/suppliers/${supplier._id}`);
          return true;
        } catch (err) {
          MySwal.showValidationMessage(
            `Delete failed: ${err.response?.data?.message || 'Unknown error'}`
          );
          return false;
        }
      },
      allowOutsideClick: () => !MySwal.isLoading()
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success('Supplier has been deleted successfully');
        fetchSuppliers();
      }
    });
  };

  const handleModalSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      if (isEditMode && currentSupplier) {
        await api.put(`/suppliers/${currentSupplier._id}`, values);
        toast.success('Supplier updated successfully');
      } else {
        // Auto-generate code if not provided
        if (!values.code || values.code.trim() === "") {
          values.code = Math.random().toString(36).substring(2, 8).toUpperCase();
        }
        await api.post('/suppliers', values);
        toast.success('Supplier created successfully');
      }
      setShowModal(false);
      form.resetFields();
      fetchSuppliers();
    } catch (err) {
      console.error('Error saving supplier:', err);
      toast.error(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleModalCancel = () => {
    setShowModal(false);
    form.resetFields();
    setCurrentSupplier(null);
  };

  const columns = [
    {
      title: "Supplier Name",
      dataIndex: "supplierName",
      render: (text, record) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            {record.image ? (
              <ImageWithBasePath alt={text} src={record.image} />
            ) : (
              <div className="supplier-avatar">
                <User size={20} />
              </div>
            )}
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
                    placeholder="Search suppliers..."
                    className="form-control form-control-sm formsearch"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Link to className="btn btn-searchset">
                    <Search className="feather-search" size={16} />
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
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => {
                    setSearchTerm('');
                    fetchSuppliers();
                  }}
                  disabled={loading}
                  title="Refresh suppliers"
                >
                  <RotateCcw size={16} />
                </button>
                <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
                  <PlusCircle size={16} className="me-1" />
                  Add New Supplier
                </button>
              </div>
            </div>
            <div className="table-responsive">
              {loading ? (
                <div className="suppliers-loading">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading suppliers...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading suppliers...</p>
                </div>
              ) : filteredSuppliers.length === 0 && searchTerm ? (
                <div className="text-center py-4">
                  <Search size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No suppliers found</h5>
                  <p className="text-muted">No suppliers match your search criteria "{searchTerm}"</p>
                  <button className="btn btn-outline-primary" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </button>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-4">
                  <User size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No suppliers yet</h5>
                  <p className="text-muted">Get started by adding your first supplier</p>
                  <button className="btn btn-primary" onClick={handleAdd}>
                    <PlusCircle size={16} className="me-1" />
                    Add Your First Supplier
                  </button>
                </div>
              ) : (
                <>
                  <Table
                    className="table datanew"
                    columns={columns}
                    dataSource={filteredSuppliers}
                    rowKey={(record) => record._id}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => 
                        `${range[0]}-${range[1]} of ${total} suppliers`,
                    }}
                  />
                  {searchTerm && (
                    <div className="mt-2 text-muted">
                      Showing {filteredSuppliers.length} of {suppliers.length} suppliers
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* Modal for Add/Edit Supplier */}
        <Modal
          title={isEditMode ? 'Edit Supplier' : 'Add Supplier'}
          open={showModal}
          onCancel={handleModalCancel}
          footer={null}
          width={600}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleModalSubmit}
            size="large"
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="supplierName"
                  label="Supplier Name"
                  rules={[
                    { required: true, message: 'Please enter supplier name' },
                    { min: 2, message: 'Supplier name must be at least 2 characters' }
                  ]}
                >
                  <Input placeholder="Enter supplier name" />
                </Form.Item>
              </Col>
            </Row>
            
            {isEditMode && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="code"
                    label="Supplier Code"
                  >
                    <Input placeholder="Auto-generated" disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="country"
                    label="Country"
                  >
                    <Input placeholder="Enter country" />
                  </Form.Item>
                </Col>
              </Row>
            )}
            
            {!isEditMode && (
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="country"
                    label="Country"
                  >
                    <Input placeholder="Enter country" />
                  </Form.Item>
                </Col>
              </Row>
            )}
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please enter email address' },
                    { type: 'email', message: 'Please enter a valid email address' }
                  ]}
                >
                  <Input placeholder="Enter email address" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[
                    { required: true, message: 'Please enter phone number' },
                    { min: 10, message: 'Phone number must be at least 10 digits' }
                  ]}
                >
                  <Input placeholder="Enter phone number" />
                </Form.Item>
              </Col>
            </Row>
            
            <div className="text-end mt-3">
              <Button onClick={handleModalCancel} className="me-2">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                {isEditMode ? 'Update Supplier' : 'Add Supplier'}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Suppliers;

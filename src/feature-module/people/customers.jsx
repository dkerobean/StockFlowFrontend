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

// Custom styles for customers
const customStyles = `
  .customer-avatar {
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
  
  .customers-loading {
    text-align: center;
    padding: 20px;
  }
  
  .search-highlight {
    background-color: #fff3cd;
    padding: 2px 4px;
    border-radius: 3px;
  }
`;

const Customers = () => {
  // Inject custom styles
  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form] = Form.useForm();

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.customers || res.data);
      setFilteredCustomers(res.data.customers || res.data);
      if ((res.data.customers || res.data).length > 0) {
        toast.success(`Loaded ${(res.data.customers || res.data).length} customers successfully`);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Search functionality with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredCustomers(customers);
      } else {
        const filtered = customers.filter(customer => 
          customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.country?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCustomers(filtered);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, customers]);

  const handleAdd = () => {
    setCurrentCustomer(null);
    setIsEditMode(false);
    form.resetFields();
    setShowModal(true);
  };

  const handleEdit = (customer) => {
    setCurrentCustomer(customer);
    setIsEditMode(true);
    form.setFieldsValue({
      customerName: customer.customerName,
      code: customer.code,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || '',
      description: customer.description || '',
    });
    setShowModal(true);
  };

  const handleModalSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      if (isEditMode && currentCustomer) {
        await api.put(`/customers/${currentCustomer._id}`, values);
        toast.success('Customer updated successfully');
      } else {
        // Auto-generate code if not provided
        if (!values.code || values.code.trim() === "") {
          values.code = Math.random().toString(36).substring(2, 8).toUpperCase();
        }
        await api.post('/customers', values);
        toast.success('Customer created successfully');
      }
      setShowModal(false);
      form.resetFields();
      fetchCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleModalCancel = () => {
    setShowModal(false);
    form.resetFields();
    setCurrentCustomer(null);
  };

  const handleDelete = async (customer) => {
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
          await api.delete(`/customers/${customer._id}`);
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
        toast.success('Customer has been deleted successfully');
        fetchCustomers();
      }
    });
  };

  const options = [
    { value: "sortByDate", label: "Sort by Date" },
    { value: "140923", label: "14 09 23" },
    { value: "110923", label: "11 09 23" },
  ];
  const optionsTwo = [
    { label: "Choose Customer Name", value: "" },
    { label: "Benjamin", value: "Benjamin" },
    { label: "Ellen", value: "Ellen" },
    { label: "Freda", value: "Freda" },
    { label: "Kaitlin", value: "Kaitlin" },
  ];

  const countries = [
    { label: "Choose Country", value: "" },
    { label: "India", value: "India" },
    { label: "USA", value: "USA" },
  ];

  const columns = [
    {
      title: "Customer Name",
      dataIndex: "customerName",
      render: (text, record) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            {record.image ? (
              <ImageWithBasePath alt={text} src={record.image} />
            ) : (
              <div className="customer-avatar">
                <User size={20} />
              </div>
            )}
          </Link>
          <Link to="#">{text}</Link>
        </span>
      ),
      sorter: (a, b) => a.customerName.length - b.customerName.length,
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
      title: "City",
      dataIndex: "city",
      sorter: (a, b) => (a.city || '').length - (b.city || '').length,
    },
    {
      title: "Country",
      dataIndex: "country",
      sorter: (a, b) => (a.country || '').length - (b.country || '').length,
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
          maintitle="Customer List"
          subtitle="Manage Your Customers"
          addButton="Add New Customer"
        />

        {/* /product list */}
        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search customers..."
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
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => {
                    setSearchTerm('');
                    fetchCustomers();
                  }}
                  disabled={loading}
                  title="Refresh customers"
                >
                  <RotateCcw size={16} />
                </button>
                <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
                  <PlusCircle size={16} className="me-1" />
                  Add New Customer
                </button>
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
                  <div className="col-lg-3 col-sm-6 col-12">
                    <div className="input-blocks">
                      <User className="info-img" />
                      <Select
                        options={optionsTwo}
                        placeholder="Choose Customer Name"
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-sm-6 col-12">
                    <div className="input-blocks">
                      <Globe className="info-img" />
                      <Select
                        options={countries}
                        placeholder="Choose Country"
                      />
                    </div>
                  </div>
                  <div className="col-lg-3 col-sm-6 col-12 ms-auto">
                    <div className="input-blocks">
                      <a className="btn btn-filters ms-auto">
                        {" "}
                        <i
                          data-feather="search"
                          className="feather-search"
                        />{" "}
                        Search{" "}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /Filter */}
            <div className="table-responsive">
              {loading ? (
                <div className="customers-loading">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading customers...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading customers...</p>
                </div>
              ) : filteredCustomers.length === 0 && searchTerm ? (
                <div className="text-center py-4">
                  <Search size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No customers found</h5>
                  <p className="text-muted">No customers match your search criteria "{searchTerm}"</p>
                  <button className="btn btn-outline-primary" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </button>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-4">
                  <User size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No customers yet</h5>
                  <p className="text-muted">Get started by adding your first customer</p>
                  <button className="btn btn-primary" onClick={handleAdd}>
                    <PlusCircle size={16} className="me-1" />
                    Add Your First Customer
                  </button>
                </div>
              ) : (
                <>
                  <Table
                    className="table datanew"
                    columns={columns}
                    dataSource={filteredCustomers}
                    rowKey={(record) => record._id}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => 
                        `${range[0]}-${range[1]} of ${total} customers`,
                    }}
                  />
                  {searchTerm && (
                    <div className="mt-2 text-muted">
                      Showing {filteredCustomers.length} of {customers.length} customers
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {/* /product list */}
      </div>
      
      {/* Modal for Add/Edit Customer */}
      <Modal
        title={isEditMode ? 'Edit Customer' : 'Add Customer'}
        open={showModal}
        onCancel={handleModalCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
          size="large"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[
                  { required: true, message: 'Please enter customer name' },
                  { min: 2, message: 'Customer name must be at least 2 characters' }
                ]}
              >
                <Input placeholder="Enter customer name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              {isEditMode ? (
                <Form.Item
                  name="code"
                  label="Customer Code"
                >
                  <Input placeholder="Auto-generated" disabled />
                </Form.Item>
              ) : null}
            </Col>
          </Row>
          
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
                  { min: 10, message: 'Phone number must be at least 10 characters' }
                ]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="address"
                label="Address"
              >
                <Input placeholder="Enter street address" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
              >
                <Input placeholder="Enter city" />
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
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="description"
                label="Description"
              >
                <Input.TextArea 
                  placeholder="Enter customer description (optional)" 
                  maxLength={500}
                  showCount
                  rows={3}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <div className="text-end mt-3">
            <Button onClick={handleModalCancel} className="me-2">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={submitLoading}>
              {isEditMode ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;
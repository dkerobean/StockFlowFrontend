import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../breadcrumbs";
import { Link } from "react-router-dom";
import { Filter, Sliders, MapPin, User, Edit, Trash2, Search, RotateCcw, PlusCircle, Clock, Phone, Mail } from "react-feather";
import Image from "../../img/image";
import Select from "react-select";
import { Table, Modal, Button, Form, Input, Row, Col, Select as AntSelect, TimePicker, DatePicker, Tag, Badge } from "antd";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import api from '../../api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';

// Custom styles for stores
const customStyles = `
  .store-avatar {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    border: 1px solid #e0e0e0;
  }
  
  .stores-loading {
    text-align: center;
    padding: 20px;
  }
  
  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
  
  .status-operational {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }
  
  .status-maintenance {
    background: #fff7e6;
    color: #fa8c16;
    border: 1px solid #ffd591;
  }
  
  .status-closed {
    background: #fff2f0;
    color: #ff4d4f;
    border: 1px solid #ffb3b3;
  }
  
  .status-setup {
    background: #f0f0ff;
    color: #722ed1;
    border: 1px solid #d3adf7;
  }
  
  .contact-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .contact-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #666;
  }
`;

const StoreList = () => {
  // Inject custom styles
  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [form] = Form.useForm();

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/locations');
      setLocations(res.data.locations || res.data);
      setFilteredLocations(res.data.locations || res.data);
      if ((res.data.locations || res.data).length > 0) {
        toast.success(`Loaded ${(res.data.locations || res.data).length} locations successfully`);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Search functionality with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredLocations(locations);
      } else {
        const filtered = locations.filter(location => 
          location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.storeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.storeManager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.contactPerson?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.contactPerson?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.address?.region?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredLocations(filtered);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, locations]);

  const handleAdd = () => {
    setCurrentLocation(null);
    setIsEditMode(false);
    form.resetFields();
    setShowModal(true);
  };

  const handleEdit = (location) => {
    setCurrentLocation(location);
    setIsEditMode(true);
    
    // Prepare operating hours for form
    const operatingHours = {};
    if (location.operatingHours) {
      Object.keys(location.operatingHours).forEach(day => {
        if (location.operatingHours[day]?.open && location.operatingHours[day]?.close) {
          operatingHours[`${day}_open`] = moment(location.operatingHours[day].open, 'HH:mm');
          operatingHours[`${day}_close`] = moment(location.operatingHours[day].close, 'HH:mm');
        }
      });
    }

    form.setFieldsValue({
      name: location.name,
      storeCode: location.storeCode,
      type: location.type,
      status: location.status,
      street: location.address?.street || '',
      city: location.address?.city || '',
      region: location.address?.region || '',
      country: location.address?.country || '',
      zipCode: location.address?.zipCode || '',
      contactPersonName: location.contactPerson?.name || '',
      contactPersonEmail: location.contactPerson?.email || '',
      contactPersonPhone: location.contactPerson?.phone || '',
      contactPersonPosition: location.contactPerson?.position || '',
      storeManager: location.storeManager || '',
      storeSize: location.storeSize,
      setupDate: location.setupDate ? moment(location.setupDate) : null,
      description: location.description || '',
      ...operatingHours
    });
    setShowModal(true);
  };

  const handleModalSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      // Prepare data structure
      const data = {
        name: values.name,
        type: values.type,
        status: values.status,
        address: {
          street: values.street,
          city: values.city,
          region: values.region,
          country: values.country,
          zipCode: values.zipCode
        },
        contactPerson: {
          name: values.contactPersonName,
          email: values.contactPersonEmail,
          phone: values.contactPersonPhone,
          position: values.contactPersonPosition
        },
        storeManager: values.storeManager,
        storeSize: values.storeSize,
        setupDate: values.setupDate ? values.setupDate.format('YYYY-MM-DD') : null,
        description: values.description,
        operatingHours: {}
      };

      // Process operating hours
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      days.forEach(day => {
        if (values[`${day}_open`] && values[`${day}_close`]) {
          data.operatingHours[day] = {
            open: values[`${day}_open`].format('HH:mm'),
            close: values[`${day}_close`].format('HH:mm')
          };
        }
      });

      if (isEditMode && currentLocation) {
        await api.put(`/locations/${currentLocation._id}`, data);
        toast.success('Location updated successfully');
      } else {
        await api.post('/locations', data);
        toast.success('Location created successfully');
      }
      
      setShowModal(false);
      form.resetFields();
      fetchLocations();
    } catch (err) {
      console.error('Error saving location:', err);
      toast.error(err.response?.data?.message || 'Failed to save location');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleModalCancel = () => {
    setShowModal(false);
    form.resetFields();
    setCurrentLocation(null);
  };

  const handleDelete = async (location) => {
    const MySwal = withReactContent(Swal);
    MySwal.fire({
      title: "Are you sure?",
      text: "This will deactivate the location. You won't be able to revert this!",
      showCancelButton: true,
      confirmButtonColor: "#00ff00",
      confirmButtonText: "Yes, deactivate it!",
      cancelButtonColor: "#ff0000",
      cancelButtonText: "Cancel",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          await api.delete(`/locations/${location._id}`);
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
        toast.success('Location has been deactivated successfully');
        fetchLocations();
      }
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      operational: { class: 'status-operational', text: 'Operational' },
      maintenance: { class: 'status-maintenance', text: 'Maintenance' },
      closed: { class: 'status-closed', text: 'Closed' },
      setup: { class: 'status-setup', text: 'Setup' }
    };
    
    const statusInfo = statusMap[status] || { class: 'status-operational', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const storeTypeOptions = [
    { value: 'Store', label: 'Store' },
    { value: 'Warehouse', label: 'Warehouse' },
    { value: 'Distribution Center', label: 'Distribution Center' },
    { value: 'Outlet', label: 'Outlet' }
  ];

  const statusOptions = [
    { value: 'operational', label: 'Operational' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'closed', label: 'Closed' },
    { value: 'setup', label: 'Setup' }
  ];

  const storeSizeOptions = [
    { value: 'Small', label: 'Small' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Large', label: 'Large' },
    { value: 'Extra Large', label: 'Extra Large' }
  ];

  const sortOptions = [
    { value: "sortByDate", label: "Sort by Date" },
    { value: "sortByName", label: "Sort by Name" },
    { value: "sortByType", label: "Sort by Type" },
  ];

  const columns = [
    {
      title: "Store Name",
      dataIndex: "name",
      render: (text, record) => (
        <span className="productimgname">
          <Link to="#" className="product-img stock-img">
            {record.image ? (
              <Image alt={text} src={record.image} />
            ) : (
              <div className="store-avatar">
                <MapPin size={20} />
              </div>
            )}
          </Link>
          <div>
            <Link to="#" className="fw-bold">{text}</Link>
            {record.storeCode && <div className="text-muted small">{record.storeCode}</div>}
          </div>
        </span>
      ),
      sorter: (a, b) => a.name.length - b.name.length,
    },
    {
      title: "Type & Status",
      dataIndex: "type",
      render: (text, record) => (
        <div>
          <Tag color="blue">{text}</Tag>
          <div className="mt-1">{getStatusBadge(record.status)}</div>
        </div>
      ),
      sorter: (a, b) => a.type.localeCompare(b.type),
    },
    {
      title: "Location",
      dataIndex: "address",
      render: (address) => (
        <div className="text-sm">
          {address?.city && <div>{address.city}</div>}
          {address?.region && <div className="text-muted">{address.region}</div>}
        </div>
      ),
    },
    {
      title: "Contact Person",
      dataIndex: "contactPerson",
      render: (contact) => (
        <div className="contact-info">
          {contact?.name ? (
            <>
              <div className="fw-bold">{contact.name}</div>
              {contact.position && <div className="text-muted small">{contact.position}</div>}
              {contact.phone && (
                <div className="contact-item">
                  <Phone size={12} />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="contact-item">
                  <Mail size={12} />
                  <span>{contact.email}</span>
                </div>
              )}
            </>
          ) : (
            <span className="text-muted">No contact person</span>
          )}
        </div>
      ),
    },
    {
      title: "Store Size",
      dataIndex: "storeSize",
      render: (storeSize) => (
        <div>
          {storeSize && <div className="text-muted">{storeSize}</div>}
        </div>
      ),
      sorter: (a, b) => (a.storeSize || '').localeCompare(b.storeSize || ''),
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
          maintitle="Store List"
          subtitle="Manage Your Store Locations"
          addButton="Add New Store"
        />

        <div className="card table-list-card">
          <div className="card-body">
            <div className="table-top">
              <div className="search-set">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search stores..."
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
                    <Image
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
                  options={sortOptions}
                  placeholder="Sort by Date"
                />
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => {
                    setSearchTerm('');
                    fetchLocations();
                  }}
                  disabled={loading}
                  title="Refresh locations"
                >
                  <RotateCcw size={16} />
                </button>
                <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
                  <PlusCircle size={16} className="me-1" />
                  Add New Store
                </button>
              </div>
            </div>

            <div className="table-responsive">
              {loading ? (
                <div className="stores-loading">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading stores...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading stores...</p>
                </div>
              ) : filteredLocations.length === 0 && searchTerm ? (
                <div className="text-center py-4">
                  <Search size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No stores found</h5>
                  <p className="text-muted">No stores match your search criteria "{searchTerm}"</p>
                  <button className="btn btn-outline-primary" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </button>
                </div>
              ) : filteredLocations.length === 0 ? (
                <div className="text-center py-4">
                  <MapPin size={48} className="text-muted mb-3" />
                  <h5 className="text-muted">No stores yet</h5>
                  <p className="text-muted">Get started by adding your first store location</p>
                  <button className="btn btn-primary" onClick={handleAdd}>
                    <PlusCircle size={16} className="me-1" />
                    Add Your First Store
                  </button>
                </div>
              ) : (
                <>
                  <Table
                    className="table datanew"
                    columns={columns}
                    dataSource={filteredLocations}
                    rowKey={(record) => record._id}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => 
                        `${range[0]}-${range[1]} of ${total} stores`,
                    }}
                  />
                  {searchTerm && (
                    <div className="mt-2 text-muted">
                      Showing {filteredLocations.length} of {locations.length} stores
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal for Add/Edit Store */}
      <Modal
        title={isEditMode ? 'Edit Store Location' : 'Add Store Location'}
        open={showModal}
        onCancel={handleModalCancel}
        footer={null}
        width={900}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
          size="large"
        >
          {/* Basic Information */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Store Name"
                rules={[
                  { required: true, message: 'Please enter store name' },
                  { min: 2, message: 'Store name must be at least 2 characters' }
                ]}
              >
                <Input placeholder="Enter store name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              {isEditMode ? (
                <Form.Item
                  name="storeCode"
                  label="Store Code"
                >
                  <Input placeholder="Auto-generated" disabled />
                </Form.Item>
              ) : null}
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="type"
                label="Store Type"
                rules={[{ required: true, message: 'Please select store type' }]}
              >
                <AntSelect placeholder="Select store type">
                  {storeTypeOptions.map(option => (
                    <AntSelect.Option key={option.value} value={option.value}>
                      {option.label}
                    </AntSelect.Option>
                  ))}
                </AntSelect>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <AntSelect placeholder="Select status">
                  {statusOptions.map(option => (
                    <AntSelect.Option key={option.value} value={option.value}>
                      {option.label}
                    </AntSelect.Option>
                  ))}
                </AntSelect>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="storeSize"
                label="Store Size"
              >
                <AntSelect placeholder="Select store size">
                  {storeSizeOptions.map(option => (
                    <AntSelect.Option key={option.value} value={option.value}>
                      {option.label}
                    </AntSelect.Option>
                  ))}
                </AntSelect>
              </Form.Item>
            </Col>
          </Row>

          {/* Address Information */}
          <h6 className="mt-4 mb-3">📍 Address Information</h6>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="street"
                label="Street Address"
              >
                <Input placeholder="Enter street address" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
              >
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="region"
                label="Region/State"
              >
                <Input placeholder="Enter region or state" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="country"
                label="Country"
              >
                <Input placeholder="Enter country" />
              </Form.Item>
            </Col>
          </Row>

          {/* Contact Person Information */}
          <h6 className="mt-4 mb-3">👤 Contact Person Information</h6>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactPersonName"
                label="Contact Person Name"
              >
                <Input placeholder="Enter contact person name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPersonPosition"
                label="Position/Title"
              >
                <Input placeholder="Enter position or title" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contactPersonEmail"
                label="Email Address"
                rules={[
                  { type: 'email', message: 'Please enter a valid email address' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPersonPhone"
                label="Phone Number"
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>

          {/* Store Management */}
          <h6 className="mt-4 mb-3">🏪 Store Management</h6>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="storeManager"
                label="Store Manager"
              >
                <Input placeholder="Enter store manager name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="setupDate"
                label="Setup Date"
              >
                <DatePicker style={{ width: '100%' }} placeholder="Select setup date" />
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
                  placeholder="Enter store description (optional)" 
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
              {isEditMode ? 'Update Store' : 'Add Store'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StoreList;
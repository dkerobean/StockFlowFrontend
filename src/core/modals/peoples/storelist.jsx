import React, { useState, useEffect, useRef } from "react";
import Breadcrumbs from "../../breadcrumbs";
import { Sliders, Filter } from "react-feather";
import { Link } from "react-router-dom";
import Select from "react-select";
import { Modal, Button, Form, Table } from 'react-bootstrap';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StoreList = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    name: '',
    type: '',
    address: ''
  });
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchLocations();
    return () => { isMounted.current = false; };
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (isMounted.current) setLocations(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch locations');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const resetFormData = () => {
    setCurrentLocation({ name: '', type: '', address: '' });
    setSelectedLocationId(null);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    resetFormData();
    setShowAddEditModal(true);
  };

  const openEditModal = (location) => {
    setIsEditMode(true);
    setSelectedLocationId(location._id);
    setCurrentLocation({
      name: location.name || '',
      type: location.type || '',
      address: location.address || ''
    });
    setShowAddEditModal(true);
  };

  const closeAddEditModal = () => {
    setShowAddEditModal(false);
    resetFormData();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLocation(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (selectedOption) => {
    setCurrentLocation(prev => ({ ...prev, type: selectedOption ? selectedOption.value : '' }));
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      if (isEditMode) {
        await axios.put(`${process.env.REACT_APP_API_URL}/locations/${selectedLocationId}`, currentLocation, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Store updated successfully');
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/locations`, currentLocation, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Store created successfully');
      }
      if (isMounted.current) {
        fetchLocations();
        closeAddEditModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save store');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleDeleteClick = (location) => {
    setLocationToDelete(location);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/locations/${locationToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Store deleted successfully');
      if (isMounted.current) {
        fetchLocations();
        setShowDeleteModal(false);
        setLocationToDelete(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete store');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const toggleFilterVisibility = () => setIsFilterVisible(prev => !prev);

  const storeTypeOptions = [
    { value: 'Store', label: 'Store' },
    { value: 'Warehouse', label: 'Warehouse' },
    { value: 'Distribution', label: 'Distribution Center' }
  ];

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-wrapper">
        <div className="content">
          <Breadcrumbs
            maintitle="Store List"
            subtitle="Manage Your Stores"
          />
          <div className="page-header">
            <div className="add-item d-flex"></div>
            <ul className="table-top-head">
              <li>
                <div className="page-btn">
                  <Button variant="primary" onClick={openAddModal}>
                    <i className="fa fa-plus-circle me-2" /> Add Store
                  </Button>
                </div>
              </li>
            </ul>
          </div>

          <div className="card table-list-card">
            <div className="card-body">
              <div className="table-top">
                <div className="search-set">
                  <div className="search-input">
                    <input
                      type="text"
                      placeholder="Search by name..."
                      className="form-control form-control-sm formsearch"
                    />
                    <Link to="#" className="btn btn-searchset">
                      <i data-feather="search" className="feather-search" />
                    </Link>
                  </div>
                </div>
                <div className="search-path">
                  <Button
                    className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`}
                    onClick={toggleFilterVisibility}
                  >
                    <Filter className="filter-icon" />
                  </Button>
                </div>
                <div className="form-sort stylewidth">
                  <Sliders className="info-img" />
                  <Select
                    className="select"
                    options={[]}
                    placeholder="Sort by Date"
                  />
                </div>
              </div>
              {/* Table */}
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Address</th>
                      <th>Created By</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan="5" className="text-center">Loading...</td></tr>}
                    {!loading && locations.map((location) => (
                      <tr key={location._id}>
                        <td>{location.name}</td>
                        <td>{location.type}</td>
                        <td>{location.address
                          ? [location.address.street, location.address.region, location.address.country]
                              .filter(Boolean)
                              .join(', ')
                          : typeof location.address === 'string'
                            ? location.address
                            : ''
                        }</td>
                        <td>{location.createdBy?.name || 'N/A'}</td>
                        <td className="action-table-data">
                          <div className="edit-delete-action">
                            <Button
                              variant="link"
                              className="me-2 p-2"
                              onClick={() => openEditModal(location)}
                              title="Edit"
                            >
                              <i data-feather="edit" className="feather-edit" />
                            </Button>
                            <Button
                              variant="link"
                              className="confirm-text p-2"
                              onClick={() => handleDeleteClick(location)}
                              title="Delete"
                            >
                              <i data-feather="trash-2" className="feather-trash-2" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && locations.length === 0 && (
                      <tr><td colSpan="5" className="text-center">No stores found.</td></tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Store Modal */}
      <Modal show={showAddEditModal} onHide={closeAddEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? "Edit Store" : "Add Store"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitLocation}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Store Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentLocation.name}
                onChange={handleInputChange}
                placeholder="Enter store name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Store Type <span className="text-danger">*</span></Form.Label>
              <Select
                options={storeTypeOptions}
                value={storeTypeOptions.find(opt => opt.value === currentLocation.type)}
                onChange={handleTypeChange}
                placeholder="Choose Type"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={currentLocation.address}
                onChange={handleInputChange}
                placeholder="Enter address"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeAddEditModal} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEditMode ? "Save Changes" : "Add Store")}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Store</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this store?</p>
          {locationToDelete && (
            <div>
              <p><strong>Name:</strong> {locationToDelete.name}</p>
              <p><strong>Type:</strong> {locationToDelete.type}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Store'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StoreList;

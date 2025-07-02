import React, { useState, useEffect, useRef } from "react";
import Breadcrumbs from "../../core/breadcrumbs";
import { Sliders, Filter, Calendar, User, FileText } from "react-feather"; // Removed Eye, StopCircle as they might not be used directly
import { Link } from "react-router-dom";
import Select from "react-select";
import Image from "../../core/img/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { all_routes } from "../../Router/all_routes";

const API_URL = `${process.env.REACT_APP_API_URL}/income`; // Backend API URL for income
const INCOME_CATEGORIES_API_URL = `${process.env.REACT_APP_API_URL}/income-categories`; // API for income categories
// You might need an API endpoint for sales if 'relatedSale' is a dropdown of existing sales
// const SALES_API_URL = `${process.env.REACT_APP_API_URL}/sales`;

const IncomeList = () => {
  const route = all_routes;
  const [incomes, setIncomes] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]); // To populate category dropdown
  // const [salesList, setSalesList] = useState([]); // If you want to populate relatedSale from a list
  const [loading, setLoading] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentIncomeData, setCurrentIncomeData] = useState({
    source: 'Other',
    description: '',
    amount: '',
    date: new Date(),
    notes: '',
    relatedSale: '' // Store ID of related sale if source is 'Sale'
  });
  const [selectedIncomeId, setSelectedIncomeId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchIncomes();
    fetchIncomeCategories();
    // fetchSalesList(); // If you need to populate sales for the 'relatedSale' field
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchIncomes = async (showErrorToast = true) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isMounted.current) {
        setIncomes(response.data || []);
      }
    } catch (err) {
      console.error('Fetch income error:', err);
      if (showErrorToast && isMounted.current) {
        toast.error(err.response?.data?.message || "Error fetching income records");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const fetchIncomeCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(INCOME_CATEGORIES_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isMounted.current) {
        setIncomeCategories(response.data.categories || response.data || []);
      }
    } catch (err) {
      console.error('Fetch income categories error:', err);
      // Optional: toast.error("Error fetching income categories");
    }
  };

  // const fetchSalesList = async () => { // Example if you fetch sales for dropdown
  //   try {
  //     const token = localStorage.getItem("token");
  //     const response = await axios.get(SALES_API_URL, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     if (isMounted.current) {
  //       setSalesList(response.data || []);
  //     }
  //   } catch (err) {
  //     console.error('Fetch sales list error:', err);
  //   }
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentIncomeData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setCurrentIncomeData(prev => ({ ...prev, date }));
  };

  const handleSourceChange = (selectedOption) => {
    setCurrentIncomeData(prev => ({
      ...prev,
      source: selectedOption ? selectedOption.value : '',
      relatedSale: selectedOption && selectedOption.value === 'Sale' ? prev.relatedSale : '' // Clear relatedSale if source is not Sale
    }));
  };

  // const handleRelatedSaleChange = (selectedOption) => {
  //   setCurrentIncomeData(prev => ({ ...prev, relatedSale: selectedOption ? selectedOption.value : '' }));
  // };

  const resetFormData = () => {
    setCurrentIncomeData({
      source: 'Other',
      description: '',
      amount: '',
      date: new Date(),
      notes: '',
      relatedSale: ''
    });
    setSelectedIncomeId(null);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    resetFormData();
    setShowAddEditModal(true);
  };

  const openEditModal = (income) => {
    setIsEditMode(true);
    setSelectedIncomeId(income._id);
    setCurrentIncomeData({
      source: income.source || 'Other',
      description: income.description || '',
      amount: income.amount || '',
      date: income.date ? new Date(income.date) : new Date(),
      notes: income.notes || '',
      relatedSale: income.relatedSale?._id || income.relatedSale || '' // Assuming relatedSale might be populated or just an ID
    });
    setShowAddEditModal(true);
  };

  const closeAddEditModal = () => {
    setShowAddEditModal(false);
    resetFormData();
  };

  const handleSubmitIncome = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    let payload = { ...currentIncomeData };

    payload.amount = parseFloat(payload.amount);
    if (isNaN(payload.amount) || payload.amount <= 0) {
        toast.error("Amount must be a positive number.");
        setLoading(false);
        return;
    }

    if (payload.source !== 'Sale') {
      delete payload.relatedSale; // Remove relatedSale if not applicable
    } else if (!payload.relatedSale) {
      // If source is 'Sale' but relatedSale is empty, you might want to handle this
      // For now, we proceed, but backend validation for required relatedSale will trigger if not provided
    }

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/${selectedIncomeId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Income record updated successfully");
      } else {
        await axios.post(API_URL, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Income record added successfully");
      }
      if (isMounted.current) {
        fetchIncomes(false);
        closeAddEditModal();
      }
    } catch (err) {
      console.error('Submit income error:', err);
      if (isMounted.current) {
        toast.error(err.response?.data?.message || "Error saving income record");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleDeleteClick = (income) => {
    setIncomeToDelete(income);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!incomeToDelete) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/${incomeToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Income record deleted successfully");
      if (isMounted.current) {
        fetchIncomes(false);
        setShowDeleteModal(false);
        setIncomeToDelete(null);
      }
    } catch (err) {
      console.error('Delete income error:', err);
      if (isMounted.current) {
        toast.error(err.response?.data?.message || "Error deleting income record");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const toggleFilterVisibility = () => setIsFilterVisible(prev => !prev);

  const incomeSourceOptions = [
    { value: "Sale", label: "Sale" },
    { value: "Service", label: "Service" },
    { value: "Investment", label: "Investment" },
    { value: "Other", label: "Other" },
  ];

  // const salesOptions = salesList.map(sale => ({ value: sale._id, label: `Sale ID: ${sale._id} - Total: ${sale.total}` }));

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-wrapper">
        <div className="content">
          <Breadcrumbs
            maintitle="Income List"
            subtitle="Manage Your Income"
            path={route.incomelist} // Make sure this route is defined in all_routes
          />
           <div className="page-header">
            <div className="add-item d-flex">
                {/* Page title can be here if needed */}
            </div>
            <ul className="table-top-head">
                <li>
                    <div className="page-btn">
                        <button
                        type="button"
                        className="btn btn-primary"
                        onClick={openAddModal}
                        >
                        <i className="fa fa-plus-circle me-2" />
                        Add New Income
                        </button>
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
                      placeholder="Search by description..."
                      className="form-control form-control-sm formsearch"
                      // onChange={(e) => setSearchQuery(e.target.value)} // Add search state and logic
                    />
                    <Link to="#" className="btn btn-searchset">
                      <i data-feather="search" className="feather-search" />
                    </Link>
                  </div>
                </div>
                <div className="search-path">
                  <button
                    className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`}
                    onClick={toggleFilterVisibility}
                  >
                    <Filter className="filter-icon" />
                    <span>
                      <Image src="assets/img/icons/closes.svg" alt="img" />
                    </span>
                  </button>
                </div>
                {/* Add Sort By dropdown if needed */}
              </div>

              {/* Filter Inputs Card - adapt as needed */}
              <div className={`card${isFilterVisible ? " visible" : ""}`} id="filter_inputs" style={{ display: isFilterVisible ? "block" : "none" }}>
                <div className="card-body pb-0">
                  <div className="row">
                    {/* Add filter fields here, e.g., by source, date range */}
                    <div className="col-lg-3 col-sm-6 col-12">
                      <div className="input-blocks">
                        <User className="info-img" /> {/* Placeholder icon */}
                        <Select
                          className="select select-height"
                          options={incomeSourceOptions}
                          placeholder="Filter by Source"
                          isClearable
                          // value={...} onChange={...} Add filter state and handler
                        />
                      </div>
                    </div>
                    <div className="col-lg-3 col-sm-6 col-12">
                      <div className="input-blocks">
                        <Calendar className="info-img" />
                        <div className="input-groupicon">
                          <DatePicker
                            // selected={filterDateFrom} onChange={(date) => setFilterDateFrom(date)}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="From Date"
                            className="datetimepicker"
                            isClearable
                          />
                        </div>
                      </div>
                    </div>
                     <div className="col-lg-3 col-sm-6 col-12">
                      <div className="input-blocks">
                        <Calendar className="info-img" />
                        <div className="input-groupicon">
                          <DatePicker
                            // selected={filterDateTo} onChange={(date) => setFilterDateTo(date)}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="To Date"
                            className="datetimepicker"
                            isClearable
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-3 col-sm-6 col-12">
                      <div className="input-blocks">
                        <Link to="#" className="btn btn-filters ms-auto">
                          <i data-feather="search" className="feather-search" /> Search
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table datanew">
                  <thead>
                    <tr>
                      <th className="no-sort">
                        <label className="checkboxs">
                          <input type="checkbox" id="select-all" />
                          <span className="checkmarks" />
                        </label>
                      </th>
                      <th>Source</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Related Sale ID</th>
                      <th className="no-sort">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan="7" className="text-center">Loading...</td></tr>}
                    {!loading && incomes.map((income) => (
                    <tr key={income._id}>
                      <td>
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                        </label>
                      </td>
                      <td>{income.source}</td>
                      <td>{income.description}</td>
                      <td>${typeof income.amount === 'number' ? income.amount.toFixed(2) : 'N/A'}</td>
                      <td>{new Date(income.date).toLocaleDateString()}</td>
                      <td>{income.relatedSale?._id || income.relatedSale || '-'}</td>
                      <td className="action-table-data">
                        <div className="edit-delete-action">
                          <Link
                            className="me-2 p-2"
                            to="#"
                            onClick={() => openEditModal(income)}
                          >
                            <i data-feather="edit" className="feather-edit" />
                          </Link>
                          <Link
                            className="confirm-text p-2"
                            to="#"
                            onClick={() => handleDeleteClick(income)}
                          >
                            <i data-feather="trash-2" className="feather-trash-2"/>
                          </Link>
                        </div>
                      </td>
                    </tr>
                    ))}
                    {!loading && incomes.length === 0 && (
                        <tr><td colSpan="7" className="text-center">No income records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Income Modal */}
      <Modal show={showAddEditModal} onHide={closeAddEditModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? "Edit Income Record" : "Add Income Record"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitIncome}>
          <Modal.Body>
            <div className="row">
              <div className="col-lg-6">
                <Form.Group className="mb-3">
                  <Form.Label>Source <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={incomeSourceOptions}
                    value={incomeSourceOptions.find(opt => opt.value === currentIncomeData.source)}
                    onChange={handleSourceChange}
                    placeholder="Choose Source"
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-lg-6">
                <Form.Group className="mb-3">
                  <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                  <DatePicker
                    selected={currentIncomeData.date}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-lg-12">
                <Form.Group className="mb-3">
                  <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="description"
                    value={currentIncomeData.description}
                    onChange={handleInputChange}
                    placeholder="Enter description"
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-lg-6">
                <Form.Group className="mb-3">
                  <Form.Label>Amount <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="amount"
                    value={currentIncomeData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    required
                    step="0.01"
                  />
                </Form.Group>
              </div>
              {currentIncomeData.source === 'Sale' && (
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Related Sale ID <span className="text-danger">*</span></Form.Label>
                    {/*
                      Replace this with a Select dropdown populated by salesList if you implement fetchSalesList
                      <Select
                        options={salesOptions}
                        value={salesOptions.find(opt => opt.value === currentIncomeData.relatedSale)}
                        onChange={handleRelatedSaleChange}
                        placeholder="Choose Related Sale"
                        isClearable
                        required
                      />
                    */}
                    <Form.Control
                      type="text" // Or a Select dropdown if you fetch sales
                      name="relatedSale"
                      value={currentIncomeData.relatedSale}
                      onChange={handleInputChange}
                      placeholder="Enter Sale ID"
                      required
                    />
                  </Form.Group>
                </div>
              )}
              <div className="col-lg-12">
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="notes"
                    value={currentIncomeData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes"
                  />
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeAddEditModal} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEditMode ? "Save Changes" : "Add Income")}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Income Record</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this income record?</p>
          {incomeToDelete && (
            <div>
              <p><strong>Description:</strong> {incomeToDelete.description}</p>
              <p><strong>Amount:</strong> ${typeof incomeToDelete.amount === 'number' ? incomeToDelete.amount.toFixed(2) : 'N/A'}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Income'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default IncomeList;

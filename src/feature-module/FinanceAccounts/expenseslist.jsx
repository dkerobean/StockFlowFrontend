import React, { useState, useEffect, useRef } from "react";
import Breadcrumbs from "../../core/breadcrumbs";
import { Eye, Sliders, Filter, Calendar, User, FileText, StopCircle } from "react-feather"; // Added StopCircle
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

const API_URL = `${process.env.REACT_APP_API_URL}/expense`; // Backend API URL for expenses
const CATEGORIES_API_URL = `${process.env.REACT_APP_API_URL}/categories`; // Backend API URL for categories

const ExpensesList = () => {
  const route = all_routes;
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Modal States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExpenseData, setCurrentExpenseData] = useState({
    category: '',
    description: '',
    amount: '',
    date: new Date(),
    paymentMethod: '',
    supplier: { name: '', contact: '' },
    receiptUrl: '',
    notes: ''
  });
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Filter States (example, can be expanded)
  const [filterDateFrom, setFilterDateFrom] = useState(null);
  const [filterDateTo, setFilterDateTo] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);


  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchExpenses();
    fetchExpenseCategories();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchExpenses = async (showErrorToast = true) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isMounted.current) {
        setExpenses(response.data || []);
      }
    } catch (err) {
      console.error('Fetch expenses error:', err);
      if (showErrorToast && isMounted.current) {
        toast.error(err.response?.data?.message || "Error fetching expenses");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const fetchExpenseCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(CATEGORIES_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isMounted.current) {
        setExpenseCategories(response.data.categories || response.data || []);
      }
    } catch (err) {
      console.error('Fetch expense categories error:', err);
      // toast.error("Error fetching expense categories"); // Optional: notify user
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "supplierName" || name === "supplierContact") {
      const supplierField = name === "supplierName" ? "name" : "contact";
      setCurrentExpenseData(prev => ({
        ...prev,
        supplier: { ...prev.supplier, [supplierField]: value }
      }));
    } else {
      setCurrentExpenseData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (date) => {
    setCurrentExpenseData(prev => ({ ...prev, date }));
  };

  const handleCategoryChange = (selectedOption) => {
    setCurrentExpenseData(prev => ({ ...prev, category: selectedOption ? selectedOption.value : '' }));
  };

  const resetFormData = () => {
    setCurrentExpenseData({
      category: '',
      description: '',
      amount: '',
      date: new Date(),
      paymentMethod: '',
      supplier: { name: '', contact: '' },
      receiptUrl: '',
      notes: ''
    });
    setSelectedExpenseId(null);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    resetFormData();
    setShowAddEditModal(true);
  };

  const openEditModal = (expense) => {
    setIsEditMode(true);
    setSelectedExpenseId(expense._id);
    setCurrentExpenseData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: expense.date ? new Date(expense.date) : new Date(),
      paymentMethod: expense.paymentMethod || '',
      supplier: {
        name: expense.supplier?.name || '',
        contact: expense.supplier?.contact || ''
      },
      receiptUrl: expense.receiptUrl || '',
      notes: expense.notes || ''
    });
    setShowAddEditModal(true);
  };

  const closeAddEditModal = () => {
    setShowAddEditModal(false);
    resetFormData();
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    const payload = { ...currentExpenseData };
    // Ensure amount is a number
    payload.amount = parseFloat(payload.amount);
    if (isNaN(payload.amount) || payload.amount <= 0) {
        toast.error("Amount must be a positive number.");
        setLoading(false);
        return;
    }


    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/${selectedExpenseId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Expense updated successfully");
      } else {
        await axios.post(API_URL, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Expense added successfully");
      }
      if (isMounted.current) {
        fetchExpenses(false);
        closeAddEditModal();
      }
    } catch (err) {
      console.error('Submit expense error:', err);
      if (isMounted.current) {
        toast.error(err.response?.data?.message || "Error saving expense");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_URL}/${expenseToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Expense deleted successfully");
      if (isMounted.current) {
        fetchExpenses(false);
        setShowDeleteModal(false);
        setExpenseToDelete(null);
      }
    } catch (err) {
      console.error('Delete expense error:', err);
      if (isMounted.current) {
        toast.error(err.response?.data?.message || "Error deleting expense");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const toggleFilterVisibility = () => setIsFilterVisible(prev => !prev);

  const categoryOptions = expenseCategories.map(cat => ({ value: cat.name, label: cat.name }));
  const paymentMethodOptions = [
    { value: "", label: "Choose Payment Method" },
    { value: "Cash", label: "Cash" },
    { value: "Credit Card", label: "Credit Card" },
    { value: "Bank Transfer", label: "Bank Transfer" },
    { value: "Check", label: "Check" },
    { value: "Other", label: "Other" },
  ];

  // Example options for filters - replace with dynamic data if needed
    const filterSortOptions = [
        { value: "date_desc", label: "Sort by Date (Newest)" },
        { value: "date_asc", label: "Sort by Date (Oldest)" },
        { value: "amount_desc", label: "Sort by Amount (High-Low)" },
        { value: "amount_asc", label: "Sort by Amount (Low-High)" },
    ];


  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="page-wrapper">
        <div className="content">
          <Breadcrumbs
            maintitle="Expense List"
            subtitle="Manage Your Expenses"
          />
           <div className="page-header">
            <div className="add-item d-flex">
                <div className="page-title">
                    {/* Removed h4 and h6 for brevity, can be added back if needed */}
                </div>
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
                        Add New Expense
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
                <div className="form-sort stylewidth">
                  <Sliders className="info-img" />
                  <Select
                    className="select"
                    options={filterSortOptions} // Use defined sort options
                    placeholder="Sort by..."
                    // onChange={handleSortChange} // Add sort logic
                  />
                </div>
              </div>

              <div className={`card${isFilterVisible ? " visible" : ""}`} id="filter_inputs" style={{ display: isFilterVisible ? "block" : "none" }}>
                <div className="card-body pb-0">
                  <div className="row">
                    <div className="col-lg-3 col-sm-6 col-12">
                      <div className="input-blocks">
                        <User className="info-img" />
                        <Select
                          className="select select-height"
                          options={categoryOptions}
                          placeholder="Filter by Category"
                          isClearable
                          value={categoryOptions.find(opt => opt.value === filterCategory)}
                          // onChange={(option) => setFilterCategory(option ? option.value : null)}
                        />
                      </div>
                    </div>
                    <div className="col-lg-3 col-sm-6 col-12">
                      <div className="input-blocks">
                        <Calendar className="info-img" />
                        <div className="input-groupicon">
                          <DatePicker
                            selected={filterDateFrom}
                            // onChange={(date) => setFilterDateFrom(date)}
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
                            selected={filterDateTo}
                            // onChange={(date) => setFilterDateTo(date)}
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
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Payment Method</th>
                      {/* <th>Supplier</th> */}
                      <th className="no-sort">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan="7" className="text-center">Loading...</td></tr>}
                    {!loading && expenses.map((expense) => (
                    <tr key={expense._id}>
                      <td>
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                        </label>
                      </td>
                      <td>{expense.category}</td>
                      <td>{expense.description}</td>
                      <td>${typeof expense.amount === 'number' ? expense.amount.toFixed(2) : 'N/A'}</td>
                      <td>{new Date(expense.date).toLocaleDateString()}</td>
                      <td>{expense.paymentMethod || '-'}</td>
                      {/* <td>{expense.supplier?.name || '-'}</td> */}
                      <td className="action-table-data">
                        <div className="edit-delete-action">
                          {/* <Link className="me-2 p-2 mb-0" to="#">
                            <Eye className="action-eye" />
                          </Link> */}
                          <Link
                            className="me-2 p-2"
                            to="#"
                            onClick={() => openEditModal(expense)}
                          >
                            <i data-feather="edit" className="feather-edit" />
                          </Link>
                          <Link
                            className="confirm-text p-2"
                            to="#"
                            onClick={() => handleDeleteClick(expense)}
                          >
                            <i data-feather="trash-2" className="feather-trash-2"/>
                          </Link>
                        </div>
                      </td>
                    </tr>
                    ))}
                    {!loading && expenses.length === 0 && (
                        <tr><td colSpan="7" className="text-center">No expenses found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      <Modal show={showAddEditModal} onHide={closeAddEditModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? "Edit Expense" : "Add Expense"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitExpense}>
          <Modal.Body>
            <div className="row">
              <div className="col-lg-6">
                <Form.Group className="mb-3">
                  <Form.Label>Expense Category <span className="text-danger">*</span></Form.Label>
                  <Select
                    options={categoryOptions}
                    value={categoryOptions.find(opt => opt.value === currentExpenseData.category)}
                    onChange={handleCategoryChange}
                    placeholder="Choose Category"
                    isClearable
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-lg-6">
                <Form.Group className="mb-3">
                  <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                  <DatePicker
                    selected={currentExpenseData.date}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    className="form-control"
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
                    value={currentExpenseData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    required
                    step="0.01"
                  />
                </Form.Group>
              </div>
               <div className="col-lg-6">
                <Form.Group className="mb-3">
                  <Form.Label>Payment Method</Form.Label>
                   <Select
                    options={paymentMethodOptions}
                    value={paymentMethodOptions.find(opt => opt.value === currentExpenseData.paymentMethod)}
                    onChange={(selectedOption) => setCurrentExpenseData(prev => ({ ...prev, paymentMethod: selectedOption ? selectedOption.value : '' }))}
                    placeholder="Choose Payment Method"
                    isClearable
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
                    value={currentExpenseData.description}
                    onChange={handleInputChange}
                    placeholder="Enter description"
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-lg-6">
                <Form.Group className="mb-3">
                  <Form.Label>Supplier Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="supplierName"
                    value={currentExpenseData.supplier.name}
                    onChange={handleInputChange}
                    placeholder="Supplier name"
                  />
                </Form.Group>
              </div>
              <div className="col-lg-6">
                <Form.Group className="mb-3">
                  <Form.Label>Supplier Contact</Form.Label>
                  <Form.Control
                    type="text"
                    name="supplierContact"
                    value={currentExpenseData.supplier.contact}
                    onChange={handleInputChange}
                    placeholder="Supplier contact (phone/email)"
                  />
                </Form.Group>
              </div>
              <div className="col-lg-12">
                <Form.Group className="mb-3">
                  <Form.Label>Receipt URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="receiptUrl"
                    value={currentExpenseData.receiptUrl}
                    onChange={handleInputChange}
                    placeholder="http://example.com/receipt.jpg"
                  />
                </Form.Group>
              </div>
              <div className="col-lg-12">
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="notes"
                    value={currentExpenseData.notes}
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
              {loading ? 'Saving...' : (isEditMode ? "Save Changes" : "Add Expense")}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this expense?</p>
          {expenseToDelete && (
            <div>
              <p><strong>Description:</strong> {expenseToDelete.description}</p>
              <p><strong>Amount:</strong> ${typeof expenseToDelete.amount === 'number' ? expenseToDelete.amount.toFixed(2) : 'N/A'}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Expense'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ExpensesList;

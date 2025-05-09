import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sliders, Filter } from "react-feather";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import Breadcrumbs from "../../core/breadcrumbs";
import { all_routes } from "../../Router/all_routes";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal as BootstrapModal, Button as BootstrapButton, Form } from 'react-bootstrap';

// Ensure this API endpoint is set up in your backend to manage income categories
const API_URL = `${process.env.REACT_APP_API_URL}/income-categories`; // Or your actual endpoint for income categories

const IncomeCategory = () => {
  const route = all_routes;
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const isMounted = useRef(true);

  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    isMounted.current = true;
    fetchCategories();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchCategories = async (showErrorToast = true) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (isMounted.current) {
        setCategories(response.data.categories || response.data || []);
      }
    } catch (err) {
      console.error('Fetch income categories error:', err);
      if (showErrorToast && isMounted.current) {
        toast.error(err.response?.data?.message || "Error fetching income categories");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setFormData({ name: "", description: "" });
    setSelectedId(null);
    setShowAddEditModal(true);
  };

  const openEditModal = (cat) => {
    setEditMode(true);
    setFormData({ name: cat.name, description: cat.description });
    setSelectedId(cat._id);
    setShowAddEditModal(true);
  };

  const handleModalClose = () => {
    setShowAddEditModal(false);
    setFormData({ name: "", description: "" });
    setEditMode(false);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (editMode) {
        await axios.put(`${API_URL}/${selectedId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Income category updated successfully");
      } else {
        await axios.post(API_URL, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Income category created successfully");
      }
      if (isMounted.current) {
        fetchCategories(false);
        handleModalClose();
      }
    } catch (err) {
      console.error('Submit income category error:', err);
      if (isMounted.current) {
        toast.error(err.response?.data?.message || "Error saving income category");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/${categoryToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Income category deleted successfully");
      if (isMounted.current) {
        fetchCategories(false);
      }
    } catch (err) {
      console.error('Delete income category error:', err);
      if (isMounted.current) {
        toast.error(err.response?.data?.message || "Error deleting income category");
      }
    } finally {
      setShowDeleteConfirmModal(false);
      setCategoryToDelete(null);
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <Breadcrumbs title="Income Category" path={route.incomecategory} maintitle="Income Category" />
          <ToastContainer position="top-right" autoClose={3000} />

          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>Income Category</h4>
                <h6>Manage your income categories</h6>
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
                    Add New Income Category
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
                      placeholder="Search by category name..."
                      className="form-control form-control-sm formsearch"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <Link to="#" className="btn btn-searchset">
                      <i data-feather="search" className="feather-search" />
                    </Link>
                  </div>
                </div>
                {/* You can add a filter button similar to ExpenseCategory if needed */}
              </div>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>
                        <label className="checkboxs">
                          <input type="checkbox" id="select-all" />
                          <span className="checkmarks" />
                        </label>
                      </th>
                      <th>Category Name</th>
                      <th>Description</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan="4" className="text-center">Loading...</td></tr>}
                    {!loading && filteredCategories.length === 0 && (
                      <tr><td colSpan="4" className="text-center">No income categories found.</td></tr>
                    )}
                    {!loading && filteredCategories.map((cat) => (
                      <tr key={cat._id}>
                        <td>
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks" />
                          </label>
                        </td>
                        <td>{cat.name}</td>
                        <td>{cat.description}</td>
                        <td className="action-table-data">
                          <div className="edit-delete-action">
                            <Link
                              className="me-2 p-2"
                              to="#"
                              onClick={() => openEditModal(cat)}
                            >
                              <i data-feather="edit" className="feather-edit" />
                            </Link>
                            <Link
                              className="confirm-text p-2"
                              to="#"
                              onClick={() => handleDelete(cat)}
                            >
                               <i data-feather="trash-2" className="feather-trash-2" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BootstrapModal show={showAddEditModal} onHide={handleModalClose} centered>
        <BootstrapModal.Header closeButton>
          <BootstrapModal.Title>{editMode ? "Edit Income Category" : "Add Income Category"}</BootstrapModal.Title>
        </BootstrapModal.Header>
        <Form onSubmit={handleSubmit}>
          <BootstrapModal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Category Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter category name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>
          </BootstrapModal.Body>
          <BootstrapModal.Footer>
            <BootstrapButton variant="secondary" onClick={handleModalClose} disabled={loading}>
              Cancel
            </BootstrapButton>
            <BootstrapButton variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : (editMode ? "Update Category" : "Add Category")}
            </BootstrapButton>
          </BootstrapModal.Footer>
        </Form>
      </BootstrapModal>

      <BootstrapModal show={showDeleteConfirmModal} onHide={() => setShowDeleteConfirmModal(false)} centered>
        <BootstrapModal.Header closeButton>
          <BootstrapModal.Title>Delete Income Category</BootstrapModal.Title>
        </BootstrapModal.Header>
        <BootstrapModal.Body>
          <p>Are you sure you want to delete the category "<strong>{categoryToDelete?.name}</strong>"?</p>
          <p>This action cannot be undone.</p>
        </BootstrapModal.Body>
        <BootstrapModal.Footer>
          <BootstrapButton variant="secondary" onClick={() => setShowDeleteConfirmModal(false)} disabled={loading}>
            Cancel
          </BootstrapButton>
          <BootstrapButton variant="danger" onClick={confirmDeleteCategory} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete Category'}
          </BootstrapButton>
        </BootstrapModal.Footer>
      </BootstrapModal>
    </>
  );
};

export default IncomeCategory;

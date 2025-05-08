import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Breadcrumbs from "../../core/breadcrumbs";
import { Filter, Sliders } from "react-feather";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import Select from "react-select";
import { Zap } from "react-feather/dist";
import { all_routes } from "../../Router/all_routes";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal as BootstrapModal, Button as BootstrapButton } from 'react-bootstrap'; // Import react-bootstrap components

const API_URL = `${process.env.REACT_APP_API_URL}/categories`;

const ExpenseCategory = () => {
  const route = all_routes;
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const addModalRef = useRef();
  const editModalRef = useRef();
  const isMounted = useRef(true);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); // State for delete confirmation modal
  const [categoryToDelete, setCategoryToDelete] = useState(null); // State for category to be deleted

  const toggleFilterVisibility = () => {
    setIsFilterVisible((prevVisibility) => !prevVisibility);
  };

  useEffect(() => {
    isMounted.current = true;
    fetchCategories();
    return () => { isMounted.current = false; };
  }, []);

  // Fetch categories for the current user
  const fetchCategories = async (showError = true) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log('Fetching categories...'); // Debug log
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Categories fetched:', response.data); // Debug log
      setCategories(response.data);
    } catch (err) {
      console.error('Fetch error:', err); // Debug log
      if (showError) {
        toast.error("Failed to fetch categories");
      }
    } finally {
      setLoading(false);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setForm({ name: "", description: "" });
    setEditMode(false);
    setSelectedId(null);
    // Use Bootstrap 5 modal method
    const modal = new window.bootstrap.Modal(document.getElementById('add-units'));
    modal.show();
  };

  // Open Edit Modal
  const openEditModal = (cat) => {
    setForm({ name: cat.name, description: cat.description || "" });
    setEditMode(true);
    setSelectedId(cat._id);
    // Use Bootstrap 5 modal method
    const modal = new window.bootstrap.Modal(document.getElementById('edit-units'));
    modal.show();
  };

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Utility to close modal using Bootstrap API
  const closeModal = (modalId) => {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
      modalInstance?.hide();
    }
    setForm({ name: "", description: "" });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Expense name is required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (editMode) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/categories/${selectedId}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Category updated successfully");
        closeModal('edit-units');
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/categories`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Category created successfully");
        closeModal('add-units');
      }
      await fetchCategories(false); // Refresh list after modal closes
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving category");
    }
  };

  // Delete category - updated to show confirmation modal
  const handleDelete = async (category) => {
    setCategoryToDelete(category); // Store the whole category object
    setShowDeleteConfirmModal(true); // Show the confirmation modal
  };

  // Confirm delete category - new function
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/${categoryToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Category deleted successfully");
      fetchCategories(false); // Refresh list
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || "Error deleting category");
    } finally {
      setShowDeleteConfirmModal(false); // Hide modal
      setCategoryToDelete(null); // Reset category to delete
    }
  };

  // Update close button handlers in both modals
  const handleCloseModal = (modalId) => {
    closeModal(modalId);
  };

  // Filtered categories by search
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <ToastContainer />
      <div>
        <div className="page-wrapper">
          <div className="content">
            <Breadcrumbs
              maintitle="Expense Category"
              subtitle="Manage Your Expense Category"
              addButton="Add Expenses Category"
              onAddClick={openAddModal}
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
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                </div>
                <div
                  className={`card${isFilterVisible ? " visible" : ""}`}
                  id="filter_inputs"
                  style={{ display: isFilterVisible ? "block" : "none" }}
                >
                  <div className="card-body pb-0">
                    <div className="row">
                      <div className="col-lg-3 col-sm-6 col-12">
                        <div className="input-blocks">
                          <Zap className="info-img" />
                          <Select options={[]} placeholder="Choose Category" />
                        </div>
                      </div>
                      <div className="col-lg-9 col-sm-6 col-12">
                        <div className="input-blocks">
                          <Link className="btn btn-filters ms-auto">
                            <i data-feather="search" className="feather-search" /> Search
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table  datanew">
                    <thead>
                      <tr>
                        <th className="no-sort">
                          <label className="checkboxs">
                            <input type="checkbox" id="select-all" />
                            <span className="checkmarks" />
                          </label>
                        </th>
                        <th>Category name</th>
                        <th>Description</th>
                        <th className="no-sort">Action</th>
                      </tr>
                    </thead>
                    <tbody className="Expense-list-blk">
                      {loading ? (
                        <tr><td colSpan={4}>Loading...</td></tr>
                      ) : filteredCategories.length === 0 ? (
                        <tr><td colSpan={4}>No categories found</td></tr>
                      ) : (
                        filteredCategories.map((cat) => (
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
                                  className="me-2 p-2 mb-0"
                                  data-bs-toggle="modal"
                                  data-bs-target="#edit-units"
                                  onClick={() => openEditModal(cat)}
                                >
                                  <i data-feather="edit" className="feather-edit" />
                                </Link>
                                <Link
                                  className="me-0 confirm-text p-2 mb-0"
                                  onClick={() => handleDelete(cat)} // Pass the whole category object
                                >
                                  <i data-feather="trash-2" className="feather-trash-2" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Expense Category Modal */}
        <div className="modal fade" id="add-units" tabIndex={-1} aria-hidden="true" ref={addModalRef}>
          <div className="modal-dialog modal-dialog-centered custom-modal-two">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header border-0 custom-modal-header">
                    <div className="page-title">
                      <h4>Add Expense Category</h4>
                    </div>
                    <button
                      type="button"
                      className="close"
                      onClick={() => closeModal('add-units')}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                  <div className="modal-body custom-modal-body">
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-lg-12">
                          <div className="mb-3">
                            <label className="form-label">Expense Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="name"
                              value={form.name}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="edit-add card">
                            <div className="edit-add">
                              <label className="form-label">Description</label>
                            </div>
                            <div className="card-body-list input-blocks mb-0">
                              <textarea
                                className="form-control"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                maxLength={600}
                              />
                            </div>
                            <p>Maximum 600 Characters</p>
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer-btn">
                        <button
                          type="button"
                          className="btn btn-cancel me-2"
                          data-bs-dismiss="modal"
                          onClick={() => closeModal('add-units')}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-submit">
                          Submit
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Expense Category Modal */}
        <div className="modal fade" id="edit-units" tabIndex={-1} aria-hidden="true" ref={editModalRef}>
          <div className="modal-dialog modal-dialog-centered custom-modal-two">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header border-0 custom-modal-header">
                    <div className="page-title">
                      <h4>Edit Expense Category</h4>
                    </div>
                    <button
                      type="button"
                      className="close"
                      onClick={() => closeModal('edit-units')}
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                  <div className="modal-body custom-modal-body">
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-lg-12">
                          <div className="mb-3">
                            <label className="form-label">Expense Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="name"
                              value={form.name}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-12">
                          <div className="edit-add card">
                            <div className="edit-add">
                              <label className="form-label">Description</label>
                            </div>
                            <div className="card-body-list input-blocks mb-0">
                              <textarea
                                className="form-control"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                maxLength={600}
                              />
                            </div>
                            <p>Maximum 600 Characters</p>
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer-btn">
                        <button
                          type="button"
                          className="btn btn-cancel me-2"
                          data-bs-dismiss="modal"
                          onClick={() => closeModal('edit-units')}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-submit">
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal (using react-bootstrap) */}
        <BootstrapModal show={showDeleteConfirmModal} onHide={() => setShowDeleteConfirmModal(false)} centered>
          <BootstrapModal.Header closeButton>
            <BootstrapModal.Title>Delete Expense Category</BootstrapModal.Title>
          </BootstrapModal.Header>
          <BootstrapModal.Body>
            <p>Are you sure you want to delete the category "<strong>{categoryToDelete?.name}</strong>"?</p>
            <p>This action cannot be undone.</p>
          </BootstrapModal.Body>
          <BootstrapModal.Footer>
            <BootstrapButton variant="secondary" onClick={() => setShowDeleteConfirmModal(false)}>
              Cancel
            </BootstrapButton>
            <BootstrapButton variant="danger" onClick={confirmDeleteCategory}>
              Delete Category
            </BootstrapButton>
          </BootstrapModal.Footer>
        </BootstrapModal>
      </div>
    </>
  );
};

export default ExpenseCategory;

import React, { useState, useEffect } from "react";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Make sure Bootstrap's JS is loaded, e.g., in your index.js or App.js
// import 'bootstrap/dist/js/bootstrap.bundle.min';

const AddCategory = ({ onSuccess }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [categoryName, setCategoryName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('active');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalId = "add-category";

    const generateSlug = (name) => {
        if (!name) return '';
        return name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    };

    const resetForm = () => {
        setCategoryName('');
        setDescription('');
        setStatus('active');
        setIsSubmitting(false);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            toast.error("Category name is required");
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Authentication required");
            setIsSubmitting(false);
            return;
        }

        try {
            const slug = generateSlug(categoryName);
            await axios.post(`${API_URL}/product-categories`,
                {
                    name: categoryName.trim(),
                    description: description.trim(),
                    slug: slug,
                    status: status
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            // Show success toast notification
            toast.success('Category created successfully!');
            
            // Clear the form immediately after successful submission
            resetForm();
            
            // Call the onSuccess callback to refresh the list
            if (onSuccess) {
                onSuccess();
            }

            // Close modal using window.bootstrap if available
            const modalElement = document.getElementById(modalId);
            if (modalElement && window.bootstrap) {
                const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    try {
                        const bsModal = new window.bootstrap.Modal(modalElement);
                        bsModal.hide();
                    } catch (modalError) {
                        console.error("Could not initialize Bootstrap modal:", modalError);
                        // Fallback: use jQuery if available
                        if (window.jQuery) {
                            window.jQuery(modalElement).modal('hide');
                        } else {
                            // Last resort: use data-bs-dismiss programmatically
                            const closeButton = modalElement.querySelector('[data-bs-dismiss="modal"]');
                            if (closeButton) closeButton.click();
                        }
                    }
                }
            } else {
                // Fallback if bootstrap is not available
                const closeButton = modalElement?.querySelector('[data-bs-dismiss="modal"]');
                if (closeButton) closeButton.click();
            }

        } catch (error) {
            console.error("Error adding product category:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to add product category";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = () => {
        setStatus(prev => prev === 'active' ? 'inactive' : 'active');
    };

    useEffect(() => {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const handleHide = () => {
                console.log("Add modal hidden, resetting form.");
                resetForm();
            };
            modalElement.addEventListener('hidden.bs.modal', handleHide);

            return () => {
                modalElement.removeEventListener('hidden.bs.modal', handleHide);
            };
        }
    }, [modalId]);

    return (
        <div className="modal fade" id={modalId} tabIndex="-1" aria-labelledby="addCategoryLabel" aria-hidden="true">
            <ToastContainer />
            <div className="modal-dialog modal-dialog-centered custom-modal-two">
                <div className="modal-content">
                    <div className="page-wrapper-new p-0">
                        <div className="content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4 id="addCategoryLabel">Add New Product Category</h4>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="modal-body custom-modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="add-category-name" className="form-label">Category Name</label>
                                        <input
                                            type="text"
                                            id="add-category-name"
                                            className="form-control"
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            required
                                            disabled={isSubmitting}
                                            aria-describedby="categoryNameHelp"
                                        />
                                        <div id="categoryNameHelp" className="form-text">Enter the name for the new product category.</div>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="add-category-description" className="form-label">Description</label>
                                        <textarea
                                            id="add-category-description"
                                            className="form-control"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows="3"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                            <span className="status-label">Status</span>
                                            <div className="form-check form-switch">
                                                <input
                                                    type="checkbox"
                                                    id="add-category-status"
                                                    className="form-check-input"
                                                    role="switch"
                                                    checked={status === 'active'}
                                                    onChange={toggleStatus}
                                                    disabled={isSubmitting}
                                                />
                                                <label htmlFor="add-category-status" className="form-check-label">
                                                    {status === 'active' ? 'Active' : 'Inactive'}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer-btn">
                                        <button
                                            type="button"
                                            className="btn btn-cancel me-2"
                                            data-bs-dismiss="modal"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-submit"
                                            disabled={isSubmitting || !categoryName.trim()}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Creating...
                                                </>
                                            ) : 'Create Category'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCategory;
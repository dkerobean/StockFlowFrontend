import React, { useState, useEffect } from "react";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Make sure Bootstrap's JS is loaded, e.g., in your index.js or App.js
// import 'bootstrap/dist/js/bootstrap.bundle.min';

const AddCategoryList = ({ onSuccess }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [categoryName, setCategoryName] = useState('');
    const [status, setStatus] = useState('active'); // Default status
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalId = "add-category"; // Ensure this matches the id in CategoryList modal trigger

    const generateSlug = (name) => {
        if (!name) return ''; // Handle empty name case
        return name.toLowerCase()
            .replace(/[^\w\s-]/g, '') // remove non-word characters except space and hyphen
            .replace(/\s+/g, '-')     // replace spaces with hyphens
            .replace(/--+/g, '-')     // replace multiple hyphens with single
            .trim();                  // trim leading/trailing hyphens (though regex should handle most)
    };

    const resetForm = () => {
        setCategoryName('');
        setStatus('active');
        setIsSubmitting(false);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            toast.error("Category name cannot be empty.");
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Authentication required.");
            setIsSubmitting(false);
            return;
        }

        try {
            const slug = generateSlug(categoryName);
            await axios.post(`${API_URL}/categories`,
                {
                    name: categoryName.trim(), // Trim name before sending
                    slug: slug,
                    status: status
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // --- Success Sequence ---
            // 1. Show success toast
            toast.success(`Category "${categoryName.trim()}" added successfully!`);

            // 2. Call the onSuccess callback (to refresh the list in parent)
            if (onSuccess) {
                onSuccess();
            }

            // 3. Close the modal
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                // Use Bootstrap's static method to get the instance
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    // Fallback if instance not found (less ideal)
                    const bsModal = new bootstrap.Modal(modalElement);
                    bsModal.hide();
                }
            }

            // 4. Reset form state (handled by modal 'hidden.bs.modal' event now)
            // resetForm(); // Removed - let the useEffect handle reset on hide

        } catch (error) {
            console.error("Error adding category:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to add category";
            toast.error(errorMessage);
        } finally {
            // Only set isSubmitting to false here if it wasn't reset by modal close/hide
            // It's generally safer to let the hide event listener handle the final state reset.
             setIsSubmitting(false); // Keep this for error cases where modal doesn't hide
        }
    };

    const toggleStatus = () => {
        setStatus(prev => prev === 'active' ? 'inactive' : 'active');
    };

    // Effect to reset form when modal is hidden
    useEffect(() => {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const handleHide = () => {
                console.log("Add modal hidden, resetting form.");
                resetForm();
            };
            modalElement.addEventListener('hidden.bs.modal', handleHide);

            // Cleanup listener when component unmounts or modalId changes
            return () => {
                modalElement.removeEventListener('hidden.bs.modal', handleHide);
            };
        }
    }, [modalId]); // Dependency array ensures effect runs if modalId changes

    return (
        <div className="modal fade" id={modalId} tabIndex="-1" aria-labelledby="addCategoryLabel" aria-hidden="true"> {/* Added tabIndex, labels */}
        <ToastContainer />
            <div className="modal-dialog modal-dialog-centered custom-modal-two">
                <div className="modal-content">
                    <div className="page-wrapper-new p-0">
                        <div className="content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4 id="addCategoryLabel">Create Category</h4> {/* Added id */}
                                </div>
                                <button
                                    type="button"
                                    className="btn-close" // Use Bootstrap's standard close button class
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                    disabled={isSubmitting} // Disable close button while submitting
                                />
                            </div>
                            <div className="modal-body custom-modal-body">
                                <form onSubmit={handleSubmit}>
                                    {/* ... (input fields for name, slug) ... */}
                                     <div className="mb-3">
                                        <label htmlFor="add-category-name" className="form-label">Category Name</label> {/* Added htmlFor */}
                                        <input
                                            type="text"
                                            id="add-category-name" // Added id
                                            className="form-control"
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            required
                                            disabled={isSubmitting}
                                            aria-describedby="categoryNameHelp" // Accessibility
                                        />
                                         <div id="categoryNameHelp" className="form-text">Enter the name for the new category.</div>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="add-category-slug" className="form-label">Category Slug (auto-generated)</label> {/* Added htmlFor */}
                                        <input
                                            type="text"
                                            id="add-category-slug" // Added id
                                            className="form-control"
                                            value={generateSlug(categoryName)}
                                            readOnly
                                            tabIndex="-1" // Make readOnly not focusable
                                        />
                                    </div>
                                    <div className="mb-3"> {/* Wrapped status toggle for better spacing */}
                                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                            <span className="status-label">Status</span>
                                            <div className="form-check form-switch"> {/* Use Bootstrap form-switch */}
                                                <input
                                                    type="checkbox"
                                                    id="add-category-status"
                                                    className="form-check-input" // Use BS class
                                                    role="switch" // Accessibility
                                                    checked={status === 'active'}
                                                    onChange={toggleStatus}
                                                    disabled={isSubmitting}
                                                />
                                                <label htmlFor="add-category-status" className="form-check-label">{status === 'active' ? 'Active' : 'Inactive'}</label> {/* Dynamic label */}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer-btn">
                                        <button
                                            type="button"
                                            className="btn btn-cancel me-2"
                                            data-bs-dismiss="modal"
                                            disabled={isSubmitting} // Also disable cancel during submit
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-submit"
                                            disabled={isSubmitting || !categoryName.trim()} // Disable if submitting or name is empty
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

export default AddCategoryList;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Make sure Bootstrap's JS is loaded, e.g., in your index.js or App.js
// import 'bootstrap/dist/js/bootstrap.bundle.min';


const EditCategoryList = ({ categoryId, currentName, currentStatus, onUpdate }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [name, setName] = useState(''); // Initialize empty, set in useEffect
    const [status, setStatus] = useState('active'); // Initialize default, set in useEffect
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalId = `edit-category-${categoryId}`; // Dynamic ID

    // Effect to update state when props change (e.g., when opening modal for a different category)
    useEffect(() => {
        setName(currentName || ''); // Handle potential undefined initial prop
        setStatus(currentStatus || 'active'); // Handle potential undefined initial prop
    }, [currentName, currentStatus, categoryId]); // Re-run if any of these change

    const generateSlug = (name) => {
         if (!name) return '';
        return name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-');
    };

     const resetForm = () => {
        // Resetting to initial props might be better than blank/active
        setName(currentName || '');
        setStatus(currentStatus || 'active');
        setIsSubmitting(false);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
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
            const slug = generateSlug(name);
            await axios.put(`${API_URL}/product-categories/${categoryId}`,
                {
                    name: name.trim(), // Trim name
                    slug,
                    status
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // --- Success Sequence ---
            // Show success toast notification
            toast.success('Category updated successfully!');

            // 2. Call the onUpdate callback (to refresh list)
            if (onUpdate) {
                onUpdate();
            }

            // Close the modal safely
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

            // 4. Reset form state (handled by 'hidden.bs.modal' event)
            // Resetting state here might cause a flicker if the modal closes slowly
            // setIsSubmitting(false); // Let finally handle this

        } catch (error) {
            console.error("Error updating category:", error);
             const errorMessage = error.response?.data?.message || error.message || "Failed to update category";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false); // Ensure submitting state is reset on success or error
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
                console.log(`Edit modal ${modalId} hidden, resetting form.`);
                // Don't necessarily reset the form here, as the parent might reuse the component instance.
                // Resetting isSubmitting is important though.
                 setIsSubmitting(false);
                 // Optionally reset name/status if desired, but maybe rely on the prop-setting effect instead.
                 // setName(currentName || '');
                 // setStatus(currentStatus || 'active');
            };
            modalElement.addEventListener('hidden.bs.modal', handleHide);

            // Cleanup listener
            return () => {
                modalElement.removeEventListener('hidden.bs.modal', handleHide);
            };
        }
    }, [modalId, currentName, currentStatus]); // Add dependencies if reset logic uses them

    return (
        // Ensure the modalId matches the one used in JS
        <div className="modal fade" id={modalId} tabIndex="-1" aria-labelledby={`editCategoryLabel-${categoryId}`} aria-hidden="true">
        <ToastContainer />
            <div className="modal-dialog modal-dialog-centered custom-modal-two">
                <div className="modal-content">
                    <div className="page-wrapper-new p-0">
                        <div className="content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4 id={`editCategoryLabel-${categoryId}`}>Edit Category</h4> {/* Dynamic label id */}
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
                                        <label htmlFor={`edit-category-name-${categoryId}`} className="form-label">Category Name</label> {/* Dynamic htmlFor */}
                                        <input
                                            type="text"
                                            id={`edit-category-name-${categoryId}`} // Dynamic id
                                            className="form-control"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor={`edit-category-slug-${categoryId}`} className="form-label">Category Slug</label> {/* Dynamic htmlFor */}
                                        <input
                                            type="text"
                                            id={`edit-category-slug-${categoryId}`} // Dynamic id
                                            className="form-control"
                                            value={generateSlug(name)}
                                            readOnly
                                             tabIndex="-1"
                                        />
                                    </div>
                                     <div className="mb-3"> {/* Wrapped status toggle */}
                                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                            <span className="status-label">Status</span>
                                             <div className="form-check form-switch">
                                                <input
                                                    type="checkbox"
                                                    id={`edit-status-${categoryId}`} // Dynamic id
                                                    className="form-check-input"
                                                    role="switch"
                                                    checked={status === 'active'}
                                                    onChange={toggleStatus}
                                                    disabled={isSubmitting}
                                                />
                                                 <label htmlFor={`edit-status-${categoryId}`} className="form-check-label">{status === 'active' ? 'Active' : 'Inactive'}</label>
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
                                            disabled={isSubmitting || !name.trim()} // Disable if submitting or name empty
                                        >
                                             {isSubmitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Updating...
                                                </>
                                            ) : 'Save Changes'}
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

export default EditCategoryList;
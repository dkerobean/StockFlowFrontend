import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Added onModalClose prop for better cleanup handling if needed from parent
const EditBrand = ({ brandId, currentName, currentStatus, onUpdate, onModalClose }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [name, setName] = useState(''); // Initialize empty, set in useEffect
    const [status, setStatus] = useState('active'); // Initialize default, set in useEffect
    const [slugPreview, setSlugPreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalId = `edit-brand-${brandId}`; // Dynamic ID

    const generateSlug = (name) => {
        if (!name) return ''; // Handle empty name
        return name.toLowerCase()
            .trim() // Add trim
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-');
    };

    // Effect to set initial state and slug when props change
    useEffect(() => {
        setName(currentName || '');
        setStatus(currentStatus || 'active');
        setSlugPreview(generateSlug(currentName || '')); // Generate initial slug
    }, [currentName, currentStatus, brandId]); // Depend on props

    // Effect to update slug preview when name changes *after* initial load
    useEffect(() => {
        // Avoid running on initial mount if name is set by the other effect
        if (name !== currentName) {
             setSlugPreview(generateSlug(name));
        }
    }, [name, currentName]); // Only re-run if name changes

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = name.trim(); // Use trimmed name
        if (!trimmedName) {
            toast.error("Brand name cannot be empty.");
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem('token'); // Get token inside try/catch or before
        if (!token) {
            toast.error("Authentication required.");
            setIsSubmitting(false);
            return;
        }

        try {
            // Send the current slug preview
            await axios.put(`${API_URL}/brands/${brandId}`, {
                name: trimmedName,
                slug: slugPreview, // Send updated slug
                status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Brand updated successfully!');

            if (onUpdate) onUpdate(); // Trigger parent refresh & close

            // Optionally, manually hide if parent doesn't via onUpdate
            // const modalElement = document.getElementById(modalId);
            // if (modalElement) {
            //     const modalInstance = bootstrap.Modal.getInstance(modalElement);
            //     if (modalInstance) modalInstance.hide();
            // }

        } catch (error) {
            console.error("Error updating brand:", error);
            toast.error(`Failed to update brand: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSubmitting(false); // Ensure this runs even on error
        }
    };

    const toggleStatus = () => {
        setStatus(prev => prev === 'active' ? 'inactive' : 'active');
    };

    // Effect to handle modal close cleanup (optional, depends on parent logic)
    useEffect(() => {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            const handleHide = () => {
                console.log(`Edit brand modal ${modalId} hidden.`);
                setIsSubmitting(false); // Reset submitting state as safety measure
                // if (onModalClose) {
                //     onModalClose(); // Call parent cleanup if needed
                // }
            };
            modalElement.addEventListener('hidden.bs.modal', handleHide);
            return () => modalElement.removeEventListener('hidden.bs.modal', handleHide);
        }
    }, [modalId, onModalClose]); // Add dependencies

    return (
        <div className="modal fade" id={modalId} tabIndex="-1" aria-labelledby={`editBrandLabel-${brandId}`} aria-hidden="true">
             {/* REMOVE ToastContainer from here */}
             <ToastContainer />
            <div className="modal-dialog modal-dialog-centered custom-modal-two">
                <div className="modal-content">
                    <div className="page-wrapper-new p-0">
                        <div className="content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4 id={`editBrandLabel-${brandId}`}>Edit Brand</h4>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close" // Use standard BS class
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                    disabled={isSubmitting} // Disable while submitting
                                ></button>
                            </div>
                            <div className="modal-body custom-modal-body">
                                <form onSubmit={handleSubmit}>
                                    {/* Brand Name Input */}
                                    <div className="mb-3">
                                        <label htmlFor={`edit-brand-name-${brandId}`} className="form-label">Brand Name</label>
                                        <input
                                            id={`edit-brand-name-${brandId}`}
                                            type="text"
                                            className="form-control"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    {/* Slug Preview Input */}
                                    {/* <div className="mb-3">
                                        <label htmlFor={`edit-brand-slug-${brandId}`} className="form-label">Brand Slug</label>
                                        <input
                                            id={`edit-brand-slug-${brandId}`}
                                            type="text"
                                            className="form-control"
                                            value={slugPreview}
                                            readOnly
                                            tabIndex="-1" // Make readOnly not focusable
                                        />
                                    </div> */}
                                    {/* Status Toggle */}
                                     <div className="mb-3">
                                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                            <span className="status-label">Status</span>
                                            <div className="form-check form-switch">
                                                <input
                                                    type="checkbox"
                                                    id={`edit-brand-status-${brandId}`}
                                                    className="form-check-input" // Use standard BS class
                                                    role="switch"
                                                    checked={status === 'active'}
                                                    onChange={toggleStatus}
                                                    disabled={isSubmitting}
                                                />
                                                <label htmlFor={`edit-brand-status-${brandId}`} className="form-check-label">
                                                    {status === 'active' ? 'Active' : 'Inactive'}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Modal Footer Buttons */}
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
                                                    Saving...
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

export default EditBrand;
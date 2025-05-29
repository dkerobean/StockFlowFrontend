import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddBrand = ({ onSuccess }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [brandName, setBrandName] = useState('');
    const [status, setStatus] = useState('active');
    const [slugPreview, setSlugPreview] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalId = "add-brand"; // Added modalId for clarity

    const generateSlug = (name) => {
        if (!name) return ''; // Handle empty name
        return name.toLowerCase()
            .trim() // Add trim
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-');
    };

    // Update slug preview when brandName changes
    useEffect(() => {
        setSlugPreview(generateSlug(brandName));
    }, [brandName]);

    // Reset form helper
    const resetForm = () => {
        setBrandName('');
        setStatus('active');
        setSlugPreview(''); // Reset slug preview too
        setIsSubmitting(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = brandName.trim(); // Use trimmed name
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
            // Send the generated slug
            await axios.post(`${API_URL}/brands`, {
                name: trimmedName,
                slug: slugPreview,
                status: status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Show success toast notification
            toast.success('Brand created successfully!');
            
            // Reset form
            resetForm();
            
            // Close modal using Bootstrap API
            const modalElement = document.getElementById(modalId);
            if (modalElement && window.bootstrap) { // Check for window.bootstrap
                const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    // Fallback if getInstance returns null (e.g., modal not initialized via JS)
                    const fallbackModal = new window.bootstrap.Modal(modalElement);
                    fallbackModal.hide();
                }
            }

            if (onSuccess) onSuccess(); // Refresh parent list AFTER modal hide is initiated
            // Don't reset form here, let the 'hidden' event handle it

        } catch (error) {
            console.error("Error adding brand:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to add brand";
            if (errorMessage.toLowerCase().includes("already exist")) {
                toast.error(`Brand "${trimmedName}" already exists.`, {
                    autoClose: 5000,
                    position: "top-right"
                });
            } else {
                toast.error(errorMessage, {
                    autoClose: 5000,
                    position: "top-right"
                });
            }
        } finally {
            setIsSubmitting(false); // Ensure this runs even on error
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
                console.log("Add brand modal hidden, resetting form.");
                resetForm();
            };
            modalElement.addEventListener('hidden.bs.modal', handleHide);
            return () => modalElement.removeEventListener('hidden.bs.modal', handleHide);
        }
    }, [modalId]); // Add modalId dependency

    return (
        <div className="modal fade" id={modalId} tabIndex="-1" aria-labelledby="addBrandLabel" aria-hidden="true">
            <ToastContainer />
            <div className="modal-dialog modal-dialog-centered custom-modal-two">
                <div className="modal-content">
                    <div className="page-wrapper-new p-0">
                        <div className="content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4 id="addBrandLabel">Create Brand</h4>
                                </div>
                                <button
                                    type="button"
                                    className="btn-close" // Use standard Bootstrap class
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                    disabled={isSubmitting} // Disable while submitting
                                ></button>
                            </div>
                            <div className="modal-body custom-modal-body">
                                <form onSubmit={handleSubmit}>
                                    {/* Brand Name Input */}
                                    <div className="mb-3">
                                        <label htmlFor="add-brand-name" className="form-label">Brand Name</label>
                                        <input
                                            id="add-brand-name"
                                            type="text"
                                            className="form-control"
                                            value={brandName}
                                            onChange={(e) => setBrandName(e.target.value)}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    {/* Slug Preview Input */}
                                    {/* <div className="mb-3">
                                        <label htmlFor="add-brand-slug" className="form-label">Brand Slug (auto-generated)</label>
                                        <input
                                            id="add-brand-slug"
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
                                                    id="add-brand-status"
                                                    className="form-check-input" // Use standard BS class
                                                    role="switch"
                                                    checked={status === 'active'}
                                                    onChange={toggleStatus}
                                                    disabled={isSubmitting}
                                                />
                                                <label htmlFor="add-brand-status" className="form-check-label">
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
                                            disabled={isSubmitting || !brandName.trim()} // Disable if submitting or name empty
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Creating...
                                                </>
                                            ) : 'Create Brand'}
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

export default AddBrand;
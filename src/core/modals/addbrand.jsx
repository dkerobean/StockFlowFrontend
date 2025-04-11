import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import { toast } from 'react-toastify';

// Helper to get Auth Token (assuming it's the same as in AddProduct)
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
};

// Accept onSuccess prop to notify parent component
const AddBrand = ({ onSuccess }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [brandName, setBrandName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission if wrapped in form
        if (!brandName.trim()) {
            toast.error("Brand name cannot be empty.");
            return;
        }
        setIsSubmitting(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            toast.error("Authentication required.");
            setIsSubmitting(false);
            return;
        }

        try {
            await axios.post(`${API_URL}/brands`, { name: brandName }, { headers: authHeader });
            toast.success(`Brand "${brandName}" added successfully!`);
            setBrandName(''); // Clear input
            if (onSuccess) {
                onSuccess(); // Call the callback to refresh the list in parent
            }
            // Close the modal manually using Bootstrap's JS API
            const modalElement = document.getElementById('add-units-brand');
            if (modalElement) {
                // eslint-disable-next-line no-undef // Inform ESLint about Bootstrap global
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    // Fallback if instance not found (might happen on fast navigations)
                     const fallbackModal = new bootstrap.Modal(modalElement);
                     fallbackModal.hide();
                }
            }
        } catch (error) {
            console.error("Error adding brand:", error.response ? error.response.data : error);
            toast.error(`Failed to add brand: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close event to clear the input
    React.useEffect(() => {
        const modalElement = document.getElementById('add-units-brand');
        if (modalElement) {
            const handleHide = () => {
                setBrandName(''); // Clear input when modal hides
                setIsSubmitting(false); // Reset submitting state
            };
            modalElement.addEventListener('hidden.bs.modal', handleHide);
            // Cleanup listener on component unmount
            return () => {
                modalElement.removeEventListener('hidden.bs.modal', handleHide);
            };
        }
    }, []);


    return (
        <>
            {/* Add Brand Modal Structure (Keep original ID and classes) */}
            <div className="modal fade" id="add-units-brand" tabIndex={-1} aria-labelledby="addBrandModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered custom-modal-two">
                    <div className="modal-content">
                        <div className="page-wrapper-new p-0">
                            <div className="content">
                                <div className="modal-header border-0 custom-modal-header">
                                    <div className="page-title">
                                        <h4 id="addBrandModalLabel">Add New Brand</h4>
                                    </div>
                                    <button
                                        type="button"
                                        className="close"
                                        data-bs-dismiss="modal"
                                        aria-label="Close"
                                    >
                                        <span aria-hidden="true">×</span>
                                    </button>
                                </div>
                                <div className="modal-body custom-modal-body">
                                    {/* Removed form tag wrapping entire modal, handle submit on button click */}
                                    <div className="mb-3">
                                        <label className="form-label">Brand Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={brandName}
                                            onChange={(e) => setBrandName(e.target.value)}
                                            placeholder="Enter brand name"
                                            required
                                        />
                                    </div>
                                    <div className="modal-footer-btn">
                                        <button
                                            type="button" // Important: change Link to button
                                            className="btn btn-cancel me-2"
                                            data-bs-dismiss="modal"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button" // Important: change Link to button
                                            onClick={handleSubmit} // Call submit handler
                                            className="btn btn-submit"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Add Brand */}
        </>
    );
};

export default AddBrand;
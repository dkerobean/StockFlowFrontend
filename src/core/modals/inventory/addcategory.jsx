import React, { useState } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';

// Helper to get Auth Token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
};

// Accept onSuccess prop
const AddCategory = ({ onSuccess }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [categoryName, setCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            toast.error("Category name cannot be empty.");
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
            await axios.post(`${API_URL}/categories`, { name: categoryName }, { headers: authHeader });
            toast.success(`Category "${categoryName}" added successfully!`);
            setCategoryName(''); // Clear input
            if (onSuccess) {
                onSuccess(); // Call the callback
            }
            // Close the modal manually
            const modalElement = document.getElementById('add-units-category');
            if (modalElement) {
                 // eslint-disable-next-line no-undef
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                 if (modalInstance) {
                    modalInstance.hide();
                } else {
                     const fallbackModal = new bootstrap.Modal(modalElement);
                     fallbackModal.hide();
                }
            }
        } catch (error) {
            console.error("Error adding category:", error.response ? error.response.data : error);
            toast.error(`Failed to add category: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

     // Handle modal close event to clear the input
    React.useEffect(() => {
        const modalElement = document.getElementById('add-units-category');
        if (modalElement) {
            const handleHide = () => {
                setCategoryName(''); // Clear input when modal hides
                setIsSubmitting(false);
            };
            modalElement.addEventListener('hidden.bs.modal', handleHide);
            // Cleanup listener
            return () => {
                modalElement.removeEventListener('hidden.bs.modal', handleHide);
            };
        }
    }, []);


    return (
        <>
            {/* Add Category Modal Structure (Keep original ID and classes) */}
            <div className="modal fade" id="add-units-category" tabIndex={-1} aria-labelledby="addCategoryModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered custom-modal-two">
                    <div className="modal-content">
                        <div className="page-wrapper-new p-0">
                            <div className="content">
                                <div className="modal-header border-0 custom-modal-header">
                                    <div className="page-title">
                                        <h4 id="addCategoryModalLabel">Add New Category</h4>
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
                                    <div className="mb-3">
                                        <label className="form-label">Category Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            placeholder="Enter category name"
                                            required
                                        />
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
                                            type="button"
                                            onClick={handleSubmit}
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
            {/* /Add Category */}
        </>
    );
};

export default AddCategory;
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
            toast.error("Category name is required");
            return;
        }
        setIsSubmitting(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            toast.error("Authentication required");
            setIsSubmitting(false);
            return;
        }

        try {
            await axios.post(`${API_URL}/product-categories`, { name: categoryName }, { headers: authHeader });

            // Close the modal first
            const modalElement = document.getElementById('add-units-category');
            if (modalElement && window.bootstrap) { // Check for window.bootstrap
                const modalInstance = window.bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    // Fallback if getInstance returns null
                    const fallbackModal = new window.bootstrap.Modal(modalElement);
                    fallbackModal.hide();
                }
            }

            if (onSuccess) {
                onSuccess(); // Call the callback AFTER modal hide is initiated
            }

        } catch (error) {
            console.error("Error adding product category:", error.response ? error.response.data : error); // Updated log
            toast.error(`Failed to add product category: ${error.response?.data?.message || error.message}`); // Updated toast
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
                setIsSubmitting(false); // Also reset submitting state
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
            {/* Add Category Modal Structure */}
            <div className="modal fade" id="add-units-category" tabIndex={-1} aria-labelledby="addCategoryModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-sm">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="addCategoryModalLabel">Add New Category</h5>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="modal-body">
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
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                data-bs-dismiss="modal"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="btn btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Add Category */}
        </>
    );
};

export default AddCategory;
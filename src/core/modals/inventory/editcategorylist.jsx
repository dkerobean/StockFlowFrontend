import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EditCategoryList = ({ categoryId, currentName, currentStatus, onUpdate }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [name, setName] = useState(currentName);
    const [status, setStatus] = useState(currentStatus);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setName(currentName);
        setStatus(currentStatus);
    }, [currentName, currentStatus]);

    const generateSlug = (name) => {
        return name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-');
    };

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
            await axios.put(`${API_URL}/categories/${categoryId}`,
                {
                    name,
                    slug,
                    status
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            toast.success('Category updated successfully!');

            if (onUpdate) {
                onUpdate();
            }

            // Close modal
            const modalElement = document.getElementById(`edit-category-${categoryId}`);
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        } catch (error) {
            console.error("Error updating category:", error);
            toast.error(`Failed to update category: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = () => {
        setStatus(prev => prev === 'active' ? 'inactive' : 'active');
    };

    return (
        <div className="modal fade" id={`edit-category-${categoryId}`}>
            <div className="modal-dialog modal-dialog-centered custom-modal-two">
                <div className="modal-content">
                    <div className="page-wrapper-new p-0">
                        <div className="content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4>Edit Category</h4>
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
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Category Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Category Slug</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={generateSlug(name)}
                                            readOnly
                                        />
                                    </div>
                                    <div className="mb-0">
                                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                            <span className="status-label">Status</span>
                                            <input
                                                type="checkbox"
                                                id={`edit-status-${categoryId}`}
                                                className="check"
                                                checked={status === 'active'}
                                                onChange={toggleStatus}
                                            />
                                            <label htmlFor={`edit-status-${categoryId}`} className="checktoggle" />
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
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Updating...' : 'Save Changes'}
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
import React, { useState, useEffect } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddCategoryList = ({ onSuccess }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [categoryName, setCategoryName] = useState('');
    const [status, setStatus] = useState('active'); // Changed to string to match backend
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalId = "add-category";

    const generateSlug = (name) => {
        return name.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-');
    };

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
                    name: categoryName,
                    slug: slug,
                    status: status
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            toast.success(`Category "${categoryName}" added successfully!`);
            setCategoryName('');
            setStatus('active');

            if (onSuccess) {
                onSuccess();
            }

            // Close modal
            const modalElement = document.getElementById(modalId);
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
        } catch (error) {
            console.error("Error adding category:", error);
            toast.error(`Failed to add category: ${error.response?.data?.message || error.message}`);
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
                setCategoryName('');
                setStatus('active');
                setIsSubmitting(false);
            };
            modalElement.addEventListener('hidden.bs.modal', handleHide);
            return () => {
                modalElement.removeEventListener('hidden.bs.modal', handleHide);
            };
        }
    }, [modalId]);

    return (
        <div className="modal fade" id={modalId}>
            <div className="modal-dialog modal-dialog-centered custom-modal-two">
                <div className="modal-content">
                    <div className="page-wrapper-new p-0">
                        <div className="content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4>Create Category</h4>
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
                                            value={categoryName}
                                            onChange={(e) => setCategoryName(e.target.value)}
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Category Slug (auto-generated)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={generateSlug(categoryName)}
                                            readOnly
                                        />
                                    </div>
                                    <div className="mb-0">
                                        <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                            <span className="status-label">Status</span>
                                            <input
                                                type="checkbox"
                                                id="add-category-status"
                                                className="check"
                                                checked={status === 'active'}
                                                onChange={toggleStatus}
                                            />
                                            <label htmlFor="add-category-status" className="checktoggle" />
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
                                            {isSubmitting ? 'Creating...' : 'Create Category'}
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
import React, { useState } from 'react';
import { X } from 'feather-icons-react/build/IconComponents';
import { toast } from 'react-toastify';

const AddSupplierQuick = ({ isVisible, onClose, onSupplierAdded }) => {
    const [formData, setFormData] = useState({
        supplierName: '',
        code: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
    });
    
    const [loading, setLoading] = useState(false);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Generate supplier code based on name
    const generateCode = (name) => {
        if (!name) return '';
        return name.toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 6) + 
            Math.random().toString(36).substring(2, 5).toUpperCase();
    };

    // Auto-generate code when name changes
    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => ({
            ...prev,
            supplierName: name,
            code: prev.code || generateCode(name)
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.supplierName.trim()) {
            toast.error('Supplier name is required');
            return;
        }

        if (!formData.code.trim()) {
            toast.error('Supplier code is required');
            return;
        }

        try {
            setLoading(true);
            
            // Create the supplier data
            const supplierData = {
                supplierName: formData.supplierName.trim(),
                code: formData.code.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                notes: formData.notes.trim(),
                isActive: true
            };

            // Make API call to create supplier
            const response = await fetch('/api/suppliers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(supplierData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create supplier');
            }

            const newSupplier = await response.json();
            
            toast.success('Supplier created successfully!');
            
            // Reset form
            setFormData({
                supplierName: '',
                code: '',
                email: '',
                phone: '',
                address: '',
                notes: ''
            });

            // Notify parent component
            if (onSupplierAdded) {
                onSupplierAdded(newSupplier);
            }

            // Close modal
            onClose();

        } catch (error) {
            console.error('Error creating supplier:', error);
            toast.error(error.message || 'Failed to create supplier');
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060}}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-0">
                        <div className="page-title">
                            <h4>Add New Supplier</h4>
                            <p className="text-muted mb-0">Create a new supplier quickly</p>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-lg-6 col-md-6 col-sm-12">
                                    <div className="input-blocks">
                                        <label>Supplier Name *</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="supplierName"
                                            value={formData.supplierName}
                                            onChange={handleNameChange}
                                            placeholder="Enter supplier name"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-6 col-sm-12">
                                    <div className="input-blocks">
                                        <label>Supplier Code *</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="code"
                                            value={formData.code}
                                            onChange={handleInputChange}
                                            placeholder="Enter supplier code"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col-lg-6 col-md-6 col-sm-12">
                                    <div className="input-blocks">
                                        <label>Email</label>
                                        <input 
                                            type="email" 
                                            className="form-control"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-6 col-sm-12">
                                    <div className="input-blocks">
                                        <label>Phone</label>
                                        <input 
                                            type="tel" 
                                            className="form-control"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col-lg-12">
                                    <div className="input-blocks">
                                        <label>Address</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Enter supplier address"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col-lg-12">
                                    <div className="input-blocks">
                                        <label>Notes</label>
                                        <textarea
                                            className="form-control"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows="3"
                                            placeholder="Enter any additional notes"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="modal-footer-btn">
                                <button
                                    type="button"
                                    className="btn btn-cancel me-2"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Supplier'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSupplierQuick;
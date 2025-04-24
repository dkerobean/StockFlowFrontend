import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
// Removed: import ImageWithBasePath from "../../img/imagewithbasebath"; // Use standard img or ensure component works
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search as SearchIcon, X } from "react-feather"; // Import icons

const API_URL = process.env.REACT_APP_API_URL;
const BACKEND_BASE_URL = API_URL ? API_URL.replace('/api', '') : ''; // Base URL for images

// Helper to get Auth Header
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token not found.");
        // Optionally redirect to login or show error
        return null;
    }
    return { Authorization: `Bearer ${token}` };
};


const StockadjustmentModal = ({ onAdjustmentCreated, locations, products: initialProductsData }) => { // Receive initial product list if needed, maybe rename to avoid confusion
    const [formData, setFormData] = useState({
        location: null,
        referenceNumber: '',
        products: [],
        notes: '',
        adjustmentDate: new Date()
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false); // Added loading state for search
    const [searchError, setSearchError] = useState(null);  // Added error state for search
    const [isSubmitting, setIsSubmitting] = useState(false); // Renamed isLoading for clarity

    // Adjustment type options (same as before)
    const adjustmentTypeOptions = [
        { value: 'Addition', label: 'Addition' },
        { value: 'Subtraction', label: 'Subtraction' },
        { value: 'Damage', label: 'Damage' },
        { value: 'Theft', label: 'Theft' },
        { value: 'Correction', label: 'Correction' },
        { value: 'Initial Stock', label: 'Initial Stock' },
        { value: 'Return', label: 'Return' },
        { value: 'Transfer Out', label: 'Transfer Out' },
        { value: 'Transfer In', label: 'Transfer In' },
        { value: 'Cycle Count Adj', label: 'Cycle Count Adjustment' },
        { value: 'Obsolete', label: 'Obsolete' },
        { value: 'Other', label: 'Other' }
    ];

    // Debounced search function
    const searchProducts = useCallback(async (term) => {
        if (term.length < 3) {
            setSearchResults([]);
            setSearchError(null);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        setSearchError(null);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setSearchError("Authentication required.");
            setIsSearching(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/products?search=${term}&limit=10&isActive=true&fields=name,sku,imageUrl`, { // Limit results, ensure active, specify fields
                headers: authHeader
            });
            setSearchResults(response.data.data || []);
        } catch (err) {
            console.error("Error searching products:", err);
            setSearchError("Failed to search products.");
            setSearchResults([]); // Clear results on error
        } finally {
            setIsSearching(false);
        }
    }, []); // No dependencies needed if API_URL is constant

    // Use useEffect for debounced search
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            searchProducts(searchTerm);
        }, 300); // 300ms debounce

        return () => clearTimeout(debounceTimer); // Cleanup timer on unmount or change
    }, [searchTerm, searchProducts]);


    // Add product to adjustment
    const handleAddProduct = (product) => {
        if (!product || !product._id) {
            console.error("Invalid product data:", product);
            toast.error("Invalid product data.");
            return;
        }

        if (!formData.location) {
            toast.error("Please select a location first");
            return;
        }

        const existingProduct = formData.products.find(p => p.product === product._id);
        if (existingProduct) {
            toast.warn(`Product "${product.name}" is already added. You can adjust its quantity.`);
            // Clear search state
            setSearchTerm('');
            setSearchResults([]);
            setSearchError(null);
            return;
        }

        setFormData(prev => ({
            ...prev,
            products: [
                ...prev.products,
                {
                    product: product._id, // Store only the ID
                    name: product.name,
                    sku: product.sku,
                    imageUrl: product.imageUrl, // Store image URL if available
                    quantity: 1,
                    type: 'Addition', // Default type
                    // reason: 'Correction' // Maybe remove default reason or make it selectable
                }
            ]
        }));

        // Clear search state
        setSearchTerm('');
        setSearchResults([]);
        setSearchError(null);
    };

    // Update product quantity
    const handleQuantityChange = (index, value) => {
        const newQuantity = Math.max(1, parseInt(value) || 1);
        const newProducts = [...formData.products];
        newProducts[index].quantity = newQuantity;
        setFormData(prev => ({ ...prev, products: newProducts }));
    };

    // Update product adjustment type
    const handleTypeChange = (index, selectedOption) => { // Receive the full react-select option
        const newProducts = [...formData.products];
        newProducts[index].type = selectedOption.value; // Use the value from the option
        setFormData(prev => ({ ...prev, products: newProducts }));
    };

    // Remove product from adjustment
    const handleRemoveProduct = (index) => {
        const newProducts = formData.products.filter((_, i) => i !== index); // More concise way to remove
        setFormData(prev => ({ ...prev, products: newProducts }));
    };

    // Reset form
    const resetForm = () => {
         setFormData({
            location: null,
            referenceNumber: '',
            products: [],
            notes: '',
            adjustmentDate: new Date()
        });
        setSearchTerm('');
        setSearchResults([]);
        setSearchError(null);
        setIsSubmitting(false);
    }

    // Submit adjustment
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!formData.location) {
            toast.error("Please select a location.");
            setIsSubmitting(false);
            return;
        }
        if (formData.products.length === 0) {
             toast.error("Please add at least one product to adjust.");
             setIsSubmitting(false);
             return;
        }

        const authHeader = getAuthHeader();
        if (!authHeader) {
             toast.error("Authentication error. Please log in again.");
             setIsSubmitting(false);
             return;
        }

        const payload = {
            locationId: formData.location.value,
            referenceNumber: formData.referenceNumber || undefined, // Send undefined if empty
            notes: formData.notes,
            adjustmentDate: formData.adjustmentDate.toISOString(), // Send as ISO string
            adjustments: formData.products.map(item => ({
                productId: item.product,
                adjustmentType: item.type,
                quantityAdjusted: item.quantity,
                reason: item.reason || item.type // Use type as reason if specific reason isn't captured
            }))
        };

        try {
            await axios.post(`${API_URL}/stock-adjustments`, payload, { headers: authHeader });
            toast.success("Stock adjustment created successfully!");
            onAdjustmentCreated(); // Callback to refresh the parent list
            // Close modal - assuming Bootstrap 5 JS handles this via attributes
            const modalElement = document.getElementById('add-units');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
            resetForm(); // Reset form state
        } catch (err) {
            console.error("Error creating adjustment:", err.response?.data || err.message);
            toast.error(err.response?.data?.message || "Failed to create adjustment. Please check details.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // CSS for the dropdown (can be moved to a CSS file)
    const dropdownStyles = {
        position: 'absolute',
        top: '100%', // Position below the input
        left: 0,
        width: '100%',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderTop: 'none',
        zIndex: 1051, // Ensure it's above modal backdrop (usually 1050)
        maxHeight: '250px',
        overflowY: 'auto',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    };

    const itemStyles = {
        padding: '10px 15px',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
    };

    const itemHoverStyles = { // Simple hover effect
         backgroundColor: '#f8f9fa',
    };

     const productThumbStyles = {
         width: '40px',
         height: '40px',
         objectFit: 'cover',
         borderRadius: '4px',
         marginRight: '10px',
     };


    return (
        // Add Adjustment Modal
        <div className="modal fade" id="add-units" tabIndex={-1} aria-labelledby="addUnitsLabel" aria-hidden="true">
             {/* Increased modal size using modal-lg or modal-xl */}
            <div className="modal-dialog modal-dialog-centered modal-xl stock-adjust-modal">
                <div className="modal-content">
                    <div className="page-wrapper-new p-0">
                        <div className="content">
                            <div className="modal-header border-0 custom-modal-header pb-0">
                                <div className="page-title">
                                    <h4 id="addUnitsLabel">Add Stock Adjustment</h4>
                                </div>
                                <button
                                    type="button"
                                    className="close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                    onClick={resetForm} // Also reset form on manual close
                                >
                                    <span aria-hidden="true"><X size={20} /></span>
                                </button>
                            </div>
                            <div className="modal-body custom-modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        {/* Location Selection */}
                                        <div className="col-lg-4 col-md-6 col-sm-12">
                                            <div className="input-blocks">
                                                <label>Location <span className="text-danger">*</span></label>
                                                <Select
                                                    options={locations} // Assuming locations is passed correctly as { value: id, label: name }
                                                    value={formData.location}
                                                    onChange={(selected) => setFormData({...formData, location: selected})}
                                                    placeholder="Choose Location..."
                                                    className="select"
                                                    classNamePrefix="react-select" // For better styling control
                                                    isClearable
                                                    inputId="location-select" // For accessibility
                                                />
                                                 {!formData.location && isSubmitting && <small className="text-danger">Location is required.</small>}
                                            </div>
                                        </div>
                                        {/* Reference Number */}
                                        <div className="col-lg-4 col-md-6 col-sm-12">
                                            <div className="input-blocks">
                                                <label>Reference Number</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.referenceNumber}
                                                    onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                                                    placeholder="Optional (e.g., PO#, Reason Code)"
                                                />
                                            </div>
                                        </div>
                                         {/* Adjustment Date */}
                                        <div className="col-lg-4 col-md-6 col-sm-12">
                                            <div className="input-blocks">
                                                 <label>Adjustment Date <span className="text-danger">*</span></label>
                                                 <div className="input-groupicon calender-input">
                                                    <DatePicker
                                                        selected={formData.adjustmentDate}
                                                        onChange={(date) => setFormData({...formData, adjustmentDate: date || new Date()})} // Ensure date is not null
                                                        dateFormat="dd/MM/yyyy"
                                                        className="form-control datetimepicker" // Use Bootstrap's datepicker class if available
                                                        wrapperClassName="w-100" // Ensure datepicker takes full width
                                                        showIcon // Optionally show calendar icon
                                                    />
                                                    {/* Include calendar icon if not using showIcon or if default styling is off */}
                                                    {/* <span className="input-group-text"><i className="fa fa-calendar"></i></span> */}
                                                 </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Search */}
                                    <div className="input-blocks search-form mt-3">
                                        <label>Add Product</label>
                                        <div className="position-relative"> {/* This needs position: relative; */}
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search by name or SKU (min 3 chars)..."
                                                disabled={!formData.location} // Disable search until location is selected
                                            />
                                            <span className="search-icon"> {/* Style this icon */}
                                                {isSearching ? (
                                                     <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true"></span>
                                                ) : (
                                                    <SearchIcon size={18} />
                                                )}
                                            </span>

                                            {/* Search Results Dropdown */}
                                            {searchResults.length > 0 && (
                                                <div style={dropdownStyles} className="search-results-dropdown">
                                                    {searchResults.map(product => (
                                                        <div
                                                            key={product._id}
                                                            style={itemStyles}
                                                            className="search-result-item" // Add hover effect via CSS if preferred
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = itemHoverStyles.backgroundColor}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            onClick={() => handleAddProduct(product)}
                                                        >
                                                            <img
                                                                src={product.imageUrl ? `${BACKEND_BASE_URL}${product.imageUrl}` : '/assets/img/placeholder-product.png'}
                                                                alt={product.name}
                                                                style={productThumbStyles}
                                                                onError={(e) => {
                                                                    e.target.onerror = null; // Prevent infinite loop
                                                                    e.target.src = '/assets/img/placeholder-product.png';
                                                                }}
                                                            />
                                                            <div>
                                                                <div className="product-name fw-medium">{product.name}</div>
                                                                <div className="product-sku text-muted small">{product.sku || 'No SKU'}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Display search error */}
                                            {searchError && <div className="text-danger small mt-1">{searchError}</div>}
                                             {/* Indicate no results */}
                                             {!isSearching && searchTerm.length >= 3 && searchResults.length === 0 && !searchError && (
                                                <div style={{...dropdownStyles, padding: '10px', textAlign: 'center', color: '#6c757d'}}>
                                                    No products found matching "{searchTerm}".
                                                </div>
                                             )}
                                        </div>
                                        {!formData.location && <small className="text-muted">Select a location to enable product search.</small>}
                                    </div>

                                    {/* Products Table */}
                                    <div className="modal-body-table mt-3">
                                        <h6 className="mb-2">Products to Adjust</h6>
                                        <div className="table-responsive">
                                            <table className="table datanew">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{width: '35%'}}>Product</th>
                                                        <th>SKU</th>
                                                        <th style={{width: '100px'}}>Quantity</th>
                                                        <th style={{width: '180px'}}>Type</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {formData.products.map((item, index) => (
                                                        <tr key={item.product}> {/* Use product ID as key */}
                                                            <td>
                                                                <div className="productimgname">
                                                                    <Link to="#" className="product-img stock-img me-2">
                                                                         <img
                                                                            src={item.imageUrl ? `${BACKEND_BASE_URL}${item.imageUrl}` : '/assets/img/placeholder-product.png'}
                                                                            alt={item.name}
                                                                            style={productThumbStyles}
                                                                            onError={(e) => { e.target.onerror = null; e.target.src = '/assets/img/placeholder-product.png'; }}
                                                                        />
                                                                    </Link>
                                                                    <Link to="#">{item.name}</Link>
                                                                </div>
                                                            </td>
                                                            <td>{item.sku || <span className="text-muted">N/A</span>}</td>
                                                            <td>
                                                                {/* Simplified quantity input */}
                                                                <input
                                                                    type="number"
                                                                    className="form-control form-control-sm text-center" // Smaller input
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                                    min="1"
                                                                    style={{ width: '70px' }} // Fixed width for quantity
                                                                />
                                                            </td>
                                                            <td>
                                                                {/* Use react-select for type selection */}
                                                                 <Select
                                                                    options={adjustmentTypeOptions}
                                                                    value={adjustmentTypeOptions.find(opt => opt.value === item.type)}
                                                                    onChange={(selected) => handleTypeChange(index, selected)}
                                                                    className="select type-select" // Add class for specific styling if needed
                                                                    classNamePrefix="react-select-sm" // Prefix for smaller select
                                                                    menuPortalTarget={document.body} // Prevent dropdown cutoff in modal
                                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }} // Ensure dropdown is on top
                                                                />
                                                            </td>
                                                            <td className="text-end">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-light text-danger" // Lighter button, red icon/text
                                                                    onClick={() => handleRemoveProduct(index)}
                                                                    title="Remove Product" // Tooltip
                                                                >
                                                                     <Trash2 size={16} /> {/* Use Trash icon */}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Row for when no products are added */}
                                                    {formData.products.length === 0 && (
                                                        <tr>
                                                            <td colSpan="5" className="text-center text-muted py-3">
                                                                Search and add products to adjust stock levels.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        {formData.products.length === 0 && isSubmitting && <small className="text-danger">At least one product is required.</small>}
                                    </div>

                                    {/* Notes Section */}
                                    <div className="row mt-3">
                                        <div className="col-lg-12">
                                            <div className="input-blocks summer-description-box">
                                                <label>Notes / Reason <span className="text-muted">(Optional)</span></label>
                                                <textarea
                                                    className="form-control"
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                                    rows="3"
                                                    placeholder="Add any relevant notes about this adjustment..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="modal-footer-btn mt-4">
                                        <button
                                            type="button"
                                            className="btn btn-cancel me-2"
                                            data-bs-dismiss="modal"
                                            onClick={resetForm} // Reset form on cancel
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-submit"
                                            disabled={isSubmitting || !formData.location || formData.products.length === 0}
                                        >
                                            {isSubmitting ? (
                                                 <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Processing...
                                                 </>
                                            ) : 'Create Adjustment'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit/View Modals remain unchanged for now */}
            <div className="modal fade" id="edit-units"> {/* Placeholder */} </div>
            <div className="modal fade" id="view-notes"> {/* Placeholder */} </div>
        </div>
    );
};

export default StockadjustmentModal;
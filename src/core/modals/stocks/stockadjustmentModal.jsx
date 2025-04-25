import React, { useState, useEffect } from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from "react-router-dom"; // Keep Link if used inside
import { Trash2, PlusCircle, Calendar } from 'react-feather'; // Import icons

// Helper function for formatting product options
const formatOptionLabel = ({ label, sku, imageUrl }, backendBaseUrl) => {
    const imageSource = imageUrl
        ? `${backendBaseUrl}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`
        : '/assets/img/placeholder-product.png';

    return (
        <div className="d-flex align-items-center">
            <img
                src={imageSource}
                alt={label || 'Product'}
                style={{ width: '30px', height: '30px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/img/placeholder-product.png';
                }}
            />
            <div>
                <div>{label || 'No Name'}</div>
                <div className="text-muted small">{sku || 'No SKU'}</div>
            </div>
        </div>
    );
};

// Helper function to get image URL safely
const getImageUrl = (imageUrl, backendBaseUrl) => {
    if (!imageUrl) return '/assets/img/placeholder-product.png';
    const base = backendBaseUrl.endsWith('/') ? backendBaseUrl.slice(0, -1) : backendBaseUrl;
    const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${base}${path}`;
};

const StockadjustmentModal = ({
    onAdjustmentCreated,
    locations,
    products,
    adjustmentTypes, // Receive types as prop
    backendBaseUrl, // Receive base URL as prop
    apiUrl, // Receive API URL as prop
    getAuthHeader // Receive auth header func as prop
}) => {
    // Form State
    const [location, setLocation] = useState(null);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [adjustmentDate, setAdjustmentDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const [adjustedProducts, setAdjustedProducts] = useState([]); // List of products to adjust

    // Product Input State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedAdjTypeOption, setSelectedAdjTypeOption] = useState(adjustmentTypes.find(t => t.value === 'Addition') || adjustmentTypes[0]); // Default to 'Addition' or first option

    // General State
    const [isLoading, setIsLoading] = useState(false);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Add new state for notes modal
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedNotes, setSelectedNotes] = useState('');

    // Function to generate reference number
    const generateReferenceNumber = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `REF-${year}${month}${day}-${random}`;
    };

    // Function to fetch available products for a location
    const fetchAvailableProducts = async (locationId) => {
        if (!locationId) return;

        setIsLoadingProducts(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setIsLoadingProducts(false);
            return;
        }

        try {
            // Always start with all products
            setAvailableProducts(products);

            // Only check inventory if not doing initial stock
            if (selectedAdjTypeOption?.value !== 'Initial Stock') {
                const response = await axios.get(`${apiUrl}/inventory?locationId=${locationId}`, {
                    headers: authHeader
                });

                if (response.data && Array.isArray(response.data)) {
                    const inventoryProducts = response.data.map(inv => inv.product?._id).filter(Boolean);

                    if (inventoryProducts.length > 0) {
                        // Filter products that have inventory
                        const filteredProducts = products.filter(product =>
                            inventoryProducts.includes(product.value)
                        );
                        setAvailableProducts(filteredProducts);
                    } else {
                        // If no inventory found, show a message but still allow Initial Stock
                        toast.info("This location has no existing inventory. You can:");
                        toast.info("1. Select 'Initial Stock' type to add new products");
                        toast.info("2. Or continue with current type to adjust existing products");

                        // Automatically switch to Initial Stock type if no inventory exists
                        const initialStockType = adjustmentTypes.find(t => t.value === 'Initial Stock');
                        if (initialStockType) {
                            setSelectedAdjTypeOption(initialStockType);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching available products:", err);
            // Don't show error, just set all products as available
            setAvailableProducts(products);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    // Update available products when location or adjustment type changes
    useEffect(() => {
        if (location) {
            // If Initial Stock is selected, show all products immediately
            if (selectedAdjTypeOption?.value === 'Initial Stock') {
                setAvailableProducts(products);
                setIsLoadingProducts(false);
            } else {
                fetchAvailableProducts(location.value);
            }
            setSelectedProduct(null);
        } else {
            setAvailableProducts([]);
        }
    }, [location, selectedAdjTypeOption]); // Keep both dependencies

    // Modify resetForm to include reference number generation
    const resetForm = () => {
        setLocation(null);
        setReferenceNumber(generateReferenceNumber());
        setAdjustmentDate(new Date());
        setNotes('');
        setAdjustedProducts([]);
        setSelectedProduct(null);
        setQuantity(1);
        setSelectedAdjTypeOption(adjustmentTypes.find(t => t.value === 'Addition') || adjustmentTypes[0]);
        setIsLoading(false);
    };

    // Generate reference number on initial load
    useEffect(() => {
        setReferenceNumber(generateReferenceNumber());
    }, []);

    // Add product to adjustment list
    const handleAddProduct = () => {
        if (!selectedProduct) {
            toast.warn("Please select a product to add.");
            return;
        }
        if (!location) {
            toast.warn("Please select a location first.");
            return;
        }
        if (quantity <= 0) {
            toast.warn("Quantity must be greater than zero.");
            return;
        }

        const existingProductIndex = adjustedProducts.findIndex(p => p.productId === selectedProduct.value);
        if (existingProductIndex > -1) {
            toast.error(`${selectedProduct.label} is already in the list. Remove it first to change quantity or type.`);
            return;
        }

        const newProductEntry = {
            productId: selectedProduct.value,
            name: selectedProduct.label,
            sku: selectedProduct.sku,
            imageUrl: selectedProduct.imageUrl,
            quantity: quantity,
            type: selectedAdjTypeOption.value
        };

        setAdjustedProducts(prev => [...prev, newProductEntry]);
        setSelectedProduct(null);
        setQuantity(1);
        setSelectedAdjTypeOption(adjustmentTypes.find(t => t.value === 'Addition') || adjustmentTypes[0]);
    };

    // Update quantity for a product
    const handleQuantityChange = (index, value) => {
        const newQuantity = Math.max(1, parseInt(value) || 1);
        setAdjustedProducts(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    // Update adjustment type for a product
    const handleTypeChange = (index, selectedOption) => {
        setAdjustedProducts(prev =>
            prev.map((item, i) =>
                i === index ? { ...item, type: selectedOption.value } : item
            )
        );
    };

    // Remove product from list
    const handleRemoveProduct = (index) => {
        setAdjustedProducts(prev => prev.filter((_, i) => i !== index));
    };

    // Submit adjustments
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) {
            toast.error("Please select a location.");
            return;
        }
        if (adjustedProducts.length === 0) {
            toast.error("Please add at least one product to adjust.");
            return;
        }

        setIsLoading(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                locationId: location.value,
                adjustmentDate: adjustmentDate.toISOString().split('T')[0],
                referenceNumber: referenceNumber?.trim() || undefined,
                notes: notes?.trim(),
                adjustments: adjustedProducts.map(item => ({
                    productId: item.productId,
                    adjustmentType: item.type,
                    quantityAdjusted: item.quantity,
                    reason: notes?.trim() || item.type
                }))
            };

            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            console.log('Creating stock adjustment with payload:', payload);

            const response = await axios.post(`${apiUrl}/stock-adjustments`, payload, {
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Adjustment creation response:', response.data);
            toast.success("Stock adjustment(s) created successfully");

            if (onAdjustmentCreated) {
                onAdjustmentCreated();
            }

            const closeButton = document.getElementById('closeStockAdjustmentModal');
            closeButton?.click();
            resetForm();

        } catch (err) {
            console.error("Error creating adjustment:", err);

            // Handle specific error messages
            const errorMessage = err.response?.data?.message || err.message;
            if (errorMessage.includes("Inventory record not found")) {
                toast.error("Cannot adjust stock: Some products are not available in this location. Please check product availability.");
            } else if (errorMessage.includes("negative stock")) {
                toast.error("Cannot adjust stock: The adjustment would result in negative stock levels.");
            } else if (errorMessage.includes("Permission")) {
                toast.error("You don't have permission to adjust stock at this location.");
            } else {
                toast.error(`Failed to create adjustment: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle modal close
    useEffect(() => {
        const modalElement = document.getElementById('add-units');
        const handleModalClose = () => {
            if (!isLoading) {
                resetForm();
            }
        };

        modalElement?.addEventListener('hidden.bs.modal', handleModalClose);
        return () => {
            modalElement?.removeEventListener('hidden.bs.modal', handleModalClose);
        };
    }, [isLoading]);

    // Function to show notes in modal
    const handleShowNotes = (notes) => {
        setSelectedNotes(notes);
        setShowNotesModal(true);
    };

    return (
        <>
            <div className="modal fade" id="add-units" tabIndex={-1} aria-labelledby="addUnitsLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="addUnitsLabel">Add New Stock Adjustment</h5>
                                <button
                                    type="button"
                                    id="closeStockAdjustmentModal"
                                    className="btn-close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label">Location <span className="text-danger">*</span></label>
                                        <Select
                                            options={locations}
                                            value={location}
                                            onChange={setLocation}
                                            placeholder="Select Location..."
                                            className="select"
                                            classNamePrefix="react-select"
                                            isClearable
                                            required
                                        />
                                        {!location && <small className="text-danger d-block pt-1">Location is required.</small>}
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Reference Number</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={referenceNumber}
                                                onChange={(e) => setReferenceNumber(e.target.value)}
                                                placeholder="Auto-generated reference number"
                                            />
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={() => setReferenceNumber(generateReferenceNumber())}
                                                title="Generate new reference number"
                                            >
                                                <i className="fas fa-sync-alt"></i>
                                            </button>
                                        </div>
                                        <small className="text-muted">Auto-generated, but can be modified</small>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Adjustment Date <span className="text-danger">*</span></label>
                                        <div className="input-groupicon calender-input">
                                            <DatePicker
                                                selected={adjustmentDate}
                                                onChange={(date) => setAdjustmentDate(date || new Date())}
                                                dateFormat="dd/MM/yyyy"
                                                className="form-control"
                                                required
                                            />
                                            <span className="addon-icon">
                                                <Calendar size={18} />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card mb-3">
                                    <div className="card-header bg-light py-2">
                                        <h6 className="mb-0">Add Product to Adjust</h6>
                                    </div>
                                    <div className="card-body p-3">
                                        <div className="row gx-2 align-items-end">
                                            <div className="col-lg-5 mb-2 mb-lg-0">
                                                <label className="form-label">Product <span className="text-danger">*</span></label>
                                                <Select
                                                    options={location ? availableProducts : []}
                                                    value={selectedProduct}
                                                    onChange={setSelectedProduct}
                                                    placeholder={
                                                        !location
                                                            ? "Select a location first"
                                                            : isLoadingProducts
                                                                ? "Loading products..."
                                                                : "Select Product"
                                                    }
                                                    isDisabled={!location || isLoadingProducts}
                                                    className="select"
                                                    classNamePrefix="react-select"
                                                    formatOptionLabel={(opt) => formatOptionLabel(opt, backendBaseUrl)}
                                                    isClearable
                                                    isLoading={isLoadingProducts}
                                                    noOptionsMessage={() =>
                                                        !location
                                                            ? "Please select a location first"
                                                            : availableProducts.length === 0
                                                                ? selectedAdjTypeOption?.value === 'Initial Stock'
                                                                    ? "No products available in the system"
                                                                    : "No products with inventory. Try 'Initial Stock' type"
                                                                : "No products match your search"
                                                    }
                                                />
                                            </div>
                                            <div className="col-lg-2 col-md-4 mb-2 mb-lg-0">
                                                <label className="form-label">Quantity <span className="text-danger">*</span></label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                    min="1"
                                                    required
                                                />
                                            </div>
                                            <div className="col-lg-3 col-md-4 mb-2 mb-lg-0">
                                                <label className="form-label">Type <span className="text-danger">*</span></label>
                                                <Select
                                                    options={adjustmentTypes}
                                                    value={selectedAdjTypeOption}
                                                    onChange={setSelectedAdjTypeOption}
                                                    className="select"
                                                    classNamePrefix="react-select"
                                                    required
                                                />
                                            </div>
                                            <div className="col-lg-2 col-md-4">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary w-100"
                                                    onClick={handleAddProduct}
                                                    disabled={!selectedProduct || !location}
                                                >
                                                    <PlusCircle size={16} className="me-1" /> Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-bordered table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Product</th>
                                                <th>SKU</th>
                                                <th style={{width: '100px'}}>Quantity</th>
                                                <th>Type</th>
                                                <th style={{width: '80px'}}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adjustedProducts.map((item, index) => (
                                                <tr key={`${item.productId}-${index}`}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={getImageUrl(item.imageUrl, backendBaseUrl)}
                                                                alt={item.name}
                                                                style={{width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px'}}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = '/assets/img/placeholder-product.png';
                                                                }}
                                                            />
                                                            <span>{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>{item.sku || 'N/A'}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm"
                                                            value={item.quantity}
                                                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                            min="1"
                                                        />
                                                    </td>
                                                    <td>
                                                        <Select
                                                            options={adjustmentTypes}
                                                            value={adjustmentTypes.find(opt => opt.value === item.type)}
                                                            onChange={(selected) => handleTypeChange(index, selected)}
                                                            className="select"
                                                            classNamePrefix="react-select"
                                                        />
                                                    </td>
                                                    <td className="text-center">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleRemoveProduct(index)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {adjustedProducts.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="text-center text-muted py-3">
                                                        No products added yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-3">
                                    <label className="form-label">Notes</label>
                                    <div className="input-group">
                                        <textarea
                                            className="form-control"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows="3"
                                            placeholder="Enter any additional notes or reasons for the adjustment"
                                        />
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() => handleShowNotes(notes)}
                                            disabled={!notes}
                                        >
                                            <i className="fas fa-expand-alt"></i> View Full
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    data-bs-dismiss="modal"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading || !location || adjustedProducts.length === 0}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        `Create ${adjustedProducts.length} Adjustment(s)`
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Notes Modal */}
            <div className="modal fade" id="notesModal" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Adjustment Notes</h5>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                onClick={() => setShowNotesModal(false)}
                            ></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{selectedNotes}</p>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowNotesModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StockadjustmentModal;
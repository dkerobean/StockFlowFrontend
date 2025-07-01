import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PlusCircle, Trash2 } from 'feather-icons-react/build/IconComponents';
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Select from 'react-select'
import purchaseService from '../../../services/purchaseService';
import { toast } from 'react-toastify';

const EditPurchases = ({ purchase, isVisible, onClose, onPurchaseUpdated }) => {

    const statusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'ordered', label: 'Ordered' },
        { value: 'received', label: 'Received' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'partial', label: 'Partial' },
    ];

    // State for form data
    const [formData, setFormData] = useState({
        supplier: '',
        purchaseDate: new Date(),
        dueDate: null,
        referenceNumber: '',
        status: 'pending',
        paymentStatus: 'unpaid',
        orderTax: 0,
        discountAmount: 0,
        shippingCost: 0,
        notes: '',
        warehouse: ''
    });

    // State for dropdown options
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    
    // State for purchase items
    const [purchaseItems, setPurchaseItems] = useState([{
        product: '',
        quantity: 1,
        unitCost: 0,
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        lineTotal: 0
    }]);

    // State for loading and errors
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Load dropdown data on component mount
    useEffect(() => {
        if (isVisible) {
            loadDropdownData();
        }
    }, [isVisible]);

    // Populate form when purchase data is available
    useEffect(() => {
        if (purchase && isVisible) {
            populateForm(purchase);
        }
    }, [purchase, isVisible]);

    const loadDropdownData = async () => {
        try {
            setLoadingData(true);
            
            const [suppliersRes, productsRes, locationsRes] = await Promise.all([
                purchaseService.getSuppliers(),
                purchaseService.getProducts(),
                purchaseService.getLocations()
            ]);

            // Format suppliers for dropdown
            const supplierOptions = Array.isArray(suppliersRes) 
                ? suppliersRes.map(supplier => ({
                    value: supplier._id,
                    label: supplier.supplierName,
                    code: supplier.code
                }))
                : (suppliersRes.suppliers || []).map(supplier => ({
                    value: supplier._id,
                    label: supplier.supplierName,
                    code: supplier.code
                }));

            // Format products for dropdown
            const productOptions = Array.isArray(productsRes)
                ? productsRes.map(product => ({
                    value: product._id,
                    label: product.name,
                    sku: product.sku,
                    sellingPrice: product.sellingPrice || product.price
                }))
                : (productsRes.products || []).map(product => ({
                    value: product._id,
                    label: product.name,
                    sku: product.sku,
                    sellingPrice: product.sellingPrice || product.price
                }));

            // Format locations for dropdown
            const locationOptions = Array.isArray(locationsRes)
                ? locationsRes.map(location => ({
                    value: location._id,
                    label: location.name
                }))
                : (locationsRes.locations || []).map(location => ({
                    value: location._id,
                    label: location.name
                }));

            setSuppliers(supplierOptions);
            setProducts(productOptions);
            setLocations(locationOptions);
        } catch (error) {
            console.error('Error loading dropdown data:', error);
            toast.error(`Failed to load form data: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoadingData(false);
        }
    };

    const populateForm = (purchaseData) => {
        setFormData({
            supplier: purchaseData.supplier?._id || purchaseData.supplier || '',
            purchaseDate: purchaseData.purchaseDate ? new Date(purchaseData.purchaseDate) : new Date(),
            dueDate: purchaseData.dueDate ? new Date(purchaseData.dueDate) : null,
            referenceNumber: purchaseData.referenceNumber || '',
            status: purchaseData.status || 'pending',
            paymentStatus: purchaseData.paymentStatus || 'unpaid',
            orderTax: purchaseData.orderTax || 0,
            discountAmount: purchaseData.discountAmount || 0,
            shippingCost: purchaseData.shippingCost || 0,
            notes: purchaseData.notes || '',
            warehouse: purchaseData.warehouse?._id || purchaseData.warehouse || ''
        });

        // Populate items
        if (purchaseData.items && purchaseData.items.length > 0) {
            const items = purchaseData.items.map(item => ({
                product: item.product?._id || item.product || '',
                quantity: item.quantity || 1,
                unitCost: item.unitCost || 0,
                discount: item.discount || 0,
                taxRate: item.taxRate || 0,
                taxAmount: item.taxAmount || 0,
                lineTotal: item.lineTotal || 0
            }));
            setPurchaseItems(items);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Handle numeric fields with validation
        if (['orderTax', 'discountAmount', 'shippingCost'].includes(name)) {
            const numValue = parseFloat(value) || 0;
            setFormData(prev => ({
                ...prev,
                [name]: numValue >= 0 ? numValue : 0
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle select changes
    const handleSelectChange = (selectedOption, actionMeta) => {
        const { name } = actionMeta;
        setFormData(prev => ({
            ...prev,
            [name]: selectedOption?.value || ''
        }));
    };

    // Handle date changes
    const handleDateChange = (date, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: date
        }));
    };

    // Handle purchase item changes
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...purchaseItems];
        
        // Ensure numeric values are properly converted and validated
        if (['quantity', 'unitCost', 'discount', 'taxRate'].includes(field)) {
            const numValue = parseFloat(value) || 0;
            // Additional validation
            if (field === 'quantity' && numValue < 1) {
                updatedItems[index][field] = 1;
            } else if (field === 'unitCost' && numValue < 0) {
                updatedItems[index][field] = 0;
            } else if (field === 'discount' && numValue < 0) {
                updatedItems[index][field] = 0;
            } else if (field === 'taxRate' && (numValue < 0 || numValue > 100)) {
                updatedItems[index][field] = Math.max(0, Math.min(100, numValue));
            } else {
                updatedItems[index][field] = numValue;
            }
        } else {
            updatedItems[index][field] = value;
        }
        
        // Calculate line total when relevant fields change
        if (['quantity', 'unitCost', 'discount', 'taxRate'].includes(field)) {
            const item = updatedItems[index];
            
            // Ensure all values are numbers
            const quantity = Number(item.quantity) || 0;
            const unitCost = Number(item.unitCost) || 0;
            const discount = Number(item.discount) || 0;
            const taxRate = Number(item.taxRate) || 0;
            
            // Calculate base amount
            const baseAmount = (quantity * unitCost) - discount;
            
            // Calculate tax amount
            const taxAmount = (baseAmount * taxRate) / 100;
            item.taxAmount = Math.round(taxAmount * 100) / 100;
            
            // Calculate line total
            item.lineTotal = Math.round((baseAmount + item.taxAmount) * 100) / 100;
            
            // Ensure no NaN values
            if (isNaN(item.taxAmount)) item.taxAmount = 0;
            if (isNaN(item.lineTotal)) item.lineTotal = 0;
        }
        
        setPurchaseItems(updatedItems);
    };

    // Add new purchase item
    const addPurchaseItem = () => {
        setPurchaseItems([...purchaseItems, {
            product: '',
            quantity: 1,
            unitCost: 0,
            discount: 0,
            taxRate: 0,
            taxAmount: 0,
            lineTotal: 0
        }]);
    };

    // Remove purchase item
    const removePurchaseItem = (index) => {
        if (purchaseItems.length > 1) {
            setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
        }
    };

    // Calculate totals
    const calculateTotals = () => {
        // Calculate subtotal from line totals
        const subtotal = purchaseItems.reduce((sum, item) => {
            const lineTotal = Number(item.lineTotal) || 0;
            return sum + lineTotal;
        }, 0);
        
        // Get additional costs with validation
        const orderTax = Number(formData.orderTax) || 0;
        const shippingCost = Number(formData.shippingCost) || 0;
        const discountAmount = Number(formData.discountAmount) || 0;
        
        // Calculate grand total
        const grandTotal = subtotal + orderTax + shippingCost - discountAmount;
        
        // Ensure no NaN values
        return { 
            subtotal: isNaN(subtotal) ? 0 : Math.round(subtotal * 100) / 100,
            grandTotal: isNaN(grandTotal) ? 0 : Math.round(grandTotal * 100) / 100 
        };
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.supplier) {
            toast.error('Please select a supplier');
            return;
        }

        if (purchaseItems.length === 0 || !purchaseItems[0].product) {
            toast.error('Please add at least one product');
            return;
        }

        // Validate each purchase item
        for (let i = 0; i < purchaseItems.length; i++) {
            const item = purchaseItems[i];
            const quantity = Number(item.quantity) || 0;
            const unitCost = Number(item.unitCost) || 0;
            const lineTotal = Number(item.lineTotal) || 0;
            
            if (!item.product) {
                toast.error(`Please select a product for item ${i + 1}`);
                return;
            }
            if (quantity <= 0 || isNaN(quantity)) {
                toast.error(`Please enter a valid quantity for item ${i + 1}`);
                return;
            }
            if (unitCost <= 0 || isNaN(unitCost)) {
                toast.error(`Please enter a valid unit cost for item ${i + 1}`);
                return;
            }
            if (isNaN(lineTotal)) {
                toast.error(`Invalid calculation for item ${i + 1}. Please check all numeric values.`);
                return;
            }
        }

        try {
            setLoading(true);
            
            const { subtotal, grandTotal } = calculateTotals();
            
            const purchaseData = {
                ...formData,
                items: purchaseItems.filter(item => item.product), // Only include items with products
                subtotal,
                grandTotal
            };

            await purchaseService.updatePurchase(purchase._id, purchaseData);
            
            toast.success('Purchase updated successfully!');
            
            // Callback to parent component
            if (onPurchaseUpdated) {
                onPurchaseUpdated();
            }

            // Close modal
            onClose();

        } catch (error) {
            console.error('Error updating purchase:', error);
            toast.error(error.response?.data?.message || 'Failed to update purchase');
        } finally {
            setLoading(false);
        }
    };

    const { subtotal, grandTotal } = calculateTotals();

    if (!isVisible) return null;

    return (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog purchase modal-dialog-centered stock-adjust-modal">
                <div className="modal-content">
                    <div className="page-wrapper-new p-0">
                        <div className="content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4>Edit Purchase</h4>
                                    <p className="text-muted mb-0">Update purchase information</p>
                                </div>
                                <button
                                    type="button"
                                    className="close"
                                    onClick={onClose}
                                    aria-label="Close"
                                >
                                    <span aria-hidden="true">×</span>
                                </button>
                            </div>
                            <div className="modal-body custom-modal-body">
                                {loadingData ? (
                                    <div className="text-center p-4">
                                        <div className="spinner-border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-lg-3 col-md-6 col-sm-12">
                                            <div className="input-blocks add-product">
                                                <label>Supplier Name *</label>
                                                <div className="row">
                                                    <div className="col-lg-9 col-sm-9 col-9">
                                                        <Select 
                                                            options={suppliers} 
                                                            className="select" 
                                                            placeholder="Choose Supplier"
                                                            name="supplier"
                                                            value={suppliers.find(s => s.value === formData.supplier)}
                                                            onChange={handleSelectChange}
                                                            isSearchable
                                                        />
                                                    </div>
                                                    <div className="col-lg-3 col-sm-3 col-3 ps-0">
                                                        <div className="add-icon tab">
                                                            <button 
                                                                type="button"
                                                                onClick={() => alert('Add supplier functionality will be implemented here')}
                                                                className="btn btn-primary add-supplier-btn"
                                                                title="Add New Supplier"
                                                                style={{
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    borderRadius: '8px',
                                                                    border: 'none',
                                                                    backgroundColor: '#FF9F43',
                                                                    color: 'white',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.3s ease',
                                                                    boxShadow: '0 2px 4px rgba(255, 159, 67, 0.2)'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.target.style.backgroundColor = '#e8890b';
                                                                    e.target.style.transform = 'scale(1.05)';
                                                                    e.target.style.boxShadow = '0 4px 8px rgba(255, 159, 67, 0.3)';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.target.style.backgroundColor = '#FF9F43';
                                                                    e.target.style.transform = 'scale(1)';
                                                                    e.target.style.boxShadow = '0 2px 4px rgba(255, 159, 67, 0.2)';
                                                                }}
                                                            >
                                                                <PlusCircle size={20} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-md-6 col-sm-12">
                                            <div className="input-blocks">
                                                <label>Purchase Date *</label>
                                                <div className="input-groupicon calender-input">
                                                    <DatePicker
                                                        selected={formData.purchaseDate}
                                                        onChange={(date) => handleDateChange(date, 'purchaseDate')}
                                                        className="filterdatepicker form-control"
                                                        dateFormat="dd-MM-yyyy"
                                                        placeholder='Choose Date'
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-md-6 col-sm-12">
                                            <div className="input-blocks">
                                                <label>Due Date</label>
                                                <div className="input-groupicon calender-input">
                                                    <DatePicker
                                                        selected={formData.dueDate}
                                                        onChange={(date) => handleDateChange(date, 'dueDate')}
                                                        className="filterdatepicker form-control"
                                                        dateFormat="dd-MM-yyyy"
                                                        placeholder='Choose Date'
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-md-6 col-sm-12">
                                            <div className="input-blocks">
                                                <label>Reference No</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control"
                                                    name="referenceNumber"
                                                    value={formData.referenceNumber}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter reference number"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Purchase Items */}
                                    <div className="row">
                                        <div className="col-lg-12">
                                            <div className="input-blocks">
                                                <label>Purchase Items *</label>
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <span className="text-muted">Update products in your purchase order</span>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-primary btn-sm"
                                                        onClick={addPurchaseItem}
                                                    >
                                                        <PlusCircle size={16} className="me-1" />
                                                        Add Item
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-12">
                                            <div className="modal-body-table">
                                                <div className="table-responsive">
                                                    <table className="table datanew">
                                                        <thead>
                                                            <tr>
                                                                <th style={{minWidth: '200px'}}>Product *</th>
                                                                <th style={{minWidth: '80px'}}>Qty *</th>
                                                                <th style={{minWidth: '120px'}}>Unit Cost ($) *</th>
                                                                <th style={{minWidth: '100px'}}>Discount ($)</th>
                                                                <th style={{minWidth: '80px'}}>Tax (%)</th>
                                                                <th style={{minWidth: '120px'}}>Tax Amount ($)</th>
                                                                <th style={{minWidth: '120px'}}>Line Total ($)</th>
                                                                <th style={{minWidth: '80px'}}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {purchaseItems.map((item, index) => (
                                                                <tr key={index}>
                                                                    <td>
                                                                        <Select
                                                                            options={products}
                                                                            value={products.find(p => p.value === item.product)}
                                                                            onChange={(selectedOption) => 
                                                                                handleItemChange(index, 'product', selectedOption?.value || '')
                                                                            }
                                                                            placeholder="Select Product"
                                                                            isSearchable
                                                                            className="product-select"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control"
                                                                            value={item.quantity}
                                                                            onChange={(e) => 
                                                                                handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)
                                                                            }
                                                                            min="1"
                                                                            step="1"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control"
                                                                            value={item.unitCost}
                                                                            onChange={(e) => 
                                                                                handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)
                                                                            }
                                                                            min="0"
                                                                            step="0.01"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control"
                                                                            value={item.discount}
                                                                            onChange={(e) => 
                                                                                handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)
                                                                            }
                                                                            min="0"
                                                                            step="0.01"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control"
                                                                            value={item.taxRate}
                                                                            onChange={(e) => 
                                                                                handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)
                                                                            }
                                                                            min="0"
                                                                            max="100"
                                                                            step="0.01"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control"
                                                                            value={item.taxAmount.toFixed(2)}
                                                                            readOnly
                                                                            disabled
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control font-weight-bold"
                                                                            value={item.lineTotal.toFixed(2)}
                                                                            readOnly
                                                                            disabled
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-danger btn-sm"
                                                                            onClick={() => removePurchaseItem(index)}
                                                                            disabled={purchaseItems.length === 1}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Additional Fields */}
                                        <div className="row mt-3">
                                            <div className="col-lg-3 col-md-6 col-sm-12">
                                                <div className="input-blocks">
                                                    <label>Order Tax ($)</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control"
                                                        name="orderTax"
                                                        value={formData.orderTax}
                                                        onChange={handleInputChange}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 col-sm-12">
                                                <div className="input-blocks">
                                                    <label>Discount ($)</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control"
                                                        name="discountAmount"
                                                        value={formData.discountAmount}
                                                        onChange={handleInputChange}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 col-sm-12">
                                                <div className="input-blocks">
                                                    <label>Shipping ($)</label>
                                                    <input 
                                                        type="number" 
                                                        className="form-control"
                                                        name="shippingCost"
                                                        value={formData.shippingCost}
                                                        onChange={handleInputChange}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 col-sm-12">
                                                <div className="input-blocks">
                                                    <label>Status</label>
                                                    <Select 
                                                        options={statusOptions} 
                                                        className="select" 
                                                        placeholder="Choose Status"
                                                        name="status"
                                                        value={statusOptions.find(s => s.value === formData.status)}
                                                        onChange={handleSelectChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Warehouse Selection */}
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="input-blocks">
                                                    <label>Warehouse/Location</label>
                                                    <Select 
                                                        options={locations} 
                                                        className="select" 
                                                        placeholder="Choose Warehouse"
                                                        name="warehouse"
                                                        value={locations.find(l => l.value === formData.warehouse)}
                                                        onChange={handleSelectChange}
                                                        isSearchable
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Total Summary */}
                                        <div className="row mt-3">
                                            <div className="col-lg-12">
                                                <div className="card">
                                                    <div className="card-body">
                                                        <h5 className="card-title">Purchase Summary</h5>
                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</p>
                                                                <p><strong>Order Tax:</strong> ${formData.orderTax || 0}</p>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <p><strong>Shipping:</strong> ${formData.shippingCost || 0}</p>
                                                                <p><strong>Discount:</strong> -${formData.discountAmount || 0}</p>
                                                            </div>
                                                            <div className="col-12">
                                                                <hr />
                                                                <h4><strong>Grand Total: ${grandTotal.toFixed(2)}</strong></h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="col-lg-12">
                                        <div className="input-blocks summer-description-box">
                                            <label>Notes</label>
                                            <textarea
                                                className="form-control"
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                rows="3"
                                                placeholder="Enter any additional notes or comments"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="col-lg-12">
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
                                                        Updating...
                                                    </>
                                                ) : (
                                                    'Update Purchase'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditPurchases
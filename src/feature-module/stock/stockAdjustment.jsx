import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { OverlayTrigger, Tooltip, Button, Badge } from "react-bootstrap";
import DatePicker from "react-datepicker"; // Import DatePicker
import "react-datepicker/dist/react-datepicker.css"; // Import DatePicker CSS
import Breadcrumbs from "../../core/breadcrumbs";
import Table from "../../core/pagination/datatable"; // Assuming this is your custom Table component
import StockadjustmentModal from "../../core/modals/stocks/stockadjustmentModal";
import { Filter, Sliders, Edit, Trash2, Search, RotateCcw, X, Calendar } from "react-feather"; // Added Calendar icon
import { Modal } from 'bootstrap';

// Environment variables
const API_URL = process.env.REACT_APP_API_URL;
const BACKEND_BASE_URL = API_URL ? API_URL.replace('/api', '') : '';

// Helper function to get Auth Header
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token not found.");
        toast.error("Authentication required. Please log in again.");
        // Optionally redirect to login
        return null;
    }
    return { Authorization: `Bearer ${token}` };
};

// Helper function for formatting product options (can be shared)
const formatOptionLabel = ({ label, sku, imageUrl }) => {
    const imageSource = imageUrl
           ? `${BACKEND_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`
           : '/assets/img/placeholder-product.png'; // Ensure you have a placeholder

       return (
           <div className="d-flex align-items-center">
               <img
                   src={imageSource}
                   alt={label || 'Product'}
                   style={{ width: '30px', height: '30px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                   onError={(e) => {
                       e.target.onerror = null;
                       e.target.src = '/assets/img/placeholder-product.png'; // Fallback on error
                   }}
               />
               <div>
                   <div>{label || 'No Name'}</div>
                   <div className="text-muted small">{sku || 'No SKU'}</div>
               </div>
           </div>
       );
}

const StockAdjustment = () => {
    const [adjustments, setAdjustments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState(null);
    const [locations, setLocations] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedAdjustmentType, setSelectedAdjustmentType] = useState(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const MySwal = withReactContent(Swal);
    const [selectedNotes, setSelectedNotes] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notesModal, setNotesModal] = useState(null);

    // Adjustment type options (centralized)
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
        { value: 'Cycle Count Adj', label: 'Cycle Count Adj' }, // Corrected Label
        { value: 'Obsolete', label: 'Obsolete' },
        { value: 'Other', label: 'Other' }
    ];

    // Fetch filter data (locations and products)
    const fetchFilterData = useCallback(async () => {
        const authHeader = getAuthHeader();
        if (!authHeader) return;

        try {
            const [locRes, prodRes] = await Promise.all([
                axios.get(`${API_URL}/locations?fields=name,type&limit=1000`, { headers: authHeader }), // Increased limit for locations
                axios.get(`${API_URL}/products?fields=name,_id,sku,imageUrl&limit=1000&isActive=true`, { headers: authHeader }) // Increased limit for products
            ]);

            setLocations(locRes.data.locations.map(loc => ({
                value: loc._id,
                label: `${loc.name} (${loc.type || 'N/A'})`
            })));

            const productData = Array.isArray(prodRes.data.products) ? prodRes.data.products : (prodRes.data.data || []);
            const mappedProducts = productData.map(prod => ({
                value: prod._id, // Use _id as value
                label: prod.name || 'Unnamed Product', // Use name as label
                sku: prod.sku || 'No SKU',
                imageUrl: prod.imageUrl
            })).filter(p => p.value && p.label); // Filter out invalid entries

            setProducts(mappedProducts);

        } catch (err) {
            console.error("Error fetching filter data:", err);
            toast.error("Could not load filter options.");
        }
    }, []); // No dependencies needed if API_URL is stable

    // Fetch stock adjustments based on current state (filters, pagination, search)
    const fetchAdjustments = useCallback(async (page = pagination.current, pageSize = pagination.pageSize) => {
        setIsLoading(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            setIsLoading(false);
            return;
        }

        const params = {
            page,
            limit: pageSize,
            search: searchQuery || undefined,
            locationId: selectedLocation?.value || undefined,
            productId: selectedProduct?.value || undefined,
            adjustmentType: selectedAdjustmentType?.value || undefined,
            // Send date in ISO format if backend expects it, otherwise adjust as needed
            startDate: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
            // endDate: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined, // If filtering for a single day
            // Add sort parameters if your backend supports them
            // sortBy: 'adjustmentDate',
            // sortOrder: 'desc'
        };

        // Remove undefined params
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        try {
            const response = await axios.get(`${API_URL}/stock-adjustments`, {
                headers: authHeader,
                params
            });

            setAdjustments(response.data.data || []);
            setPagination({
                current: response.data.pagination?.page || page,
                pageSize: response.data.pagination?.limit || pageSize,
                total: response.data.pagination?.total || 0
            });
        } catch (err) {
            console.error("Error fetching adjustments:", err);
            toast.error(`Failed to fetch adjustments: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedLocation, selectedProduct, selectedAdjustmentType, selectedDate, pagination.current, pagination.pageSize]); // Add pagination state as dependency


    // Handle table changes (e.g., pagination)
    const handleTableChange = (paginationConfig, filters, sorter) => {
        setPagination(prev => ({
            ...prev,
            current: paginationConfig.current || 1,
            pageSize: paginationConfig.pageSize || 10
        }));
        // Add sorting logic here if backend supports it
        // if (sorter && sorter.field) {
        //     console.log('Sorting:', sorter.field, sorter.order);
        //     // Set sorting state and refetch
        // }
    };

    // Generic handler for filter dropdown changes
    const handleFilterChange = (setter) => (option) => {
        setter(option);
        setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1 on filter change
    };

    // Reset all filters
    const resetFilters = () => {
        setSearchQuery("");
        setSelectedLocation(null);
        setSelectedProduct(null);
        setSelectedAdjustmentType(null);
        setSelectedDate(null);
        setPagination(prev => ({ ...prev, current: 1 })); // Reset page
        // Trigger fetch immediately after resetting
        // fetchAdjustments(1, pagination.pageSize); // Or let the useEffect handle it
    };

    // Delete adjustment
    const handleDeleteAdjustment = (adjustmentId, referenceNumber) => {
        MySwal.fire({
            title: "Are you sure?",
            html: `This action cannot be undone. <br/> You are attempting to delete adjustment: <strong>${referenceNumber || adjustmentId}</strong>. <br/> <strong style='color: red;'>Deleting adjustments can break audit trails. Consider creating a correcting adjustment instead.</strong>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel"
        }).then(async (result) => {
            if (result.isConfirmed) {
                const authHeader = getAuthHeader();
                if (!authHeader) return;

                // --- Check backend setting for deletion ---
                // Ideally, the backend should control if deletion is allowed.
                // If the backend strictly forbids it (like in the provided controller),
                // this frontend call will fail with a 403 or similar error.

                try {
                    setIsLoading(true); // Show loading indicator during delete
                    await axios.delete(`${API_URL}/stock-adjustments/${adjustmentId}`, {
                        headers: authHeader
                    });

                    toast.success(`Adjustment ${referenceNumber || adjustmentId} deleted successfully`);
                    // Refetch data for the current page after deletion
                    fetchAdjustments(pagination.current, pagination.pageSize);
                } catch (err) {
                    console.error("Error deleting adjustment:", err);
                    toast.error(`Failed to delete adjustment: ${err.response?.data?.message || err.message}`);
                    setIsLoading(false); // Ensure loading is turned off on error
                }
                // No need for finally { setIsLoading(false); } here as fetchAdjustments handles it
            }
        });
    };

    // Initialize modal when component mounts
    useEffect(() => {
        const modal = new Modal(document.getElementById('viewNotesModal'));
        setNotesModal(modal);
    }, []);

    // Function to handle showing notes
    const handleShowNotes = (notes) => {
        setSelectedNotes(notes || 'No notes available');
        notesModal?.show();
    };

    // Function to handle hiding notes
    const handleHideNotes = () => {
        notesModal?.hide();
    };

    // Fetch filter data on component mount
    useEffect(() => {
        fetchFilterData();
    }, [fetchFilterData]);

    // Fetch adjustments when filters or pagination change (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAdjustments(); // Uses state for page and pageSize
        }, 500); // Debounce requests

        return () => clearTimeout(timer); // Cleanup timer on unmount or dependency change
    }, [fetchAdjustments]); // fetchAdjustments is memoized and includes its own dependencies


    // Table columns definition
    const columns = [
        {
            title: "Adj #", // Shortened title
            dataIndex: "adjustmentNumber",
            key: "adjustmentNumber",
            render: (text) => text || <Badge bg="light" text="dark">N/A</Badge>,
            sorter: (a, b) => (a.adjustmentNumber || '').localeCompare(b.adjustmentNumber || ''), // Basic client-side sort
            width: '120px'
        },
        {
            title: "Reference",
            dataIndex: "referenceNumber",
            key: "referenceNumber",
            render: (text) => text || <i className="text-muted">None</i>,
            sorter: (a, b) => (a.referenceNumber || '').localeCompare(b.referenceNumber || ''),
            width: '150px'
        },
        {
            title: "Date",
            dataIndex: "adjustmentDate",
            key: "adjustmentDate",
            render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
            sorter: (a, b) => new Date(a.adjustmentDate) - new Date(b.adjustmentDate),
            width: '120px'
        },
        {
            title: "Location",
            dataIndex: ["location", "name"],
            key: "location",
            render: (text, record) => (
                <span title={record.location?.type ? `${text} (${record.location.type})` : text}>
                    {text || <span className="text-muted">N/A</span>}
                    {record.location?.type && ` (${record.location.type})`}
                </span>
            ),
            sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''),
            width: '180px'
        },
        {
            title: "Product",
            key: "product", // Use key for uniqueness
            render: (_, record) => {
                const product = record.product;
                if (!product) return <span className="text-muted">N/A</span>;
                const imageUrl = product.imageUrl
                    ? `${BACKEND_BASE_URL}${product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`}`
                    : '/assets/img/placeholder-product.png';

                return (
                    <div className="userimgname d-flex align-items-center"> {/* Use flex */}
                        <Link to="#" className="product-img me-2"> {/* Added margin */}
                            <img
                                alt={product.name}
                                src={imageUrl}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/img/placeholder-product.png';
                                }}
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                        </Link>
                        <div style={{ lineHeight: '1.2' }}> {/* Adjust line height */}
                            <Link to="#" title={product.name}>{product.name?.length > 30 ? product.name.substring(0, 27) + '...' : product.name}</Link>
                            <br />
                            <small className="text-muted">{product.sku || 'No SKU'}</small>
                        </div>
                    </div>
                );
            },
             sorter: (a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''),
            width: '250px'
        },
        {
            title: "Type",
            dataIndex: "adjustmentType",
            key: "adjustmentType",
            render: (type) => {
                 let badgeBg = 'secondary'; // Default
                 if (['Addition', 'Transfer In', 'Return', 'Initial Stock', 'Correction'].includes(type)) badgeBg = 'success';
                 if (['Subtraction', 'Damage', 'Theft', 'Transfer Out', 'Obsolete'].includes(type)) badgeBg = 'danger';
                 // 'Other' remains secondary
                 return <Badge bg={badgeBg}>{type}</Badge>;
            },
            sorter: (a, b) => (a.adjustmentType || '').localeCompare(b.adjustmentType || ''),
            filters: adjustmentTypeOptions.map(opt => ({ text: opt.label, value: opt.value })), // Add client-side filters if needed
            onFilter: (value, record) => record.adjustmentType === value,
            width: '150px'
        },
        {
            title: "Qty Adj.", // Shortened title
            dataIndex: "quantityAdjusted",
            key: "quantityAdjusted",
            render: (qty, record) => {
                 let sign = '';
                 let textClass = 'text-dark'; // Default
                 if (['Addition', 'Transfer In', 'Return', 'Initial Stock', 'Correction'].includes(record.adjustmentType)) {
                     sign = '+';
                     textClass = 'text-success fw-bold';
                 } else if (['Subtraction', 'Damage', 'Theft', 'Transfer Out', 'Obsolete'].includes(record.adjustmentType)) {
                     sign = '-';
                     textClass = 'text-danger fw-bold';
                 }
                 return <span className={textClass}>{sign}{qty ?? 0}</span>;
            },
            sorter: (a, b) => a.quantityAdjusted - b.quantityAdjusted,
            align: 'center',
            width: '100px'
        },
         {
            title: "Prev Qty",
            dataIndex: "previousQuantity",
            key: "previousQuantity",
            render: (qty) => qty ?? <Badge bg="light" text="dark">N/A</Badge>,
            sorter: (a, b) => (a.previousQuantity ?? 0) - (b.previousQuantity ?? 0),
            align: 'center',
            width: '100px'
        },
        {
            title: "New Qty",
            dataIndex: "newQuantity",
            key: "newQuantity",
            render: (qty) => qty ?? <Badge bg="light" text="dark">N/A</Badge>,
            sorter: (a, b) => (a.newQuantity ?? 0) - (b.newQuantity ?? 0),
            align: 'center',
            width: '100px'
        },
        {
            title: "Adjusted By",
            dataIndex: ["adjustedBy", "name"],
            key: "adjustedBy",
            render: (text) => text || <span className="text-muted">System/Unknown</span>,
             sorter: (a, b) => (a.adjustedBy?.name || '').localeCompare(b.adjustedBy?.name || ''),
            width: '150px'
        },
        {
            title: "Notes",
            key: "notes",
            render: (_, record) => (
                <div>
                    {record.reason ? (
                        <>
                            <span className="d-inline-block text-truncate" style={{ maxWidth: '150px' }}>
                                {record.reason}
                            </span>
                            <button
                                className="btn btn-link btn-sm p-0 ms-2"
                                onClick={() => handleShowNotes(record.reason)}
                                title="View full notes"
                            >
                                <i className="fas fa-expand-alt"></i>
                            </button>
                        </>
                    ) : (
                        <span className="text-muted">No notes</span>
                    )}
                </div>
            ),
            width: '200px'
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <div className="edit-delete-action d-flex justify-content-center">
                    {/* Edit Button (If you implement editing) */}
                    {/* <OverlayTrigger overlay={<Tooltip>Edit Adjustment</Tooltip>}>
                        <Link
                            className="me-2 p-2"
                            to="#" // Link to an edit route or trigger an edit modal
                            // onClick={() => handleEditAdjustment(record)} // Example handler
                        >
                             <Edit size={18} />
                        </Link>
                     </OverlayTrigger> */}
                    <OverlayTrigger overlay={<Tooltip>Delete Adjustment (Caution!)</Tooltip>}>
                        <Link
                            className="confirm-text p-2"
                            to="#"
                            onClick={() => handleDeleteAdjustment(record._id, record.referenceNumber || record.adjustmentNumber)}
                        >
                            <Trash2 size={18} className="text-danger" />
                        </Link>
                    </OverlayTrigger>
                </div>
            ),
            width: '80px',
            align: 'center',
        }
    ];


    return (
        <div className="page-wrapper">
            {/* Toast Container for Notifications */}
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />

            <div className="content">
                <Breadcrumbs
                    maintitle="Stock Adjustment"
                    subtitle="Manage stock level changes"
                    addButton="Add New Adjustment" // Clearer button text
                    modalTarget="#add-units"        // Target the modal ID
                />

                <div className="card table-list-card">
                    <div className="card-body">
                        <div className="table-top d-flex justify-content-between align-items-center flex-wrap gap-3">
                            {/* Enhanced Search Input */}
                            <div className="search-set flex-grow-1" style={{ maxWidth: '450px' }}>
                                <div className="search-input">
                                    <input
                                        type="text"
                                        placeholder="🔍 Search by Adj#, Ref#, Product..."
                                        className="form-control formsearch"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setPagination(prev => ({ ...prev, current: 1 })); // Reset page on search change
                                        }}
                                    />
                                    <button className="btn btn-searchset" type="button">
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Filter Controls */}
                            <div className="search-path">
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    {/* Location Filter */}
                                    <div style={{ minWidth: '160px' }}>
                                        <Select
                                            options={[{ value: '', label: 'All Locations' }, ...locations]}
                                            value={selectedLocation}
                                            onChange={handleFilterChange(setSelectedLocation)}
                                            placeholder="📍 Filter by Location"
                                            className="select"
                                            classNamePrefix="react-select"
                                            isClearable
                                        />
                                    </div>
                                    {/* Product Filter */}
                                    <div style={{ minWidth: '160px' }}>
                                        <Select
                                            options={[{ value: '', label: 'All Products' }, ...products]}
                                            value={selectedProduct}
                                            onChange={handleFilterChange(setSelectedProduct)}
                                            placeholder="📦 Filter by Product"
                                            className="select"
                                            classNamePrefix="react-select"
                                            formatOptionLabel={formatOptionLabel} // Reuse label formatting
                                            isClearable
                                            filterOption={(option, rawInput) => { // Basic search
                                                const input = rawInput.toLowerCase();
                                                const label = option.label?.toLowerCase() || '';
                                                const sku = option.data?.sku?.toLowerCase() || option.sku?.toLowerCase() || '';
                                                return label.includes(input) || sku.includes(input);
                                            }}
                                        />
                                    </div>
                                    {/* Type Filter */}
                                    <div style={{ minWidth: '140px' }}>
                                        <Select
                                            options={[{ value: '', label: 'All Types' }, ...adjustmentTypeOptions]}
                                            value={selectedAdjustmentType}
                                            onChange={handleFilterChange(setSelectedAdjustmentType)}
                                            placeholder="📊 All Types"
                                            className="select"
                                            classNamePrefix="react-select"
                                            isClearable
                                        />
                                    </div>
                                    {/* Date Filter */}
                                    <div style={{ minWidth: '140px' }}>
                                        <div className="input-groupicon calender-input">
                                            <DatePicker
                                                selected={selectedDate}
                                                onChange={(date) => {
                                                    setSelectedDate(date);
                                                    setPagination(prev => ({ ...prev, current: 1 }));
                                                }}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="📅 Filter by Date"
                                                className="form-control form-control-sm datetimepicker"
                                                isClearable
                                                peekNextMonth
                                                showMonthDropdown
                                                showYearDropdown
                                                dropdownMode="select"
                                            />
                                            <span className="addon-icon">
                                                <Calendar size={18} />
                                            </span>
                                        </div>
                                    </div>
                                    {/* Reset Filters Button */}
                                    <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        onClick={resetFilters}
                                        className="d-flex align-items-center gap-1"
                                        style={{ minWidth: '120px', height: '44px' }}
                                    >
                                        <RotateCcw size={14} />
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="table-responsive">
                             {/* Use the custom Table component */}
                             <Table
                                loading={isLoading}
                                columns={columns}
                                dataSource={adjustments}
                                rowKey="_id" // Use MongoDB _id as the key
                                pagination={{
                                    current: pagination.current,
                                    pageSize: pagination.pageSize,
                                    total: pagination.total,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                                    showSizeChanger: true,
                                    pageSizeOptions: ['10', '25', '50', '100'],
                                }}
                                onChange={handleTableChange} // Pass the handler
                                className="table datanew dataTable no-footer" // Add necessary classes
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <StockadjustmentModal
                // Pass the function to refetch data on successful creation
                onAdjustmentCreated={() => fetchAdjustments(1, pagination.pageSize)} // Reset to page 1
                locations={locations} // Pass fetched locations
                products={products} // Pass fetched and mapped products
                adjustmentTypes={adjustmentTypeOptions} // Pass types
                backendBaseUrl={BACKEND_BASE_URL} // Pass base URL for images
                apiUrl={API_URL} // Pass API URL
                getAuthHeader={getAuthHeader} // Pass auth header function
            />

            {/* Notes View Modal */}
            <div
                className="modal fade"
                id="viewNotesModal"
                tabIndex={-1}
                aria-hidden="true"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Adjustment Notes</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleHideNotes}
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="modal-body">
                            <div className="p-3" style={{ whiteSpace: 'pre-wrap' }}>
                                {selectedNotes}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleHideNotes}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustment;
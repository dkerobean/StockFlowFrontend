import React, { useState, useEffect, useCallback } from 'react';
import { OverlayTrigger, Tooltip, Button } from 'react-bootstrap'; // Added Button
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { DatePicker } from 'antd'; // Keep DatePicker if you plan date filtering
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Icons using feather-icons-react
import {
    ChevronUp, Filter, RotateCcw, Sliders, Box, Search, X
} from 'feather-icons-react/build/IconComponents';

// Redux (Keep if used)
import { useDispatch, useSelector } from 'react-redux';
import { setToogleHeader } from '../../core/redux/action';

// Core Components
import Image from '../../core/img/image'; // Keep if used for header icons
import Table from '../../core/pagination/datatable'; // Your custom Table component

// Routes and Config
import { all_routes } from "../../Router/all_routes";
const API_URL = process.env.REACT_APP_API_URL;
const BACKEND_BASE_URL = API_URL ? API_URL.replace('/api', '') : '';

// Helper function to get Auth Header
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) { console.error("Auth token not found."); return null; }
    return { Authorization: `Bearer ${token}` };
};

// Custom styles for react-select to match Bootstrap form controls
const selectStyles = {
    control: (baseStyles, state) => ({
        ...baseStyles,
        minHeight: '38px',
        borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
        boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#86b7fe' : '#adb5bd',
        },
        fontSize: '14px'
    }),
    menu: base => ({ ...base, zIndex: 5 }),
};


const ExpiredProduct = () => {
    const route = all_routes;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const redux_data = useSelector((state) => state.toggle_header);

    // Component State
    const [expiredItems, setExpiredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFetchingFilters, setIsFetchingFilters] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [locations, setLocations] = useState([]); // Options for location filter
    const [categories, setCategories] = useState([]); // Options for category filter
    const [selectedLocationFilter, setSelectedLocationFilter] = useState(null);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);

    // Status options for expired products
    const statusOptions = [
        { value: null, label: "All Status" },
        { value: "recent", label: "Recently Expired" },
        { value: "long", label: "Long Expired" }
    ];

    // --- Fetch Location Filter Data ---
    const fetchLocationFilterData = useCallback(async () => {
        setIsFetchingFilters(true);
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL) {
            toast.error(!authHeader ? "Auth required." : "API URL missing.");
            setIsFetchingFilters(false); return;
        }
        try {
            console.log("Fetching location filter data...");
            const response = await axios.get(`${API_URL}/locations`, { headers: authHeader });
            console.log("Location filter response:", response.data);
            
            // Handle both direct array response and paginated response
            const locationsArray = response.data.locations || response.data;
            console.log("Locations array for filter:", locationsArray);
            
            if (Array.isArray(locationsArray)) {
                const formattedLocations = [
                    { value: null, label: "All Locations" },
                    ...locationsArray.map(loc => ({ 
                        value: loc._id, 
                        label: `${loc.name} (${loc.type || 'Location'})` 
                    }))
                ];
                setLocations(formattedLocations);
                console.log("Formatted location options:", formattedLocations);
            } else {
                console.warn("Locations response is not an array:", locationsArray);
                setLocations([]);
            }
        } catch (err) {
            console.error("Error fetching location filter data:", err);
            toast.error("Could not load location options.");
            if (err.response?.status === 401) { 
                localStorage.removeItem('token'); 
                navigate(route.signin); // Fixed route name
            }
        } finally {
            setIsFetchingFilters(false);
        }
    }, [API_URL, navigate, route.signin]);

    // --- Fetch Categories Filter Data ---
    const fetchCategories = useCallback(async () => {
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL) return;

        try {
            console.log("Fetching categories for filters...");
            const categoryRes = await axios.get(`${API_URL}/product-categories`, { headers: authHeader });

            console.log("Category filter response:", categoryRes.data);

            // Format categories for react-select
            const formattedCategories = [
                { value: null, label: "All Categories" },
                ...categoryRes.data.map(cat => ({ 
                    value: cat._id, 
                    label: cat.name 
                }))
            ];
            setCategories(formattedCategories);

            console.log("Formatted category options:", formattedCategories);

        } catch (err) {
            console.error("Error fetching categories filter data:", err);
            toast.error("Could not load category options.");
            if (err.response?.status === 401) { 
                localStorage.removeItem('token'); 
                navigate(route.signin);
            }
        }
    }, [API_URL, navigate, route.signin]);

    // --- Fetch Expired Items Data ---
    const fetchExpiredItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL) {
            toast.error(!authHeader ? "Auth required." : "API URL missing.");
            setLoading(false); if(!authHeader) navigate(route.signin); return;
        }

        // Prepare query parameters for the backend
        const params = {
            search: searchQuery || undefined,
            locationId: selectedLocationFilter?.value || undefined,
            categoryId: selectedCategoryFilter?.value || undefined,
            status: selectedStatusFilter?.value || undefined,
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]); // Clean empty params

        console.log("Fetching expired items with params:", params); // Debugging log

        try {
            const response = await axios.get(`${API_URL}/inventory/expired`, {
                headers: authHeader,
                params
            });
            setExpiredItems(response.data || []);
        } catch (err) {
            console.error("Error fetching expired items:", err);
            const errorMessage = err.response?.data?.message || "Failed to load expired items";
            setError(errorMessage);
            toast.error(errorMessage);
            setExpiredItems([]); // Clear data on error
            if (err.response?.status === 401) { localStorage.removeItem('token'); navigate(route.signin); }
        } finally {
            setLoading(false);
        }
    }, [API_URL, navigate, route.signin, searchQuery, selectedLocationFilter, selectedCategoryFilter, selectedStatusFilter]);

    // --- Effects ---
    // Fetch filter options on mount
    useEffect(() => {
        fetchLocationFilterData();
        fetchCategories();
    }, [fetchLocationFilterData, fetchCategories]);

    // Set default filter values after options are loaded
    useEffect(() => {
        if (categories.length > 0 && !selectedCategoryFilter) {
            setSelectedCategoryFilter(categories[0]); // "All Categories"
        }
        if (locations.length > 0 && !selectedLocationFilter) {
            setSelectedLocationFilter(locations[0]); // "All Locations"
        }
        if (statusOptions.length > 0 && !selectedStatusFilter) {
            setSelectedStatusFilter(statusOptions[0]); // "All Status"
        }
    }, [categories, locations, statusOptions, selectedCategoryFilter, selectedLocationFilter, selectedStatusFilter]);

    // Fetch expired items when filters change (debounced)
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchExpiredItems();
        }, 300); // Debounce API calls
        return () => clearTimeout(debounceTimer);
    }, [fetchExpiredItems]); // Depends on the memoized fetch function

    // --- Handlers ---
    const resetFilters = () => {
        setSearchQuery("");
        setSelectedLocationFilter(null);
        setSelectedCategoryFilter(null);
        setSelectedStatusFilter(null);
        toast.info("Filters reset");
        // Data will refetch via useEffect hook
    };

    // --- Tooltip Renderers ---
    const renderTooltip = (props, text) => (<Tooltip {...props}>{text}</Tooltip>);

    // --- Column Definitions ---
    const columns = [
        {
            title: "Product",
            render: (record) => { // Use standard img tag for image rendering
                let placeholderSrc = "/assets/img/placeholder-product.png";
                let imageSrc = placeholderSrc;
                const productImageUrl = record.product?.imageUrl;

                if (productImageUrl) {
                    if (productImageUrl.startsWith('http://') || productImageUrl.startsWith('https://')) { imageSrc = productImageUrl; }
                    else if (productImageUrl.startsWith('/') && BACKEND_BASE_URL) { imageSrc = `${BACKEND_BASE_URL}${productImageUrl}`; }
                    else if (BACKEND_BASE_URL) { imageSrc = `${BACKEND_BASE_URL}/${productImageUrl.startsWith('/') ? productImageUrl.substring(1) : productImageUrl}`; }
                    else { console.warn(`Cannot construct image URL for product ${record.product?.name} (${productImageUrl}) without BACKEND_BASE_URL.`); }
                }

                return (
                    <span className="productimgname">
                        <Link to="#" className="product-img stock-img">
                            <img
                                alt={record.product?.name || 'Product'}
                                src={imageSrc}
                                style={{ objectFit: 'contain', width: '40px', height: '40px' }}
                                onError={(e) => { console.error(`IMAGE LOAD ERROR: ${imageSrc}`); e.target.onerror = null; e.target.src = placeholderSrc; }}
                            />
                        </Link>
                        <Link to={record.product?._id ? route.productdetails.replace(':productId', record.product._id) : '#'}>
                            {record.product?.name || <span className="text-muted">N/A</span>}
                        </Link>
                    </span>
                );
            },
            sorter: (a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''),
        },
        {
            title: "Location",
            dataIndex: ['location', 'name'],
            sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''),
            render: (name) => name || <span className="text-muted">N/A</span>,
        },
        {
            title: "SKU",
            dataIndex: ['product', 'sku'],
            sorter: (a, b) => (a.product?.sku || '').localeCompare(b.product?.sku || ''),
            render: (sku) => sku || <span className="text-muted">N/A</span>,
        },
        {
            title: "Expired Qty",
            dataIndex: "quantity",
            sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0),
            render: (qty) => qty ?? 0,
            align: 'center',
        },
        {
            title: "Expired Date",
            dataIndex: "expiryDate",
            render: (date) => date ? new Date(date).toLocaleDateString() : <span className="text-muted">N/A</span>,
            sorter: (a, b) => new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0),
        },
        // Removed Actions column as they are not usually performed directly on the expired list
    ];

    return (
        <div className="page-wrapper">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex"> <div className="page-title"> <h4>Expired Products</h4> <h6>List of products past expiry</h6> </div> </div>
                    <ul className="table-top-head"> {/* ... Header Icons ... */}
                        <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Refresh')}><Link to="#" onClick={(e) => { e.preventDefault(); fetchExpiredItems(); }}><RotateCcw /></Link></OverlayTrigger></li>
                        <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Collapse')}><Link to="#" id="collapse-header" className={redux_data ? "active" : ""} onClick={() => { dispatch(setToogleHeader(!redux_data)); }}><ChevronUp /></Link></OverlayTrigger></li>
                    </ul>
                </div>

                <div className="card table-list-card">
                    <div className="card-body">
                        {/* Table Top: Search and Inline Filters */}
                        <div className="table-top d-flex justify-content-between align-items-center">
                            <div className="search-set flex-grow-1" style={{ maxWidth: '400px' }}>
                                <div className="search-input">
                                    <input
                                        type="text"
                                        placeholder="Search Products..."
                                        className="form-control form-control-sm formsearch"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Link to className="btn btn-searchset">
                                        <Search className="feather-search" />
                                    </Link>
                                </div>
                            </div>
                            
                            {/* Filter Controls - Right Side */}
                            <div className="search-path">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    {/* Category Filter */}
                                    <div style={{ minWidth: '130px' }}>
                                        <Select
                                            styles={selectStyles}
                                            options={categories}
                                            value={selectedCategoryFilter}
                                            onChange={setSelectedCategoryFilter}
                                            placeholder="All Categories"
                                            isClearable={false}
                                            isLoading={isFetchingFilters}
                                        />
                                    </div>
                                    
                                    {/* Location Filter */}
                                    <div style={{ minWidth: '130px' }}>
                                        <Select
                                            styles={selectStyles}
                                            options={locations}
                                            value={selectedLocationFilter}
                                            onChange={setSelectedLocationFilter}
                                            placeholder="All Locations"
                                            isClearable={false}
                                            isLoading={isFetchingFilters}
                                        />
                                    </div>
                                    
                                    {/* Status Filter */}
                                    <div style={{ minWidth: '130px' }}>
                                        <Select
                                            styles={selectStyles}
                                            options={statusOptions}
                                            value={selectedStatusFilter}
                                            onChange={setSelectedStatusFilter}
                                            placeholder="All Status"
                                            isClearable={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="table-responsive">
                            <Table
                                columns={columns}
                                dataSource={expiredItems}
                                loading={loading} // Pass loading state to Table component
                                // error={error} // Pass error state if your Table component displays it
                                rowKey="_id" // Use the Inventory record's _id as the key
                            />
                            {/* Display error message if fetch failed */}
                             {!loading && error && (
                                <div className="alert alert-danger text-center">Error: {error}</div>
                            )}
                            {/* Custom No Data Message */}
                            {!loading && !error && expiredItems.length === 0 && (
                                <div className="text-center p-5 text-muted">
                                    {searchQuery || selectedLocationFilter?.value || selectedCategoryFilter?.value || selectedStatusFilter?.value
                                        ? "No expired items match your current filters."
                                        : "No expired items found."}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExpiredProduct;
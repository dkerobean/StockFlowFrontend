import React, { useState, useEffect, useCallback } from 'react';
import { OverlayTrigger, Tooltip, Button } from 'react-bootstrap'; // Use Button from react-bootstrap
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Icons using feather-icons-react
import {
    Archive, Box, ChevronUp, Mail, RotateCcw, Sliders, Zap, Edit,
    Filter, Search, X // Ensure Search and X are imported
} from 'feather-icons-react/build/IconComponents';

// Redux (Keep if used)
import { useDispatch, useSelector } from 'react-redux';
import { setToogleHeader } from '../../core/redux/action';

// Core Components
import Image from '../../core/img/image'; // Keep if used for header icons
import Table from '../../core/pagination/datatable'; // Your custom Table component

// Routes and Config
import { all_routes } from "../../Router/all_routes"; // Your route definitions
const API_URL = process.env.REACT_APP_API_URL; // API base URL from .env
const BACKEND_BASE_URL = API_URL ? API_URL.replace('/api', '') : ''; // Base URL for images

// Helper function to get Auth Header
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token not found.");
        return null;
    }
    return { Authorization: `Bearer ${token}` };
};

// Custom styles for react-select
const selectStyles = {
    control: (baseStyles, state) => ({
        ...baseStyles, minHeight: 'calc(1.5em + 0.75rem + 2px)', borderColor: state.isFocused ? '#86b7fe' : '#ced4da', boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none', '&:hover': { borderColor: state.isFocused ? '#86b7fe' : '#adb5bd' },
    }),
    menu: base => ({ ...base, zIndex: 5 }),
};


const LowStock = () => {
    const route = all_routes;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const redux_data = useSelector((state) => state.toggle_header);

    // --- Component State ---
    const [lowStockItems, setLowStockItems] = useState([]);
    const [outOfStockItems, setOutOfStockItems] = useState([]);
    const [loadingLow, setLoadingLow] = useState(true);
    const [loadingOut, setLoadingOut] = useState(true);
    const [errorLow, setErrorLow] = useState(null);
    const [errorOut, setErrorOut] = useState(null);
    const [isFetchingFilters, setIsFetchingFilters] = useState(false);

    // --- Filter State ---
    // Separate state for each tab's filters
    const [searchQueryLow, setSearchQueryLow] = useState("");
    const [searchQueryOut, setSearchQueryOut] = useState("");
    const [locations, setLocations] = useState([]); // Shared location options
    const [selectedLocationFilterLow, setSelectedLocationFilterLow] = useState(null);
    const [selectedLocationFilterOut, setSelectedLocationFilterOut] = useState(null);
    // Add state for other filters (e.g., category) if needed

    // --- Fetch Location Filter Data ---
    const fetchLocationFilterData = useCallback(async () => {
        setIsFetchingFilters(true);
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL) {
            toast.error(!authHeader ? "Auth required." : "API URL missing.");
            setIsFetchingFilters(false); return;
        }
        try {
            const response = await axios.get(`${API_URL}/locations`, { headers: authHeader });
            
            // Handle both direct array response and paginated response
            const locationsArray = response.data.locations || response.data;
            
            if (Array.isArray(locationsArray)) {
                const formattedLocations = [
                    { value: null, label: "All Locations" },
                    ...locationsArray.map(loc => ({ 
                        value: loc._id, 
                        label: `${loc.name} (${loc.type || 'Location'})` 
                    }))
                ];
                setLocations(formattedLocations);
            } else {
                console.warn("Locations response is not an array:", locationsArray);
                setLocations([{ value: null, label: "All Locations" }]);
            }
        } catch (err) {
            console.error("Error fetching locations:", err);
            toast.error("Could not load location filters.");
            if (err.response?.status === 401) { localStorage.removeItem('token'); navigate(route.login); }
        } finally {
            setIsFetchingFilters(false);
        }
    }, [API_URL, navigate, route.login]);


    // --- Fetching Functions (with Filter Params) ---
    const fetchLowStock = useCallback(async () => {
        setLoadingLow(true);
        setErrorLow(null);
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL) { /* ... error handling ... */ setLoadingLow(false); return; }

        const params = {
            search: searchQueryLow || undefined, // Use specific search query
            locationId: selectedLocationFilterLow?.value || undefined, // Use specific location filter
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        console.log("Fetching Low Stock with params:", params); // Debug log

        try {
            const response = await axios.get(`${API_URL}/inventory/low-stock`, { headers: authHeader, params });
            setLowStockItems(response.data || []);
        } catch (error) {
             console.error("Error fetching low stock:", error);
             const msg = error.response?.data?.message || "Failed to load low stock";
             setErrorLow(msg); toast.error(msg); setLowStockItems([]);
             if (error.response?.status === 401) { /* ... handle 401 ... */ }
        } finally {
            setLoadingLow(false);
        }
    }, [API_URL, navigate, route.login, searchQueryLow, selectedLocationFilterLow]); // Dependencies specific to low stock filters


    const fetchOutOfStock = useCallback(async () => {
        setLoadingOut(true);
        setErrorOut(null);
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL) { /* ... error handling ... */ setLoadingOut(false); return; }

        const params = {
            search: searchQueryOut || undefined, // Use specific search query
            locationId: selectedLocationFilterOut?.value || undefined, // Use specific location filter
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

         console.log("Fetching Out of Stock with params:", params); // Debug log

        try {
            const response = await axios.get(`${API_URL}/inventory/out-of-stock`, { headers: authHeader, params });
            setOutOfStockItems(response.data || []);
        } catch (error) {
            console.error("Error fetching out of stock:", error);
            const msg = error.response?.data?.message || "Failed to load out of stock";
            setErrorOut(msg); toast.error(msg); setOutOfStockItems([]);
             if (error.response?.status === 401) { /* ... handle 401 ... */ }
        } finally {
            setLoadingOut(false);
        }
    }, [API_URL, navigate, route.login, searchQueryOut, selectedLocationFilterOut]); // Dependencies specific to out of stock filters

    // --- Effects ---
    // Fetch location options once on mount
    useEffect(() => {
        fetchLocationFilterData();
    }, [fetchLocationFilterData]);

    // Fetch data for both tabs when their respective filters change (debounced)
    useEffect(() => {
        const lowStockTimer = setTimeout(() => fetchLowStock(), 300);
        return () => clearTimeout(lowStockTimer);
    }, [fetchLowStock]); // Runs when fetchLowStock identity changes (due to its own deps)

    useEffect(() => {
        const outOfStockTimer = setTimeout(() => fetchOutOfStock(), 300);
        return () => clearTimeout(outOfStockTimer);
    }, [fetchOutOfStock]); // Runs when fetchOutOfStock identity changes (due to its own deps)

    // --- Handlers ---
     const resetFilters = (type) => { // type 'low' or 'out'
        if (type === 'low') {
             setSearchQueryLow("");
             setSelectedLocationFilterLow(null);
             // Reset other low stock filters if added
        } else if (type === 'out') {
             setSearchQueryOut("");
             setSelectedLocationFilterOut(null);
             // Reset other out of stock filters if added
        }
         toast.info(`Filters reset for ${type === 'low' ? 'Low Stock' : 'Out of Stock'}`);
         // Data will refetch via useEffect hooks because state changed
    };

    // --- Tooltip Renderers ---
    const renderTooltip = (props, text) => (<Tooltip {...props}>{text}</Tooltip>);

    // --- Common Image Rendering Function ---
     const renderProductCell = (record) => { // Reusable image rendering logic
        let placeholderSrc = "/assets/img/placeholder-product.png";
        let imageSrc = placeholderSrc;
        const productImageUrl = record.product?.imageUrl;

        if (productImageUrl) {
            if (productImageUrl.startsWith('http')) { imageSrc = productImageUrl; }
            else if (productImageUrl.startsWith('/') && BACKEND_BASE_URL) { imageSrc = `${BACKEND_BASE_URL}${productImageUrl}`; }
            else if (BACKEND_BASE_URL) { imageSrc = `${BACKEND_BASE_URL}/${productImageUrl.startsWith('/') ? productImageUrl.substring(1) : productImageUrl}`; }
            else { console.warn(`Cannot construct image URL for product ${record.product?.name} without BACKEND_BASE_URL.`); }
        }

        return (
            <span className="productimgname">
                <Link to={record.product?._id ? route.productdetails.replace(':productId', record.product._id) : '#'} className="product-img stock-img">
                    <img alt={record.product?.name || 'Product'} src={imageSrc} style={{ objectFit: 'contain', width: '40px', height: '40px' }} onError={(e) => { console.error(`IMAGE LOAD ERROR: ${imageSrc}`); e.target.onerror = null; e.target.src = placeholderSrc; }} />
                </Link>
                 <Link to={record.product?._id ? route.productdetails.replace(':productId', record.product._id) : '#'}>
                    {record.product?.name || <span className="text-muted">N/A</span>}
                 </Link>
            </span>
        );
    };

    // --- Column Definitions ---
    const columnsLow = [ /* ... columns using renderProductCell ... */
        { title: "Location", dataIndex: ['location', 'name'], sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''), render: (name) => name || <span className="text-muted">N/A</span> },
        { title: "Product", render: renderProductCell, sorter: (a, b) => (a.product?.name || '').localeCompare(b.product?.name || '') },
        { title: "SKU", dataIndex: ['product', 'sku'], sorter: (a, b) => (a.product?.sku || '').localeCompare(b.product?.sku || ''), render: (sku) => sku || <span className="text-muted">N/A</span> },
        { title: "Current Qty", dataIndex: 'quantity', sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0), render: (qty) => qty ?? 0, align: 'center' },
        { title: "Notify Qty", dataIndex: 'notifyAt', sorter: (a, b) => (a.notifyAt ?? 0) - (b.notifyAt ?? 0), render: (qty) => qty ?? 0, align: 'center' },
    ];
    const columnsOut = [ /* ... columns using renderProductCell ... */
         { title: "Location", dataIndex: ['location', 'name'], sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''), render: (name) => name || <span className="text-muted">N/A</span> },
         { title: "Product", render: renderProductCell, sorter: (a, b) => (a.product?.name || '').localeCompare(b.product?.name || '') },
         { title: "SKU", dataIndex: ['product', 'sku'], sorter: (a, b) => (a.product?.sku || '').localeCompare(b.product?.sku || ''), render: (sku) => sku || <span className="text-muted">N/A</span> },
         { title: "Qty", dataIndex: 'quantity', sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0), render: (qty) => qty ?? 0, align: 'center' },
         { title: "Status", render: (record) => ( <> {!record.product?.isActive && <span className="badge badge-linedanger me-1">Product Inactive</span>} {!record.location?.isActive && <span className="badge badge-linedanger">Location Inactive</span>} {record.product?.isActive && record.location?.isActive && <span className="badge badge-linesuccess">Active</span>} </> ), }
    ];

    // --- Common Filter/Search UI Component ---
    const renderTableTop = (type) => {
        // Determine which state variables and setters to use based on the tab type ('low' or 'out')
        const currentSearchQuery = type === 'low' ? searchQueryLow : searchQueryOut;
        const setSearchQueryFn = type === 'low' ? setSearchQueryLow : setSearchQueryOut;
        const selectedLocation = type === 'low' ? selectedLocationFilterLow : selectedLocationFilterOut;
        const setSelectedLocationFn = type === 'low' ? setSelectedLocationFilterLow : setSelectedLocationFilterOut;

        return (
            <div className="table-top d-flex justify-content-between align-items-center">
                <div className="search-set flex-grow-1" style={{ maxWidth: '400px' }}>
                    <div className="search-input">
                        <input
                            type="text"
                            placeholder={`Search ${type === 'low' ? 'Low' : 'Out of'} Stock...`}
                            className="form-control form-control-sm formsearch"
                            value={currentSearchQuery}
                            onChange={(e) => setSearchQueryFn(e.target.value)}
                        />
                        <button className="btn btn-searchset" title="Search">
                            <Search className="feather-search" />
                        </button>
                    </div>
                </div>
                
                {/* Filter Controls - Right Side */}
                <div className="search-path">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <div style={{ minWidth: '130px' }}>
                            <Select
                                styles={selectStyles}
                                options={locations}
                                value={selectedLocation}
                                onChange={setSelectedLocationFn}
                                placeholder="All Locations"
                                isClearable={false}
                                isLoading={isFetchingFilters}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    // --- Main Render ---
    return (
        <div className="page-wrapper">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="content">
                {/* Page Header */}
                <div className="page-header">
                     <div className="page-title me-auto"><h4>Stock Alerts</h4><h6>Manage stock levels</h6></div>
                     <ul className="table-top-head">{/* ... Header Icons ... */}
                        <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Refresh All')}><Link to="#" onClick={() => { fetchLowStock(); fetchOutOfStock(); }}><RotateCcw /></Link></OverlayTrigger></li>
                        <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Collapse')}><Link to="#" id="collapse-header" className={redux_data ? "active" : ""} onClick={() => { dispatch(setToogleHeader(!redux_data)); }}><ChevronUp /></Link></OverlayTrigger></li>
                     </ul>
                </div>

                {/* Tabs */}
                <div className="table-tab">
                    <ul className="nav nav-pills" id="pills-tab" role="tablist">{/* ... Tab Buttons ... */}
                         <li className="nav-item" role="presentation"> <button className="nav-link active" id="pills-low-stock-tab" data-bs-toggle="pill" data-bs-target="#pills-low-stock" type="button" role="tab"> Low Stocks </button> </li>
                         <li className="nav-item" role="presentation"> <button className="nav-link" id="pills-out-of-stock-tab" data-bs-toggle="pill" data-bs-target="#pills-out-of-stock" type="button" role="tab"> Out of Stocks </button> </li>
                    </ul>

                    {/* Tab Content */}
                    <div className="tab-content" id="pills-tabContent">
                        {/* Low Stock Pane */}
                        <div className="tab-pane fade show active" id="pills-low-stock" role="tabpanel">
                            <div className="card table-list-card">
                                <div className="card-body">
                                    {renderTableTop('low')} {/* Render common UI with 'low' type */}
                                    <div className="table-responsive">
                                        <Table columns={columnsLow} dataSource={lowStockItems} loading={loadingLow} rowKey="_id" />
                                        {/* Loading/Error/No Data Messages */}
                                        {!loadingLow && errorLow && <div className="alert alert-danger text-center">Error: {errorLow}</div>}
                                        {!loadingLow && !errorLow && lowStockItems.length === 0 && ( <div className="text-center p-5 text-muted"> {searchQueryLow || selectedLocationFilterLow ? "No low stock items match filters." : "No low stock items found."} </div> )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Out of Stock Pane */}
                        <div className="tab-pane fade" id="pills-out-of-stock" role="tabpanel">
                             <div className="card table-list-card">
                                <div className="card-body">
                                    {renderTableTop('out')} {/* Render common UI with 'out' type */}
                                    <div className="table-responsive">
                                        <Table columns={columnsOut} dataSource={outOfStockItems} loading={loadingOut} rowKey="_id" />
                                         {/* Loading/Error/No Data Messages */}
                                        {!loadingOut && errorOut && <div className="alert alert-danger text-center">Error: {errorOut}</div>}
                                        {!loadingOut && !errorOut && outOfStockItems.length === 0 && ( <div className="text-center p-5 text-muted"> {searchQueryOut || selectedLocationFilterOut ? "No out of stock items match filters." : "No out of stock items found."} </div> )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LowStock;
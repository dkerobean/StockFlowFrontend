import React, { useState, useEffect, useCallback } from 'react';
import { OverlayTrigger, Tooltip, Button } from 'react-bootstrap'; // Added Button
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Icons using feather-icons-react
import {
    Archive, Box, ChevronUp, Mail, RotateCcw, Sliders, Zap, Edit,
    Filter, Search, X // Added Search, X
} from 'feather-icons-react/build/IconComponents';

// Redux (Keep if used for header toggle)
import { useDispatch, useSelector } from 'react-redux';
import { setToogleHeader } from '../../core/redux/action';

// Core Components
import ImageWithBasePath from '../../core/img/imagewithbasebath'; // Keep for header icons if used there
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

// Custom styles for react-select (Optional, for consistency)
const selectStyles = {
    control: (baseStyles, state) => ({
        ...baseStyles, minHeight: 'calc(1.5em + 0.75rem + 2px)', borderColor: state.isFocused ? '#86b7fe' : '#ced4da', boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none', '&:hover': { borderColor: state.isFocused ? '#86b7fe' : '#adb5bd' },
    }),
    menu: base => ({ ...base, zIndex: 5 }),
};

// Feather Icon Helper (if still needed elsewhere, otherwise can remove)
// const FeatherIcon = ({ icon, ...props }) => {
//     const IconComponent = icon;
//     return <IconComponent {...props} />;
// };

const LowStock = () => {
    const route = all_routes;
    const navigate = useNavigate();
    // Redux state for header toggle
    const dispatch = useDispatch();
    const redux_data = useSelector((state) => state.toggle_header);

    // --- Component State ---
    const [lowStockItems, setLowStockItems] = useState([]);
    const [outOfStockItems, setOutOfStockItems] = useState([]);
    const [loadingLow, setLoadingLow] = useState(true);
    const [loadingOut, setLoadingOut] = useState(true);
    const [errorLow, setErrorLow] = useState(null);
    const [errorOut, setErrorOut] = useState(null);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [isFetchingFilters, setIsFetchingFilters] = useState(false);

    // --- Filter State ---
    const [searchQueryLow, setSearchQueryLow] = useState(""); // Separate search for low stock
    const [searchQueryOut, setSearchQueryOut] = useState(""); // Separate search for out of stock
    const [locations, setLocations] = useState([]); // For location filter dropdown
    const [selectedLocationFilterLow, setSelectedLocationFilterLow] = useState(null);
    const [selectedLocationFilterOut, setSelectedLocationFilterOut] = useState(null);
    // Add other filters like product/category if needed

    // --- Fetch Location Filter Data ---
    const fetchLocationFilterData = useCallback(async () => {
        setIsFetchingFilters(true);
        const authHeader = getAuthHeader();
        if (!authHeader) { toast.error("Authentication required for fetching filters."); setIsFetchingFilters(false); return; }
        if (!API_URL) { console.error("API_URL is not configured."); toast.error("Application configuration error (API URL)."); setIsFetchingFilters(false); return; }
        try {
            const response = await axios.get(`${API_URL}/locations?fields=name,type`, { headers: authHeader });
            setLocations(response.data.map(loc => ({ value: loc._id, label: `${loc.name} (${loc.type})` })));
        } catch (err) {
            console.error("Error fetching location filter data:", err);
            toast.error("Could not load location filter options.");
             if (err.response && err.response.status === 401) { localStorage.removeItem('token'); navigate(route.login); }
        } finally {
            setIsFetchingFilters(false);
        }
    }, [API_URL, navigate, route.login]);


    // --- Fetching Functions ---
    const fetchLowStock = useCallback(async () => {
        setLoadingLow(true);
        setErrorLow(null);
        const authHeader = getAuthHeader();
        if (!authHeader) { toast.error("Authentication required."); setLoadingLow(false); navigate(route.login); return; }
        if (!API_URL) { console.error("API_URL not configured."); toast.error("Config error."); setErrorLow("Config error."); setLoadingLow(false); return; }

        const params = { // Backend needs to support these
            search: searchQueryLow || undefined,
            locationId: selectedLocationFilterLow?.value || undefined,
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        try {
            const response = await axios.get(`${API_URL}/inventory/low-stock`, { headers: authHeader, params });
            setLowStockItems(response.data || []);
        } catch (error) {
            console.error("Error fetching low stock items:", error);
            const msg = error.response?.data?.message || "Failed to load low stock items";
            setErrorLow(msg);
            toast.error(msg);
            setLowStockItems([]);
            if (error.response && error.response.status === 401) { localStorage.removeItem('token'); navigate(route.login); }
        } finally {
            setLoadingLow(false);
        }
    }, [API_URL, navigate, route.login, searchQueryLow, selectedLocationFilterLow]);


    const fetchOutOfStock = useCallback(async () => {
        setLoadingOut(true);
        setErrorOut(null);
        const authHeader = getAuthHeader();
        if (!authHeader) { toast.error("Authentication required."); setLoadingOut(false); navigate(route.login); return; }
        if (!API_URL) { console.error("API_URL not configured."); toast.error("Config error."); setErrorOut("Config error."); setLoadingOut(false); return; }

        const params = { // Backend needs to support these
            search: searchQueryOut || undefined,
            locationId: selectedLocationFilterOut?.value || undefined,
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        try {
            const response = await axios.get(`${API_URL}/inventory/out-of-stock`, { headers: authHeader, params });
            setOutOfStockItems(response.data || []);
        } catch (error) {
            console.error("Error fetching out of stock items:", error);
             const msg = error.response?.data?.message || "Failed to load out of stock items";
            setErrorOut(msg);
            toast.error(msg);
            setOutOfStockItems([]);
             if (error.response && error.response.status === 401) { localStorage.removeItem('token'); navigate(route.login); }
        } finally {
            setLoadingOut(false);
        }
    }, [API_URL, navigate, route.login, searchQueryOut, selectedLocationFilterOut]);

    // --- Effects ---
    useEffect(() => {
        fetchLocationFilterData();
    }, [fetchLocationFilterData]);

    useEffect(() => {
        // Debounce fetches when search/filters change
        const lowStockTimer = setTimeout(() => fetchLowStock(), 300);
        const outOfStockTimer = setTimeout(() => fetchOutOfStock(), 300);

        return () => {
            clearTimeout(lowStockTimer);
            clearTimeout(outOfStockTimer);
        };
    }, [fetchLowStock, fetchOutOfStock]); // Depend on the fetch functions themselves

    // --- Handlers ---
    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };

     const resetFilters = (type) => { // type can be 'low' or 'out'
        if (type === 'low') {
             setSearchQueryLow("");
             setSelectedLocationFilterLow(null);
        } else if (type === 'out') {
             setSearchQueryOut("");
             setSelectedLocationFilterOut(null);
        }
         setIsFilterVisible(false); // Hide filters on reset
         toast.info(`Filters reset for ${type === 'low' ? 'Low Stock' : 'Out of Stock'}`);
         // Data will refetch via useEffect
    };

    // --- Tooltip Renderers ---
    const renderTooltip = (props, text) => (<Tooltip {...props}>{text}</Tooltip>);

    // --- Common Image Rendering Function ---
     const renderProductCell = (record) => {
        let placeholderSrc = "/assets/img/placeholder-product.png";
        let imageSrc = placeholderSrc;
        const productImageUrl = record.product?.imageUrl;

        if (productImageUrl) {
            if (productImageUrl.startsWith('http://') || productImageUrl.startsWith('https://')) { imageSrc = productImageUrl; }
            else if (productImageUrl.startsWith('/') && BACKEND_BASE_URL) { imageSrc = `${BACKEND_BASE_URL}${productImageUrl}`; }
            else if (BACKEND_BASE_URL) { imageSrc = `${BACKEND_BASE_URL}/${productImageUrl.startsWith('/') ? productImageUrl.substring(1) : productImageUrl}`; }
            else { console.warn(`Cannot construct image URL for product ${record.product?.name} without BACKEND_BASE_URL.`); }
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
    };

    // --- Column Definitions ---
    // Columns for Low Stock Table
    const columnsLow = [
        { title: "Location", dataIndex: ['location', 'name'], sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''), render: (name) => name || <span className="text-muted">N/A</span> },
        { title: "Product", render: renderProductCell, sorter: (a, b) => (a.product?.name || '').localeCompare(b.product?.name || '') },
        { title: "SKU", dataIndex: ['product', 'sku'], sorter: (a, b) => (a.product?.sku || '').localeCompare(b.product?.sku || ''), render: (sku) => sku || <span className="text-muted">N/A</span> },
        { title: "Current Qty", dataIndex: 'quantity', sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0), render: (qty) => qty ?? 0, align: 'center' },
        { title: "Notify Qty", dataIndex: 'notifyAt', sorter: (a, b) => (a.notifyAt ?? 0) - (b.notifyAt ?? 0), render: (qty) => qty ?? 0, align: 'center' },
        // Add actions if needed (e.g., link to adjust stock page)
    ];

    // Columns for Out of Stock Table
    const columnsOut = [
         { title: "Location", dataIndex: ['location', 'name'], sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''), render: (name) => name || <span className="text-muted">N/A</span> },
         { title: "Product", render: renderProductCell, sorter: (a, b) => (a.product?.name || '').localeCompare(b.product?.name || '') },
         { title: "SKU", dataIndex: ['product', 'sku'], sorter: (a, b) => (a.product?.sku || '').localeCompare(b.product?.sku || ''), render: (sku) => sku || <span className="text-muted">N/A</span> },
         { title: "Qty", dataIndex: 'quantity', sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0), render: (qty) => qty ?? 0, align: 'center' },
         {
            title: "Status",
            render: (record) => (
                <>
                    {!record.product?.isActive && <span className="badge badge-linedanger me-1">Product Inactive</span>}
                    {!record.location?.isActive && <span className="badge badge-linedanger">Location Inactive</span>}
                    {record.product?.isActive && record.location?.isActive && <span className="badge badge-linesuccess">Active</span>}
                </>
            ),
        }
    ];

    // --- Common Filter/Search UI Component ---
    const renderTableTop = (type) => { // type = 'low' or 'out'
        const currentSearchQuery = type === 'low' ? searchQueryLow : searchQueryOut;
        const setSearchQueryFn = type === 'low' ? setSearchQueryLow : setSearchQueryOut;
        const fetchFn = type === 'low' ? fetchLowStock : fetchOutOfStock;
        const selectedLocation = type === 'low' ? selectedLocationFilterLow : selectedLocationFilterOut;
        const setSelectedLocationFn = type === 'low' ? setSelectedLocationFilterLow : setSelectedLocationFilterOut;

        return (
             <>
                <div className="table-top">
                    {/* Search */}
                    <div className="search-set">
                        <div className="search-input">
                            <input
                                type="text"
                                placeholder={`Search ${type === 'low' ? 'Low Stock' : 'Out of Stock'}...`}
                                className="form-control form-control-sm formsearch"
                                value={currentSearchQuery}
                                onChange={(e) => setSearchQueryFn(e.target.value)}
                            />
                            <button className="btn btn-searchset" onClick={fetchFn} title="Search">
                                <Search size={18} />
                            </button>
                        </div>
                    </div>
                    {/* Filter Toggle */}
                    <div className="search-path">
                        <button type='button' className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`} onClick={toggleFilterVisibility} title={isFilterVisible ? "Hide Filters" : "Show Filters"}>
                            <Filter className="filter-icon" />
                            <span>{isFilterVisible ? <X size={14} style={{marginLeft: '5px'}}/> : ''}</span>
                        </button>
                    </div>
                    {/* Sort (Example - needs state/logic) */}
                    {/* <div className="form-sort"> <Sliders className="info-img" /> <Select className="select" styles={selectStyles} options={[{ value: 'qty_asc', label: 'Qty Asc' }]} placeholder="Sort by..." /> </div> */}
                </div>

                {/* Filter Card */}
                <div className={`card filter_card ${isFilterVisible ? " visible" : ""}`} style={{ display: isFilterVisible ? "block" : "none" }}>
                    <div className="card-body pb-0">
                        <div className="row">
                            {/* Location Filter */}
                            <div className="col-lg-4 col-sm-6 col-12 mb-3">
                                <Select
                                    styles={selectStyles}
                                    options={locations}
                                    value={selectedLocation}
                                    onChange={setSelectedLocationFn}
                                    placeholder="Filter by Location..."
                                    isClearable
                                    isLoading={isFetchingFilters}
                                    classNamePrefix="react-select"
                                />
                            </div>
                            {/* Add other filters (Product, Category) here if needed */}
                            {/* Reset Button */}
                            <div className="col-lg-2 col-sm-6 col-12 mb-3 ms-auto">
                                <Button variant="secondary" size="sm" onClick={() => resetFilters(type)} className="w-100">
                                    <RotateCcw size={14} className="me-1"/> Reset
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };


    return (
        <div className="page-wrapper">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="content">
                <div className="page-header">
                    <div className="page-title me-auto">
                        <h4>Stock Alerts</h4>
                        <h6>Manage low and out of stock items</h6>
                    </div>
                    {/* Header buttons */}
                    <ul className="table-top-head">
                         {/* Notify/Email buttons - UI only */}
                        {/* <li>...</li> */}
                        <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Refresh All')}><Link to="#" onClick={() => { fetchLowStock(); fetchOutOfStock(); }}><RotateCcw /></Link></OverlayTrigger></li>
                        <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Collapse')}><Link to="#" id="collapse-header" className={redux_data ? "active" : ""} onClick={() => { dispatch(setToogleHeader(!redux_data)); }}><ChevronUp /></Link></OverlayTrigger></li>
                    </ul>
                </div>

                {/* Tabs */}
                <div className="table-tab">
                    <ul className="nav nav-pills" id="pills-tab" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button className="nav-link active" id="pills-low-stock-tab" data-bs-toggle="pill" data-bs-target="#pills-low-stock" type="button" role="tab" aria-controls="pills-low-stock" aria-selected="true">
                                Low Stocks
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button className="nav-link" id="pills-out-of-stock-tab" data-bs-toggle="pill" data-bs-target="#pills-out-of-stock" type="button" role="tab" aria-controls="pills-out-of-stock" aria-selected="false">
                                Out of Stocks
                            </button>
                        </li>
                    </ul>

                    {/* Tab Content */}
                    <div className="tab-content" id="pills-tabContent">
                        {/* Low Stock Pane */}
                        <div className="tab-pane fade show active" id="pills-low-stock" role="tabpanel" aria-labelledby="pills-low-stock-tab">
                            <div className="card table-list-card">
                                <div className="card-body">
                                    {renderTableTop('low')} {/* Render common top section */}
                                    <div className="table-responsive">
                                        <Table
                                            columns={columnsLow}
                                            dataSource={lowStockItems}
                                            loading={loadingLow}
                                            error={errorLow} // Pass error state if Table handles it
                                            rowKey="_id"
                                        />
                                          {!loadingLow && !errorLow && lowStockItems.length === 0 && (
                                             <div className="text-center p-5 text-muted">
                                                {searchQueryLow || selectedLocationFilterLow ? "No low stock items match your filters." : "No low stock items found."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Out of Stock Pane */}
                        <div className="tab-pane fade" id="pills-out-of-stock" role="tabpanel" aria-labelledby="pills-out-of-stock-tab">
                             <div className="card table-list-card">
                                <div className="card-body">
                                    {renderTableTop('out')} {/* Render common top section */}
                                    <div className="table-responsive">
                                        <Table
                                            columns={columnsOut}
                                            dataSource={outOfStockItems}
                                            loading={loadingOut}
                                            error={errorOut} // Pass error state if Table handles it
                                            rowKey="_id"
                                        />
                                        {!loadingOut && !errorOut && outOfStockItems.length === 0 && (
                                             <div className="text-center p-5 text-muted">
                                                {searchQueryOut || selectedLocationFilterOut ? "No out of stock items match your filters." : "No out of stock items found."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal placeholder */}
            {/* {editingItem && <EditLowStock ... />} */}
        </div>
    )
}

export default LowStock;
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
import ImageWithBasePath from '../../core/img/imagewithbasebath'; // Keep if used for header icons
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

// Custom styles for react-select
const selectStyles = {
    control: (baseStyles, state) => ({ /* ... styles ... */ }),
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
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [isFetchingFilters, setIsFetchingFilters] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [locations, setLocations] = useState([]); // Options for location filter
    const [selectedLocationFilter, setSelectedLocationFilter] = useState(null);
    // const [selectedDateRange, setSelectedDateRange] = useState([null, null]); // Example for date range

    // --- Fetch Location Filter Data ---
    const fetchLocationFilterData = useCallback(async () => {
        setIsFetchingFilters(true);
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL) {
            toast.error(!authHeader ? "Auth required." : "API URL missing.");
            setIsFetchingFilters(false); return;
        }
        try {
            const response = await axios.get(`${API_URL}/locations?fields=name,type`, { headers: authHeader });
            setLocations(response.data.map(loc => ({ value: loc._id, label: `${loc.name} (${loc.type})` })));
        } catch (err) {
            console.error("Error fetching location filter data:", err);
            toast.error("Could not load location options.");
            if (err.response?.status === 401) { localStorage.removeItem('token'); navigate(route.login); }
        } finally {
            setIsFetchingFilters(false);
        }
    }, [API_URL, navigate, route.login]);

    // --- Fetch Expired Items Data ---
    const fetchExpiredItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL) {
            toast.error(!authHeader ? "Auth required." : "API URL missing.");
            setLoading(false); if(!authHeader) navigate(route.login); return;
        }

        // Prepare query parameters for the backend
        const params = {
            search: searchQuery || undefined,
            locationId: selectedLocationFilter?.value || undefined,
            // Add date range params if implementing date filter
            // expiryStartDate: selectedDateRange[0]?.toISOString() || undefined,
            // expiryEndDate: selectedDateRange[1]?.toISOString() || undefined,
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
            if (err.response?.status === 401) { localStorage.removeItem('token'); navigate(route.login); }
        } finally {
            setLoading(false);
        }
    }, [API_URL, navigate, route.login, searchQuery, selectedLocationFilter /*, selectedDateRange */]);

    // --- Effects ---
    // Fetch filter options on mount
    useEffect(() => {
        fetchLocationFilterData();
    }, [fetchLocationFilterData]);

    // Fetch expired items when filters change (debounced)
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchExpiredItems();
        }, 300); // Debounce API calls
        return () => clearTimeout(debounceTimer);
    }, [fetchExpiredItems]); // Depends on the memoized fetch function

    // --- Handlers ---
    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };

    const resetFilters = () => {
        setSearchQuery("");
        setSelectedLocationFilter(null);
        // setSelectedDateRange([null, null]); // Reset date range if used
        setIsFilterVisible(false);
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

    // Example static sort options
    const sortOptions = [ /* ... sort options if needed ... */ ];

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
                        {/* Table Top: Search, Filter Toggle */}
                        <div className="table-top">
                            {/* Search Input */}
                            <div className="search-set">
                                <div className="search-input">
                                    <input
                                        type="text"
                                        placeholder="Search by Product Name/SKU..."
                                        className="form-control form-control-sm formsearch"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {/* Button can trigger fetch immediately or rely on debounce */}
                                    <button className="btn btn-searchset" onClick={fetchExpiredItems} title="Search">
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>
                            {/* Filter Toggle Button */}
                            <div className="search-path">
                                <button type='button' className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`} onClick={toggleFilterVisibility} title={isFilterVisible ? "Hide Filters" : "Show Filters"}>
                                    <Filter className="filter-icon" />
                                    <span>{isFilterVisible ? <X size={14} style={{marginLeft: '5px'}}/> : ''}</span>
                                </button>
                            </div>
                            {/* Sort Dropdown (Optional) */}
                            {/* <div className="form-sort"> <Sliders className="info-img" /> <Select className="select" styles={selectStyles} options={sortOptions} placeholder="Sort by..." /> </div> */}
                        </div>

                        {/* Filter Card - Collapsible */}
                        <div
                            className={`card filter-card ${isFilterVisible ? " visible" : ""}`}
                            id="filter_inputs"
                            style={{ display: isFilterVisible ? "block" : "none" }}
                        >
                            <div className="card-body pb-0">
                                <div className="row">
                                    {/* Location Filter Dropdown */}
                                    <div className="col-lg-4 col-sm-6 col-12 mb-3">
                                        <Select
                                            styles={selectStyles}
                                            options={locations}
                                            value={selectedLocationFilter}
                                            onChange={setSelectedLocationFilter}
                                            placeholder="Filter by Location..."
                                            isClearable
                                            isLoading={isFetchingFilters}
                                            classNamePrefix="react-select"
                                            noOptionsMessage={() => isFetchingFilters ? 'Loading...' : 'No locations found'}
                                        />
                                    </div>
                                    {/* Optional Date Filter */}
                                    <div className="col-lg-4 col-sm-6 col-12 mb-3">
                                        {/* Add AntD DatePicker or RangePicker here if date filtering is needed */}
                                        {/* <DatePicker placeholder="Filter by Expiry Date" className="form-control" style={{ width: '100%' }} /> */}
                                    </div>
                                    {/* Reset Filters Button */}
                                    <div className="col-lg-2 col-sm-6 col-12 mb-3 ms-auto">
                                        <Button variant="secondary" size="sm" onClick={resetFilters} className="w-100">
                                            <RotateCcw size={14} className="me-1"/> Reset Filters
                                        </Button>
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
                                    {searchQuery || selectedLocationFilter /* Add date filter check here if used */
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
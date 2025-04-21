import React, { useState, useEffect, useCallback } from 'react';
import { OverlayTrigger, Tooltip, Button } from 'react-bootstrap'; // Added Button
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { DatePicker } from 'antd';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Icons using feather-icons-react for consistency
import {
    ChevronUp, Filter, RotateCcw, Sliders, Box, Search, X // Added Search, X
} from 'feather-icons-react/build/IconComponents';

// Redux (Keep if used for header toggle)
import { useDispatch, useSelector } from 'react-redux';
import { setToogleHeader } from '../../core/redux/action';

// Core Components
import ImageWithBasePath from '../../core/img/imagewithbasebath'; // Still needed for header icons potentially
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
        ...baseStyles,
        minHeight: 'calc(1.5em + 0.75rem + 2px)',
        borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
        boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#86b7fe' : '#adb5bd',
        },
    }),
    menu: base => ({ ...base, zIndex: 5 }),
};


const ExpiredProduct = () => {
    const route = all_routes;
    const navigate = useNavigate();
    // Redux state for header toggle
    const dispatch = useDispatch();
    const redux_data = useSelector((state) => state.toggle_header);

    // Component State
    const [expiredItems, setExpiredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [isFetchingFilters, setIsFetchingFilters] = useState(false); // Loading state for filters

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [locations, setLocations] = useState([]); // For location filter dropdown
    const [selectedLocationFilter, setSelectedLocationFilter] = useState(null);
    // Add state for date range filter if implementing
    // const [selectedDateRange, setSelectedDateRange] = useState([null, null]); // Example: [startDate, endDate]

    // --- Fetch Location Filter Data ---
    const fetchLocationFilterData = useCallback(async () => {
        setIsFetchingFilters(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
             toast.error("Authentication required for fetching filters.");
             setIsFetchingFilters(false);
             return;
        }
        if (!API_URL) {
             console.error("API_URL is not configured.");
             toast.error("Application configuration error (API URL).");
             setIsFetchingFilters(false);
             return;
        }
        try {
            const response = await axios.get(`${API_URL}/locations?fields=name,type`, { headers: authHeader });
            setLocations(response.data.map(loc => ({ value: loc._id, label: `${loc.name} (${loc.type})` })));
        } catch (err) {
            console.error("Error fetching location filter data:", err);
            toast.error("Could not load location filter options.");
             if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                navigate(route.login);
            }
        } finally {
            setIsFetchingFilters(false);
        }
    }, [API_URL, navigate, route.login]);

    // --- Fetching Function ---
    const fetchExpiredItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            toast.error("Authentication required. Please log in.");
            setLoading(false);
            navigate(route.login);
            return;
        }
         if (!API_URL) {
              console.error("API_URL is not configured.");
              toast.error("Application configuration error (API URL).");
              setError("Application configuration error.");
              setLoading(false);
              return;
         }

        // Prepare query parameters for filtering (Example)
        const params = {
            // Backend needs to support these query params for the /inventory/expired route
            search: searchQuery || undefined, // Example: Search by product name/sku within expired items
            locationId: selectedLocationFilter?.value || undefined,
            // expiryStartDate: selectedDateRange[0]?.toISOString() || undefined, // Example date range
            // expiryEndDate: selectedDateRange[1]?.toISOString() || undefined,   // Example date range
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);


        try {
            const response = await axios.get(`${API_URL}/inventory/expired`, {
                headers: authHeader,
                params // Send filter params
            });
            setExpiredItems(response.data || []);
        } catch (err) {
            console.error("Error fetching expired items:", err);
            const errorMessage = err.response?.data?.message || "Failed to load expired items";
            setError(errorMessage);
            toast.error(errorMessage);
            setExpiredItems([]); // Clear data on error
             if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                navigate(route.login);
            }
        } finally {
            setLoading(false);
        }
    // Add filter states as dependencies if they should trigger a refetch
    }, [API_URL, navigate, route.login, searchQuery, selectedLocationFilter /*, selectedDateRange */]);

    // --- Effects ---
    // Fetch filter data on mount
    useEffect(() => {
        fetchLocationFilterData();
    }, [fetchLocationFilterData]);

    // Fetch expired items on mount and when filters change (debounced)
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchExpiredItems();
        }, 300); // Debounce API calls

        return () => clearTimeout(debounceTimer);
    }, [fetchExpiredItems]); // Depend on the callback function


    // --- Handlers ---
    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };

    // Example handler for date range change (if using AntD RangePicker)
    // const handleDateRangeChange = (dates) => {
    //     setSelectedDateRange(dates || [null, null]);
    // };

    // Reset filters
    const resetFilters = () => {
        setSearchQuery("");
        setSelectedLocationFilter(null);
        // setSelectedDateRange([null, null]);
        setIsFilterVisible(false);
        toast.info("Filters reset");
        // fetchExpiredItems will be called by useEffect
    };


    // --- Tooltip Renderers ---
    const renderTooltip = (props, text) => (<Tooltip {...props}>{text}</Tooltip>);

    // --- Column Definitions ---
    const columns = [
         {
            title: "Product",
            render: (record) => {
                 // --- Image Rendering Logic ---
                let placeholderSrc = "/assets/img/placeholder-product.png"; // Path to your placeholder
                let imageSrc = placeholderSrc;
                const productImageUrl = record.product?.imageUrl; // Get URL from nested product

                 if (productImageUrl) {
                     if (productImageUrl.startsWith('http://') || productImageUrl.startsWith('https://')) {
                         imageSrc = productImageUrl; // Absolute URL
                     } else if (productImageUrl.startsWith('/') && BACKEND_BASE_URL) {
                         imageSrc = `${BACKEND_BASE_URL}${productImageUrl}`; // Relative starting with /
                     } else if (BACKEND_BASE_URL) {
                          // Other relative path (e.g., 'uploads/img.jpg')
                         imageSrc = `${BACKEND_BASE_URL}/${productImageUrl.startsWith('/') ? productImageUrl.substring(1) : productImageUrl}`;
                     } else {
                         console.warn(`Cannot construct image URL for product ${record.product?.name} (${productImageUrl}) without BACKEND_BASE_URL.`);
                     }
                 }
                 // --- End Image Logic ---

                return (
                    <span className="productimgname">
                        <Link to="#" className="product-img stock-img">
                           {/* Use standard img tag for better control */}
                            <img
                                alt={record.product?.name || 'Product Image'}
                                src={imageSrc}
                                style={{ objectFit: 'contain', width: '40px', height: '40px' }} // Adjust size as needed
                                onError={(e) => {
                                    console.error(`IMAGE LOAD ERROR for src: ${imageSrc} (Product: ${record.product?.name})`);
                                    e.target.onerror = null;
                                    e.target.src = placeholderSrc;
                                }}
                            />
                        </Link>
                         <Link to={record.product?._id ? route.productdetails.replace(':productId', record.product._id) : '#'}>
                             {record.product?.name || <span className="text-muted">N/A</span>}
                         </Link>
                    </span>
                );
            },
            // Sorter needs to access nested data carefully
            sorter: (a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''),
        },
        {
            title: "Location",
            dataIndex: ['location', 'name'], // Access nested data
            sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''),
            render: (name) => name || <span className="text-muted">N/A</span>,
        },
        {
            title: "SKU",
            dataIndex: ['product', 'sku'], // Access nested data
            sorter: (a, b) => (a.product?.sku || '').localeCompare(b.product?.sku || ''),
             render: (sku) => sku || <span className="text-muted">N/A</span>,
        },
        {
            title: "Expired Qty",
            dataIndex: "quantity",
            sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0), // Handle null/undefined with ??
             render: (qty) => qty ?? 0, // Display 0 if null/undefined
             align: 'center', // Align quantity center
        },
        {
            title: "Expired Date",
            dataIndex: "expiryDate",
            render: (date) => date ? new Date(date).toLocaleDateString() : <span className="text-muted">N/A</span>,
            sorter: (a, b) => new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0), // Handle null/undefined dates
        },
        // Removed Actions column
    ];

    // Example static sort options
    const sortOptions = [
        { value: 'expiryDate_asc', label: 'Expiry Date (Oldest First)' },
        { value: 'expiryDate_desc', label: 'Expiry Date (Newest First)' },
        { value: 'productName_asc', label: 'Product Name (A-Z)' },
    ];

    return (
        <div className="page-wrapper">
             <ToastContainer position="top-right" autoClose={3000} />
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Expired Products</h4>
                            <h6>List of products past their expiry date</h6>
                        </div>
                    </div>
                    {/* Standard Header Icons */}
                    <ul className="table-top-head">
                        {/* Add PDF/Excel links if needed */}
                        {/* <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'PDF')}><Link to="#"><ImageWithBasePath src="assets/img/icons/pdf.svg" alt="PDF" /></Link></OverlayTrigger></li> */}
                        {/* <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Excel')}><Link to="#"><ImageWithBasePath src="assets/img/icons/excel.svg" alt="Excel" /></Link></OverlayTrigger></li> */}
                        <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Refresh')}><Link to="#" onClick={(e) => { e.preventDefault(); fetchExpiredItems(); }}><RotateCcw /></Link></OverlayTrigger></li>
                        <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Collapse')}><Link to="#" id="collapse-header" className={redux_data ? "active" : ""} onClick={() => { dispatch(setToogleHeader(!redux_data)); }}><ChevronUp /></Link></OverlayTrigger></li>
                    </ul>
                </div>

                <div className="card table-list-card">
                    <div className="card-body">
                         {/* Table Top: Search, Filter Toggle, Sort */}
                         <div className="table-top">
                            {/* Search */}
                            <div className="search-set">
                                <div className="search-input">
                                    <input
                                        type="text"
                                        placeholder="Search by Product Name/SKU..."
                                        className="form-control form-control-sm formsearch"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button className="btn btn-searchset" onClick={fetchExpiredItems} title="Search">
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
                             {/* Sort Dropdown (Example - Needs implementation to apply sort) */}
                            <div className="form-sort">
                                <Sliders className="info-img" />
                                <Select
                                    className="select"
                                    styles={selectStyles} // Apply styles
                                    options={sortOptions}
                                    placeholder="Sort by..."
                                    // onChange={handleSortChange} // Add handler to apply sort
                                />
                            </div>
                        </div>

                        {/* Filter Card */}
                        <div
                            className={`card filter-card ${isFilterVisible ? " visible" : ""}`}
                            id="filter_inputs"
                            style={{ display: isFilterVisible ? "block" : "none" }}
                        >
                            <div className="card-body pb-0">
                                <div className="row">
                                    {/* Location Filter */}
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
                                        />
                                    </div>
                                    {/* Date Range Filter (Example) */}
                                    <div className="col-lg-4 col-sm-6 col-12 mb-3">
                                        {/* Replace with AntD RangePicker if needed */}
                                         <DatePicker
                                             // value={selectedDateRange[0]} // Adapt if using single date picker
                                             // onChange={(date) => setSelectedDateRange([date, selectedDateRange[1]])}
                                             placeholder="Filter by Expiry Date From"
                                             className="form-control"
                                             style={{ width: '100%' }} // Ensure full width
                                         />
                                    </div>
                                    {/* Reset Button */}
                                    <div className="col-lg-2 col-sm-6 col-12 mb-3 ms-auto">
                                        <Button variant="secondary" size="sm" onClick={resetFilters} className="w-100">
                                            <RotateCcw size={14} className="me-1"/> Reset
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="table-responsive">
                            {/* Loading and Error States Handled by Table component */}
                            <Table
                                columns={columns}
                                dataSource={expiredItems}
                                loading={loading} // Pass loading state
                                error={error} // Pass error state (if Table component supports it)
                                rowKey="_id" // Use inventory record _id
                                // Add pagination if needed
                            />
                            {/* Custom No Data Message */}
                             {!loading && !error && expiredItems.length === 0 && (
                                <div className="text-center p-5 text-muted">
                                    {searchQuery || selectedLocationFilter ? "No expired items match your current filters." : "No expired items found."}
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
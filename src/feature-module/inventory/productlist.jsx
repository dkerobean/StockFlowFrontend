import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select"; // Ensure Select is imported
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Icons
import {
    Box, ChevronUp, Download, Edit, Eye, Filter, GitMerge, PlusCircle,
    RotateCcw, Sliders, StopCircle, Trash2, Search, X // Added X icon
} from "feather-icons-react/build/IconComponents";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { setToogleHeader } from "../../core/redux/action";

// Components
import ImageWithBasePath from "../../core/img/imagewithbasebath"; // Your custom image component
import Table from "../../core/pagination/datatable"; // Your custom Table component
import { OverlayTrigger, Tooltip, Button } from "react-bootstrap"; // Added Button
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

// Routes and Config
import { all_routes } from "../../Router/all_routes"; // Your route definitions
const API_URL = process.env.REACT_APP_API_URL; // Your API base URL from .env
const BACKEND_BASE_URL = API_URL ? API_URL.replace('/api', '') : ''; // Base URL for images if served directly

// Helper function to get Authorization Header
const getAuthHeader = () => {
    const token = localStorage.getItem('token'); // Adjust key if needed
    if (!token) {
        console.error("Authentication token not found.");
        // Returning null might lead to errors later, better to handle immediately
        // Throwing an error or redirecting might be suitable depending on context
        return null;
    }
    return { Authorization: `Bearer ${token}` };
};

// Custom styles for react-select to match Bootstrap form controls
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
    menu: base => ({ ...base, zIndex: 5 }), // Ensure dropdown appears above other elements
};


const ProductList = () => {
    const route = all_routes;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header); // For collapse button
    const MySwal = withReactContent(Swal); // SweetAlert wrapper

    // --- Component State ---
    const [products, setProducts] = useState([]); // Holds the list of products
    const [isLoading, setIsLoading] = useState(false); // For loading indicator during product fetch
    const [isFetchingFilters, setIsFetchingFilters] = useState(false); // For loading indicator for filter dropdowns
    const [error, setError] = useState(null); // Stores any error during data fetching
    const [isFilterVisible, setIsFilterVisible] = useState(false); // Controls visibility of the filter card
    const [searchQuery, setSearchQuery] = useState(""); // Holds the text from the search input

    // --- Filter Data State ---
    const [categories, setCategories] = useState([]); // Options for category filter
    const [brands, setBrands] = useState([]); // Options for brand filter
    const [locations, setLocations] = useState([]); // Options for location filter

    // --- Selected Filter State ---
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null); // Currently selected category
    const [selectedBrandFilter, setSelectedBrandFilter] = useState(null); // Currently selected brand
    const [selectedLocationFilter, setSelectedLocationFilter] = useState(null); // Currently selected location

    // --- Fetch Filter Data (Categories, Brands, Locations) ---
    const fetchFilterData = useCallback(async () => {
        setIsFetchingFilters(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
             toast.error("Authentication required for fetching filters.");
             setIsFetchingFilters(false);
             return; // Stop if not authenticated
        }
        if (!API_URL) {
            console.error("API_URL is not configured.");
            toast.error("Application configuration error (API URL).");
            setIsFetchingFilters(false);
            return;
        }
        try {
            // Fetch all filter data concurrently
            const [catRes, brandRes, locRes] = await Promise.all([
                axios.get(`${API_URL}/categories`, { headers: authHeader }),
                axios.get(`${API_URL}/brands`, { headers: authHeader }),
                axios.get(`${API_URL}/locations?fields=name,type`, { headers: authHeader }) // Fetch locations with specific fields
            ]);

            // Format data for react-select: { value: _id, label: name }
            setCategories(catRes.data.map(cat => ({ value: cat._id, label: cat.name })));
            setBrands(brandRes.data.map(br => ({ value: br._id, label: br.name })));
            setLocations(locRes.data.map(loc => ({ value: loc._id, label: `${loc.name} (${loc.type})` })));
        } catch (err) {
            console.error("Error fetching filter data:", err.response ? err.response.data : err);
            toast.error("Could not load filter options. Please try refreshing.");
            // Handle specific errors like 401 Unauthorized if needed
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                navigate(route.login); // Redirect on auth error
            }
        } finally {
            setIsFetchingFilters(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [API_URL, navigate, route.login]); // Dependencies

    // --- Fetch Products (Handles Search and Filtering) ---
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null); // Clear previous errors
        const authHeader = getAuthHeader();
        if (!authHeader) {
            toast.error("Authentication required. Please log in.");
            setIsLoading(false);
            navigate(route.login);
            return;
        }
         if (!API_URL || !BACKEND_BASE_URL) { // Check config again before fetch
              console.error("API_URL or BACKEND_BASE_URL is not configured.");
              toast.error("Application configuration error.");
              setIsLoading(false);
              setError("Application configuration error.");
              return;
         }

        // Prepare query parameters for the API request
        const params = {
            populate: 'category,brand,createdBy', // Fields to populate on the backend
            search: searchQuery || undefined, // Include search term if present
            includeInactive: 'false', // Default to active products (can be changed)
            // Add filter parameters only if a selection has been made
            category: selectedCategoryFilter?.value || undefined,
            brand: selectedBrandFilter?.value || undefined,
            locationId: selectedLocationFilter?.value || undefined, // Pass selected location ID
        };

        // Optional: Remove keys with undefined values to keep the URL cleaner
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        try {
            // Make the API call to fetch products
            const response = await axios.get(`${API_URL}/products`, { headers: authHeader, params });
            setProducts(response.data || []); // Update state with fetched products
        } catch (err) {
            console.error("Error fetching products:", err.response ? err.response.data : err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch products.";
            setError(errorMessage); // Set error state to display message
             if (err.response && err.response.status === 401) {
                toast.error("Session expired. Please log in again.");
                localStorage.removeItem('token');
                navigate(route.login);
            }
        } finally {
            setIsLoading(false); // End loading state
        }
    // Dependencies: Fetch again if any filter, search query, or API URL changes
    }, [
        navigate, route.login, searchQuery, API_URL, BACKEND_BASE_URL,
        selectedCategoryFilter, selectedBrandFilter, selectedLocationFilter
    ]);

    // --- Effects ---
    // Fetch filter data when the component mounts
    useEffect(() => {
        fetchFilterData();
    }, [fetchFilterData]);

    // Fetch products when filters or search query change (with debounce)
    useEffect(() => {
        // Set up a timer to delay the fetchProducts call
        const debounceTimer = setTimeout(() => {
            fetchProducts();
        }, 300); // 300ms delay

        // Cleanup function: clear the timer if dependencies change before it fires
        return () => {
            clearTimeout(debounceTimer);
        };
    }, [fetchProducts]); // Re-run effect only when fetchProducts function identity changes


    // --- Event Handlers ---

    // Handle Deactivating a Product
    const handleDelete = (productId, productName) => {
        MySwal.fire({
            title: "Are you sure?",
            text: `This will deactivate the product "${productName}". You can reactivate it later.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, deactivate it!",
            cancelButtonText: "Cancel",
            customClass: {
                confirmButton: "btn btn-danger",
                cancelButton: "btn btn-secondary ms-2"
            },
            buttonsStyling: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                const authHeader = getAuthHeader();
                if (!authHeader) {
                    toast.error("Authentication failed. Please log in.");
                    navigate(route.login);
                    return;
                }
                try {
                    // Send DELETE request to the backend endpoint (maps to soft delete)
                    await axios.delete(`${API_URL}/products/${productId}`, { headers: authHeader });
                    MySwal.fire({
                       title: "Deactivated!",
                       text: `Product "${productName}" has been deactivated.`,
                       icon: "success",
                       timer: 1500, // Auto close after 1.5s
                       showConfirmButton: false,
                    });
                    // Refetch the product list to reflect the change
                    fetchProducts();
                } catch (err) {
                    console.error("Error deactivating product:", err.response ? err.response.data : err);
                    const deleteErrorMsg = err.response?.data?.message || "Failed to deactivate product.";
                    MySwal.fire("Error!", deleteErrorMsg, "error");
                     if (err.response && err.response.status === 401) {
                        toast.error("Session expired. Please log in again.");
                        localStorage.removeItem('token');
                        navigate(route.login);
                     }
                }
            }
        });
    };

    // Toggle the visibility of the filter section
    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };

    // Reset all filters and the search query
    const resetFilters = () => {
        setSearchQuery("");
        setSelectedCategoryFilter(null);
        setSelectedBrandFilter(null);
        setSelectedLocationFilter(null);
        setIsFilterVisible(false); // Optionally hide filters on reset
        // fetchProducts will be called automatically by the useEffect hook due to state changes
        toast.info("Filters reset");
    };


    // --- Table Column Definitions ---
    const columns = [
        {
            title: "Product",
            dataIndex: "name",
            render: (text, record) => {
                // Determine the image source, handling different URL types and providing fallback
                 let placeholderSrc = "/assets/img/placeholder-product.png"; // Path to your placeholder
                 let imageSrc = placeholderSrc;

                 if (record.imageUrl) {
                     if (record.imageUrl.startsWith('http://') || record.imageUrl.startsWith('https://')) {
                         // Absolute URL
                         imageSrc = record.imageUrl;
                     } else if (record.imageUrl.startsWith('/') && BACKEND_BASE_URL) {
                         // Relative URL starting with '/', needs backend base URL
                         imageSrc = `${BACKEND_BASE_URL}${record.imageUrl}`;
                     } else if (BACKEND_BASE_URL) {
                          // Relative URL not starting with '/', assume relative to backend root
                         imageSrc = `${BACKEND_BASE_URL}/${record.imageUrl.startsWith('/') ? record.imageUrl.substring(1) : record.imageUrl}`;
                     } else {
                        // Cannot determine URL, use placeholder
                        console.warn(`Cannot construct image URL for product ${record.name} (${record.imageUrl}) without BACKEND_BASE_URL.`);
                     }
                 }

                 return (
                     <span className="productimgname">
                         {/* Link to product details page */}
                         <Link to={route.productdetails.replace(':productId', record._id)} className="product-img stock-img">
                             {/* Use standard img tag with onError fallback */}
                             <img
                                alt={text}
                                src={imageSrc}
                                style={{ objectFit: 'contain', width: '60px', height: '60px', border: '0px solid #eee' }}
                                onError={(e) => {
                                    // If image fails to load, log error and set src to placeholder
                                    console.error(`IMAGE LOAD ERROR for src: ${imageSrc} (Product: ${record.name})`);
                                    e.target.onerror = null; // Prevent infinite loop if placeholder also fails
                                    e.target.src = placeholderSrc;
                                }}
                             />
                         </Link>
                         {/* Link to product details page (text) */}
                         <Link to={route.productdetails.replace(':productId', record._id)}>{text}</Link>
                     </span>
                 );
            },
            sorter: (a, b) => a.name.localeCompare(b.name), // Sort alphabetically by name
            width: '300px', // Fixed width for consistency
        },
        {
            title: "SKU",
            dataIndex: "sku",
            sorter: (a, b) => (a.sku || '').localeCompare(b.sku || ''), // Sort by SKU
        },
        {
            title: "Category",
            dataIndex: "category", // Field from populated data
            render: (category) => category?.name || <span className="text-muted">N/A</span>, // Display category name or N/A
            sorter: (a, b) => (a.category?.name || '').localeCompare(b.category?.name || ''), // Sort by category name
        },
        {
            title: "Brand",
            dataIndex: "brand", // Field from populated data
            render: (brand) => brand?.name || <span className="text-muted">N/A</span>, // Display brand name or N/A
            sorter: (a, b) => (a.brand?.name || '').localeCompare(b.brand?.name || ''), // Sort by brand name
        },
        {
            title: "Price",
            dataIndex: "price",
            render: (price) => price !== undefined && price !== null ? `$${Number(price).toFixed(2)}` : <span className="text-muted">N/A</span>, // Format price
            sorter: (a, b) => (a.price || 0) - (b.price || 0), // Sort numerically by price
        },
        // NOTE: "Location" column is intentionally omitted.
        // Displaying all locations a product exists in is complex for a list view.
        // Use the "Filter by Location" dropdown instead to see products at a specific location.
        {
            title: "Created By",
            dataIndex: "createdBy", // Field from populated data
            render: (createdBy) => (
                <span className="userimgname">
                    {/* Link might go to user profile if available */}
                    <Link to="#">{createdBy?.name || <span className="text-muted">Unknown</span>}</Link>
                </span>
            ),
            sorter: (a, b) => (a.createdBy?.name || '').localeCompare(b.createdBy?.name || ''), // Sort by creator name
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => {
                // Generate paths for action links using route constants
                const editProductPath = route.editproduct?.replace(':productId', record._id) || '#';
                const productDetailsPath = route.productdetails?.replace(':productId', record._id) || '#';

                // Log warnings if routes seem misconfigured
                if (editProductPath === '#') console.warn("Edit product route not configured correctly.");
                if (productDetailsPath === '#') console.warn("Product details route not configured correctly.");

                return (
                    <div className="edit-delete-action">
                        {/* View Details */}
                        <Link className="me-1 p-1 action-icon" to={productDetailsPath} title="View Details">
                            <Eye className="feather-view" size={18} />
                        </Link>
                        {/* Edit Product */}
                        <Link className="me-1 p-1 action-icon" to={editProductPath} title="Edit Product">
                            <Edit className="feather-edit" size={18} />
                        </Link>
                        {/* Deactivate Product */}
                        <Link
                            className="p-1 action-icon"
                            to="#"
                            onClick={() => handleDelete(record._id, record.name)}
                            title="Deactivate Product"
                        >
                            <Trash2 className="feather-trash-2" size={18}/>
                        </Link>
                    </div>
                );
            },
            width: '100px', // Fixed width for action buttons
        },
    ];


    // --- Tooltip Render Functions (for top buttons) ---
    const renderRefreshTooltip = (props) => (<Tooltip id="refresh-tooltip" {...props}>Refresh</Tooltip>);
    const renderCollapseTooltip = (props) => (<Tooltip id="collapse-tooltip" {...props}>Collapse</Tooltip>);


    // --- Render Component ---
    return (
        <div className="page-wrapper">
             {/* Toast notifications container */}
             <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />

            <div className="content">
                {/* Page Header */}
                <div className="page-header">
                     <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Product List</h4>
                            <h6>Manage your products</h6>
                        </div>
                    </div>
                    {/* Header Action Buttons */}
                    <ul className="table-top-head">
                        <li><OverlayTrigger placement="top" overlay={renderRefreshTooltip}><Link to="#" onClick={(e) => {e.preventDefault(); fetchProducts();}}><RotateCcw /></Link></OverlayTrigger></li>
                        <li><OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                            <Link to="#" id="collapse-header" className={data ? "active" : ""} onClick={(e) => { e.preventDefault(); dispatch(setToogleHeader(!data)); }}>
                                <ChevronUp />
                            </Link>
                        </OverlayTrigger></li>
                    </ul>
                    {/* Add Product Button */}
                    <div className="page-btn">
                        <Link to={route.addproduct} className="btn btn-added">
                            <PlusCircle className="me-2 iconsize" />Add New Product
                        </Link>
                    </div>
                </div>

                {/* Main Card for Table and Filters */}
                <div className="card table-list-card">
                    <div className="card-body">
                        {/* Top section: Search and Filter Toggle */}
                        <div className="table-top">
                            {/* Search Input */}
                            <div className="search-set">
                                <div className="search-input">
                                    <input
                                        type="text"
                                        placeholder="Search Products..."
                                        className="form-control form-control-sm formsearch"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                     <button className="btn btn-searchset" onClick={fetchProducts} title="Search">
                                        <Search className="feather-search" />
                                    </button>
                                </div>
                            </div>
                            {/* Filter Toggle Button */}
                            <div className="search-path">
                                <Link
                                    className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`}
                                    id="filter_search"
                                    to="#"
                                    onClick={(e) => {e.preventDefault(); toggleFilterVisibility();}}
                                    title={isFilterVisible ? "Hide Filters" : "Show Filters"}
                                >
                                    <Filter className="filter-icon" />
                                    <span>{isFilterVisible ? <X size={14} style={{marginLeft: '5px'}}/> : ''}</span>
                                </Link>
                            </div>
                        </div>

                        {/* Filter Section - Collapsible */}
                        <div
                            className={`card filter-card ${isFilterVisible ? " visible" : ""}`}
                            id="filter_inputs"
                            style={{ display: isFilterVisible ? "block" : "none" }}
                        >
                            <div className="card-body pb-0">
                                <div className="row">
                                    {/* Category Filter Dropdown */}
                                    <div className="col-lg-3 col-sm-6 col-12 mb-3">
                                         <Select
                                            styles={selectStyles}
                                            options={categories}
                                            value={selectedCategoryFilter}
                                            onChange={setSelectedCategoryFilter}
                                            placeholder="Filter by Category..."
                                            isClearable
                                            isLoading={isFetchingFilters}
                                            classNamePrefix="react-select" // For potential custom CSS
                                        />
                                    </div>
                                    {/* Brand Filter Dropdown */}
                                    <div className="col-lg-3 col-sm-6 col-12 mb-3">
                                         <Select
                                            styles={selectStyles}
                                            options={brands}
                                            value={selectedBrandFilter}
                                            onChange={setSelectedBrandFilter}
                                            placeholder="Filter by Brand..."
                                            isClearable
                                            isLoading={isFetchingFilters}
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    {/* Location Filter Dropdown */}
                                    <div className="col-lg-3 col-sm-6 col-12 mb-3">
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
                                        <small className="form-text text-muted d-block mt-1">
                                            Shows products available at this location (Requires backend support).
                                        </small>
                                    </div>
                                    {/* Reset Filters Button */}
                                     <div className="col-lg-3 col-sm-6 col-12 mb-3 d-flex align-items-end"> {/* Align button bottom */}
                                        <Button variant="secondary" size="sm" onClick={resetFilters} className="w-100">
                                            <RotateCcw size={14} className="me-1"/> Reset Filters
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="table-responsive">
                            {/* Loading Indicator */}
                            {isLoading && <div className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading products...</span></div></div>}
                            {/* Error Message */}
                            {!isLoading && error && <div className="alert alert-danger mx-2">Error: {error} <button onClick={fetchProducts} className="btn btn-sm btn-link p-0 ms-2">Retry</button></div>}
                            {/* Table Display */}
                            {!isLoading && !error && (
                                 <Table // Your custom AntD-like Table component
                                    columns={columns}
                                    dataSource={products} // Pass the fetched products
                                    rowKey="_id" // Use MongoDB '_id' as the unique key
                                    // Add pagination configuration if your Table component supports it
                                    // Example: pagination={{ pageSize: 10, showSizeChanger: true }}
                                />
                            )}
                            {/* No Results Messages */}
                             {!isLoading && !error && products.length === 0 && !searchQuery && !selectedCategoryFilter && !selectedBrandFilter && !selectedLocationFilter &&(
                                <div className="text-center p-5 text-muted">No products found. <Link to={route.addproduct}>Add your first product!</Link></div>
                            )}
                             {!isLoading && !error && products.length === 0 && (searchQuery || selectedCategoryFilter || selectedBrandFilter || selectedLocationFilter) && (
                                <div className="text-center p-5 text-muted">No products match your current filters or search criteria.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductList; // Export the component
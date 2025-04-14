import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from 'axios'; // Import axios
import { toast, ToastContainer } from 'react-toastify'; // Import toast
import 'react-toastify/dist/ReactToastify.css'; // Toast styles
// import dayjs from 'dayjs'; // Keep if needed for other date formatting

// Icons
import {
    Box, ChevronUp, Download, Edit, Eye, Filter, GitMerge, PlusCircle,
    RotateCcw, Sliders, StopCircle, Trash2, Search // Added Search icon
} from "feather-icons-react/build/IconComponents";

// Redux (Keep for header toggle)
import { useDispatch, useSelector } from "react-redux";
import { setToogleHeader } from "../../core/redux/action";

// Components
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import Table from "../../core/pagination/datatable"; // Assuming this is your DataTable component
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

// Routes and Config
import { all_routes } from "../../Router/all_routes";
const API_URL = process.env.REACT_APP_API_URL; // Get API URL from .env
// **** Derive Backend Base URL (adjust if API_URL structure differs) ****
// This assumes API_URL is like 'http://<host>:<port>/api'
const BACKEND_BASE_URL = API_URL ? API_URL.replace('/api', '') : '';

// Helper function to get Authentication Token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token not found.");
        return null;
    }
    return { Authorization: `Bearer ${token}` };
};

const ProductList = () => {
    const route = all_routes;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header); // For header collapse
    const MySwal = withReactContent(Swal);

    // --- State ---
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState(""); // State for search input

    // --- Fetch Products Function (Keep as is) ---
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            toast.error("Authentication required. Please log in.");
            setIsLoading(false);
            navigate(route.login);
            return;
        }
        if (!API_URL || !BACKEND_BASE_URL) {
             console.error("API_URL or BACKEND_BASE_URL is not configured properly in .env");
             toast.error("Application configuration error.");
             setIsLoading(false);
             setError("Application configuration error.");
             return;
        }

        try {
            const response = await axios.get(`${API_URL}/products?populate=category,brand,createdBy`, {
                headers: authHeader,
                params: {
                    search: searchQuery || undefined
                }
            });
            setProducts(response.data || []);
        } catch (err) {
            console.error("Error fetching products:", err.response ? err.response.data : err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch products.";
            setError(errorMessage);
            toast.error(errorMessage);

            if (err.response && err.response.status === 401) {
                toast.error("Session expired. Please log in again.");
                localStorage.removeItem('token');
                navigate(route.login);
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate, route.login, searchQuery]); // Removed API_URL from dependency array - it's constant


    // --- Initial Data Fetch (Keep as is) ---
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // --- Handle Search (Client-side filtering - Keep as is or adapt for backend search) ---
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) || // Add check for sku existence
        (product.category?.name && product.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.brand?.name && product.brand.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // --- Handle Delete (Keep as is) ---
    const handleDelete = (productId, productName) => {
        MySwal.fire({
            title: "Are you sure?",
            text: `You won't be able to revert deleting "${productName}"!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
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
                    // Using DELETE request for soft delete as per your controller
                    await axios.delete(`${API_URL}/products/${productId}`, { headers: authHeader });
                    MySwal.fire({
                       title: "Deactivated!", // Changed title to reflect soft delete
                       text: `Product "${productName}" has been deactivated.`,
                       icon: "success",
                       confirmButtonText: "OK",
                       customClass: { confirmButton: "btn btn-success" } ,
                       buttonsStyling: false
                    });
                    fetchProducts(); // Refresh list
                } catch (err) {
                    console.error("Error deactivating product:", err.response ? err.response.data : err);
                    const deleteErrorMsg = err.response?.data?.message || "Failed to deactivate product.";
                    toast.error(deleteErrorMsg);
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

    // --- Table Columns Definition ---
    const columns = [
    {
        title: "Product",
        dataIndex: "name",
        render: (text, record) => {
            // --- Construct the full image source URL ---
            // *** FIX Placeholder Path: Should be relative to public folder ***
            let placeholderSrc = "/assets/img/placeholder-product.png"; // Assuming assets is in your public folder

            let imageSrc = placeholderSrc; // Default to placeholder

            if (record.imageUrl) {
                if (record.imageUrl.startsWith('http://') || record.imageUrl.startsWith('https://')) {
                    imageSrc = record.imageUrl;
                } else if (record.imageUrl.startsWith('/') && BACKEND_BASE_URL) {
                    imageSrc = `${BACKEND_BASE_URL}${record.imageUrl}`;
                }
                // If imageUrl exists but isn't absolute or relative starting with '/', imageSrc remains placeholderSrc
            }
            console.log("Attempting to load image from:", imageSrc);

            // --- ** TEST: Replace ImageWithBasePath with standard img ** ---
            return (
                <span className="productimgname">
                    <Link to={`${route.productdetails}/${record._id}`} className="product-img stock-img">
                        {/* Use standard img tag for testing */}
                        <img
                           alt={text}
                           src={imageSrc} // Use the constructed full URL or placeholder
                           style={{ objectFit: 'contain', width: '60px', height: '60px', border: '0px solid green' }} // Added border for visibility
                           onError={(e) => {
                               console.error(`IMAGE LOAD ERROR for src: ${imageSrc}`, e);
                               // Prevent infinite loop if the placeholder also fails
                               e.target.onerror = null;
                               // Set to a known simple placeholder path on error
                               e.target.src = "/assets/img/placeholder-product.png";
                           }}
                        />
                    </Link>
                    <Link to={`${route.productdetails}/${record._id}`}>{text}</Link>
                </span>
            );
            // --- ** End Test ** ---
        },
        sorter: (a, b) => a.name.localeCompare(b.name),
        width: '450px',
    },

        {
            title: "SKU",
            dataIndex: "sku",
            sorter: (a, b) => (a.sku || '').localeCompare(b.sku || ''), // Handle potential missing SKU
        },
        {
            title: "Category",
            dataIndex: "category",
            render: (category) => category?.name || <span className="text-muted">N/A</span>,
            sorter: (a, b) => (a.category?.name || '').localeCompare(b.category?.name || ''),
        },
        {
            title: "Brand",
            dataIndex: "brand",
            render: (brand) => brand?.name || <span className="text-muted">N/A</span>,
            sorter: (a, b) => (a.brand?.name || '').localeCompare(b.brand?.name || ''),
        },
        {
            title: "Price",
            dataIndex: "price",
            render: (price) => `$${Number(price).toFixed(2)}`,
            sorter: (a, b) => a.price - b.price,
        },
        {
            title: "Created By",
            dataIndex: "createdBy",
            render: (createdBy) => (
                <span className="userimgname">
                     {/* Link to profile page if available, otherwise just display name */}
                    <Link to="#">{createdBy?.name || <span className="text-muted">Unknown</span>}</Link>
                </span>
            ),
            sorter: (a, b) => (a.createdBy?.name || '').localeCompare(b.createdBy?.name || ''),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <div className="edit-delete-action">
                    <Link className="me-1 p-1" to={`${route.productdetails}/${record._id}`} title="View Details">
                        <Eye className="feather-view" />
                    </Link>
                    <Link className="me-2 p-2" to={`${route.editproduct}/${record._id}`} title="Edit Product">
                        <Edit className="feather-edit" />
                    </Link>
                    <Link
                        className="p-2"
                        to="#"
                        onClick={() => handleDelete(record._id, record.name)}
                        title="Deactivate Product" // Changed title for soft delete
                    >
                        <Trash2 className="feather-trash-2" />
                    </Link>
                </div>
            ),
            width: '120px',
        },
    ];


    // --- Tooltip Render Functions (Keep as is) ---
    const renderTooltip = (props) => (<Tooltip id="pdf-tooltip" {...props}>Pdf</Tooltip>);
    const renderExcelTooltip = (props) => (<Tooltip id="excel-tooltip" {...props}>Excel</Tooltip>);
    const renderPrinterTooltip = (props) => (<Tooltip id="printer-tooltip" {...props}>Printer</Tooltip>);
    const renderRefreshTooltip = (props) => (<Tooltip id="refresh-tooltip" {...props}>Refresh</Tooltip>);
    const renderCollapseTooltip = (props) => (<Tooltip id="collapse-tooltip" {...props}>Collapse</Tooltip>);

    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };

    // --- Filter Dropdown Options (Needs implementation if used) ---
    // const [filterCategories, setFilterCategories] = useState([]); // Example state
    // const [filterBrands, setFilterBrands] = useState([]); // Example state
    // useEffect(() => { /* Fetch categories/brands for filter dropdowns */ }, []);

    return (
        <div className="page-wrapper">
             {/* Toast Container */}
             <ToastContainer /* ...props */ />

            <div className="content">
                <div className="page-header">
                    {/* Header Content (Keep as is) */}
                     <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Product List</h4>
                            <h6>Manage your products</h6>
                        </div>
                    </div>
                    <ul className="table-top-head">
                       {/* ... (PDF, Excel, etc. buttons) ... */}
                        <li><OverlayTrigger placement="top" overlay={renderRefreshTooltip}><Link to="#" onClick={(e) => {e.preventDefault(); fetchProducts();}}><RotateCcw /></Link></OverlayTrigger></li>
                        <li><OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                            <Link to="#" id="collapse-header" className={data ? "active" : ""} onClick={(e) => { e.preventDefault(); dispatch(setToogleHeader(!data)); }}>
                                <ChevronUp />
                            </Link>
                        </OverlayTrigger></li>
                    </ul>
                    <div className="page-btn">
                        <Link to={route.addproduct} className="btn btn-added">
                            <PlusCircle className="me-2 iconsize" />Add New Product
                        </Link>
                    </div>
                    {/* ... (Import button) ... */}
                </div>

                <div className="card table-list-card">
                    <div className="card-body">
                        <div className="table-top">
                            {/* Search Input (Keep as is, or connect onKeyPress/button to fetchProducts for backend search) */}
                            <div className="search-set">
                                <div className="search-input">
                                    <input
                                        type="text"
                                        placeholder="Search Products..."
                                        className="form-control form-control-sm formsearch"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && fetchProducts()} // Trigger search on Enter
                                    />
                                    <button className="btn btn-searchset" onClick={fetchProducts}> {/* Use button for click search */}
                                        <Search className="feather-search" />
                                    </button>
                                </div>
                            </div>
                             {/* Filter Button (Keep as is) */}
                            <div className="search-path">
                                <Link
                                    className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`}
                                    id="filter_search"
                                    to="#"
                                    onClick={(e) => {e.preventDefault(); toggleFilterVisibility();}}
                                >
                                    <Filter className="filter-icon" />
                                    <span>{isFilterVisible ? <ImageWithBasePath src="assets/img/icons/closes.svg" alt="img" /> : ''}</span>
                                </Link>
                            </div>
                            {/* ... (Sort dropdown placeholder) ... */}
                        </div>

                        {/* Filter Section (Connect to state and fetchProducts for backend filtering) */}
                        <div
                            className={`card filter-card ${isFilterVisible ? " visible" : ""}`}
                            id="filter_inputs"
                            style={{ display: isFilterVisible ? "block" : "none" }}
                        >
                            <div className="card-body pb-0">
                                <div className="row">
                                    {/* --- Example Filter Inputs (Needs wiring) --- */}
                                    {/*
                                    <div className="col-lg-3 col-sm-6 col-12">
                                        <div className="input-blocks">
                                            <CategoryIcon className="info-img" /> // Replace with actual icon
                                            <Select
                                                className="select"
                                                options={filterCategories} // Use dynamic options
                                                // value={selectedFilterCategory}
                                                // onChange={setSelectedFilterCategory}
                                                placeholder="Filter by Category"
                                                isClearable
                                            />
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-sm-6 col-12">
                                        <div className="input-blocks">
                                             <BrandIcon className="info-img" /> // Replace with actual icon
                                             <Select
                                                className="select"
                                                options={filterBrands} // Use dynamic options
                                                // value={selectedFilterBrand}
                                                // onChange={setSelectedFilterBrand}
                                                placeholder="Filter by Brand"
                                                isClearable
                                             />
                                        </div>
                                    </div>
                                    */}
                                    {/* --- Search Button for Filters --- */}
                                    <div className="col-lg-2 col-sm-6 col-12 ms-auto">
                                         <div className="input-blocks">
                                            <button className="btn btn-filters w-100" /* onClick={applyFilters} */ >
                                                <Search className="feather-search me-1" /> Search
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* End Filter Section */}

                        {/* Table Section */}
                        <div className="table-responsive">
                             {isLoading && <div className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}
                            {!isLoading && error && <div className="text-center p-5 text-danger">Error: {error}</div>}
                            {!isLoading && !error && (
                                 <Table
                                    columns={columns}
                                    // Use 'products' if search/filter is done backend, 'filteredProducts' if client-side
                                    dataSource={products} // Switched to 'products' assuming backend search is preferred
                                    rowKey="_id"
                                    // pagination={{ pageSize: 10 }} // Example pagination config if your Table supports it
                                />
                            )}
                            {/* No results messages (adjust based on using products vs filteredProducts) */}
                             {!isLoading && !error && products.length === 0 && !searchQuery && (
                                <div className="text-center p-5 text-muted">No products found. <Link to={route.addproduct}>Add your first product!</Link></div>
                            )}
                             {!isLoading && !error && products.length === 0 && searchQuery && (
                                <div className="text-center p-5 text-muted">No products match your search criteria "{searchQuery}".</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import dayjs from 'dayjs';

// Icons
import {
    Box, ChevronUp, Download, Edit, Eye, Filter, GitMerge, PlusCircle,
    RotateCcw, Sliders, StopCircle, Trash2, Search
} from "feather-icons-react/build/IconComponents";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { setToogleHeader } from "../../core/redux/action";

// Components
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import Table from "../../core/pagination/datatable";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

// Routes and Config
import { all_routes } from "../../Router/all_routes";
const API_URL = process.env.REACT_APP_API_URL;
const BACKEND_BASE_URL = API_URL ? API_URL.replace('/api', '') : '';

// Helper function
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
    const data = useSelector((state) => state.toggle_header);
    const MySwal = withReactContent(Swal);

    // --- State ---
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // --- Fetch Products ---
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
            // Fetch active products by default, include populated fields
            // Use search param if searchQuery is not empty
            const response = await axios.get(`${API_URL}/products`, {
                headers: authHeader,
                params: {
                    populate: 'category,brand,createdBy',
                    search: searchQuery || undefined, // Send search term if present
                    includeInactive: 'false' // Or manage this via filter state if needed
                }
            });
            setProducts(response.data || []);
        } catch (err) {
            console.error("Error fetching products:", err.response ? err.response.data : err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch products.";
            setError(errorMessage);
            // Don't toast error here again if fetchProducts is called multiple times (e.g., search)
            // Let the UI show the error state instead.
            // toast.error(errorMessage); // Optional: Keep if preferred

            if (err.response && err.response.status === 401) {
                toast.error("Session expired. Please log in again.");
                localStorage.removeItem('token');
                navigate(route.login);
            }
        } finally {
            setIsLoading(false);
        }
        // Added API_URL back as dependency, although technically constant, it's safer.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, route.login, searchQuery, API_URL]);


    // --- Initial Data Fetch & Fetch on Search Change ---
    useEffect(() => {
        // Debounce search fetch? Optional optimization. For now, fetch on change.
        const handler = setTimeout(() => {
            fetchProducts();
        }, 300); // Debounce search requests slightly

        return () => {
            clearTimeout(handler); // Cleanup timeout on component unmount or query change
        };
    }, [fetchProducts, searchQuery]); // Fetch when fetchProducts or searchQuery changes

    // --- Client-side filtering (REMOVED - Assuming backend search is primary) ---
    // const filteredProducts = products.filter(...) // Keep only if client-side filtering is still desired as a fallback

    // --- Handle Delete ---
    const handleDelete = (productId, productName) => {
        MySwal.fire({
            title: "Are you sure?",
            text: `This will deactivate the product "${productName}". You can reactivate it later.`, // Updated text
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33", // Red for delete/deactivate
            cancelButtonColor: "#3085d6", // Blue for cancel
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
                    // Using DELETE request mapped to soft delete endpoint
                    await axios.delete(`${API_URL}/products/${productId}`, { headers: authHeader });
                    MySwal.fire({
                       title: "Deactivated!",
                       text: `Product "${productName}" has been deactivated.`,
                       icon: "success",
                       confirmButtonText: "OK",
                       customClass: { confirmButton: "btn btn-success" } ,
                       buttonsStyling: false
                    });
                    // Trigger a refetch *after* the confirmation modal is closed
                    fetchProducts();
                } catch (err) {
                    console.error("Error deactivating product:", err.response ? err.response.data : err);
                    const deleteErrorMsg = err.response?.data?.message || "Failed to deactivate product.";
                    // toast.error(deleteErrorMsg); // Show error in Swal instead
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
                let placeholderSrc = "/assets/img/placeholder-product.png";
                let imageSrc = placeholderSrc;

                if (record.imageUrl) {
                    if (record.imageUrl.startsWith('http://') || record.imageUrl.startsWith('https://')) {
                        imageSrc = record.imageUrl;
                    } else if (record.imageUrl.startsWith('/') && BACKEND_BASE_URL) {
                        // Prepend backend base URL only if imageUrl starts with '/' and base URL exists
                        imageSrc = `${BACKEND_BASE_URL}${record.imageUrl}`;
                    } else if (BACKEND_BASE_URL) {
                         // If it doesn't start with '/' or http, assume it's relative to base URL (e.g., 'uploads/image.jpg')
                         // This might need adjustment based on how backend saves/serves URLs
                         // imageSrc = `${BACKEND_BASE_URL}/${record.imageUrl}`; // Uncomment/adjust if needed
                         // For now, safer to default to placeholder if format isn't recognized absolute/relative
                         console.warn(`Unrecognized image URL format for product ${record.name}: ${record.imageUrl}. Using placeholder.`);
                    }
                }
                 console.log("Product:", record.name, "Attempting image:", imageSrc);

                return (
                    <span className="productimgname">
                        <Link to={route.productdetails.replace(':productId', record._id)} className="product-img stock-img">
                             {/* Using standard img with error handling */}
                            <img
                               alt={text}
                               src={imageSrc}
                               style={{ objectFit: 'contain', width: '60px', height: '60px', border: '0px solid #eee' }} // Example styling
                               onError={(e) => {
                                   console.error(`IMAGE LOAD ERROR for src: ${imageSrc} (Product: ${record.name})`);
                                   e.target.onerror = null;
                                   e.target.src = placeholderSrc; // Fallback to placeholder on error
                               }}
                            />
                        </Link>
                        <Link to={route.productdetails.replace(':productId', record._id)}>{text}</Link>
                    </span>
                );
            },
            sorter: (a, b) => a.name.localeCompare(b.name),
            width: '300px', // Adjusted width slightly
        },
        {
            title: "SKU",
            dataIndex: "sku",
            sorter: (a, b) => (a.sku || '').localeCompare(b.sku || ''),
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
            render: (price) => price !== undefined && price !== null ? `$${Number(price).toFixed(2)}` : <span className="text-muted">N/A</span>,
            sorter: (a, b) => (a.price || 0) - (b.price || 0), // Handle potential null/undefined price
        },
        {
            title: "Created By",
            dataIndex: "createdBy",
            render: (createdBy) => (
                <span className="userimgname">
                    {/* Consider linking to a user profile page if available */}
                    <Link to="#">{createdBy?.name || <span className="text-muted">Unknown</span>}</Link>
                </span>
            ),
            sorter: (a, b) => (a.createdBy?.name || '').localeCompare(b.createdBy?.name || ''),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => {
                // --- ** Check if route.editproduct exists and has :productId ** ---
                const editProductPath = route.editproduct && route.editproduct.includes(':productId')
                    ? route.editproduct.replace(':productId', record._id)
                    : '#'; // Fallback URL if route is misconfigured

                    console.log(`Rendering Edit Link for ID ${record._id}: Path = ${editProductPath}`);

                if (editProductPath === '#') {
                    console.warn("Edit product route is not configured correctly in all_routes.js");
                }

                const productDetailsPath = route.productdetails && route.productdetails.includes(':productId')
                    ? route.productdetails.replace(':productId', record._id)
                    : '#';

                if (productDetailsPath === '#') {
                    console.warn("Product details route is not configured correctly in all_routes.js");
                }

                return (
                    <div className="edit-delete-action">
                        <Link className="me-1 p-1 action-icon" to={productDetailsPath} title="View Details">
                            <Eye className="feather-view" size={18} />
                        </Link>
                        {/* --- Updated Link --- */}
                        <Link className="me-1 p-1 action-icon" to={editProductPath} title="Edit Product">
                            <Edit className="feather-edit" size={18} />
                        </Link>
                        {/* --- End Update --- */}
                        <Link
                            className="p-1 action-icon" // Added action-icon class for consistency
                            to="#"
                            onClick={() => handleDelete(record._id, record.name)}
                            title="Deactivate Product"
                        >
                            <Trash2 className="feather-trash-2" size={18}/>
                        </Link>
                    </div>
                );
            },
            width: '100px', // Adjusted width
        },
    ];


    // --- Tooltip Render Functions ---
    // ... (renderTooltip functions remain the same) ...
    const renderRefreshTooltip = (props) => (<Tooltip id="refresh-tooltip" {...props}>Refresh</Tooltip>);
    const renderCollapseTooltip = (props) => (<Tooltip id="collapse-tooltip" {...props}>Collapse</Tooltip>);

    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };

    return (
        <div className="page-wrapper">
             <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />

            <div className="content">
                <div className="page-header">
                     <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Product List</h4>
                            <h6>Manage your products</h6>
                        </div>
                    </div>
                    <ul className="table-top-head">
                       {/* PDF/Excel/Print buttons removed for brevity, add back if needed */}
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
                     {/* Import button removed for brevity, add back if needed */}
                </div>

                <div className="card table-list-card">
                    <div className="card-body">
                        <div className="table-top">
                            <div className="search-set">
                                <div className="search-input">
                                    <input
                                        type="text"
                                        placeholder="Search by Name, SKU, Category, Brand..." // Updated placeholder
                                        className="form-control form-control-sm formsearch"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        // Removed onKeyPress, fetch happens via useEffect debounce now
                                    />
                                    {/* Keep button if manual trigger is desired */}
                                     <button className="btn btn-searchset" onClick={fetchProducts} title="Search">
                                        <Search className="feather-search" />
                                    </button>
                                </div>
                            </div>
                            <div className="search-path">
                                <Link
                                    className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`}
                                    id="filter_search"
                                    to="#"
                                    onClick={(e) => {e.preventDefault(); toggleFilterVisibility();}}
                                    title="Show/Hide Filters"
                                >
                                    <Filter className="filter-icon" />
                                    <span>{isFilterVisible ? <X size={14} style={{marginLeft: '5px'}}/> : ''}</span> {/* Use X icon */}
                                </Link>
                            </div>
                             {/* Sort dropdown removed for brevity */}
                        </div>

                        {/* Filter Section (Placeholder - Requires state and logic) */}
                        <div
                            className={`card filter-card ${isFilterVisible ? " visible" : ""}`}
                            id="filter_inputs"
                            style={{ display: isFilterVisible ? "block" : "none" }}
                        >
                            <div className="card-body pb-0">
                                <div className="row">
                                    <div className="col-12 text-muted mb-2">
                                        Filters are not yet implemented. Add Category/Brand dropdowns here and update `fetchProducts` params.
                                    </div>
                                    {/* Example Filter Inputs (Add state and logic) */}
                                    {/* <div className="col-lg-3 col-sm-6 col-12"> ... Category Select ... </div> */}
                                    {/* <div className="col-lg-3 col-sm-6 col-12"> ... Brand Select ... </div> */}
                                    {/* <div className="col-lg-2 col-sm-6 col-12 ms-auto"> ... Search Button ... </div> */}
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="table-responsive">
                            {isLoading && <div className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}
                            {!isLoading && error && <div className="alert alert-danger mx-2">Error: {error} <button onClick={fetchProducts} className="btn btn-sm btn-link p-0">Retry</button></div>}
                            {!isLoading && !error && (
                                 <Table
                                    columns={columns}
                                    dataSource={products} // Using 'products' directly as filtering/search is backend
                                    rowKey="_id"
                                    // Add pagination options if your Table component supports them
                                    // pagination={{ current: currentPage, pageSize: 10, total: totalProducts, onChange: handlePageChange }}
                                />
                            )}
                            {/* No Results Messages */}
                             {!isLoading && !error && products.length === 0 && !searchQuery && (
                                <div className="text-center p-5 text-muted">No products found. <Link to={route.addproduct}>Add your first product!</Link></div>
                            )}
                            {/* Updated message for search */}
                             {!isLoading && !error && products.length === 0 && searchQuery && (
                                <div className="text-center p-5 text-muted">No products match your search: "{searchQuery}".</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
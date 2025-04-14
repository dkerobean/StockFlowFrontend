import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from 'axios'; // Import axios
import { toast, ToastContainer } from 'react-toastify'; // Import toast
import 'react-toastify/dist/ReactToastify.css'; // Toast styles
import dayjs from 'dayjs'; // Although not directly used in list, might be needed for formatting future date columns

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

// Helper function to get Authentication Token (Same as in AddProduct)
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

    // --- Fetch Products Function ---
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null); // Reset error state
        const authHeader = getAuthHeader();
        if (!authHeader) {
            toast.error("Authentication required. Please log in.");
            setIsLoading(false);
            navigate(route.login);
            return;
        }

        try {
            // Fetch products and populate related fields
            // Adjust the populate query based on your backend setup
            // Common usage: '?populate=category,brand,createdBy'
            const response = await axios.get(`${API_URL}/products?populate=category,brand,createdBy`, {
                headers: authHeader,
                params: { // Optional: Add search query parameter if backend supports it
                    search: searchQuery || undefined // Send search only if it's not empty
                }
            });
            setProducts(response.data || []); // Ensure response.data is an array
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
    // Include searchQuery in dependency array if you want to trigger fetch on search change (for backend search)
    // If search is purely client-side, remove searchQuery from here
    }, [navigate, route.login, searchQuery, API_URL]); // Added API_URL

    // --- Initial Data Fetch ---
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); // fetchProducts is now memoized with useCallback

    // --- Handle Search (Client-side filtering example) ---
    // If implementing backend search, modify fetchProducts and potentially remove this
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category?.name && product.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.brand?.name && product.brand.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // --- Handle Delete ---
    const handleDelete = (productId, productName) => {
        MySwal.fire({
            title: "Are you sure?",
            text: `You won't be able to revert deleting "${productName}"!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33", // Red for delete confirmation
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            customClass: { // Optional: Use custom classes if needed for styling
                confirmButton: "btn btn-danger",
                cancelButton: "btn btn-secondary ms-2"
            },
            buttonsStyling: false // Use Bootstrap classes defined above
        }).then(async (result) => {
            if (result.isConfirmed) {
                const authHeader = getAuthHeader();
                if (!authHeader) {
                    toast.error("Authentication failed. Please log in.");
                    navigate(route.login);
                    return;
                }
                try {
                    await axios.delete(`${API_URL}/products/${productId}`, { headers: authHeader });
                    MySwal.fire({
                       title: "Deleted!",
                       text: `Product "${productName}" has been deleted.`,
                       icon: "success",
                       confirmButtonText: "OK",
                       customClass: { confirmButton: "btn btn-success" } ,
                       buttonsStyling: false
                    });
                    // Refresh the list after successful deletion
                    fetchProducts();
                } catch (err) {
                    console.error("Error deleting product:", err.response ? err.response.data : err);
                    const deleteErrorMsg = err.response?.data?.message || "Failed to delete product.";
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
            dataIndex: "name", // Use the 'name' field from the model
            render: (text, record) => (
                <span className="productimgname">
                    <Link to={`${route.productdetails}/${record._id}`} className="product-img stock-img">
                        {/* Use record.imageUrl or a default image */}
                        <ImageWithBasePath
                           alt={text}
                           // Provide a fallback image path if imageUrl is empty or missing
                           src={record.imageUrl || "assets/img/placeholder-product.png"}
                           style={{ objectFit: 'contain', width: '40px', height: '40px' }} // Example styling
                         />
                    </Link>
                    <Link to={`${route.productdetails}/${record._id}`}>{text}</Link>
                </span>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
            width: '250px', // Adjust width as needed
        },
        {
            title: "SKU",
            dataIndex: "sku",
            sorter: (a, b) => a.sku.localeCompare(b.sku),
        },
        {
            title: "Category",
            dataIndex: "category",
            render: (category) => category?.name || <span className="text-muted">N/A</span>, // Access populated category name
            sorter: (a, b) => (a.category?.name || '').localeCompare(b.category?.name || ''),
        },
        {
            title: "Brand",
            dataIndex: "brand",
            render: (brand) => brand?.name || <span className="text-muted">N/A</span>, // Access populated brand name or show N/A
            sorter: (a, b) => (a.brand?.name || '').localeCompare(b.brand?.name || ''),
        },
        {
            title: "Price",
            dataIndex: "price",
            render: (price) => `$${Number(price).toFixed(2)}`, // Format price
            sorter: (a, b) => a.price - b.price,
        },
        // { // The model doesn't have 'unit' or 'qty'. Remove or adapt if needed.
        //   title: "Unit",
        //   dataIndex: "unit", // This field doesn't exist in your model
        //   sorter: (a, b) => a.unit.length - b.unit.length,
        // },
        // { // Qty needs aggregation from Inventory model - complex, maybe show in details view?
        //   title: "Qty",
        //   dataIndex: "qty", // This field doesn't exist directly on Product
        //   render: () => 'N/A', // Placeholder
        //   sorter: (a, b) => a.qty - b.qty,
        // },
        {
            title: "Created By",
            dataIndex: "createdBy",
            render: (createdBy) => (
                <span className="userimgname">
                    {/* Assuming createdBy is populated with at least 'name'. Add image if available */}
                    {/* <Link to="/profile" className="product-img">
                      <ImageWithBasePath alt="" src={createdBy?.profileImage || 'assets/img/users/default-avatar.png'} />
                    </Link> */}
                    <Link to="#">{createdBy?.name || <span className="text-muted">Unknown</span>}</Link>
                </span>
            ),
            sorter: (a, b) => (a.createdBy?.name || '').localeCompare(b.createdBy?.name || ''),
        },
        {
            title: "Action",
            key: "action", // Added key for uniqueness
            render: (_, record) => ( // Use '_' if the first arg (text) isn't needed
                <div className="edit-delete-action">
                    <Link className="me-1 p-1" to={`${route.productdetails}/${record._id}`} title="View Details">
                        <Eye className="feather-view" />
                    </Link>
                    <Link className="me-2 p-2" to={`${route.editproduct}/${record._id}`} title="Edit Product">
                        <Edit className="feather-edit" />
                    </Link>
                    <Link
                        className="p-2" // Removed confirm-text class, using title instead
                        to="#"
                        onClick={() => handleDelete(record._id, record.name)}
                        title="Delete Product"
                    >
                        <Trash2 className="feather-trash-2" />
                    </Link>
                </div>
            ),
            width: '120px', // Adjust width
        },
    ];


    // --- Tooltip Render Functions (Keep as they are) ---
    const renderTooltip = (props) => (<Tooltip id="pdf-tooltip" {...props}>Pdf</Tooltip>);
    const renderExcelTooltip = (props) => (<Tooltip id="excel-tooltip" {...props}>Excel</Tooltip>);
    const renderPrinterTooltip = (props) => (<Tooltip id="printer-tooltip" {...props}>Printer</Tooltip>);
    const renderRefreshTooltip = (props) => (<Tooltip id="refresh-tooltip" {...props}>Refresh</Tooltip>);
    const renderCollapseTooltip = (props) => (<Tooltip id="collapse-tooltip" {...props}>Collapse</Tooltip>); // Corrected id

    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };

    // --- Filter Dropdown Options (REMOVE or Replace with dynamic data/backend integration) ---
    // These static options don't reflect your actual data
    // const options = [ ... ];
    // const productlist = [ ... ];
    // const categorylist = [ ... ];
    // const subcategorylist = [ ... ];
    // const brandlist = [ ... ];
    // const price = [ ... ];

    return (
        <div className="page-wrapper">
             {/* Toast Container for Notifications */}
             <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Product List</h4>
                            <h6>Manage your products</h6>
                        </div>
                    </div>
                    {/* Top Action Buttons */}
                    <ul className="table-top-head">
                       {/* PDF, Excel, Print buttons (Functionality needs implementation) */}
                        <li><OverlayTrigger placement="top" overlay={renderTooltip}><Link to="#"><ImageWithBasePath src="assets/img/icons/pdf.svg" alt="img" /></Link></OverlayTrigger></li>
                        <li><OverlayTrigger placement="top" overlay={renderExcelTooltip}><Link to="#"><ImageWithBasePath src="assets/img/icons/excel.svg" alt="img" /></Link></OverlayTrigger></li>
                        <li><OverlayTrigger placement="top" overlay={renderPrinterTooltip}><Link to="#"><i className="feather-printer" /></Link></OverlayTrigger></li>
                        <li><OverlayTrigger placement="top" overlay={renderRefreshTooltip}><Link to="#" onClick={fetchProducts}><RotateCcw /></Link></OverlayTrigger></li>
                        <li><OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                            <Link to="#" id="collapse-header" className={data ? "active" : ""} onClick={(e) => { e.preventDefault(); dispatch(setToogleHeader(!data)); }}>
                                <ChevronUp />
                            </Link>
                        </OverlayTrigger></li>
                    </ul>
                    {/* Add/Import Buttons */}
                    <div className="page-btn">
                        <Link to={route.addproduct} className="btn btn-added">
                            <PlusCircle className="me-2 iconsize" />Add New Product
                        </Link>
                    </div>
                    <div className="page-btn import">
                        {/* Import Functionality Modal Trigger (Modal needs implementation) */}
                        <Link to="#" className="btn btn-added color" /* data-bs-toggle="modal" data-bs-target="#import-product-modal" */ >
                            <Download className="me-2" />Import Product
                        </Link>
                    </div>
                </div>

                {/* Product list card */}
                <div className="card table-list-card">
                    <div className="card-body">
                        <div className="table-top">
                            {/* Search Input */}
                            <div className="search-set">
                                <div className="search-input">
                                    <input
                                        type="text"
                                        placeholder="Search Products (Name, SKU, Category...)"
                                        className="form-control form-control-sm formsearch"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        // Optional: Trigger backend search on Enter or button click
                                        // onKeyPress={(e) => e.key === 'Enter' && fetchProducts()}
                                    />
                                    <Link to="#" className="btn btn-searchset" onClick={fetchProducts}> {/* Or trigger client filter */}
                                        <Search className="feather-search" />
                                    </Link>
                                </div>
                            </div>
                            {/* Filter Button */}
                            <div className="search-path">
                                <Link
                                    className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`}
                                    id="filter_search"
                                    onClick={toggleFilterVisibility} // Added onClick handler
                                >
                                    <Filter className="filter-icon" />
                                    <span>{isFilterVisible ? <ImageWithBasePath src="assets/img/icons/closes.svg" alt="img" /> : ''}</span>
                                </Link>
                            </div>
                            {/* Sort Dropdown (Example - Needs real implementation) */}
                            {/* <div className="form-sort">
                                <Sliders className="info-img" />
                                <Select className="select" options={options} placeholder="Sort by..." />
                            </div> */}
                        </div>

                        {/* Filter Section (Hidden by default) */}
                        {/* NOTE: This filter section uses static selects. It needs to be connected */}
                        {/*       to state and likely interact with fetchProducts for backend filtering. */}
                        <div
                            className={`card filter-card ${isFilterVisible ? " visible" : ""}`} // Added filter-card class
                            id="filter_inputs"
                            style={{ display: isFilterVisible ? "block" : "none" }}
                        >
                            <div className="card-body pb-0">
                                <div className="row">
                                    {/* Example Filter Inputs - Needs wiring up */}
                                    <div className="col-lg-2 col-sm-6 col-12">
                                        <div className="input-blocks">
                                            <StopCircle className="info-img" />
                                            <Select className="select" /* options={categories} */ placeholder="Filter by Category" />
                                        </div>
                                    </div>
                                    <div className="col-lg-2 col-sm-6 col-12">
                                        <div className="input-blocks">
                                            <StopCircle className="info-img" />
                                            <Select className="select" /* options={brands} */ placeholder="Filter by Brand" />
                                        </div>
                                    </div>
                                    {/* Add more filters as needed */}
                                    <div className="col-lg-2 col-sm-6 col-12 ms-auto"> {/* Align button right */}
                                         <div className="input-blocks">
                                            <button className="btn btn-filters w-100"> {/* Use button instead of Link */}
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
                                    // Use filteredProducts for client-side search, or products for backend search
                                    dataSource={filteredProducts}
                                    rowKey="_id" // Use _id as the unique key for each row
                                    // Pass other necessary props to your Table component (e.g., pagination config)
                                />
                            )}
                             {!isLoading && !error && filteredProducts.length === 0 && !searchQuery && (
                                <div className="text-center p-5 text-muted">No products found. <Link to={route.addproduct}>Add your first product!</Link></div>
                            )}
                            {!isLoading && !error && filteredProducts.length === 0 && searchQuery && (
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
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Icons
import {
    Box, ChevronUp, Download, Edit, Eye, Filter, GitMerge, PlusCircle,
    RotateCcw, Sliders, StopCircle, Trash2, Search, X, FileText, Users
} from "feather-icons-react/build/IconComponents";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { setToogleHeader } from "../../core/redux/action";

// Components
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import Table from "../../core/pagination/datatable";
import { OverlayTrigger, Tooltip, Button } from "react-bootstrap";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

// Routes and Config
import { all_routes } from "../../Router/all_routes";
const API_URL = process.env.REACT_APP_API_URL;
const BACKEND_BASE_URL = API_URL ? API_URL.replace('/api', '') : '';

// Helper function to get Authorization Header
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token not found.");
        return null;
    }
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

const ProductList = () => {
    const route = all_routes;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header);
    const MySwal = withReactContent(Swal);

    // --- Component State ---
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingFilters, setIsFetchingFilters] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // --- Filter Data State ---
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [locations, setLocations] = useState([]);

    // --- Selected Filter State ---
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null);
    const [selectedBrandFilter, setSelectedBrandFilter] = useState(null);
    const [selectedLocationFilter, setSelectedLocationFilter] = useState(null);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
    const [sortBy, setSortBy] = useState({ value: "createdAt", label: "Last 7 Days" });

    // Status options
    const statusOptions = [
        { value: null, label: "All Status" },
        { value: true, label: "Active" },
        { value: false, label: "Inactive" }
    ];

    // Sort options matching the desired UI
    const sortOptions = [
        { value: "createdAt", label: "Last 7 Days" },
        { value: "name", label: "Name A-Z" },
        { value: "-name", label: "Name Z-A" },
        { value: "-price", label: "Price High-Low" },
        { value: "price", label: "Price Low-High" }
    ];

    // --- Fetch Filter Data ---
    const fetchFilterData = useCallback(async () => {
        setIsFetchingFilters(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            toast.error("Authentication required for fetching filters.");
            setIsFetchingFilters(false);
            return;
        }
        try {
            const [catRes, brandRes, locRes] = await Promise.all([
                axios.get(`${API_URL}/product-categories`, { headers: authHeader }),
                axios.get(`${API_URL}/brands`, { headers: authHeader }),
                axios.get(`${API_URL}/locations`, { headers: authHeader })
            ]);

            setCategories([
                { value: null, label: "All Categories" },
                ...catRes.data.map(cat => ({ value: cat._id, label: cat.name }))
            ]);
            setBrands([
                { value: null, label: "All Brands" },
                ...brandRes.data.map(br => ({ value: br._id, label: br.name }))
            ]);
            setLocations([
                { value: null, label: "All Locations" },
                ...(locRes.data.locations || []).map(loc => ({ value: loc._id, label: `${loc.name} (${loc.type})` }))
            ]);
        } catch (err) {
            console.error("Error fetching filter data:", err.response ? err.response.data : err);
            toast.error("Could not load filter options. Please try refreshing.");
        } finally {
            setIsFetchingFilters(false);
        }
    }, [API_URL]);

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

        const params = {
            populate: 'category,brand,createdBy',
            search: searchQuery || undefined,
            includeInactive: selectedStatusFilter === null ? 'true' : selectedStatusFilter ? 'false' : 'true',
            category: selectedCategoryFilter?.value || undefined,
            brand: selectedBrandFilter?.value || undefined,
            locationId: selectedLocationFilter?.value || undefined,
            includeInventory: 'true', // Always include inventory data
            sort: sortBy?.value || 'createdAt'
        };

        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        try {
            const response = await axios.get(`${API_URL}/products`, { 
                headers: authHeader, 
                params 
            });
            setProducts(response.data || []);
        } catch (err) {
            console.error("Error fetching products:", err.response ? err.response.data : err);
            const fetchErrorMsg = err.response?.data?.message || "Failed to fetch products.";
            setError(fetchErrorMsg);
            toast.error(fetchErrorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [API_URL, searchQuery, selectedCategoryFilter, selectedBrandFilter, selectedLocationFilter, selectedStatusFilter, sortBy, navigate, route.login]);

    // Load data on component mount and when filters change
    useEffect(() => {
        fetchFilterData();
    }, [fetchFilterData]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchProducts]);

    // Reset all filters
    const resetFilters = () => {
        setSearchQuery("");
        setSelectedCategoryFilter(null);
        setSelectedBrandFilter(null);
        setSelectedLocationFilter(null);
        setSelectedStatusFilter(null);
        setSortBy({ value: "createdAt", label: "Last 7 Days" });
        toast.info("Filters reset");
    };

    // Handle product deactivation
    const handleDeactivateProduct = (productId, productName) => {
        MySwal.fire({
            title: "Are you sure?",
            text: `You are about to deactivate "${productName}". This action can be reversed later.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, deactivate it!",
            cancelButtonText: "Cancel"
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
                        title: "Deactivated!",
                        text: `Product "${productName}" has been deactivated.`,
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    fetchProducts();
                } catch (err) {
                    console.error("Error deactivating product:", err.response ? err.response.data : err);
                    MySwal.fire("Error!", "Failed to deactivate product.", "error");
                }
            }
        });
    };

    // Tooltip components
    const renderRefreshTooltip = <Tooltip>Refresh</Tooltip>;
    const renderCollapseTooltip = <Tooltip>Collapse</Tooltip>;

    // Table columns
    const columns = [
        {
            title: "SKU",
            dataIndex: "sku",
            render: (text) => <span className="fw-medium">{text}</span>
        },
        {
            title: "Product",
            dataIndex: "name",
            render: (text, record) => {
                let imageSrc = "/assets/img/placeholder-product.png";
                if (record.imageUrl) {
                    if (record.imageUrl.startsWith('http')) {
                        imageSrc = record.imageUrl;
                    } else if (BACKEND_BASE_URL) {
                        imageSrc = `${BACKEND_BASE_URL}/${record.imageUrl.replace(/^\/+/, '')}`;
                    }
                }

                return (
                    <div className="productimgname">
                        <Link to={route.productdetails?.replace(':productId', record._id)} className="product-img">
                            <img
                                alt={text}
                                src={imageSrc}
                                style={{ objectFit: 'contain', width: '40px', height: '40px' }}
                                onError={(e) => {
                                    e.target.src = "/assets/img/placeholder-product.png";
                                }}
                            />
                        </Link>
                        <Link to={route.productdetails?.replace(':productId', record._id)}>{text}</Link>
                    </div>
                );
            }
        },
        {
            title: "Category",
            dataIndex: "category",
            render: (category) => category?.name || "N/A"
        },
        {
            title: "Brand",
            dataIndex: "brand",
            render: (brand) => brand?.name || "N/A"
        },
        {
            title: "Price",
            dataIndex: "price",
            render: (price) => `$${(price || 0).toFixed(2)}`
        },
        {
            title: "Unit",
            dataIndex: "unit",
            render: () => "Pc" // Default unit
        },
        {
            title: "Qty",
            dataIndex: "quantity",
            render: (text, record) => {
                // If a specific location is selected, show stock for that location
                if (selectedLocationFilter?.value && record.totalStock !== undefined) {
                    return record.totalStock;
                }
                // If no location filter, calculate total across all locations
                if (record.inventory && Array.isArray(record.inventory)) {
                    const totalQty = record.inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
                    return totalQty;
                }
                // Fallback to zero if no inventory data
                return 0;
            }
        },
        {
            title: "Created By",
            dataIndex: "createdBy",
            render: (createdBy) => (
                <div className="userimgname">
                    <div className="user-img">
                        <Users size={16} />
                    </div>
                    <div className="ms-2">
                        <span>{createdBy?.name || "Unknown"}</span>
                    </div>
                </div>
            )
        },
        {
            title: "Action",
            render: (text, record) => (
                <div className="action-table-data">
                    <div className="edit-delete-action">
                        <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}>
                            <Link className="me-1 p-1" to={route.productdetails?.replace(':productId', record._id)}>
                                <Eye size={14} className="feather-eye" />
                            </Link>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip>Edit Product</Tooltip>}>
                            <Link className="me-1 p-1" to={route.editproduct?.replace(':productId', record._id)}>
                                <Edit size={14} className="feather-edit" />
                            </Link>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip>Delete Product</Tooltip>}>
                            <Link 
                                className="confirm-text p-1" 
                                to="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDeactivateProduct(record._id, record.name);
                                }}
                            >
                                <Trash2 size={14} className="feather-trash-2" />
                            </Link>
                        </OverlayTrigger>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="page-wrapper">
            <div className="content">
                {/* Page Header */}
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Product List</h4>
                            <h6>Manage your products</h6>
                        </div>
                    </div>
                    <ul className="table-top-head">
                        <li>
                            <OverlayTrigger placement="top" overlay={<Tooltip>Export PDF</Tooltip>}>
                                <Link to="#"><FileText /></Link>
                            </OverlayTrigger>
                        </li>
                        <li>
                            <OverlayTrigger placement="top" overlay={<Tooltip>Export Excel</Tooltip>}>
                                <Link to="#"><FileText /></Link>
                            </OverlayTrigger>
                        </li>
                        <li>
                            <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                                <Link to="#" onClick={(e) => {e.preventDefault(); fetchProducts();}}>
                                    <RotateCcw />
                                </Link>
                            </OverlayTrigger>
                        </li>
                        <li>
                            <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                                <Link 
                                    to="#" 
                                    className={data ? "active" : ""} 
                                    onClick={(e) => { e.preventDefault(); dispatch(setToogleHeader(!data)); }}
                                >
                                    <ChevronUp />
                                </Link>
                            </OverlayTrigger>
                        </li>
                    </ul>
                    <div className="page-btn">
                        <Link to={route.addproduct} className="btn btn-added">
                            <PlusCircle className="me-2" />Add New Product
                        </Link>
                        <Link to="#" className="btn btn-primary ms-2">
                            <Download className="me-2" />Import Product
                        </Link>
                    </div>
                </div>

                {/* Main Card */}
                <div className="card table-list-card">
                    <div className="card-body">
                        {/* Search and Filters Bar */}
                        <div className="table-top">
                            <div className="search-set">
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
                            
                            {/* Filter Controls */}
                            <div className="search-path">
                                <div className="d-flex align-items-center gap-3">
                                    {/* Category Filter */}
                                    <div style={{ minWidth: '150px' }}>
                                        <Select
                                            styles={selectStyles}
                                            options={categories}
                                            value={selectedCategoryFilter}
                                            onChange={setSelectedCategoryFilter}
                                            placeholder="Category"
                                            isClearable={false}
                                            isLoading={isFetchingFilters}
                                        />
                                    </div>
                                    
                                    {/* Brand Filter */}
                                    <div style={{ minWidth: '150px' }}>
                                        <Select
                                            styles={selectStyles}
                                            options={brands}
                                            value={selectedBrandFilter}
                                            onChange={setSelectedBrandFilter}
                                            placeholder="Brand"
                                            isClearable={false}
                                            isLoading={isFetchingFilters}
                                        />
                                    </div>
                                    
                                    {/* Location Filter */}
                                    <div style={{ minWidth: '150px' }}>
                                        <Select
                                            styles={selectStyles}
                                            options={locations}
                                            value={selectedLocationFilter}
                                            onChange={setSelectedLocationFilter}
                                            placeholder="Location"
                                            isClearable={false}
                                            isLoading={isFetchingFilters}
                                        />
                                    </div>
                                    
                                    {/* Status Filter */}
                                    <div style={{ minWidth: '150px' }}>
                                        <Select
                                            styles={selectStyles}
                                            options={statusOptions}
                                            value={selectedStatusFilter}
                                            onChange={setSelectedStatusFilter}
                                            placeholder="Status"
                                            isClearable={false}
                                        />
                                    </div>
                                    
                                    {/* Sort By */}
                                    <div style={{ minWidth: '150px' }}>
                                        <Select
                                            styles={selectStyles}
                                            options={sortOptions}
                                            value={sortBy}
                                            onChange={setSortBy}
                                            placeholder="Sort By"
                                            isClearable={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="table-responsive">
                            {isLoading && (
                                <div className="text-center p-5">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading products...</span>
                                    </div>
                                </div>
                            )}
                            
                            {!isLoading && error && (
                                <div className="alert alert-danger">
                                    Error: {error}
                                    <button onClick={fetchProducts} className="btn btn-sm btn-link p-0 ms-2">
                                        Retry
                                    </button>
                                </div>
                            )}
                            
                            {!isLoading && !error && (
                                <Table
                                    columns={columns}
                                    dataSource={products}
                                    rowKey="_id"
                                />
                            )}
                            
                            {!isLoading && !error && products.length === 0 && (
                                <div className="text-center p-5 text-muted">
                                    No products found. 
                                    <Link to={route.addproduct} className="ms-1">Add your first product!</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default ProductList;
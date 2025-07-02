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
import Image from "../../core/img/image";
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
        console.log('Delete function called with:', { productId, productName });
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
                    
                    // Parse error response for user-friendly messages
                    const errorData = err.response?.data;
                    let userMessage = "Failed to deactivate product.";
                    
                    if (err.response?.status === 403) {
                        userMessage = "You don't have permission to deactivate products. Please contact an administrator.";
                    } else if (err.response?.status === 404) {
                        userMessage = "Product not found. It may have been deleted.";
                    } else if (errorData?.userMessage) {
                        userMessage = errorData.userMessage;
                    } else if (errorData?.message) {
                        userMessage = errorData.message;
                    }
                    
                    MySwal.fire("Cannot Deactivate Product", userMessage, "error");
                }
            }
        });
    };

    // Handle permanent product deletion
    const handlePermanentDeleteProduct = (productId, productName) => {
        console.log('Permanent delete function called with:', { productId, productName });
        
        // Step 1: Initial warning
        MySwal.fire({
            title: "⚠️ PERMANENT DELETION WARNING",
            html: `
                <div style="text-align: left; margin: 20px 0;">
                    <p><strong>You are about to PERMANENTLY DELETE:</strong></p>
                    <p style="color: #d33; font-weight: bold;">"${productName}"</p>
                    <hr style="margin: 15px 0;">
                    <p><strong>This action will:</strong></p>
                    <ul style="text-align: left; color: #666;">
                        <li>Delete the product from the database forever</li>
                        <li>Remove all associated inventory records</li>
                        <li>Cannot be undone or recovered</li>
                    </ul>
                    <hr style="margin: 15px 0;">
                    <p style="color: #d33; font-weight: bold;">⚠️ This action is IRREVERSIBLE!</p>
                </div>
            `,
            icon: "error",
            showCancelButton: true,
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Continue to Confirmation",
            cancelButtonText: "Cancel",
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                // Step 2: Type product name to confirm
                MySwal.fire({
                    title: "Type Product Name to Confirm",
                    html: `
                        <div style="text-align: left; margin: 20px 0;">
                            <p>To confirm permanent deletion, type the exact product name:</p>
                            <p style="background: #f8f9fa; padding: 10px; border: 1px solid #dee2e6; border-radius: 4px; font-family: monospace; font-weight: bold;">${productName}</p>
                        </div>
                    `,
                    input: 'text',
                    inputPlaceholder: 'Type product name exactly as shown above',
                    showCancelButton: true,
                    confirmButtonColor: "#dc3545",
                    cancelButtonColor: "#6c757d",
                    confirmButtonText: "Confirm Deletion",
                    cancelButtonText: "Cancel",
                    reverseButtons: true,
                    inputValidator: (value) => {
                        if (value !== productName) {
                            return 'Product name does not match. Please type it exactly as shown.';
                        }
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        // Execute permanent deletion directly (no reason needed)
                        const authHeader = getAuthHeader();
                        if (!authHeader) {
                            toast.error("Authentication failed. Please log in.");
                            navigate(route.login);
                            return;
                        }
                        
                        try {
                            console.log('Executing permanent delete request...');
                            const response = await axios.delete(`${API_URL}/products/${productId}/permanent`, { 
                                headers: authHeader,
                                data: { reason: 'User requested permanent deletion' }
                            });
                            
                            console.log('Permanent delete response:', response.data);
                            
                            MySwal.fire({
                                title: "Permanently Deleted!",
                                text: response.data.message || `Product "${productName}" has been permanently deleted.`,
                                icon: "success",
                                timer: 2000,
                                showConfirmButton: false,
                            });
                            
                            // Refresh the product list
                            fetchProducts();
                            
                        } catch (err) {
                            console.error("Error permanently deleting product:", err.response ? err.response.data : err);
                            
                            // Parse structured error response
                            const errorData = err.response?.data;
                            
                            if (errorData?.error === 'ACTIVE_INVENTORY_FOUND') {
                                // Create user-friendly inventory error message
                                const inventoryList = errorData.details.inventoryLocations
                                    .map(inv => `• ${inv.locationName}: ${inv.quantity} units`)
                                    .join('<br>');
                                
                                const suggestionsList = errorData.suggestions
                                    .map(suggestion => `• ${suggestion}`)
                                    .join('<br>');
                                
                                MySwal.fire({
                                    title: "Cannot Delete Product",
                                    html: `
                                        <div style="text-align: left; margin: 20px 0;">
                                            <p><strong>This product still has active inventory:</strong></p>
                                            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 10px 0; font-family: monospace;">
                                                ${inventoryList}
                                            </div>
                                            <p><strong>To delete this product, you need to:</strong></p>
                                            <div style="color: #666; margin: 10px 0;">
                                                ${suggestionsList}
                                            </div>
                                            <hr style="margin: 15px 0;">
                                            <p style="color: #007bff; font-size: 14px;">
                                                💡 <strong>Tip:</strong> Use the Stock Management section to adjust inventory levels.
                                            </p>
                                        </div>
                                    `,
                                    icon: "info",
                                    confirmButtonText: "Understand",
                                    confirmButtonColor: "#007bff",
                                    width: '500px'
                                });
                            } else {
                                // Fallback for other errors
                                const errorMsg = errorData?.userMessage || errorData?.message || "Failed to permanently delete product.";
                                MySwal.fire("Error!", errorMsg, "error");
                            }
                        }
                    }
                });
            }
        });
    };

    // Handle product reactivation
    const handleReactivateProduct = (productId, productName) => {
        console.log('Reactivate function called with:', { productId, productName });
        
        MySwal.fire({
            title: "Reactivate Product?",
            text: `Are you sure you want to reactivate "${productName}"? This will make the product available again.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, reactivate it!",
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
                    console.log('Executing reactivation request...');
                    const response = await axios.patch(`${API_URL}/products/${productId}/reactivate`, {}, { 
                        headers: authHeader
                    });
                    
                    console.log('Reactivation response:', response.data);
                    
                    MySwal.fire({
                        title: "Reactivated!",
                        text: response.data.message || `Product "${productName}" has been reactivated.`,
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    
                    // Refresh the product list
                    fetchProducts();
                    
                } catch (err) {
                    console.error("Error reactivating product:", err.response ? err.response.data : err);
                    
                    // Parse error response for user-friendly messages
                    const errorData = err.response?.data;
                    let userMessage = "Failed to reactivate product.";
                    
                    if (err.response?.status === 403) {
                        userMessage = "You don't have permission to reactivate products. Please contact an administrator.";
                    } else if (err.response?.status === 404) {
                        userMessage = "Product not found. It may have been permanently deleted.";
                    } else if (errorData?.userMessage) {
                        userMessage = errorData.userMessage;
                    } else if (errorData?.message) {
                        userMessage = errorData.message;
                    }
                    
                    MySwal.fire("Cannot Reactivate Product", userMessage, "error");
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
                    } else if (API_URL) {
                        // Fallback to API_URL base
                        const baseUrl = API_URL.replace('/api', '');
                        imageSrc = `${baseUrl}/${record.imageUrl.replace(/^\/+/, '')}`;
                    }
                }
                
                // Debug log to help troubleshoot
                console.log('Image loading debug:', {
                    recordImageUrl: record.imageUrl,
                    BACKEND_BASE_URL,
                    API_URL,
                    finalImageSrc: imageSrc
                });

                // Apply inactive styling if product is not active
                const isInactive = !record.isActive;
                const inactiveStyle = isInactive ? {
                    opacity: 0.5,
                    filter: 'grayscale(50%)'
                } : {};

                return (
                    <div className="productimgname" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        ...inactiveStyle
                    }}>
                        <Link to={route.productdetails ? route.productdetails.replace(':productId', record._id) : '#'} className="product-img">
                            <img
                                alt={text}
                                src={imageSrc}
                                style={{ objectFit: 'cover', width: '50px', height: '50px', borderRadius: '6px' }}
                                onError={(e) => {
                                    e.target.src = "/assets/img/placeholder-product.png";
                                }}
                            />
                        </Link>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Link 
                                to={route.productdetails ? route.productdetails.replace(':productId', record._id) : '#'}
                                style={{ 
                                    textDecoration: 'none', 
                                    fontSize: '14px', 
                                    fontWeight: '500', 
                                    color: isInactive ? '#999' : '#333'
                                }}
                            >
                                {text}
                            </Link>
                            {isInactive && (
                                <span style={{
                                    fontSize: '11px',
                                    color: '#dc3545',
                                    backgroundColor: '#f8d7da',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    display: 'inline-block',
                                    width: 'fit-content',
                                    fontWeight: '500'
                                }}>
                                    INACTIVE
                                </span>
                            )}
                        </div>
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
                // Backend now provides totalStock for both location-specific and general queries
                if (record.totalStock !== undefined) {
                    return record.totalStock;
                }
                // Fallback: calculate from inventory array if totalStock not available
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
            render: (createdBy) => {
                const userName = createdBy?.name || "Unknown";
                const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                
                return (
                    <div className="userimgname" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="user-img" style={{ position: 'relative' }}>
                            {createdBy?.profileImage ? (
                                <img 
                                    src={createdBy.profileImage} 
                                    alt={userName}
                                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div 
                                className="user-avatar-initials"
                                style={{ 
                                    display: createdBy?.profileImage ? 'none' : 'flex',
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    backgroundColor: '#ff9f40', 
                                    color: 'white', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}
                            >
                                {userInitials}
                            </div>
                        </div>
                        <div>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>{userName}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            title: "Action",
            render: (text, record) => {
                // Debug logging to identify the issue
                console.log('Action buttons debug for product:', {
                    id: record._id,
                    name: record.name,
                    isActive: record.isActive,
                    isActiveType: typeof record.isActive,
                    rawRecord: record
                });

                return (
                    <div className="action-table-data">
                        <div className="edit-delete-action">
                            {/* View Details - always available */}
                            <OverlayTrigger placement="top" overlay={<Tooltip>View Details</Tooltip>}>
                                <Link className="me-1 p-1" to={route.productdetails ? route.productdetails.replace(':productId', record._id) : '#'}>
                                    <Eye size={14} className="feather-eye" />
                                </Link>
                            </OverlayTrigger>
                            
                            {/* Edit - always available */}
                            <OverlayTrigger placement="top" overlay={<Tooltip>Edit Product</Tooltip>}>
                                <Link 
                                    className="me-1 p-1" 
                                    to={route.editproduct ? route.editproduct.replace(':productId', record._id) : '#'}
                                    onClick={(e) => {
                                        console.log('Edit clicked for product:', record._id);
                                        if (!route.editproduct) {
                                            e.preventDefault();
                                            console.error('Edit route not defined');
                                            toast.error('Edit route not configured');
                                        }
                                    }}
                                >
                                    <Edit size={14} className="feather-edit" />
                                </Link>
                            </OverlayTrigger>
                            
                            {/* Actions based on product status */}
                            {record.isActive === true || record.isActive === 'true' ? (
                                /* Active product: Show deactivate button */
                                <OverlayTrigger placement="top" overlay={<Tooltip>Deactivate Product</Tooltip>}>
                                    <Link 
                                        className="confirm-text p-1" 
                                        to="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeactivateProduct(record._id, record.name);
                                        }}
                                    >
                                        <StopCircle size={14} className="feather-stop-circle" style={{ color: '#ffc107' }} />
                                    </Link>
                                </OverlayTrigger>
                            ) : (
                                /* Inactive product: Show reactivate and permanent delete buttons */
                                <>
                                    <OverlayTrigger placement="top" overlay={<Tooltip>Reactivate Product</Tooltip>}>
                                        <Link 
                                            className="confirm-text p-1" 
                                            to="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleReactivateProduct(record._id, record.name);
                                            }}
                                        >
                                            <GitMerge size={14} className="feather-git-merge" style={{ color: '#28a745' }} />
                                        </Link>
                                    </OverlayTrigger>
                                    
                                    <OverlayTrigger placement="top" overlay={<Tooltip>Permanently Delete</Tooltip>}>
                                        <Link 
                                            className="confirm-text p-1" 
                                            to="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePermanentDeleteProduct(record._id, record.name);
                                            }}
                                            style={{ marginLeft: '4px' }}
                                        >
                                            <Trash2 size={14} className="feather-trash-2" style={{ color: '#dc3545' }} />
                                        </Link>
                                    </OverlayTrigger>
                                </>
                            )}
                        </div>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="page-wrapper">
            <div className="content">
                {/* Page Header */}
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
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
                    <div className="page-btn" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link to={route.addproduct} className="btn btn-added" style={{ whiteSpace: 'nowrap' }}>
                            <PlusCircle className="me-2" />Add New Product
                        </Link>
                        <Link to="#" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
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
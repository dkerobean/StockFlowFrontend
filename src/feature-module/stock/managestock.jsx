import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { OverlayTrigger, Tooltip, Button, ProgressBar, Badge } from "react-bootstrap"; // Added Badge
import './managestock.css'; // Import the CSS file

// Icons (Import necessary icons)
import {
    Filter, Edit, Trash2, Search, RotateCcw, Upload, Download,
    Eye, ChevronUp, PlusCircle, X // Ensure Eye and X are imported
} from "react-feather";

// Redux (Optional)
import { useDispatch, useSelector } from "react-redux";
import { setToogleHeader } from "../../core/redux/action"; // Example action

// Components
import Breadcrumbs from "../../core/breadcrumbs"; // Assuming this component exists
import Table from "../../core/pagination/datatable"; // Your custom Table component
import { all_routes } from "../../Router/all_routes"; // Your route definitions

// Config and Helpers
const API_URL = process.env.REACT_APP_API_URL;
const BACKEND_BASE_URL = API_URL ? API_URL.replace('/api', '') : '';

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
        ...baseStyles,
        minHeight: 'calc(1.5em + 0.75rem + 2px)',
        borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
        boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
        '&:hover': { borderColor: state.isFocused ? '#86b7fe' : '#adb5bd', },
    }),
    menu: base => ({ ...base, zIndex: 5 }),
};


// --- Stock Level Visual Component ---
const StockLevelBar = ({ quantity, minStock, notifyAt, maxStock = null, recordId }) => {
    // Calculate thresholds and percentages
    const estimatedMaxBasedOnThresholds = notifyAt > 0 ? Math.max(quantity, notifyAt * 3)
                                        : minStock > 0 ? Math.max(quantity, minStock * 5)
                                        : Math.max(quantity, 100);
    const effectiveMax = maxStock > 0 ? Math.max(quantity, maxStock) : estimatedMaxBasedOnThresholds;
    const percentage = effectiveMax > 0 ? Math.min(100, Math.max(0, (quantity / effectiveMax) * 100)) : 0;

    // Determine status and color
    let status = "success";
    let statusText = "Good";
    let variant = "success";

    if (quantity <= 0) {
        status = "danger";
        statusText = "Out of Stock";
        variant = "danger";
    } else if (minStock !== undefined && quantity <= minStock) {
        status = "danger";
        statusText = "Below Minimum";
        variant = "danger";
    } else if (notifyAt !== undefined && quantity <= notifyAt) {
        status = "warning";
        statusText = "Low Stock";
        variant = "warning";
    } else if (percentage <= 25) {
        // Keep Low Stock/Below Minimum if applicable, otherwise Critical
        if (status === 'success') {
            status = "danger";
            statusText = "Critical";
            variant = "danger";
        }
    } else if (percentage <= 50) {
         // Keep Low Stock/Below Minimum if applicable, otherwise Moderate
        if (status === 'success') {
            status = "warning";
            statusText = "Moderate";
            variant = "warning";
        }
    }

    const tooltipText = (
        <div className="stock-tooltip">
            <div className="mb-1"><strong>Current Stock:</strong> {quantity}</div>
            {minStock !== undefined && <div><strong>Minimum:</strong> {minStock}</div>}
            {notifyAt !== undefined && <div><strong>Notify At:</strong> {notifyAt}</div>}
            {maxStock !== undefined && <div><strong>Maximum:</strong> {maxStock ?? 'N/A'}</div>}
            <div className="mt-1"><strong>Status:</strong> {statusText}</div>
        </div>
    );

    return (
        <div className="stock-level-container" style={{ minWidth: '150px' }}>
            <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`tooltip-stock-${recordId}`}>{tooltipText}</Tooltip>}
            >
                <div className="stock-level-wrapper">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        {/* Use Bootstrap Badge for status */}
                        <Badge bg={variant} className="text-capitalize stock-status-badge">{statusText}</Badge>
                        <span className="text-muted small">{percentage.toFixed(0)}% Full</span>
                    </div>
                    <ProgressBar
                        now={percentage}
                        variant={variant}
                        className="stock-progress-bar"
                        style={{
                            height: '8px',
                            borderRadius: '4px',
                            backgroundColor: '#e9ecef'
                        }}
                    />
                    <div className="d-flex justify-content-between align-items-center mt-1 quantity-indicators">
                        <span className="text-muted small">0</span>
                        <span className="fw-bold">{quantity}</span>
                        <span className="text-muted small">{effectiveMax}</span>
                    </div>
                </div>
            </OverlayTrigger>
        </div>
    );
};


// --- Main Component ---
const Managestock = () => {
    const route = all_routes;
    const navigate = useNavigate();
    const dispatch = useDispatch(); // Optional: For Redux state like header toggle
    const toggleData = useSelector((state) => state.toggle_header); // Optional: Get Redux state
    const MySwal = withReactContent(Swal);

    // --- State ---
    const [inventoryItems, setInventoryItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingFilters, setIsFetchingFilters] = useState(false);
    const [error, setError] = useState(null);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [locations, setLocations] = useState([]); // Filter options for locations
    const [products, setProducts] = useState([]);   // Filter options for products
    const [selectedLocationFilter, setSelectedLocationFilter] = useState(null);
    const [selectedProductFilter, setSelectedProductFilter] = useState(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    // --- Fetch Filter Data (Locations, Products) ---
    const fetchFilterData = useCallback(async () => {
        console.log("Fetching filter data (locations, products)...");
        setIsFetchingFilters(true);
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL) {
            toast.error(!authHeader ? "Authentication required for filters." : "API URL not configured.");
            setIsFetchingFilters(false);
            console.error("Auth header or API URL missing for filter fetch.");
            if (!authHeader) navigate(route.login);
            return;
        }

        try {
            const [locRes, prodRes] = await Promise.all([
                axios.get(`${API_URL}/locations?fields=name,type`, { headers: authHeader }),
                axios.get(`${API_URL}/products?fields=name,_id,sku&limit=500&isActive=true`, { headers: authHeader })
            ]);

            console.log("Filter data received:", { locations: locRes.data, products: prodRes.data });

            const locationsArray = locRes.data.locations || locRes.data;
            const productsArray = prodRes.data.products || prodRes.data;

            setLocations(locationsArray.map(loc => ({ value: loc._id, label: `${loc.name} (${loc.type || 'N/A'})` })));
            setProducts(productsArray.map(prod => ({ value: prod._id, label: `${prod.name} (${prod.sku || 'No SKU'})` })));

        } catch (err) {
            console.error("Error fetching filter data:", err.response ? err.response.data : err);
            toast.error("Could not load filter options.");
            if (err.response && err.response.status === 401) {
                console.log("Unauthorized (401) fetching filters, redirecting to login.");
                localStorage.removeItem('token');
                navigate(route.login);
            }
        } finally {
            setIsFetchingFilters(false);
            console.log("Filter data fetching finished.");
        }
    }, [API_URL, navigate, route.login]);


    // --- Fetch Inventory Data ---
    const fetchInventory = useCallback(async (page = 1, pageSize = 10) => {
        console.log(`Fetching Inventory - Page: ${page}, PageSize: ${pageSize}, Search: '${searchQuery}', Location: ${selectedLocationFilter?.value}, Product: ${selectedProductFilter?.value}`);
        setIsLoading(true); setError(null);
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL || !BACKEND_BASE_URL) {
            const errorMsg = !authHeader ? "Authentication required." : "Application configuration error (API/Backend URL).";
            toast.error(errorMsg);
            setError(errorMsg);
            setIsLoading(false);
            console.error("Auth header or API/Backend URL missing for inventory fetch.");
            if (!authHeader) navigate(route.login);
            return;
        }

        const params = {
            // *** UPDATED POPULATE: Ensure backend populates product.category ***
            populate: 'product,location,product.category', // Include product.category
            search: searchQuery || undefined,
            locationId: selectedLocationFilter?.value || undefined,
            productId: selectedProductFilter?.value || undefined,
            page: page,
            limit: pageSize,
        };

        // Clean params object by removing undefined keys
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        console.log("API Request Params:", params);

        try {
            const response = await axios.get(`${API_URL}/inventory`, { headers: authHeader, params });
            console.log("Raw API Response:", response);

            const items = response.data.data || response.data || []; // Adapt based on backend response structure
            const totalItems = response.data.pagination?.total ?? (response.data.totalCount ?? items.length); // Get total count for pagination

            // *** LOGGING ADDED ***
            console.log("Fetched Items (Check product.category and product.isActive here):", items);
            if (items.length > 0) {
                console.log("Example item product data:", items[0].product);
            }
            console.log("Total Items:", totalItems);

            setInventoryItems(items);
            setPagination(prev => ({ ...prev, current: page, pageSize: pageSize, total: totalItems }));

        } catch (err) {
            console.error("Error fetching inventory:", err.response ? err.response.data : err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch inventory data.";
            setError(errorMessage);
            toast.error(`Error: ${errorMessage}`);
            if (err.response && err.response.status === 401) {
                console.log("Unauthorized (401) fetching inventory, redirecting to login.");
                toast.error("Session expired. Please log in again.");
                localStorage.removeItem('token');
                navigate(route.login);
            }
        } finally {
            setIsLoading(false);
            console.log("Inventory fetching finished.");
        }
    }, [
        navigate, route.login, searchQuery, API_URL, BACKEND_BASE_URL, // Include URLs as dependencies
        selectedLocationFilter, selectedProductFilter // Include filters
    ]); // Removed pagination state from deps, handled separately


    // --- Effects ---
    // Fetch filter data on component mount
    useEffect(() => {
        console.log("Managestock component mounted.");
        fetchFilterData();
        // Optional: Add cleanup for unmount if needed
        return () => {
            console.log("Managestock component unmounted.");
        };
    }, [fetchFilterData]); // Runs once on mount

    // Debounced Fetch on Search/Filter Change (fetches page 1)
    useEffect(() => {
        console.log("Search or filter changed. Setting debounce timer...");
        const handler = setTimeout(() => {
            console.log("Debounce timer fired. Fetching page 1.");
            // Always fetch page 1 when filters/search change
            if (pagination.current !== 1) {
                // Setting page to 1 will trigger the pagination useEffect
                setPagination(prev => ({ ...prev, current: 1 }));
            } else {
                // If already on page 1, fetch directly
                fetchInventory(1, pagination.pageSize);
            }
        }, 500); // 500ms delay

        // Cleanup function: clear the timer if dependencies change before it fires
        return () => {
            console.log("Clearing debounce timer.");
            clearTimeout(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, selectedLocationFilter, selectedProductFilter]); // Re-run only when these change

    // Fetch on Page/PageSize Change (triggered by handleTableChange or filter reset)
    useEffect(() => {
        console.log(`Pagination changed: Current=${pagination.current}, PageSize=${pagination.pageSize}. Fetching data.`);
        // The fetchInventory function itself is now stable due to useCallback,
        // so we can safely call it when pagination state changes.
        fetchInventory(pagination.current, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.current, pagination.pageSize, fetchInventory]); // Fetch when page or size changes


    // --- Event Handlers ---
    const toggleFilterVisibility = () => {
        console.log("Toggling filter visibility.");
        setIsFilterVisible((prev) => !prev);
    };

    const handleSearchChange = (event) => {
        console.log("Search query changed:", event.target.value);
        setSearchQuery(event.target.value);
    };

    // Generic handler for react-select changes
    const handleFilterChange = (setter, filterName) => (option) => {
        console.log(`Filter changed - ${filterName}:`, option);
        setter(option);
    };

    // Handler for Table component's onChange event (for pagination, sorting)
    const handleTableChange = (paginationConfig, filters, sorter) => {
         console.log("Table change event:", { paginationConfig, filters, sorter });
         // Update pagination state based on the AntD table component's callback
         setPagination(prev => ({
             ...prev,
             current: paginationConfig.current || 1,
             pageSize: paginationConfig.pageSize || 10,
             // Potentially handle sorter changes here if needed
         }));
     };

    const resetFilters = () => {
        console.log("Resetting filters...");
        setSearchQuery("");
        setSelectedLocationFilter(null);
        setSelectedProductFilter(null);
        setIsFilterVisible(false); // Optionally hide filters on reset
        // Setting page to 1 will trigger fetch via useEffect
        if (pagination.current !== 1) {
            setPagination(prev => ({ ...prev, current: 1 }));
        } else {
             // If already on page 1, the filter/search useEffect will trigger fetch.
        }
        toast.info("Filters reset");
    };

    const handleDeleteInventory = (inventoryId, productName = 'Item', locationName = 'Location') => {
        console.log(`Attempting to delete inventory record ID: ${inventoryId} (${productName} at ${locationName})`);
        MySwal.fire({
            title: "Are you sure?", text: `This will permanently remove the inventory record for "${productName}" at "${locationName}". This action cannot be undone.`,
            icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, remove it!", cancelButtonText: "Cancel", customClass: { confirmButton: "btn btn-danger", cancelButton: "btn btn-secondary ms-2" }, buttonsStyling: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                console.log(`User confirmed deletion for inventory ID: ${inventoryId}`);
                const authHeader = getAuthHeader(); if (!authHeader) { toast.error("Authentication failed."); console.error("Delete failed: No auth header."); return; }
                setIsLoading(true); // Show loading indicator during delete
                try {
                    await axios.delete(`${API_URL}/inventory/${inventoryId}`, { headers: authHeader });
                    toast.success(`Inventory record for "${productName}" removed.`);
                    console.log(`Successfully deleted inventory ID: ${inventoryId}`);
                    // Refresh data: Fetch current page again, or previous page if it was the last item
                    const isLastItemOnPage = inventoryItems.length === 1 && pagination.current > 1;
                    const pageToFetch = isLastItemOnPage ? pagination.current - 1 : pagination.current;
                    fetchInventory(pageToFetch, pagination.pageSize);

                } catch (err) {
                    console.error(`Error removing inventory record ID ${inventoryId}:`, err.response ? err.response.data : err);
                    const errorMsg = err.response?.data?.message || "Failed to remove inventory record.";
                    toast.error(errorMsg);
                    setError(errorMsg); // Set error state
                    setIsLoading(false); // Stop loading indicator on error
                     if (err.response && err.response.status === 401) {
                        toast.error("Session expired. Please log in again.");
                        localStorage.removeItem('token');
                        navigate(route.login);
                     }
                }
            } else {
                 console.log(`User cancelled deletion for inventory ID: ${inventoryId}`);
            }
        });
    };

    const handleBulkImport = () => {
        console.log("Bulk Import action triggered.");
        toast.info("Bulk Import feature is not yet implemented.");
        // Future: Open modal or navigate to import page
    };

    const handleBulkExport = () => {
        console.log("Bulk Export action triggered.");
        toast.info("Bulk Export feature is not yet implemented.");
        // Future: Implement CSV/Excel export logic
    };

    const handleOpenAdjustModal = (inventoryId, productName, currentQuantity) => {
        console.log(`Trigger adjust modal for Inventory ID: ${inventoryId}, Product: ${productName}, Current Qty: ${currentQuantity}`);
        toast.info(`Adjust stock for ${productName || 'item'} (Placeholder - ID: ${inventoryId})`);
        // TODO: Add logic to open your stock adjustment modal here
        // Pass inventoryId, productName, currentQuantity to the modal
        // Example: setAdjustModalInfo({ id: inventoryId, name: productName, qty: currentQuantity }); setIsAdjustModalOpen(true);
    };


    // --- Table Column Definitions ---
    const columns = [
        // *** MOVED LOCATION COLUMN TO THE START ***
        {
            title: "Location",
            dataIndex: ["location", "name"], // Access nested location name
            key: 'locationName',
            render: (name, record) => {
                const locationType = record.location?.type;
                const label = name || <span className="text-muted">N/A</span>;
                return locationType ? `${label} (${locationType})` : label;
            },
            sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''),
            width: '180px',
        },
        {
            title: "Product",
            dataIndex: ["product", "name"], // Access nested name
            key: 'productName',
            render: (text, record) => {
                const product = record.product;
                if (!product) {
                    console.warn(`Inventory record ${record._id} is missing product data.`);
                    return <span className="text-muted fst-italic">Product Data Missing</span>;
                }

                // --- Image Rendering Logic ---
                let imageSrc = "/assets/img/placeholder-product.png";
                if (product.imageUrl) {
                    if (product.imageUrl.startsWith('http')) {
                        imageSrc = product.imageUrl;
                    } else if (BACKEND_BASE_URL) {
                        imageSrc = `${BACKEND_BASE_URL}/${product.imageUrl.replace(/^\/+/, '')}`;
                    } else if (API_URL) {
                        // Fallback to API_URL base
                        const baseUrl = API_URL.replace('/api', '');
                        imageSrc = `${baseUrl}/${product.imageUrl.replace(/^\/+/, '')}`;
                    }
                }

                const productDetailsPath = route.productdetails?.replace(':productId', product._id) || '#';

                const isInactive = !product.isActive;
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
                        <Link to={productDetailsPath} className="product-img">
                            <img
                                alt={product.name}
                                src={imageSrc}
                                style={{ objectFit: 'cover', width: '50px', height: '50px', borderRadius: '6px' }}
                                onError={(e) => {
                                    e.target.src = "/assets/img/placeholder-product.png";
                                }}
                            />
                        </Link>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Link 
                                to={productDetailsPath}
                                style={{ 
                                    textDecoration: 'none', 
                                    fontSize: '14px', 
                                    fontWeight: '500', 
                                    color: isInactive ? '#999' : '#333'
                                }}
                            >
                                {product.name}
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
            },
            sorter: (a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''),
            width: '250px', // Adjust width if needed
        },
        {
            title: "SKU",
            dataIndex: ["product", "sku"], // Access nested sku
            key: 'sku',
            render: (sku) => sku || <span className="text-muted">N/A</span>,
            sorter: (a, b) => (a.product?.sku || '').localeCompare(b.product?.sku || ''),
            width: '120px',
        },
        // *** ADDED CATEGORY COLUMN ***
        {
            title: "Category",
            dataIndex: ["product", "category", "name"], // Access nested category name
            key: 'categoryName',
            render: (categoryName) => categoryName || <span className="text-muted">N/A</span>,
            sorter: (a, b) => (a.product?.category?.name || '').localeCompare(b.product?.category?.name || ''),
            width: '150px',
        },
        {
            title: "Price",
            dataIndex: ["product", "price"], // Access nested price
            key: 'price',
            render: (price) => price !== undefined && price !== null
                               ? `$${Number(price).toFixed(2)}` // Format as currency
                               : <span className="text-muted">N/A</span>,
            sorter: (a, b) => (a.product?.price ?? 0) - (b.product?.price ?? 0), // Sort numerically, handle null/undefined
            align: 'right',
            width: '100px',
        },
        // *** ADDED STATUS COLUMN ***
        {
            title: "Status",
            dataIndex: ["product", "isActive"], // Access nested status
            key: 'productStatus',
            render: (isActive) => (
                isActive === true ? <Badge bg="success">Active</Badge> :
                isActive === false ? <Badge bg="danger">Inactive</Badge> :
                <Badge bg="secondary">Unknown</Badge> // Handle undefined/null case
            ),
            sorter: (a, b) => {
                // Handle undefined/null values for sorting
                const valA = a.product?.isActive === true ? 1 : a.product?.isActive === false ? 0 : -1;
                const valB = b.product?.isActive === true ? 1 : b.product?.isActive === false ? 0 : -1;
                return valA - valB;
            },
            align: 'center',
            width: '100px',
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            key: 'quantity',
            render: (qty) => qty ?? 0, // Display 0 if quantity is null/undefined
            sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0), // Sort numerically, handle null/undefined
            align: 'center', // Center align quantity
            width: '100px',
        },
        {
            title: "Stock Level",
            key: "stockLevel",
            render: (text, record) => (
                <StockLevelBar
                    recordId={record._id} // Pass unique ID for tooltip
                    quantity={record.quantity ?? 0} // Pass current quantity
                    minStock={record.minStock} // Pass min stock threshold (could be undefined)
                    notifyAt={record.notifyAt} // Pass notify threshold (could be undefined)
                    // maxStock={record.maxStock} // Pass max stock if available
                />
            ),
            width: '170px', // Slightly wider for the new layout
            align: 'center', // Center align the progress bar visually
        },
               {
            title: "Action",
            key: "action",
            render: (_, record) => {
                 // --- Get Product Details Path ---
                 const productDetailsPath = record.product
                    ? (route.productdetails?.replace(':productId', record.product._id) || '#')
                    : '#';

                 // --- Get Product Edit Path ---
                 const editProductPath = record.product
                    ? (route.editproduct?.replace(':productId', record.product._id) || '#')
                    : '#';

                 // Log warnings if routes seem misconfigured
                 if (record.product && editProductPath === '#') {
                    console.warn("Edit product route not configured correctly in all_routes.");
                 }
                 if (record.product && productDetailsPath === '#') {
                     console.warn("Product details route not configured correctly in all_routes.");
                 }


                 return (
                    <div className="edit-delete-action d-flex justify-content-end align-items-center gap-1">
                        {/* View Product Details Action */}
                        {record.product && (
                            <Link className="action-icon p-1" to={productDetailsPath} title="View Product Details">
                                <Eye size={18} />
                            </Link>
                        )}

                        {/* --- UPDATED: Edit Product Action --- */}
                        {record.product && ( // Only show edit icon if product exists
                             <Link
                                className="action-icon p-1" // Keep consistent styling
                                to={editProductPath} // Link to the product edit page
                                title="Edit Product Details" // Updated title
                            >
                                <Edit size={18} />
                            </Link>
                        )}
                        {/* --- END UPDATED Edit Product Action --- */}

                        {/* Remove Inventory Record Action Button (Remains the same) */}
                        <Link
                            className="action-icon text-danger p-1"
                            to="#"
                             onClick={(e) => {
                                e.preventDefault(); // Prevent default link behavior
                                handleDeleteInventory(record._id, record.product?.name, record.location?.name);
                             }}
                            title="Remove Inventory Record"
                        >
                            <Trash2 size={18} />
                        </Link>
                    </div>
                 );
            },
            width: '120px', // Keep width adequate for icons
            align: 'right', // Align action icons to the right
        },
    ];

    // *** Log columns structure for verification ***
    console.log("Table Columns Definition:", columns);


    // --- Tooltips for Header Buttons ---
    const renderRefreshTooltip = (props) => (<Tooltip id="refresh-tooltip" {...props}>Refresh Data</Tooltip>);
    const renderCollapseTooltip = (props) => (<Tooltip id="collapse-tooltip" {...props}>Collapse Header</Tooltip>);
    const renderImportTooltip = (props) => (<Tooltip id="import-tooltip" {...props}>Import Stock Data (CSV)</Tooltip>);
    const renderExportTooltip = (props) => (<Tooltip id="export-tooltip" {...props}>Export Current View (CSV)</Tooltip>);

    // --- Render Component UI ---
    return (
        <div className="page-wrapper">
            {/* Toast notifications container */}
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />

            <div className="content">
                {/* Breadcrumbs */}
                <Breadcrumbs maintitle="Manage Stock" subtitle="View and adjust stock levels across locations" />

                 {/* Page Header with Action Buttons */}
                 <div className="page-header">
                     <div className="add-item d-flex"></div>
                     {/* Right-aligned action buttons */}
                     <ul className="table-top-head">
                         <li><OverlayTrigger placement="top" overlay={renderImportTooltip}><Link to="#" onClick={handleBulkImport}><Upload size={18} /></Link></OverlayTrigger></li>
                         <li><OverlayTrigger placement="top" overlay={renderExportTooltip}><Link to="#" onClick={handleBulkExport}><Download size={18}/></Link></OverlayTrigger></li>
                         <li><OverlayTrigger placement="top" overlay={renderRefreshTooltip}><Link to="#" onClick={(e) => {e.preventDefault(); console.log("Refresh button clicked."); fetchInventory(pagination.current, pagination.pageSize);}}><RotateCcw /></Link></OverlayTrigger></li>
                         {/* Optional Redux-based Header Collapse */}
                         {dispatch && (
                             <li>
                                <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                                    <Link to="#" id="collapse-header" className={toggleData ? "active" : ""} onClick={(e) => { e.preventDefault(); console.log("Collapse header clicked."); dispatch(setToogleHeader(!toggleData)); }}>
                                        <ChevronUp />
                                    </Link>
                                </OverlayTrigger>
                             </li>
                         )}
                     </ul>
                 </div>

                {/* Main Card for Table and Filters */}
                <div className="card table-list-card">
                    <div className="card-body">
                        {/* Top section: Search and Filter Toggle */}
                        <div className="table-top d-flex justify-content-between align-items-center">
                            {/* Search Input */}
                            <div className="search-set flex-grow-1" style={{ maxWidth: '400px' }}>
                                <div className="search-input">
                                    <input
                                        type="text"
                                        placeholder="Search by Product Name, SKU..."
                                        className="form-control form-control-sm formsearch"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                    />
                                     <button className="btn btn-searchset" title="Search" onClick={(e) => {e.preventDefault(); console.log("Manual search triggered."); fetchInventory(1, pagination.pageSize)}}>
                                        <Search className="feather-search" />
                                    </button>
                                </div>
                            </div>
                            <div className="search-path">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <div style={{ minWidth: '130px' }}>
                                        <Select
                                            styles={selectStyles}
                                            options={locations}
                                            value={selectedLocationFilter}
                                            onChange={handleFilterChange(setSelectedLocationFilter, 'Location')}
                                            placeholder="Filter by Location..."
                                            isClearable
                                            isLoading={isFetchingFilters}
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div style={{ minWidth: '130px' }}>
                                         <Select
                                            styles={selectStyles}
                                            options={products}
                                            value={selectedProductFilter}
                                            onChange={handleFilterChange(setSelectedProductFilter, 'Product')}
                                            placeholder="Filter by Product..."
                                            isClearable
                                            isLoading={isFetchingFilters}
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                </div>
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
                                    {/* Location Filter */}
                                    <div className="col-lg-4 col-sm-6 col-12 mb-3">
                                        <Select
                                            styles={selectStyles}
                                            options={locations}
                                            value={selectedLocationFilter}
                                            onChange={handleFilterChange(setSelectedLocationFilter, 'Location')}
                                            placeholder="Filter by Location..."
                                            isClearable
                                            isLoading={isFetchingFilters}
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    {/* Product Filter */}
                                    <div className="col-lg-4 col-sm-6 col-12 mb-3">
                                         <Select
                                            styles={selectStyles}
                                            options={products}
                                            value={selectedProductFilter}
                                            onChange={handleFilterChange(setSelectedProductFilter, 'Product')}
                                            placeholder="Filter by Product..."
                                            isClearable
                                            isLoading={isFetchingFilters}
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                     {/* Reset Filters Button */}
                                    <div className="col-lg-4 col-sm-6 col-12 mb-3 d-flex align-items-end">
                                        <Button variant="secondary" size="sm" onClick={resetFilters} className="w-100">
                                            <RotateCcw size={14} className="me-1"/> Reset Filters
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="table-responsive mt-3">
                            {/* Loading Indicator */}
                            {isLoading && !error && ( // Show spinner only when loading and no error
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading stock data...</span>
                                    </div>
                                    <p className="mt-2">Loading stock data...</p>
                                </div>
                            )}
                            {/* Error Message */}
                            {!isLoading && error && ( // Show error only when not loading and error exists
                                <div className="alert alert-danger mx-2">
                                    Error: {error}
                                    <button
                                        onClick={() => { console.log("Retry button clicked."); fetchInventory(pagination.current, pagination.pageSize); }}
                                        className="btn btn-sm btn-link p-0 ms-2"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                            {/* Table Display */}
                            {!isLoading && !error && (
                                <Table // Your custom AntD-like Table component
                                    columns={columns}
                                    dataSource={inventoryItems} // Pass the fetched inventory items
                                    rowKey="_id" // Use MongoDB '_id' as the unique key for rows
                                    pagination={{
                                        current: pagination.current,
                                        pageSize: pagination.pageSize,
                                        total: pagination.total,
                                        showSizeChanger: true,
                                        pageSizeOptions: ['10', '25', '50', '100'], // Options for items per page
                                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`, // Display range and total
                                    }}
                                    onChange={handleTableChange} // Handle pagination/sorting changes
                                    loading={isLoading} // Pass loading state to Table component if it supports it
                                    // Add other props your Table component accepts
                                />
                            )}
                            {/* No Results Messages */}
                             {!isLoading && !error && inventoryItems.length === 0 && !(searchQuery || selectedLocationFilter || selectedProductFilter) && (
                                <div className="text-center p-5 text-muted">
                                    No stock records found in the inventory.
                                </div>
                            )}
                             {!isLoading && !error && inventoryItems.length === 0 && (searchQuery || selectedLocationFilter || selectedProductFilter) && (
                                <div className="text-center p-5 text-muted">
                                    No stock records match your current filters or search criteria.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
             {/* Modal Placeholder */}
        </div>
    );
};

export default Managestock;
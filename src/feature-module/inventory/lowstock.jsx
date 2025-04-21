import React, { useState, useEffect } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../core/img/imagewithbasebath';
import { Archive, Box, ChevronUp, Mail, RotateCcw, Sliders, Zap, Edit } from 'feather-icons-react'; // Import specific icons
import { useDispatch, useSelector } from 'react-redux'; // Keep for header toggle if needed
import { setToogleHeader } from '../../core/redux/action'; // Keep for header toggle if needed
import Select from 'react-select';
import { Filter } from 'react-feather';
// import EditLowStock from '../../core/modals/inventory/editlowstock'; // Keep if you have this modal and want to use it
import Table from '../../core/pagination/datatable';
import axios from 'axios';
import { toast } from 'react-toastify';

// Feather Icon Helper
const FeatherIcon = ({ icon, ...props }) => {
    const IconComponent = icon;
    return <IconComponent {...props} />;
};

const LowStock = () => {
    // Redux state for header toggle (keep if needed)
    const dispatch = useDispatch();
    const redux_data = useSelector((state) => state.toggle_header); // Renamed to avoid conflict

    // Component State
    const [lowStockItems, setLowStockItems] = useState([]);
    const [outOfStockItems, setOutOfStockItems] = useState([]);
    const [loadingLow, setLoadingLow] = useState(true);
    const [loadingOut, setLoadingOut] = useState(true);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    // const [editingItem, setEditingItem] = useState(null); // State for editing modal if used

    const API_URL = process.env.REACT_APP_API_URL;

    // --- Fetching Functions ---
    const fetchLowStock = async () => {
        setLoadingLow(true);
        try {
            const response = await axios.get(`${API_URL}/inventory/low-stock`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setLowStockItems(response.data || []);
        } catch (error) {
            console.error("Error fetching low stock items:", error);
            toast.error(error.response?.data?.message || "Failed to load low stock items");
            setLowStockItems([]);
        } finally {
            setLoadingLow(false);
        }
    };

    const fetchOutOfStock = async () => {
        setLoadingOut(true);
        try {
            const response = await axios.get(`${API_URL}/inventory/out-of-stock`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setOutOfStockItems(response.data || []);
        } catch (error) {
            console.error("Error fetching out of stock items:", error);
            toast.error(error.response?.data?.message || "Failed to load out of stock items");
            setOutOfStockItems([]);
        } finally {
            setLoadingOut(false);
        }
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchLowStock();
        fetchOutOfStock();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Handlers ---
    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };

    // Edit Modal Handling (Keep if EditLowStock modal is implemented)
    // const handleEditClick = (item) => {
    //     setEditingItem(item);
    //     const modalElement = document.getElementById(`edit-stock-${item._id}`); // Ensure modal has dynamic ID
    //     if (modalElement) {
    //         const bsModal = new bootstrap.Modal(modalElement);
    //         bsModal.show();
    //     }
    // };
    // const handleEditModalClose = () => setEditingItem(null);
    // const handleUpdateSuccess = () => {
    //     fetchLowStock(); // Re-fetch low stock after potential update
    //     handleEditModalClose();
    // };

    // --- Tooltip Renderers ---
    const renderTooltip = (props, text) => (<Tooltip {...props}>{text}</Tooltip>);

    // --- Column Definitions ---
    // Columns for Low Stock Table
    const columnsLow = [
        {
            title: "Location",
            dataIndex: ['location', 'name'], // Access nested data
            sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''),
            render: (name) => name || 'N/A',
        },
        {
            title: "Product",
            // dataIndex: ['product', 'name'], // Can't use dataIndex with custom render easily here
            render: (record) => ( // Use record from render param
                <span className="productimgname">
                    <Link to="#" className="product-img stock-img">
                        {/* Use actual image URL from product */}
                        <ImageWithBasePath
                            src={record.product?.imageUrl || 'assets/img/products/product1.jpg'} // Fallback image
                            alt={record.product?.name || ''}
                         />
                    </Link>
                    <Link to={`/products/view/${record.product?._id}`}> {/* Optional: Link to product details */}
                     {record.product?.name || 'N/A'}
                    </Link>
                </span>
            ),
            sorter: (a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''),
        },
        // { // Category might require extra population or be omitted
        //     title: "Category",
        //     dataIndex: ['product', 'category', 'name'], // Requires category to be populated with name
        //     sorter: (a, b) => (a.product?.category?.name || '').localeCompare(b.product?.category?.name || ''),
        //      render: (name) => name || 'N/A',
        // },
        {
            title: "SKU",
            dataIndex: ['product', 'sku'],
            sorter: (a, b) => (a.product?.sku || '').localeCompare(b.product?.sku || ''),
            render: (sku) => sku || 'N/A',
        },
        {
            title: "Current Qty",
            dataIndex: 'quantity',
            sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0), // Numeric sort, handle null/undefined
             render: (qty) => qty ?? 0, // Display 0 if null/undefined
        },
        {
            title: "Notify Qty",
            dataIndex: 'notifyAt',
            sorter: (a, b) => (a.notifyAt ?? 0) - (b.notifyAt ?? 0), // Numeric sort
             render: (qty) => qty ?? 0,
        },
        // { // Actions column - Edit removed as purpose is unclear, Delete is wrong
        //     title: 'Actions',
        //     key: 'actions',
        //     render: (record) => (
        //         <td className="action-table-data">
        //             <div className="edit-delete-action">
        //                 <button className="me-2 p-2 btn btn-link action-icon" onClick={() => handleEditClick(record)}>
        //                     <FeatherIcon icon={Edit} size={16}/>
        //                 </button>
        //                 {/* Delete action doesn't make sense here */}
        //             </div>
        //         </td>
        //     )
        // },
    ];

    // Columns for Out of Stock Table (Simplified - no notify qty, no actions)
    const columnsOut = [
         {
            title: "Location",
            dataIndex: ['location', 'name'],
            sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''),
             render: (name) => name || 'N/A',
        },
        {
            title: "Product",
            render: (record) => (
                <span className="productimgname">
                    <Link to="#" className="product-img stock-img">
                         <ImageWithBasePath
                             src={record.product?.imageUrl || 'assets/img/products/product1.jpg'}
                             alt={record.product?.name || ''}
                          />
                    </Link>
                     <Link to={`/products/view/${record.product?._id}`}>
                        {record.product?.name || 'N/A'}
                     </Link>
                </span>
            ),
            sorter: (a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''),
        },
        {
            title: "SKU",
            dataIndex: ['product', 'sku'],
            sorter: (a, b) => (a.product?.sku || '').localeCompare(b.product?.sku || ''),
             render: (sku) => sku || 'N/A',
        },
        {
            title: "Qty",
            dataIndex: 'quantity',
             sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0),
              render: (qty) => qty ?? 0,
        },
         { // Indicate if product/location itself is inactive
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

     // Filter Options - Replace with dynamic data if needed
     const productlist = [{ value: 'all', label: 'All Products' }];
     const category = [{ value: 'all', label: 'All Categories' }];
     const warehouse = [{ value: 'all', label: 'All Locations' }];
     const oldandlatestvalue = [{ value: 'newest', label: 'Newest' }];


    return (
        <div>
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="page-title me-auto">
                            <h4>Stock Alerts</h4>
                            <h6>Manage low and out of stock items</h6>
                        </div>
                        <ul className="table-top-head">
                            {/* Notify Toggle & Send Email Button - UI only for now */}
                            <li>
                                <div className="status-toggle d-flex justify-content-between align-items-center">
                                    <input type="checkbox" id="notifyCheck" className="check"/>
                                    <label htmlFor="notifyCheck" className="checktoggle me-2">checkbox</label>
                                    Notify
                                </div>
                            </li>
                            <li>
                                <button type="button" className="btn btn-secondary">
                                    <FeatherIcon icon={Mail} className="feather-mail me-1" size={16}/>
                                    Send Email
                                </button>
                            </li>
                            {/* Standard Icons */}
                            <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'PDF')}><Link to="#"><ImageWithBasePath src="assets/img/icons/pdf.svg" alt="PDF" /></Link></OverlayTrigger></li>
                            <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Excel')}><Link to="#"><ImageWithBasePath src="assets/img/icons/excel.svg" alt="Excel" /></Link></OverlayTrigger></li>
                            <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Print')}><Link to="#"><FeatherIcon icon={Sliders} /></Link></OverlayTrigger></li>
                            <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Refresh')}><Link to="#" onClick={() => { fetchLowStock(); fetchOutOfStock(); }}><FeatherIcon icon={RotateCcw} /></Link></OverlayTrigger></li>
                            <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Collapse')}><Link to="#" id="collapse-header" className={redux_data ? "active" : ""} onClick={() => { dispatch(setToogleHeader(!redux_data)); }}><FeatherIcon icon={ChevronUp} /></Link></OverlayTrigger></li>
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
                                        {/* Common Table Top Structure */}
                                        <div className="table-top">
                                            <div className="search-set"><div className="search-input"><input type="text" placeholder="Search..." className="form-control form-control-sm formsearch"/><Link to="#" className="btn btn-searchset"><FeatherIcon icon={Filter}/></Link></div></div>
                                            <div className="search-path"><button type='button' className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`} onClick={toggleFilterVisibility}><FeatherIcon icon={Filter} className="filter-icon"/><span><ImageWithBasePath src="assets/img/icons/closes.svg" alt="Close"/></span></button></div>
                                            <div className="form-sort"><FeatherIcon icon={Sliders} className="info-img"/><Select className="select" options={oldandlatestvalue} placeholder="Sort by..."/></div>
                                        </div>
                                        {/* Filter Inputs */}
                                        <div className={`card filter_card ${isFilterVisible ? " visible" : ""}`} style={{ display: isFilterVisible ? "block" : "none" }}>
                                            <div className="card-body pb-0">
                                                <div className="row">
                                                    <div className="col-lg-3 col-sm-6 col-12"><div className="input-blocks"><FeatherIcon icon={Box} className="info-img"/><Select options={productlist} className="select" placeholder="Choose Product"/></div></div>
                                                    <div className="col-lg-3 col-sm-6 col-12"><div className="input-blocks"><FeatherIcon icon={Zap} className="info-img"/><Select options={category} className="select" placeholder="Choose Category"/></div></div>
                                                    <div className="col-lg-3 col-sm-6 col-12"><div className="input-blocks"><FeatherIcon icon={Archive} className="info-img"/><Select options={warehouse} className="select" placeholder="Choose Location"/></div></div>
                                                    <div className="col-lg-3 col-sm-6 col-12 ms-auto"><div className="input-blocks"><button type="button" className="btn btn-filters ms-auto"><FeatherIcon icon={Filter} className="me-1" size={16}/> Search </button></div></div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Table */}
                                        <div className="table-responsive">
                                            <Table columns={columnsLow} dataSource={lowStockItems} loading={loadingLow} rowKey="_id" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Out of Stock Pane */}
                            <div className="tab-pane fade" id="pills-out-of-stock" role="tabpanel" aria-labelledby="pills-out-of-stock-tab">
                                 <div className="card table-list-card">
                                    <div className="card-body">
                                        {/* Re-use common Table Top Structure */}
                                        <div className="table-top">
                                            <div className="search-set"><div className="search-input"><input type="text" placeholder="Search..." className="form-control form-control-sm formsearch"/><Link to="#" className="btn btn-searchset"><FeatherIcon icon={Filter}/></Link></div></div>
                                            <div className="search-path"><button type='button' className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`} onClick={toggleFilterVisibility}><FeatherIcon icon={Filter} className="filter-icon"/><span><ImageWithBasePath src="assets/img/icons/closes.svg" alt="Close"/></span></button></div>
                                            <div className="form-sort"><FeatherIcon icon={Sliders} className="info-img"/><Select className="select" options={oldandlatestvalue} placeholder="Sort by..."/></div>
                                        </div>
                                        {/* Re-use Filter Inputs Structure */}
                                         <div className={`card filter_card ${isFilterVisible ? " visible" : ""}`} style={{ display: isFilterVisible ? "block" : "none" }}>
                                            <div className="card-body pb-0">
                                                {/* Filter fields here */}
                                                <div className="row">
                                                    <div className="col-lg-3 col-sm-6 col-12"><div className="input-blocks"><FeatherIcon icon={Box} className="info-img"/><Select options={productlist} className="select" placeholder="Choose Product"/></div></div>
                                                    <div className="col-lg-3 col-sm-6 col-12"><div className="input-blocks"><FeatherIcon icon={Zap} className="info-img"/><Select options={category} className="select" placeholder="Choose Category"/></div></div>
                                                    <div className="col-lg-3 col-sm-6 col-12"><div className="input-blocks"><FeatherIcon icon={Archive} className="info-img"/><Select options={warehouse} className="select" placeholder="Choose Location"/></div></div>
                                                    <div className="col-lg-3 col-sm-6 col-12 ms-auto"><div className="input-blocks"><button type="button" className="btn btn-filters ms-auto"><FeatherIcon icon={Filter} className="me-1" size={16}/> Search </button></div></div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Table */}
                                        <div className="table-responsive">
                                            <Table columns={columnsOut} dataSource={outOfStockItems} loading={loadingOut} rowKey="_id" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Render Edit modal conditionally if implemented */}
            {/* {editingItem && (
                <EditLowStock
                    key={editingItem._id}
                    inventoryItem={editingItem} // Pass the whole item or specific props
                    onUpdate={handleUpdateSuccess}
                    onModalClose={handleEditModalClose}
                 />
            )} */}
        </div>
    )
}

export default LowStock;
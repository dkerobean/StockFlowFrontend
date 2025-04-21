import React, { useState, useEffect } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../core/img/imagewithbasebath';
import { ChevronUp, Filter, RotateCcw, Sliders, Box } from 'feather-icons-react'; // Import specific icons
import { setToogleHeader } from '../../core/redux/action'; // Keep if needed
import { useDispatch, useSelector } from 'react-redux'; // Keep if needed
import Select from 'react-select';
// Removed react-feather Box, using feather-icons-react Box
import { DatePicker } from 'antd';
// Removed Swal imports as delete action is removed
import Table from '../../core/pagination/datatable';
import axios from 'axios';
import { toast } from 'react-toastify';

// Feather Icon Helper
const FeatherIcon = ({ icon, ...props }) => {
    const IconComponent = icon;
    return <IconComponent {...props} />;
};

const ExpiredProduct = () => {
    // Redux state for header toggle (keep if needed)
    const dispatch = useDispatch();
    const redux_data = useSelector((state) => state.toggle_header); // Renamed

    // Component State
    const [expiredItems, setExpiredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null); // Filter state

    const API_URL = process.env.REACT_APP_API_URL;

    // --- Fetching Function ---
    const fetchExpiredItems = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/inventory/expired`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setExpiredItems(response.data || []);
        } catch (error) {
            console.error("Error fetching expired items:", error);
            toast.error(error.response?.data?.message || "Failed to load expired items");
            setExpiredItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on mount
    useEffect(() => {
        fetchExpiredItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Handlers ---
    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };
    const handleDateChange = (date) => {
        setSelectedDate(date); // Update filter state
        // Add logic here to re-fetch data with date filter if needed
    };

    // --- Tooltip Renderers ---
    const renderTooltip = (props, text) => (<Tooltip {...props}>{text}</Tooltip>);

    // --- Column Definitions ---
    const columns = [
         {
            title: "Product",
            // dataIndex: ['product', 'name'], // Not ideal with custom render
            render: (record) => (
                <span className="productimgname">
                    <Link to="#" className="product-img stock-img">
                         <ImageWithBasePath
                             src={record.product?.imageUrl || 'assets/img/products/product1.jpg'} // Fallback
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
         { // Added Location column as required
            title: "Location",
            dataIndex: ['location', 'name'],
            sorter: (a, b) => (a.location?.name || '').localeCompare(b.location?.name || ''),
            render: (name) => name || 'N/A',
        },
        {
            title: "SKU",
            dataIndex: ['product', 'sku'],
            sorter: (a, b) => (a.product?.sku || '').localeCompare(b.product?.sku || ''),
             render: (sku) => sku || 'N/A',
        },
        { // Added Quantity column
            title: "Expired Qty",
            dataIndex: "quantity",
            sorter: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0),
             render: (qty) => qty ?? 0,
        },
        // { // Manufactured Date removed - not in model
        //     title: "Manufactured Date",
        //     dataIndex: "manufactureddate", // This field doesn't exist in model
        // },
        {
            title: "Expired Date",
            dataIndex: "expiryDate", // Correct field name from model
            render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
            sorter: (a, b) => new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0),
        },
        // Actions removed - Edit/Delete not appropriate for "expired" state itself
        // {
        //     title: 'Actions',
        //     key: 'actions',
        //     render: () => (...)
        // },
    ];

     // Filter Options - Replace with dynamic data if needed
     const productFilterOptions = [{ value: 'all', label: 'All Products' }];
     const oldandlatestvalue = [{ value: 'newest', label: 'Newest' }];


    return (
        <div>
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4>Expired Products</h4>
                                <h6>Manage your expired products</h6>
                            </div>
                        </div>
                        <ul className="table-top-head">
                           {/* Standard Icons */}
                            <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'PDF')}><Link to="#"><ImageWithBasePath src="assets/img/icons/pdf.svg" alt="PDF" /></Link></OverlayTrigger></li>
                            <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Excel')}><Link to="#"><ImageWithBasePath src="assets/img/icons/excel.svg" alt="Excel" /></Link></OverlayTrigger></li>
                            <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Print')}><Link to="#"><FeatherIcon icon={Sliders} /></Link></OverlayTrigger></li>
                            <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Refresh')}><Link to="#" onClick={fetchExpiredItems}><FeatherIcon icon={RotateCcw} /></Link></OverlayTrigger></li>
                            <li><OverlayTrigger placement="top" overlay={(props) => renderTooltip(props, 'Collapse')}><Link to="#" id="collapse-header" className={redux_data ? "active" : ""} onClick={() => { dispatch(setToogleHeader(!redux_data)); }}><FeatherIcon icon={ChevronUp} /></Link></OverlayTrigger></li>
                        </ul>
                    </div>
                    {/* /product list */}
                    <div className="card table-list-card">
                        <div className="card-body">
                             {/* Common Table Top Structure */}
                             <div className="table-top">
                                <div className="search-set"><div className="search-input"><input type="text" placeholder="Search Expired Products..." className="form-control form-control-sm formsearch"/><Link to="#" className="btn btn-searchset"><FeatherIcon icon={Filter}/></Link></div></div>
                                <div className="search-path"><button type='button' className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`} onClick={toggleFilterVisibility}><FeatherIcon icon={Filter} className="filter-icon"/><span><ImageWithBasePath src="assets/img/icons/closes.svg" alt="Close"/></span></button></div>
                                <div className="form-sort"><FeatherIcon icon={Sliders} className="info-img"/><Select className="select" options={oldandlatestvalue} placeholder="Sort by..."/></div>
                            </div>
                            {/* /Filter */}
                            <div
                                className={`card filter_card ${isFilterVisible ? " visible" : ""}`}
                                id="filter_inputs"
                                style={{ display: isFilterVisible ? "block" : "none" }}
                            >
                                <div className="card-body pb-0">
                                    <div className="row">
                                        <div className="col-lg-3 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <FeatherIcon icon={Box} className="info-img" />
                                                {/* Use product options if needed */}
                                                <Select options={productFilterOptions} className="select" placeholder="Choose Product" />
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-sm-6 col-12">
                                             {/* Date Picker for filtering by expiry date range potentially */}
                                            <div className="input-blocks">
                                                <DatePicker
                                                    value={selectedDate} // Bind state
                                                    onChange={handleDateChange}
                                                    className="form-control" // Style consistency
                                                    placeholder='Filter by Expiry Date'
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-sm-6 col-12 ms-auto">
                                            <div className="input-blocks">
                                                 <button type="button" className="btn btn-filters ms-auto"><FeatherIcon icon={Filter} className="me-1" size={16}/> Search </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* /Filter */}
                            <div className="table-responsive">
                            <Table columns={columns} dataSource={expiredItems} loading={loading} rowKey="_id" />
                            </div>
                        </div>
                    </div>
                    {/* /product list */}
                </div>
            </div>
        </div>
    )
}

export default ExpiredProduct;
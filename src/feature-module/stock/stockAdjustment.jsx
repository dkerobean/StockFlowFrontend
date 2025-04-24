import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Select from "react-select";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { OverlayTrigger, Tooltip, Button, Badge } from "react-bootstrap";
import Breadcrumbs from "../../core/breadcrumbs";
import Table from "../../core/pagination/datatable";
import StockadjustmentModal from "../../core/modals/stocks/stockadjustmentModal";
import { Filter, Sliders, Edit, Trash2, Search, RotateCcw, X } from "react-feather";

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

const StockAdjustment = () => {
    const [adjustments, setAdjustments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDate, setSelectedDate] = useState(null);
    const [locations, setLocations] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedAdjustmentType, setSelectedAdjustmentType] = useState(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const MySwal = withReactContent(Swal);

    // Adjustment type options
    const adjustmentTypeOptions = [
        { value: 'Addition', label: 'Addition' },
        { value: 'Subtraction', label: 'Subtraction' },
        { value: 'Damage', label: 'Damage' },
        { value: 'Theft', label: 'Theft' },
        { value: 'Correction', label: 'Correction' },
        { value: 'Initial Stock', label: 'Initial Stock' },
        { value: 'Return', label: 'Return' },
        { value: 'Transfer Out', label: 'Transfer Out' },
        { value: 'Transfer In', label: 'Transfer In' },
        { value: 'Cycle Count Adj', label: 'Cycle Count Adjustment' },
        { value: 'Obsolete', label: 'Obsolete' },
        { value: 'Other', label: 'Other' }
    ];

    // Fetch filter data (locations and products)
    const fetchFilterData = useCallback(async () => {
        const authHeader = getAuthHeader();
        if (!authHeader) return;

        try {
            const [locRes, prodRes] = await Promise.all([
                axios.get(`${API_URL}/locations?fields=name,type`, { headers: authHeader }),
                axios.get(`${API_URL}/products?fields=name,_id,sku&limit=500&isActive=true`, { headers: authHeader })
            ]);

            setLocations(locRes.data.map(loc => ({
                value: loc._id,
                label: `${loc.name} (${loc.type || 'N/A'})`
            })));

            setProducts(prodRes.data.map(prod => ({
                value: prod._id,
                label: `${prod.name} (${prod.sku || 'No SKU'})`
            })));
        } catch (err) {
            console.error("Error fetching filter data:", err);
            toast.error("Could not load filter options.");
        }
    }, []);

    

    // Fetch stock adjustments
    const fetchAdjustments = useCallback(async (page = 1, pageSize = 10) => {
        setIsLoading(true);
        const authHeader = getAuthHeader();
        if (!authHeader) return;

        const params = {
            page,
            limit: pageSize,
            search: searchQuery || undefined,
            locationId: selectedLocation?.value || undefined,
            productId: selectedProduct?.value || undefined,
            adjustmentType: selectedAdjustmentType?.value || undefined,
            startDate: selectedDate ? selectedDate.toISOString() : undefined
        };

        try {
            const response = await axios.get(`${API_URL}/stock-adjustments`, {
                headers: authHeader,
                params
            });

            setAdjustments(response.data.data || []);
            setPagination({
                current: page,
                pageSize,
                total: response.data.pagination?.total || 0
            });
        } catch (err) {
            console.error("Error fetching adjustments:", err);
            toast.error("Failed to fetch adjustments.");
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, selectedLocation, selectedProduct, selectedAdjustmentType, selectedDate]);

    // Handle table change (pagination, sorting)
    const handleTableChange = (paginationConfig) => {
        setPagination(prev => ({
            ...prev,
            current: paginationConfig.current || 1,
            pageSize: paginationConfig.pageSize || 10
        }));
    };

    // Handle filter changes
    const handleFilterChange = (setter) => (option) => {
        setter(option);
    };

    // Reset all filters
    const resetFilters = () => {
        setSearchQuery("");
        setSelectedLocation(null);
        setSelectedProduct(null);
        setSelectedAdjustmentType(null);
        setSelectedDate(null);
        setIsFilterVisible(false);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    // Delete adjustment
    const handleDeleteAdjustment = (adjustmentId, referenceNumber) => {
        MySwal.fire({
            title: "Are you sure?",
            text: `This will delete adjustment ${referenceNumber || ''}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                const authHeader = getAuthHeader();
                if (!authHeader) return;

                try {
                    await axios.delete(`${API_URL}/stock-adjustments/${adjustmentId}`, {
                        headers: authHeader
                    });

                    toast.success("Adjustment deleted successfully");
                    fetchAdjustments(pagination.current, pagination.pageSize);
                } catch (err) {
                    console.error("Error deleting adjustment:", err);
                    toast.error("Failed to delete adjustment.");
                }
            }
        });
    };

    // Fetch data on component mount
    useEffect(() => {
        fetchFilterData();
    }, [fetchFilterData]);

    // Fetch data when filters or pagination changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAdjustments(pagination.current, pagination.pageSize);
        }, 300);

        return () => clearTimeout(timer);
    }, [fetchAdjustments, pagination.current, pagination.pageSize]);

    // Table columns
    const columns = [
        {
            title: "Adjustment #",
            dataIndex: "adjustmentNumber",
            key: "adjustmentNumber",
            render: (text) => text || <span className="text-muted">N/A</span>,
            sorter: true,
            width: '150px'
        },
        {
            title: "Reference",
            dataIndex: "referenceNumber",
            key: "referenceNumber",
            render: (text) => text || <span className="text-muted">N/A</span>,
            sorter: true,
            width: '150px'
        },
        {
            title: "Date",
            dataIndex: "adjustmentDate",
            key: "adjustmentDate",
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: true,
            width: '120px'
        },
        {
            title: "Location",
            dataIndex: ["location", "name"],
            key: "location",
            render: (text, record) => (
                <span>
                    {text || <span className="text-muted">N/A</span>}
                    {record.location?.type && ` (${record.location.type})`}
                </span>
            ),
            sorter: true,
            width: '180px'
        },
        {
            title: "Product",
            dataIndex: ["product", "name"],
            key: "product",
            render: (text, record) => {
                const product = record.product;
                if (!product) return <span className="text-muted">N/A</span>;

                return (
                    <span className="userimgname">
                        <Link to="#" className="product-img">
                            <img
                                alt={product.name}
                                src={product.imageUrl ? `${BACKEND_BASE_URL}${product.imageUrl}` : '/assets/img/placeholder-product.png'}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/img/placeholder-product.png';
                                }}
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                        </Link>
                        <Link to="#">{product.name}</Link>
                    </span>
                );
            },
            sorter: true,
            width: '250px'
        },
        {
            title: "Type",
            dataIndex: "adjustmentType",
            key: "adjustmentType",
            render: (type) => (
                <Badge bg={
                    type === 'Addition' || type === 'Transfer In' || type === 'Return' ? 'success' :
                    type === 'Subtraction' || type === 'Damage' || type === 'Theft' || type === 'Transfer Out' ? 'danger' :
                    'secondary'
                }>
                    {type}
                </Badge>
            ),
            sorter: true,
            width: '150px'
        },
        {
            title: "Quantity",
            dataIndex: "quantityAdjusted",
            key: "quantity",
            render: (qty, record) => (
                <span className={record.adjustmentType === 'Addition' ? 'text-success' : 'text-danger'}>
                    {record.adjustmentType === 'Addition' ? '+' : '-'}{qty}
                </span>
            ),
            sorter: true,
            align: 'center',
            width: '100px'
        },
        {
            title: "Previous Qty",
            dataIndex: "previousQuantity",
            key: "previousQuantity",
            render: (qty) => qty ?? 0,
            sorter: true,
            align: 'center',
            width: '100px'
        },
        {
            title: "New Qty",
            dataIndex: "newQuantity",
            key: "newQuantity",
            render: (qty) => qty ?? 0,
            sorter: true,
            align: 'center',
            width: '100px'
        },
        {
            title: "By",
            dataIndex: ["adjustedBy", "name"],
            key: "adjustedBy",
            render: (text) => text || <span className="text-muted">N/A</span>,
            sorter: true,
            width: '150px'
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <div className="edit-delete-action">
                    <Link
                        className="me-2 p-2"
                        to="#"
                        data-bs-toggle="modal"
                        data-bs-target="#edit-units"
                    >
                        <Edit className="feather-edit" />
                    </Link>
                    <Link
                        className="confirm-text p-2"
                        to="#"
                        onClick={() => handleDeleteAdjustment(record._id, record.referenceNumber)}
                    >
                        <Trash2 className="feather-trash-2" />
                    </Link>
                </div>
            ),
            width: '120px'
        }
    ];

    return (
        <div className="page-wrapper">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="content">
                <Breadcrumbs
                    maintitle="Stock Adjustment"
                    subtitle="Manage your stock adjustment"
                    addButton="Add New"
                />

                <div className="card table-list-card">
                    <div className="card-body">
                        <div className="table-top">
                            <div className="search-set">
                                <div className="search-input">
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        className="form-control form-control-sm formsearch"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <button className="btn btn-searchset" onClick={() => fetchAdjustments(1, pagination.pageSize)}>
                                        <Search className="feather-search" />
                                    </button>
                                </div>
                            </div>
                            <div className="search-path">
                                <Link
                                    className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`}
                                    onClick={() => setIsFilterVisible(!isFilterVisible)}
                                >
                                    <Filter className="filter-icon" />
                                    <span>
                                        <X className="filter-close" />
                                    </span>
                                </Link>
                            </div>
                            <div className="form-sort stylewidth">
                                <Sliders className="info-img" />
                                <Select
                                    className="select"
                                    options={[
                                        { value: "sortByDate", label: "Sort by Date" },
                                        { value: "sortByQuantity", label: "Sort by Quantity" }
                                    ]}
                                    placeholder="Sort by"
                                />
                            </div>
                        </div>

                        {/* Filter Section */}
                        {isFilterVisible && (
                            <div className="card visible" id="filter_inputs">
                                <div className="card-body pb-0">
                                    <div className="row">
                                        <div className="col-lg-2 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <Select
                                                    options={locations}
                                                    value={selectedLocation}
                                                    onChange={handleFilterChange(setSelectedLocation)}
                                                    placeholder="Choose Location"
                                                    className="select"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-2 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <Select
                                                    options={products}
                                                    value={selectedProduct}
                                                    onChange={handleFilterChange(setSelectedProduct)}
                                                    placeholder="Choose Product"
                                                    className="select"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-2 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <Select
                                                    options={adjustmentTypeOptions}
                                                    value={selectedAdjustmentType}
                                                    onChange={handleFilterChange(setSelectedAdjustmentType)}
                                                    placeholder="Choose Type"
                                                    className="select"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-2 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <DatePicker
                                                    selected={selectedDate}
                                                    onChange={setSelectedDate}
                                                    dateFormat="dd/MM/yyyy"
                                                    placeholderText="Choose Date"
                                                    className="form-control datetimepicker"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-4 col-sm-6 col-12 ms-auto">
                                            <div className="input-blocks">
                                                <button
                                                    className="btn btn-filters ms-auto"
                                                    onClick={resetFilters}
                                                >
                                                    Reset Filters
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Table Section */}
                        <div className="table-responsive">
                            {isLoading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <Table
                                    className="table datanew"
                                    columns={columns}
                                    dataSource={adjustments}
                                    pagination={{
                                        current: pagination.current,
                                        pageSize: pagination.pageSize,
                                        total: pagination.total,
                                        showSizeChanger: true,
                                        onChange: (page, pageSize) => {
                                            setPagination({ current: page, pageSize, total: pagination.total });
                                        }
                                    }}
                                    onChange={handleTableChange}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <StockadjustmentModal
                onAdjustmentCreated={() => fetchAdjustments(pagination.current, pagination.pageSize)}
                locations={locations}
                products={products}
            />
        </div>
    );
};

export default StockAdjustment;
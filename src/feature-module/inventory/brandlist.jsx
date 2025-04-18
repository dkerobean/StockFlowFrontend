import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronUp, Filter, PlusCircle, RotateCcw, Sliders, StopCircle, Zap } from 'feather-icons-react/build/IconComponents';
import { DatePicker } from 'antd';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Select from 'react-select';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import Table from '../../core/pagination/datatable';
import AddBrand from '../../core/modals/inventory/addbrand';
import EditBrand from '../../core/modals/inventory/editbrand';
import { setToogleHeader } from '../../core/redux/action';
import axios from 'axios';

const BrandList = () => {
    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Fetch brands
    const fetchBrands = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/brands`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setBrands(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching brands:", error);
            toast.error("Failed to load brands");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    // Handle delete brand
    const handleDelete = async (id) => {
        const MySwal = withReactContent(Swal);
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            showCancelButton: true,
            confirmButtonColor: '#00ff00',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonColor: '#ff0000',
            cancelButtonText: 'Cancel',
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/brands/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setBrands(brands.filter(brand => brand._id !== id));
                toast.success('Brand deleted successfully');
            } catch (error) {
                console.error("Error deleting brand:", error);
                toast.error("Failed to delete brand");
            }
        }
    };

    const toggleFilterVisibility = () => setIsFilterVisible(prev => !prev);
    const handleDateChange = (date) => setSelectedDate(date);

    // Filter options
    const oldandlatestvalue = [
        { value: 'date', label: 'Sort by Date' },
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
    ];
    const brandOptions = [
        { value: 'choose', label: 'Choose Brand' },
        { value: 'lenevo', label: 'Lenevo' },
        { value: 'boat', label: 'Boat' },
        { value: 'nike', label: 'Nike' },
    ];
    const status = [
        { value: 'choose Status', label: 'Choose Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    // Tooltips
    const renderTooltip = (props) => <Tooltip id="pdf-tooltip" {...props}>Pdf</Tooltip>;
    const renderExcelTooltip = (props) => <Tooltip id="excel-tooltip" {...props}>Excel</Tooltip>;
    const renderPrinterTooltip = (props) => <Tooltip id="printer-tooltip" {...props}>Printer</Tooltip>;
    const renderRefreshTooltip = (props) => <Tooltip id="refresh-tooltip" {...props}>Refresh</Tooltip>;
    const renderCollapseTooltip = (props) => <Tooltip id="refresh-tooltip" {...props}>Collapse</Tooltip>;

    // Table columns
    const columns = [
        {
            title: "Brand",
            dataIndex: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Brand Slug",
            dataIndex: "slug",
            sorter: (a, b) => a.slug.localeCompare(b.slug),
        },
        {
            title: "Created On",
            dataIndex: "createdAt",
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (status) => (
                <span className={`badge ${status?.toLowerCase() === 'active' ? 'badge-linesuccess' : 'badge-linedanger'}`}>
                    {status}
                </span>
            ),
            sorter: (a, b) => a.status.localeCompare(b.status),
        },
        {
            title: 'Actions',
            dataIndex: '_id',
            key: 'actions',
            render: (id, record) => (
                <td className="action-table-data">
                    <div className="edit-delete-action">
                        <Link
                            className="me-2 p-2"
                            to="#"
                            data-bs-toggle="modal"
                            data-bs-target={`#edit-brand-${id}`}
                        >
                            <i data-feather="edit" className="feather-edit"></i>
                        </Link>
                        <Link
                            className="confirm-text p-2"
                            to="#"
                            onClick={() => handleDelete(id)}
                        >
                            <i data-feather="trash-2" className="feather-trash-2"></i>
                        </Link>
                        <EditBrand
                            brandId={id}
                            currentName={record.name}
                            currentStatus={record.status}
                            onUpdate={fetchBrands}
                        />
                    </div>
                </td>
            )
        },
    ];

    return (
        <div>
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4>Brand</h4>
                                <h6>Manage your brands</h6>
                            </div>
                        </div>
                        <ul className="table-top-head">
                            <li>
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <Link>
                                        <i data-feather="file-text" className="feather-file-text"></i>
                                    </Link>
                                </OverlayTrigger>
                            </li>
                            <li>
                                <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
                                    <Link>
                                        <i data-feather="grid" className="feather-grid"></i>
                                    </Link>
                                </OverlayTrigger>
                            </li>
                            <li>
                                <OverlayTrigger placement="top" overlay={renderPrinterTooltip}>
                                    <Link>
                                        <i data-feather="printer" className="feather-printer"></i>
                                    </Link>
                                </OverlayTrigger>
                            </li>
                            <li>
                                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                                    <Link onClick={fetchBrands}>
                                        <RotateCcw />
                                    </Link>
                                </OverlayTrigger>
                            </li>
                            <li>
                                <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                                    <Link
                                        id="collapse-header"
                                        className={data ? "active" : ""}
                                        onClick={() => dispatch(setToogleHeader(!data))}
                                    >
                                        <ChevronUp />
                                    </Link>
                                </OverlayTrigger>
                            </li>
                        </ul>
                        <div className="page-btn">
                            <Link
                                to="#"
                                className="btn btn-added"
                                data-bs-toggle="modal"
                                data-bs-target="#add-brand"
                            >
                                <PlusCircle className="me-2" />
                                Add New Brand
                            </Link>
                        </div>
                    </div>

                    <div className="card table-list-card">
                        <div className="card-body">
                            <div className="table-top">
                                <div className="search-set">
                                    <div className="search-input">
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            className="form-control form-control-sm formsearch"
                                        />
                                        <Link to="#" className="btn btn-searchset">
                                            <i data-feather="search" className="feather-search" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="search-path">
                                    <Link
                                        className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`}
                                        onClick={toggleFilterVisibility}
                                    >
                                        <Filter className="filter-icon" />
                                        <span>
                                            <i data-feather="x" className="feather-x" />
                                        </span>
                                    </Link>
                                </div>
                                <div className="form-sort">
                                    <Sliders className="info-img" />
                                    <Select
                                        className="select"
                                        options={oldandlatestvalue}
                                        placeholder="Newest"
                                    />
                                </div>
                            </div>

                            {/* Filter Section */}
                            <div
                                className={`card${isFilterVisible ? " visible" : ""}`}
                                id="filter_inputs"
                                style={{ display: isFilterVisible ? "block" : "none" }}
                            >
                                <div className="card-body pb-0">
                                    <div className="row">
                                        <div className="col-lg-3 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <Zap className="info-img" />
                                                <Select
                                                    className="select"
                                                    options={brandOptions}
                                                    placeholder="Choose Brand"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <i data-feather="calendar" className="info-img" />
                                                <DatePicker
                                                    selected={selectedDate}
                                                    onChange={handleDateChange}
                                                    className="filterdatepicker"
                                                    placeholder='Choose Date'
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <StopCircle className="info-img" />
                                                <Select
                                                    className="select"
                                                    options={status}
                                                    placeholder="Choose Status"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-sm-6 col-12 ms-auto">
                                            <div className="input-blocks">
                                                <Link className="btn btn-filters ms-auto">
                                                    <i data-feather="search" className="feather-search" />
                                                    Search
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <Table
                                    columns={columns}
                                    dataSource={brands}
                                    loading={loading}
                                    rowKey="_id"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <AddBrand onSuccess={fetchBrands} />
        </div>
    );
};

export default BrandList;
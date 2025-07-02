import React, { useState, useEffect } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Image from '../../core/img/image';
import { Link } from 'react-router-dom';
import { ChevronUp, Filter, PlusCircle, RotateCcw, Sliders, StopCircle, Zap } from 'feather-icons-react/build/IconComponents';
import { useDispatch, useSelector } from 'react-redux';
import { setToogleHeader } from '../../core/redux/action';
import Select from 'react-select';
import { DatePicker } from 'antd';
import AddCategory from "../../core/modals/inventory/addcategorylist";
import EditCategory from '../../core/modals/inventory/editcategorylist';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import Table from '../../core/pagination/datatable'
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify'; // Add ToastContainer back
import 'react-toastify/dist/ReactToastify.css';

const CategoryList = () => {
    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = process.env.REACT_APP_API_URL;

    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };
    const [selectedDate, setSelectedDate] = useState(new Date());
    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    // Fetch product categories
    const fetchCategories = async () => {
        console.log('fetchCategories called'); // Debug log
        try {
            const response = await axios.get(`${API_URL}/product-categories`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setCategories(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching product categories:", error);
            toast.error("Failed to load product categories");
            setLoading(false);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                // Redirect to login if needed
            }
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Handle delete category
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
                await axios.delete(`${API_URL}/product-categories/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                toast.success('Product category deleted successfully');
                setCategories(categories.filter(category => category._id !== id));
            } catch (error) {
                console.error("Error deleting product category:", error);
                toast.error(error.response?.data?.message || "Failed to delete product category");
            }
        }
    };

    const oldandlatestvalue = [
        { value: 'date', label: 'Sort by Date' },
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
    ];

    const status = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    const renderTooltip = (props) => (
        <Tooltip id="pdf-tooltip" {...props}>
            Pdf
        </Tooltip>
    );
    const renderExcelTooltip = (props) => (
        <Tooltip id="excel-tooltip" {...props}>
            Excel
        </Tooltip>
    );
    const renderPrinterTooltip = (props) => (
        <Tooltip id="printer-tooltip" {...props}>
            Printer
        </Tooltip>
    );
    const renderRefreshTooltip = (props) => (
        <Tooltip id="refresh-tooltip" {...props}>
            Refresh
        </Tooltip>
    );
    const renderCollapseTooltip = (props) => (
        <Tooltip id="refresh-tooltip" {...props}>
            Collapse
        </Tooltip>
    )

    const columns = [
        {
            title: "Category Name",
            dataIndex: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Description",
            dataIndex: "description",
            render: (description) => description || <span className="text-muted">No description</span>,
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
                <span className={`badge ${status === 'active' ? 'badge-linesuccess' : 'badge-linedanger'}`}>
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
                            data-bs-target={`#edit-category-${id}`}
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
                        <EditCategory
                            categoryId={id}
                            currentName={record.name}
                            currentStatus={record.status}
                            onUpdate={fetchCategories}
                        />
                    </div>
                </td>
            )
        },
    ];

    return (
        <div>
            <ToastContainer />
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4>Product Categories</h4>
                                <h6>Manage your product categories</h6>
                            </div>
                        </div>
                        <ul className="table-top-head">
                            <li>
                                <OverlayTrigger placement="top" overlay={renderTooltip}>
                                    <Link>
                                        <Image src="assets/img/icons/pdf.svg" alt="img" />
                                    </Link>
                                </OverlayTrigger>
                            </li>
                            <li>
                                <OverlayTrigger placement="top" overlay={renderExcelTooltip}>
                                    <Link data-bs-toggle="tooltip" data-bs-placement="top">
                                        <Image src="assets/img/icons/excel.svg" alt="img" />
                                    </Link>
                                </OverlayTrigger>
                            </li>
                            <li>
                                <OverlayTrigger placement="top" overlay={renderPrinterTooltip}>
                                    <Link data-bs-toggle="tooltip" data-bs-placement="top">
                                        <i data-feather="printer" className="feather-printer" />
                                    </Link>
                                </OverlayTrigger>
                            </li>
                            <li>
                                <OverlayTrigger placement="top" overlay={renderRefreshTooltip}>
                                    <Link data-bs-toggle="tooltip" data-bs-placement="top" onClick={fetchCategories}>
                                        <RotateCcw />
                                    </Link>
                                </OverlayTrigger>
                            </li>
                            <li>
                                <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                                    <Link
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        id="collapse-header"
                                        className={data ? "active" : ""}
                                        onClick={() => { dispatch(setToogleHeader(!data)) }}
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
                                data-bs-target="#add-category"
                            >
                                <PlusCircle className="me-2" />
                                Add New Product Category
                            </Link>
                        </div>
                    </div>
                    {/* /product list */}
                    <div className="card table-list-card">
                        <div className="card-body">
                            <div className="table-top">
                                <div className="search-set">
                                    <div className="search-input">
                                        <input
                                            type="text"
                                            placeholder="Search categories..."
                                            className="form-control form-control-sm formsearch"
                                        />
                                        <Link to className="btn btn-searchset">
                                            <i data-feather="search" className="feather-search" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="search-path">
                                    <Link className={`btn btn-filter ${isFilterVisible ? "setclose" : ""}`} id="filter_search">
                                        <Filter
                                            className="filter-icon"
                                            onClick={toggleFilterVisibility}
                                        />
                                        <span onClick={toggleFilterVisibility}>
                                            <Image src="assets/img/icons/closes.svg" alt="img" />
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
                            {/* /Filter */}
                            <div
                                className={`card${isFilterVisible ? " visible" : ""}`}
                                id="filter_inputs"
                                style={{ display: isFilterVisible ? "block" : "none" }}
                            >
                                <div className="card-body pb-0">
                                    <div className="row">
                                        <div className="col-lg-3 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <i data-feather="calendar" className="info-img" />
                                                <div className="input-groupicon">
                                                    <DatePicker
                                                        selected={selectedDate}
                                                        onChange={handleDateChange}
                                                        type="date"
                                                        className="filterdatepicker"
                                                        dateFormat="dd-MM-yyyy"
                                                        placeholder='Choose Date'
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <StopCircle className="info-img" />
                                                <Select options={status} className="select" placeholder="Choose Status" />
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-sm-6 col-12 ms-auto">
                                            <div className="input-blocks">
                                                <Link className="btn btn-filters ms-auto">
                                                    {" "}
                                                    <i data-feather="search" className="feather-search" />{" "}
                                                    Search{" "}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* /Filter */}
                            <div className="table-responsive">
                                <Table
                                    columns={columns}
                                    dataSource={categories}
                                    loading={loading}
                                    rowKey="_id"
                                />
                            </div>
                        </div>
                    </div>
                    {/* /product list */}
                </div>
            </div>
            <AddCategory onSuccess={fetchCategories} />
        </div>
    )
}

export default CategoryList;
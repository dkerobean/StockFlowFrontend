import React, { useState, useEffect } from 'react'
import { OverlayTrigger, Tooltip, Modal, Button, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Image from '../../core/img/image';
import { ChevronUp, RotateCcw, Sliders, StopCircle, User } from 'feather-icons-react/build/IconComponents';
import { setToogleHeader } from '../../core/redux/action';
import { useDispatch, useSelector } from 'react-redux';
import { Filter } from 'react-feather';
import Select from 'react-select';
import TableComponent from '../../core/pagination/datatable'
import DateRangePicker from 'react-bootstrap-daterangepicker';
import Calendar from 'feather-icons-react/build/IconComponents/Calendar';
import axios from 'axios';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const InvoiceReport = () => {
    const dataSource = useSelector((state) => state.invoicereport_data);
    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header);

    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
    const [endDate, setEndDate] = useState(new Date());
    const [status, setStatus] = useState('');
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');

    useEffect(() => {
        fetchLocations();
        fetchInvoices();
    }, [startDate, endDate, status, selectedLocation]);

    const fetchLocations = async () => {
        try {
            const { data } = await axios.get('/api/locations');
            setLocations(data);
        } catch (error) {
            toast.error('Error fetching locations');
        }
    };

    const fetchInvoices = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate.toISOString());
            if (endDate) params.append('endDate', endDate.toISOString());
            if (status) params.append('status', status);
            if (selectedLocation) params.append('locationId', selectedLocation);

            const { data } = await axios.get(`/api/invoices?${params.toString()}`);
            dataSource.data = data;
        } catch (error) {
            toast.error('Error fetching invoices');
        }
    };

    const toggleFilterVisibility = () => {
        setIsFilterVisible((prevVisibility) => !prevVisibility);
    };
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
    const statusupdate = [
        { value: 'Choose Status', label: 'Choose Status' },
        { value: 'Paid', label: 'Paid' },
        { value: 'Unpaid', label: 'Unpaid' },
        { value: 'Overdue', label: 'Overdue' },
    ];
    const oldandlatestvalue = [
        { value: 'Sort by Date', label: 'Sort by Date' },
        { value: '07 09 23', label: '07 09 23' },
        { value: '21 09 23', label: '21 09 23' },
    ];

    const columns = [
        {
            title: "invoiceno",
            dataIndex: "invoiceno",
            sorter: (a, b) => a.invoiceno.length - b.invoiceno.length,
        },
        {
            title: "customer",
            dataIndex: "customer",
            sorter: (a, b) => a.customer.length - b.customer.length,
        },
        {
            title: "duedate",
            dataIndex: "duedate",
            sorter: (a, b) => a.duedate.length - b.duedate.length,
        },
        {
            title: "amount",
            dataIndex: "amount",
            sorter: (a, b) => a.amount.length - b.amount.length,
        },
        {
            title: "paid",
            dataIndex: "paid",
            sorter: (a, b) => a.paid.length - b.paid.length,
        },
        {
            title: "amountdue",
            dataIndex: "amountdue",
            sorter: (a, b) => a.amountdue.length - b.amountdue.length,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (text) => (
                <div>
                    {text === "Paid" && (
                        <span className="badge badge-linesuccess">{text}</span>
                    )}
                    {text === "Unpaid" && (
                        <span className="badge badge-linedanger">{text}</span>
                    )}
                    {text === "Overdue" && (
                        <span className="badge badges-warning">{text}</span>
                    )}
                </div>
            ),
            sorter: (a, b) => a.status.length - b.status.length,
        },
        {
            title: "Action",
            dataIndex: "action",
            render: (_, record) => (
                <div className="action-buttons">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setSelectedInvoice(record);
                            setShowInvoiceModal(true);
                        }}
                    >
                        View Invoice
                    </Button>
                </div>
            ),
        },
    ]
    const initialSettings = {
        endDate: new Date("2020-08-11T12:30:00.000Z"),
        ranges: {
            "Last 30 Days": [
                new Date("2020-07-12T04:57:17.076Z"),
                new Date("2020-08-10T04:57:17.076Z"),
            ],
            "Last 7 Days": [
                new Date("2020-08-04T04:57:17.076Z"),
                new Date("2020-08-10T04:57:17.076Z"),
            ],
            "Last Month": [
                new Date("2020-06-30T18:30:00.000Z"),
                new Date("2020-07-31T18:29:59.999Z"),
            ],
            "This Month": [
                new Date("2020-07-31T18:30:00.000Z"),
                new Date("2020-08-31T18:29:59.999Z"),
            ],
            Today: [
                new Date("2020-08-10T04:57:17.076Z"),
                new Date("2020-08-10T04:57:17.076Z"),
            ],
            Yesterday: [
                new Date("2020-08-09T04:57:17.076Z"),
                new Date("2020-08-09T04:57:17.076Z"),
            ],
        },
        startDate: new Date("2020-08-04T04:57:17.076Z"), // Set "Last 7 Days" as default
        timePicker: false,
    };

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setShowInvoiceModal(true);
    };

    const handlePrintInvoice = () => {
        window.print();
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'Paid': 'success',
            'Pending': 'warning',
            'Overdue': 'danger',
            'Cancelled': 'secondary'
        };
        return <Badge bg={statusColors[status] || 'primary'}>{status}</Badge>;
    };

    return (
        <div>
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4>Invoice Report </h4>
                                <h6>Manage Your Invoice Report</h6>
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
                                    <Link data-bs-toggle="tooltip" data-bs-placement="top">
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
                    </div>
                    {/* /product list */}
                    <div className="card table-list-card">
                        <div className="card-body">
                            <div className="table-top">
                                <div className="search-set">
                                    <div className="search-set">
                                        <div className="search-input">
                                            <input
                                                type="text"
                                                placeholder="Search"
                                                className="form-control form-control-sm formsearch"
                                            />
                                            <Link to className="btn btn-searchset">
                                                <i data-feather="search" className="feather-search" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="search-path">
                                    <div className="d-flex align-items-center">
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
                                className={`card${isFilterVisible ? ' visible' : ''}`}
                                id="filter_inputs"
                                style={{ display: isFilterVisible ? 'block' : 'none' }}
                            >
                                <div className="card-body pb-0">
                                    <div className="row">
                                        <div className="col-lg-3 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <User className="info-img" />
                                                <Select
                                                    className="select"
                                                    options={statusupdate}
                                                    placeholder="Choose Brand"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <div className="position-relative daterange-wraper">
                                                    <Calendar />
                                                    <DateRangePicker
                                                        initialSettings={initialSettings}
                                                    >
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                        />
                                                    </DateRangePicker>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-3 col-sm-6 col-12">
                                            <div className="input-blocks">
                                                <a className="btn btn-filters ms-auto">
                                                    {" "}
                                                    <i data-feather="search" className="feather-search" />{" "}
                                                    sssSearch{" "}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* /Filter */}
                            <div className="table-responsive">
                                <TableComponent columns={columns} dataSource={dataSource} />
                            </div>
                        </div>
                    </div>
                    {/* /product list */}
                </div>
            </div>

            {/* Invoice Modal */}
            <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Invoice Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedInvoice && (
                        <div className="invoice-container">
                            <div className="invoice-header mb-4">
                                <div className="row">
                                    <div className="col-6">
                                        <h4>StockFlow</h4>
                                        <p>123 Business Street</p>
                                        <p>City, State 12345</p>
                                        <p>Phone: (123) 456-7890</p>
                                    </div>
                                    <div className="col-6 text-end">
                                        <h4>INVOICE</h4>
                                        <p>Invoice #: {selectedInvoice.invoiceno}</p>
                                        <p>Due Date: {selectedInvoice.duedate}</p>
                                        <p>Status: {getStatusBadge(selectedInvoice.status)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="invoice-customer mb-4">
                                <div className="row">
                                    <div className="col-6">
                                        <h5>Bill To:</h5>
                                        <p>{selectedInvoice.customer}</p>
                                    </div>
                                    <div className="col-6 text-end">
                                        <h5>Payment Details:</h5>
                                        <p>Amount: ${selectedInvoice.amount}</p>
                                        <p>Paid: ${selectedInvoice.paid}</p>
                                        <p>Due: ${selectedInvoice.amountdue}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="invoice-summary">
                                <div className="row">
                                    <div className="col-12">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td>Total Amount:</td>
                                                    <td className="text-end">${selectedInvoice.amount}</td>
                                                </tr>
                                                <tr>
                                                    <td>Amount Paid:</td>
                                                    <td className="text-end">${selectedInvoice.paid}</td>
                                                </tr>
                                                <tr>
                                                    <td>Amount Duessss:</td>
                                                    <td className="text-end">${selectedInvoice.amountdue}</td>
                                                </tr>
                                                <tr className="fw-bold">
                                                    <td>Status:</td>
                                                    <td className="text-end">
                                                        {getStatusBadge(selectedInvoice.status)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowInvoiceModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handlePrintInvoice}>
                        Print Invoice
                    </Button>
                </Modal.Footer>
            </Modal>

            <style jsx>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .invoice-container, .invoice-container * {
                        visibility: visible;
                    }
                    .invoice-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .modal-footer {
                        display: none !important;
                    }
                }
                .invoice-container {
                    padding: 20px;
                }
                .badge-linesuccess {
                    background-color: #e8f5e9;
                    color: #2e7d32;
                    border: 1px solid #2e7d32;
                }
                .badge-linedanger {
                    background-color: #ffebee;
                    color: #c62828;
                    border: 1px solid #c62828;
                }
                .badges-warning {
                    background-color: #fff3e0;
                    color: #ef6c00;
                    border: 1px solid #ef6c00;
                }
            `}</style>
        </div>
    )
}

export default InvoiceReport

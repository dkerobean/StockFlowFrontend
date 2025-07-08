import React, { useState, useEffect } from 'react'
import Image from '../../core/img/image';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ChevronUp, Download, Eye, File, Filter, PlusCircle, RotateCcw, Sliders, StopCircle, User, Edit, Trash2, Search } from 'feather-icons-react/build/IconComponents';
import { setToogleHeader } from '../../core/redux/action';
import { useDispatch, useSelector } from 'react-redux';
import Select from 'react-select';
import AddPurchases from '../../core/modals/purchases/addpurchases';
import ImportPurchases from '../../core/modals/purchases/importpurchases';
import EditPurchases from '../../core/modals/purchases/editpurchases';
import ViewPurchaseDetails from '../../core/modals/purchases/viewpurchasedetails';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import purchaseService from '../../services/purchaseService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PurchasesList = () => {

    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header);

    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(null);
    
    // Modal state management
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [loadingPurchase, setLoadingPurchase] = useState(false);
    
    const oldandlatestvalue = [
        { value: 'date', label: 'Sort by Date' },
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
    ];

    // Convert suppliers to select options
    const supplierOptions = [
        { value: '', label: 'Choose Supplier Name' },
        ...suppliers.map(supplier => ({
            value: supplier._id,
            label: supplier.supplierName
        }))
    ];

    const statusOptions = [
        { value: '', label: 'Choose Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'ordered', label: 'Ordered' },
        { value: 'received', label: 'Received' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'partial', label: 'Partial' },
    ];

    const paymentStatusOptions = [
        { value: '', label: 'Choose Payment Status' },
        { value: 'paid', label: 'Paid' },
        { value: 'partial', label: 'Partial' },
        { value: 'unpaid', label: 'Unpaid' },
    ];

    // Fetch purchases and suppliers on component mount
    useEffect(() => {
        fetchPurchases();
        fetchSuppliers();
    }, []);

    // Fetch data when filters change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPurchases();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedSupplier, selectedStatus, selectedPaymentStatus]);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedSupplier) params.supplier = selectedSupplier;
            if (selectedStatus) params.status = selectedStatus;
            if (selectedPaymentStatus) params.paymentStatus = selectedPaymentStatus;

            const response = await purchaseService.getPurchases(params);
            setPurchases(response.purchases || []);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            toast.error('Failed to fetch purchases');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await purchaseService.getSuppliers();
            setSuppliers(response || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const MySwal = withReactContent(Swal);

    const showConfirmationAlert = (purchaseId) => {
        MySwal.fire({
            title: 'Are you sure?',
            text: 'This will deactivate the purchase. You won\'t be able to revert this!',
            showCancelButton: true,
            confirmButtonColor: '#00ff00',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonColor: '#ff0000',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    await purchaseService.deletePurchase(purchaseId);
                    return true;
                } catch (error) {
                    MySwal.showValidationMessage(
                        `Delete failed: ${error.response?.data?.message || 'Unknown error'}`
                    );
                    return false;
                }
            },
            allowOutsideClick: () => !MySwal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                toast.success('Purchase deleted successfully');
                fetchPurchases();
            }
        });
    };

    const handleReceivePurchase = async (purchaseId) => {
        try {
            await purchaseService.receivePurchase(purchaseId);
            toast.success('Purchase received successfully and inventory updated');
            fetchPurchases();
        } catch (error) {
            console.error('Error receiving purchase:', error);
            toast.error('Failed to receive purchase');
        }
    };

    const handleMarkAsPaid = async (purchaseId, amountDue) => {
        // Simple confirmation dialog
        MySwal.fire({
            title: 'Mark as Paid',
            text: `Are you sure you want to mark this purchase as fully paid? Amount: $${amountDue.toFixed(2)}`,
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            confirmButtonText: 'Yes, Mark as Paid',
            cancelButtonColor: '#dc3545',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    await purchaseService.recordPayment(purchaseId, {
                        paymentAmount: amountDue,
                        paymentMethod: 'cash',
                        paymentDate: new Date(),
                        notes: 'Marked as paid from purchase list'
                    });
                    return true;
                } catch (error) {
                    MySwal.showValidationMessage(
                        `Payment failed: ${error.response?.data?.message || 'Unknown error'}`
                    );
                    return false;
                }
            },
            allowOutsideClick: () => !MySwal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                toast.success('Payment recorded successfully!');
                fetchPurchases(); // Refresh the list
            }
        });
    };

    // Handle view purchase details
    const handleViewPurchase = async (purchaseId) => {
        try {
            setLoadingPurchase(true);
            const purchaseData = await purchaseService.getPurchaseById(purchaseId);
            setSelectedPurchase(purchaseData);
            setViewModalVisible(true);
        } catch (error) {
            console.error('Error fetching purchase details:', error);
            toast.error('Failed to load purchase details');
        } finally {
            setLoadingPurchase(false);
        }
    };

    // Handle edit purchase
    const handleEditPurchase = async (purchaseId) => {
        try {
            setLoadingPurchase(true);
            const purchaseData = await purchaseService.getPurchaseById(purchaseId);
            setSelectedPurchase(purchaseData);
            setEditModalVisible(true);
        } catch (error) {
            console.error('Error fetching purchase for editing:', error);
            toast.error('Failed to load purchase for editing');
        } finally {
            setLoadingPurchase(false);
        }
    };

    // Close modals
    const closeViewModal = () => {
        setViewModalVisible(false);
        setSelectedPurchase(null);
    };

    const closeEditModal = () => {
        setEditModalVisible(false);
        setSelectedPurchase(null);
    };

    // Handle purchase updated
    const handlePurchaseUpdated = () => {
        fetchPurchases(); // Refresh the list
        closeEditModal();
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: 'unstatus-badge',
            ordered: 'status-badge ordered', 
            received: 'status-badge',
            cancelled: 'badge-linedangered',
            partial: 'badges-warning'
        };
        
        const statusText = {
            pending: 'Pending',
            ordered: 'Ordered',
            received: 'Received', 
            cancelled: 'Cancelled',
            partial: 'Partial'
        };
        
        return (
            <span className={`badges ${statusMap[status] || 'unstatus-badge'}`}>
                {statusText[status] || status}
            </span>
        );
    };

    const getPaymentStatusBadge = (paymentStatus) => {
        const statusMap = {
            paid: 'badge-linesuccess',
            partial: 'badges-warning',
            unpaid: 'badge badge-linedangered'
        };
        
        return (
            <span className={statusMap[paymentStatus] || 'badge badge-linedangered'}>
                {paymentStatus ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1) : 'Unpaid'}
            </span>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
    );

    return (
        <div>
            <div className="page-wrapper">
                <ToastContainer position="top-right" autoClose={3000} />
                <div className="content">
                    <div className="page-header transfer">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4>Purchase List</h4>
                                <h6>Manage your purchases</h6>
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

                                    <Link data-bs-toggle="tooltip" data-bs-placement="top" onClick={fetchPurchases}>
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
                        <div className="d-flex purchase-pg-btn">
                            <div className="page-btn">
                                <Link
                                    to="#"
                                    className="btn btn-added"
                                    data-bs-toggle="modal"
                                    data-bs-target="#add-units"
                                >
                                    
                                    <PlusCircle className="me-2"/> 
                                    Add New Purchase
                                </Link>
                            </div>
                            <div className="page-btn import">
                                <Link
                                    to="#"
                                    className="btn btn-added color"
                                    data-bs-toggle="modal"
                                    data-bs-target="#view-notes"
                                >
                                  
                                    <Download  className="me-2"/>
                                    Import Purchase
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* /product list */}
                    <div className="card table-list-card">
                        <div className="card-body">
                            <div className="table-top d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div className="search-set flex-grow-1" style={{ maxWidth: '450px' }}>
                                    <div className="search-input">
                                        <input
                                            type="text"
                                            placeholder="🔍 Search purchases..."
                                            className="form-control formsearch"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <button className="btn btn-searchset" type="button">
                                            <Search size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="search-path">
                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        <div style={{ minWidth: '160px' }}>
                                            <Select 
                                                options={supplierOptions} 
                                                className="select" 
                                                placeholder="👤 Choose Supplier Name"
                                                value={supplierOptions.find(option => option.value === selectedSupplier) || null}
                                                onChange={(option) => setSelectedSupplier(option?.value || '')}
                                                isClearable
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <div style={{ minWidth: '160px' }}>
                                            <Select 
                                                options={statusOptions} 
                                                className="select" 
                                                placeholder="📊 Choose Status"
                                                value={statusOptions.find(option => option.value === selectedStatus) || null}
                                                onChange={(option) => setSelectedStatus(option?.value || '')}
                                                isClearable
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <div style={{ minWidth: '160px' }}>
                                            <Select 
                                                options={paymentStatusOptions} 
                                                className="select" 
                                                placeholder="💳 Choose Payment Status"
                                                value={paymentStatusOptions.find(option => option.value === selectedPaymentStatus) || null}
                                                onChange={(option) => setSelectedPaymentStatus(option?.value || '')}
                                                isClearable
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <button 
                                            variant="outline-secondary" 
                                            size="sm" 
                                            onClick={fetchPurchases}
                                            className="btn btn-primary d-flex align-items-center gap-1"
                                            style={{ minWidth: '100px', height: '44px' }}
                                        >
                                            <Search size={14} />
                                            Search
                                        </button>
                                        <button 
                                            variant="outline-secondary" 
                                            size="sm" 
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSelectedSupplier(null);
                                                setSelectedStatus(null);
                                                setSelectedPaymentStatus(null);
                                                fetchPurchases();
                                                toast.info("Filters reset");
                                            }}
                                            className="btn btn-outline-secondary d-flex align-items-center gap-1"
                                            style={{ minWidth: '100px', height: '44px' }}
                                        >
                                            <RotateCcw size={14} />
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* /Filter */}
                            <div className="table-responsive product-list">
                                {loading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading purchases...</span>
                                        </div>
                                        <p className="mt-2 text-muted">Loading purchases...</p>
                                    </div>
                                ) : purchases.length === 0 ? (
                                    <div className="text-center py-4">
                                        <File size={48} className="text-muted mb-3" />
                                        <h5 className="text-muted">No purchases found</h5>
                                        <p className="text-muted">No purchases match your search criteria</p>
                                    </div>
                                ) : (
                                <table className="table  datanew list">
                                    <thead>
                                        <tr>
                                            <th className="no-sort">
                                                <label className="checkboxs">
                                                    <input type="checkbox" id="select-all" />
                                                    <span className="checkmarks" />
                                                </label>
                                            </th>
                                            <th>Purchase Number</th>
                                            <th>Supplier Name</th>
                                            <th>Reference</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Grand Total</th>
                                            <th>Paid</th>
                                            <th>Due</th>
                                            <th>Payment Status</th>
                                            <th className="no-sort">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchases.map((purchase) => (
                                            <tr key={purchase._id}>
                                                <td>
                                                    <label className="checkboxs">
                                                        <input type="checkbox" />
                                                        <span className="checkmarks" />
                                                    </label>
                                                </td>
                                                <td className="fw-bold">{purchase.purchaseNumber}</td>
                                                <td>{purchase.supplier?.supplierName || 'N/A'}</td>
                                                <td>{purchase.referenceNumber || '-'}</td>
                                                <td>{formatDate(purchase.purchaseDate)}</td>
                                                <td>{getStatusBadge(purchase.status)}</td>
                                                <td>{formatCurrency(purchase.grandTotal)}</td>
                                                <td>{formatCurrency(purchase.amountPaid)}</td>
                                                <td>{formatCurrency(purchase.amountDue)}</td>
                                                <td>{getPaymentStatusBadge(purchase.paymentStatus)}</td>
                                                <td className="action-table-data">
                                                    <div className="edit-delete-action">
                                                        <Link 
                                                            className="me-2 p-2" 
                                                            to="#"
                                                            onClick={() => handleViewPurchase(purchase._id)}
                                                            title="View Details"
                                                            style={{pointerEvents: loadingPurchase ? 'none' : 'auto'}}
                                                        >
                                                            <Eye className="action-eye"/>
                                                        </Link>
                                                        {purchase.status === 'ordered' && (
                                                            <button
                                                                className="btn btn-sm btn-success me-2 p-2"
                                                                onClick={() => handleReceivePurchase(purchase._id)}
                                                                title="Receive Purchase"
                                                            >
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                        )}
                                                        {purchase.paymentStatus !== 'paid' && (
                                                            <button
                                                                className="btn btn-sm btn-primary me-2 p-2"
                                                                onClick={() => handleMarkAsPaid(purchase._id, purchase.amountDue)}
                                                                title="Mark as Paid"
                                                            >
                                                                <i className="fas fa-dollar-sign"></i>
                                                            </button>
                                                        )}
                                                        <Link
                                                            className="me-2 p-2"
                                                            to="#"
                                                            onClick={() => handleEditPurchase(purchase._id)}
                                                            title="Edit Purchase"
                                                            style={{pointerEvents: loadingPurchase ? 'none' : 'auto'}}
                                                        >
                                                            <Edit className="feather-edit" />
                                                        </Link>
                                                        <Link 
                                                            className="confirm-text p-2" 
                                                            to="#" 
                                                            onClick={() => showConfirmationAlert(purchase._id)}
                                                            title="Delete Purchase"
                                                        >
                                                            <Trash2 className="feather-trash-2" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* /product list */}
                </div>
            </div>
        <AddPurchases onPurchaseAdded={fetchPurchases} />
        <ImportPurchases />
        <ViewPurchaseDetails 
            purchase={selectedPurchase}
            isVisible={viewModalVisible}
            onClose={closeViewModal}
        />
        <EditPurchases 
            purchase={selectedPurchase}
            isVisible={editModalVisible}
            onClose={closeEditModal}
            onPurchaseUpdated={handlePurchaseUpdated}
        />
        </div>
    )
}

export default PurchasesList
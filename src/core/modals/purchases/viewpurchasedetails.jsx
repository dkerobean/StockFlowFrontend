import React from 'react';
import { X } from 'feather-icons-react/build/IconComponents';

const ViewPurchaseDetails = ({ purchase, isVisible, onClose }) => {
    if (!purchase) return null;

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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            pending: 'badge badge-warning',
            ordered: 'badge badge-info', 
            received: 'badge badge-success',
            cancelled: 'badge badge-danger',
            partial: 'badge badge-warning'
        };
        
        return (
            <span className={statusMap[status] || 'badge badge-secondary'}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
            </span>
        );
    };

    const getPaymentStatusBadge = (paymentStatus) => {
        const statusMap = {
            paid: 'badge badge-success',
            partial: 'badge badge-warning',
            unpaid: 'badge badge-danger'
        };
        
        return (
            <span className={statusMap[paymentStatus] || 'badge badge-danger'}>
                {paymentStatus ? paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1) : 'Unpaid'}
            </span>
        );
    };

    return (
        <div className={`modal fade ${isVisible ? 'show d-block' : ''}`} id="view-purchase-details" tabIndex="-1" style={{backgroundColor: isVisible ? 'rgba(0,0,0,0.5)' : 'transparent'}}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-0">
                        <div className="page-title">
                            <h4>Purchase Details</h4>
                            <p className="text-muted mb-0">Complete purchase information</p>
                        </div>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="modal-body">
                        {/* Purchase Header Information */}
                        <div className="row mb-4">
                            <div className="col-lg-6">
                                <div className="card h-100">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Purchase Information</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Purchase Number:</strong></div>
                                            <div className="col-sm-7">{purchase.purchaseNumber}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Reference Number:</strong></div>
                                            <div className="col-sm-7">{purchase.referenceNumber || '-'}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Purchase Date:</strong></div>
                                            <div className="col-sm-7">{formatDate(purchase.purchaseDate)}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Due Date:</strong></div>
                                            <div className="col-sm-7">{purchase.dueDate ? formatDate(purchase.dueDate) : '-'}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Status:</strong></div>
                                            <div className="col-sm-7">{getStatusBadge(purchase.status)}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Created By:</strong></div>
                                            <div className="col-sm-7">{purchase.createdBy?.name || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6">
                                <div className="card h-100">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Supplier & Payment</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Supplier:</strong></div>
                                            <div className="col-sm-7">{purchase.supplier?.supplierName || 'N/A'}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Supplier Code:</strong></div>
                                            <div className="col-sm-7">{purchase.supplier?.code || '-'}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Contact:</strong></div>
                                            <div className="col-sm-7">{purchase.supplier?.email || purchase.supplier?.phone || '-'}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Warehouse:</strong></div>
                                            <div className="col-sm-7">{purchase.warehouse?.name || 'Main Warehouse'}</div>
                                        </div>
                                        <div className="row mb-2">
                                            <div className="col-sm-5"><strong>Payment Status:</strong></div>
                                            <div className="col-sm-7">{getPaymentStatusBadge(purchase.paymentStatus)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Purchase Items */}
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Purchase Items</h5>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-bordered">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Product</th>
                                                <th>SKU</th>
                                                <th className="text-end">Quantity</th>
                                                <th className="text-end">Unit Cost</th>
                                                <th className="text-end">Discount</th>
                                                <th className="text-end">Tax Rate</th>
                                                <th className="text-end">Tax Amount</th>
                                                <th className="text-end">Line Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchase.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.product?.name || 'N/A'}</td>
                                                    <td>{item.product?.sku || '-'}</td>
                                                    <td className="text-end">{item.quantity}</td>
                                                    <td className="text-end">{formatCurrency(item.unitCost)}</td>
                                                    <td className="text-end">{formatCurrency(item.discount)}</td>
                                                    <td className="text-end">{item.taxRate}%</td>
                                                    <td className="text-end">{formatCurrency(item.taxAmount)}</td>
                                                    <td className="text-end fw-bold">{formatCurrency(item.lineTotal)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="row mb-4">
                            <div className="col-lg-8">
                                {purchase.notes && (
                                    <div className="card">
                                        <div className="card-header">
                                            <h5 className="card-title mb-0">Notes</h5>
                                        </div>
                                        <div className="card-body">
                                            <p className="mb-0">{purchase.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="col-lg-4">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Financial Summary</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Subtotal:</span>
                                            <span>{formatCurrency(purchase.subtotal)}</span>
                                        </div>
                                        {purchase.orderTax > 0 && (
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Order Tax:</span>
                                                <span>{formatCurrency(purchase.orderTax)}</span>
                                            </div>
                                        )}
                                        {purchase.shippingCost > 0 && (
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Shipping:</span>
                                                <span>{formatCurrency(purchase.shippingCost)}</span>
                                            </div>
                                        )}
                                        {purchase.discountAmount > 0 && (
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Discount:</span>
                                                <span className="text-danger">-{formatCurrency(purchase.discountAmount)}</span>
                                            </div>
                                        )}
                                        <hr />
                                        <div className="d-flex justify-content-between mb-2 fw-bold">
                                            <span>Grand Total:</span>
                                            <span>{formatCurrency(purchase.grandTotal)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Amount Paid:</span>
                                            <span className="text-success">{formatCurrency(purchase.amountPaid)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Amount Due:</span>
                                            <span className={purchase.amountDue > 0 ? 'text-danger fw-bold' : 'text-success'}>
                                                {formatCurrency(purchase.amountDue)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewPurchaseDetails;
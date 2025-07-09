import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  User, 
  Package, 
  Filter, 
  Download,
  Eye,
  Check,
  Clock,
  X
} from 'feather-icons-react';
import enhancedMongoDBDashboardService from '../../services/enhancedMongoDBDashboardService';

const TransactionTable = ({ className = '' }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchTransactionData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const recentSales = await enhancedMongoDBDashboardService.getRecentSales(50);
      
      // Transform sales data to transaction format
      const transactionData = recentSales.map(sale => ({
        id: sale._id,
        type: 'Sale',
        amount: sale.total,
        customer: sale.customerName || 'Walk-in Customer',
        items: sale.itemCount || 0,
        date: sale.createdAt,
        status: sale.status || 'Completed',
        paymentMethod: sale.paymentMethod || 'Cash',
        invoiceNumber: `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
      }));
      
      setTransactions(transactionData);
      setFilteredTransactions(transactionData);
    } catch (err) {
      console.error('Error fetching transaction data:', err);
      setError('Failed to load transaction data');
      const fallbackData = getFallbackTransactions();
      setTransactions(fallbackData);
      setFilteredTransactions(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackTransactions = () => [
    {
      id: '1',
      type: 'Sale',
      amount: 1250.00,
      customer: 'Apple Inc.',
      items: 3,
      date: new Date('2025-01-07T14:30:00'),
      status: 'Completed',
      paymentMethod: 'Credit Card',
      invoiceNumber: 'INV-0001'
    },
    {
      id: '2',
      type: 'Sale',
      amount: 890.50,
      customer: 'Microsoft Corp.',
      items: 2,
      date: new Date('2025-01-07T12:15:00'),
      status: 'Completed',
      paymentMethod: 'Bank Transfer',
      invoiceNumber: 'INV-0002'
    },
    {
      id: '3',
      type: 'Sale',
      amount: 2340.75,
      customer: 'Google LLC',
      items: 5,
      date: new Date('2025-01-07T10:45:00'),
      status: 'Pending',
      paymentMethod: 'Credit Card',
      invoiceNumber: 'INV-0003'
    },
    {
      id: '4',
      type: 'Sale',
      amount: 567.25,
      customer: 'Walk-in Customer',
      items: 1,
      date: new Date('2025-01-07T09:20:00'),
      status: 'Completed',
      paymentMethod: 'Cash',
      invoiceNumber: 'INV-0004'
    },
    {
      id: '5',
      type: 'Sale',
      amount: 3450.00,
      customer: 'Tesla Inc.',
      items: 8,
      date: new Date('2025-01-06T16:30:00'),
      status: 'Cancelled',
      paymentMethod: 'Credit Card',
      invoiceNumber: 'INV-0005'
    },
    {
      id: '6',
      type: 'Sale',
      amount: 1125.80,
      customer: 'Amazon Technologies',
      items: 4,
      date: new Date('2025-01-06T14:15:00'),
      status: 'Completed',
      paymentMethod: 'Bank Transfer',
      invoiceNumber: 'INV-0006'
    },
    {
      id: '7',
      type: 'Sale',
      amount: 789.99,
      customer: 'Local Store',
      items: 2,
      date: new Date('2025-01-06T11:45:00'),
      status: 'Completed',
      paymentMethod: 'Cash',
      invoiceNumber: 'INV-0007'
    },
    {
      id: '8',
      type: 'Sale',
      amount: 2100.50,
      customer: 'Samsung Electronics',
      items: 6,
      date: new Date('2025-01-05T15:20:00'),
      status: 'Pending',
      paymentMethod: 'Credit Card',
      invoiceNumber: 'INV-0008'
    }
  ];

  useEffect(() => {
    fetchTransactionData();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }
    
    // Sort transactions
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'customer':
          aValue = a.customer.toLowerCase();
          bValue = b.customer.toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, filterStatus, sortBy, sortOrder]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { class: 'bg-success', icon: Check },
      pending: { class: 'bg-warning text-dark', icon: Clock },
      cancelled: { class: 'bg-danger', icon: X }
    };
    
    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`badge ${config.class} d-flex align-items-center`}>
        <IconComponent size={12} className="me-1" />
        {status}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    switch (method.toLowerCase()) {
      case 'credit card':
        return <CreditCard size={16} className="text-primary" />;
      case 'bank transfer':
        return <DollarSign size={16} className="text-success" />;
      case 'cash':
        return <DollarSign size={16} className="text-warning" />;
      default:
        return <DollarSign size={16} className="text-muted" />;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className={`card h-100 ${className}`}>
        <div className="card-body">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card h-100 ${className}`}>
      <div className="card-header bg-white border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="card-title mb-1">
              <CreditCard size={20} className="me-2 text-primary" />
              Recent Transactions
            </h5>
            <p className="text-muted small mb-0">Monitor your latest sales and transactions</p>
          </div>
          
          <button className="btn btn-sm btn-outline-primary">
            <Download size={16} className="me-1" />
            Export
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="col-md-3">
            <select
              className="form-select form-select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="customer">Sort by Customer</option>
            </select>
          </div>
          
          <div className="col-md-2">
            <select
              className="form-select form-select-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
          
          <div className="col-md-4">
            <div className="text-muted small">
              Showing {Math.min(startIndex + 1, filteredTransactions.length)} - {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </div>
          </div>
        </div>
      </div>

      <div className="card-body pt-0">
        {error && (
          <div className="alert alert-warning mb-3" role="alert">
            <strong>Warning:</strong> {error}. Showing sample data.
          </div>
        )}

        {/* Transactions Table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th scope="col">Invoice #</th>
                <th scope="col">Customer</th>
                <th scope="col">Amount</th>
                <th scope="col">Items</th>
                <th scope="col">Payment</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <span className="fw-semibold text-primary">
                      {transaction.invoiceNumber}
                    </span>
                  </td>
                  
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="customer-avatar me-2">
                        <div className="avatar-sm">
                          {transaction.customer.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                      </div>
                      <div>
                        <h6 className="mb-0">{transaction.customer}</h6>
                        <small className="text-muted">{transaction.type}</small>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <span className="fw-semibold text-success">
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  
                  <td>
                    <span className="badge bg-secondary">
                      <Package size={12} className="me-1" />
                      {transaction.items}
                    </span>
                  </td>
                  
                  <td>
                    <div className="d-flex align-items-center">
                      {getPaymentMethodIcon(transaction.paymentMethod)}
                      <span className="ms-2 small">{transaction.paymentMethod}</span>
                    </div>
                  </td>
                  
                  <td>
                    <span className="text-muted small">
                      <Calendar size={12} className="me-1" />
                      {formatDate(transaction.date)}
                    </span>
                  </td>
                  
                  <td>
                    {getStatusBadge(transaction.status)}
                  </td>
                  
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted small">
              Page {currentPage} of {totalPages}
            </div>
            
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show only 5 pages around current page
                  if (pageNumber === 1 || pageNumber === totalPages || 
                      (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)) {
                    return (
                      <li 
                        key={pageNumber} 
                        className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link"
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  } else if (pageNumber === currentPage - 3 || pageNumber === currentPage + 3) {
                    return (
                      <li key={pageNumber} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    );
                  }
                  return null;
                })}
                
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Empty State */}
        {filteredTransactions.length === 0 && !isLoading && (
          <div className="text-center py-5">
            <CreditCard size={48} className="text-muted mb-3" />
            <h6 className="text-muted">No transactions found</h6>
            <p className="text-muted small">
              {filterStatus !== 'all' 
                ? `No ${filterStatus} transactions match your criteria.`
                : 'Start making sales to see transactions here.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionTable;
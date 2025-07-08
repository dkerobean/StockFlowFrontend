import React, { useState, useEffect } from 'react';
import { OverlayTrigger, Tooltip, Modal, Button, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Image from '../../core/img/image';
import { ChevronUp, FileText, PlusCircle, RotateCcw, Search, Sliders, StopCircle, User } from 'feather-icons-react/build/IconComponents';
import { setToogleHeader } from '../../core/redux/action';
import { useDispatch, useSelector } from 'react-redux';
import { Filter } from 'react-feather';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../core/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SalesList = () => {
    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header);
    const [sales, setSales] = useState([]); // State to store sales data
    const [products, setProducts] = useState([]); // State for available products
    const [locations, setLocations] = useState([]); // State for available locations
    const [selectedLocation, setSelectedLocation] = useState(''); // Selected location
    const [editingSale, setEditingSale] = useState(null); // State for editing a sale
    const [showEditModal, setShowEditModal] = useState(false); // State for edit modal visibility
    const [newSale, setNewSale] = useState({
        items: [{
            product: '',
            quantity: 1,
            price: 0,
            discount: 0
        }],
        paymentMethod: '',
        locationId: '',
        customer: {
            name: ''
        },
        notes: '',
        tax: 0,
        discount: 0
    });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedSaleForInvoice, setSelectedSaleForInvoice] = useState(null);
    const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);
    const [selectedSaleForDetail, setSelectedSaleForDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Filter states
    const [filters, setFilters] = useState({
        customer: '',
        status: '',
        reference: '',
        paymentMethod: '',
        startDate: null,
        endDate: null,
        location: ''
    });
    const [filteredSales, setFilteredSales] = useState([]);
    const [appliedFilters, setAppliedFilters] = useState({});

    // Test user permissions before attempting to fetch sales
    const testUserPermissions = async () => {
        try {
            console.log('🔐 Testing user permissions...');
            const authResponse = await api.get('/auth/me');
            console.log('👤 User data:', authResponse.data);
            
            const userRole = authResponse.data.role;
            const userLocations = authResponse.data.locations;
            
            console.log(`👤 User role: ${userRole}`);
            console.log(`📍 User locations:`, userLocations);
            
            if (!['admin', 'manager'].includes(userRole)) {
                console.error(`❌ Insufficient permissions: User role '${userRole}' does not have access to sales list`);
                toast.error(`Access denied: Sales requires Manager or Admin role. Your role: ${userRole}`);
                return false;
            }
            
            if (userRole === 'manager' && (!userLocations || userLocations.length === 0)) {
                console.error(`❌ No location access: Manager role requires location assignments`);
                toast.error('No locations assigned. Please contact administrator to assign locations.');
                return false;
            }
            
            console.log('✅ User permissions validated successfully');
            return true;
        } catch (error) {
            console.error('❌ Permission check failed:', error);
            if (error.response?.status === 401) {
                toast.error('Authentication expired. Please log in again.');
                return false;
            }
            throw error;
        }
    };

    // Fetch sales from the backend with optional filters
    const fetchSales = async (filterParams = {}) => {
        setLoading(true);
        try {
            console.log('🔄 Fetching sales data...');
            const token = localStorage.getItem('token');
            console.log('🔑 Token exists:', !!token);
            console.log('🌐 API Base URL:', api.defaults.baseURL);
            console.log('📋 Filter parameters:', filterParams);
            
            // First, test user permissions
            const hasPermissions = await testUserPermissions();
            if (!hasPermissions) {
                setSales([]);
                setFilteredSales([]);
                return;
            }
            
            // Build query parameters
            const queryParams = {};
            if (filterParams.customer) queryParams.customer = filterParams.customer;
            if (filterParams.status) queryParams.status = filterParams.status;
            if (filterParams.paymentMethod) queryParams.paymentMethod = filterParams.paymentMethod;
            if (filterParams.reference) queryParams.reference = filterParams.reference;
            if (filterParams.locationId) queryParams.locationId = filterParams.locationId;
            if (filterParams.startDate) queryParams.startDate = filterParams.startDate;
            if (filterParams.endDate) queryParams.endDate = filterParams.endDate;
            
            console.log('🚀 Making sales API request...');
            const response = await api.get('/sales', { params: queryParams });
            console.log('✅ Sales API response status:', response.status);
            console.log('📊 Sales response data:', response.data);
            console.log('📊 Sales response headers:', response.headers);
            
            if (response.data && Array.isArray(response.data)) {
                console.log('📊 Sales data received:');
                console.log('📊 Raw response:', response.data);
                console.log('📊 Number of sales:', response.data.length);
                console.log('📊 First sale example:', response.data[0]);
                
                setSales(response.data);
                setFilteredSales(response.data); // Set filtered sales to the same data
                
                console.log(`✅ Successfully loaded ${response.data.length} sales`);
                console.log('💾 Sales state after setting:', response.data);
                
                if (response.data.length === 0) {
                    console.log('ℹ️ No sales found - possible reasons:');
                    console.log('  - User role (need Manager+ access)');
                    console.log('  - Location access (user may not have access to any locations)');
                    console.log('  - No sales data in the database');
                    console.log('  - Applied filters returned no results');
                    console.log('👤 Current user token:', localStorage.getItem('token') ? 'Present' : 'Missing');
                }
            } else {
                console.warn('⚠️ Unexpected sales data format:', response.data);
                console.warn('⚠️ Expected array, got:', typeof response.data);
                setSales([]);
                setFilteredSales([]);
            }
        } catch (error) {
            console.error('❌ Error fetching sales:', error);
            console.error('🔍 API URL being used:', api.defaults.baseURL);
            console.error('🔑 Token available:', !!localStorage.getItem('token'));
            
            if (error.response) {
                console.error('📊 Response Status:', error.response.status);
                console.error('📊 Response Status Text:', error.response.statusText);
                console.error('📊 Response Data:', error.response.data);
                console.error('📊 Response Headers:', error.response.headers);
                
                if (error.response.status === 403) {
                    toast.error('Access denied. You need Manager or Admin role to view sales. Please contact your administrator.');
                } else if (error.response.status === 401) {
                    toast.error('Authentication failed. Please log in again.');
                    // Optionally redirect to login
                    // window.location.href = '/login';
                } else if (error.response.status === 404) {
                    toast.error('Sales endpoint not found. Please contact technical support.');
                } else if (error.response.status >= 500) {
                    toast.error('Server error. Please try again later or contact technical support.');
                } else {
                    toast.error(`Failed to load sales: ${error.response.data?.message || error.message}`);
                }
            } else if (error.request) {
                console.error('🌐 Request made but no response received:', error.request);
                console.error('🌐 Network error details:', {
                    code: error.code,
                    message: error.message,
                    config: {
                        baseURL: error.config?.baseURL,
                        url: error.config?.url,
                        method: error.config?.method
                    }
                });
                toast.error('Network error: Unable to connect to server. Please check if the backend is running on port 3005.');
            } else {
                console.error('🔥 Request setup error:', error.message);
                toast.error(`Request error: ${error.message}`);
            }
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    // Helper function for formatting product options
    const formatOptionLabel = ({ label, sku, imageUrl }) => {
        const imageSource = imageUrl
            ? `${process.env.REACT_APP_FILE_BASE_URL}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`
            : '/assets/img/placeholder-product.png';

        return (
            <div className="d-flex align-items-center">
                <img
                    src={imageSource}
                    alt={label || 'Product'}
                    style={{ width: '30px', height: '30px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/img/placeholder-product.png';
                    }}
                />
                <div>
                    <div>{label || 'No Name'}</div>
                    <div className="text-muted small">{sku || 'No SKU'}</div>
                </div>
            </div>
        );
    };

    // Helper function to get image URL safely
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return '/assets/img/placeholder-product.png';
        const base = process.env.REACT_APP_FILE_BASE_URL.endsWith('/')
            ? process.env.REACT_APP_FILE_BASE_URL.slice(0, -1)
            : process.env.REACT_APP_FILE_BASE_URL;
        const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
        return `${base}${path}`;
    };
    
    // Filter handlers
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    const applyFilters = async () => {
        try {
            setAppliedFilters({...filters});
            
            // Build filter parameters for backend API
            const filterParams = {};
            
            if (filters.customer && filters.customer.trim()) {
                filterParams.customer = filters.customer.trim();
            }
            if (filters.status) {
                filterParams.status = filters.status;
            }
            if (filters.paymentMethod) {
                filterParams.paymentMethod = filters.paymentMethod;
            }
            if (filters.reference && filters.reference.trim()) {
                filterParams.reference = filters.reference.trim();
            }
            if (filters.location) {
                filterParams.locationId = filters.location;
            }
            if (filters.startDate) {
                filterParams.startDate = filters.startDate instanceof Date 
                    ? filters.startDate.toISOString().split('T')[0] 
                    : filters.startDate;
            }
            if (filters.endDate) {
                filterParams.endDate = filters.endDate instanceof Date 
                    ? filters.endDate.toISOString().split('T')[0] 
                    : filters.endDate;
            }
            
            // Fetch sales with filters from backend
            await fetchSales(filterParams);
            
            // Show success message
            const resultsCount = sales.length;
            if (Object.keys(filterParams).length > 0) {
                toast.success(`Found ${resultsCount} sales matching your criteria`);
            }
        } catch (error) {
            console.error('Error applying filters:', error);
            toast.error('Failed to apply filters. Please try again.');
        }
    };
    
    const clearFilters = async () => {
        try {
            setFilters({
                customer: '',
                status: '',
                reference: '',
                paymentMethod: '',
                startDate: null,
                endDate: null,
                location: ''
            });
            setAppliedFilters({});
            
            // Fetch all sales without filters
            await fetchSales();
            
            toast.info('Filters cleared');
        } catch (error) {
            console.error('Error clearing filters:', error);
            toast.error('Failed to clear filters. Please try again.');
        }
    };
    
    // Get display sales (always use sales since backend filtering is applied)
    const displaySales = sales;
    
    // Debug: Log current state
    console.log('🔍 Current component state:');
    console.log('🔍 Sales array:', sales);
    console.log('🔍 Sales length:', sales.length);
    console.log('🔍 Loading state:', loading);
    console.log('🔍 Display sales:', displaySales);
    console.log('🔍 Display sales length:', displaySales.length);

    // Fetch products based on location
    const fetchProducts = async (locationId) => {
        try {
            const response = await api.get('/products', {
                params: {
                    includeInactive: false,
                    populate: 'category,brand',
                    locationId: locationId
                }
            });
            const productData = Array.isArray(response.data) ? response.data : (response.data.data || []);
            const mappedProducts = productData.map(prod => ({
                value: prod._id,
                label: prod.name || 'Unnamed Product',
                sku: prod.sku || 'No SKU',
                imageUrl: prod.imageUrl,
                price: prod.price
            })).filter(p => p.value && p.label);
            setProducts(mappedProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    // Fetch locations
    const fetchLocations = async () => {
        try {
            const response = await api.get('/locations');
            console.log('🔍 Locations API response:', response.data);
            
            // Handle both direct array and paginated response formats
            const locationData = Array.isArray(response.data) 
                ? response.data 
                : (response.data.locations || []);
            
            console.log('📍 Processing locations:', locationData);
            
            const mappedLocations = locationData
                .filter(loc => loc.isActive)
                .map(loc => ({
                    value: loc._id,
                    label: `${loc.name} (${loc.type || 'Store'})`
                }));
            
            console.log('✅ Mapped locations for dropdown:', mappedLocations);
            setLocations(mappedLocations);
        } catch (error) {
            console.error('❌ Error fetching locations:', error);
            setLocations([]);
        }
    };

    // Create a new sale
    const createSale = async () => {
        try {
            const response = await api.post('/sales', newSale);
            await fetchSales(); // Refresh the sales list
            setShowAddModal(false);
            toast.success('Sale created successfully!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            setNewSale({
                items: [{
                    product: '',
                    quantity: 1,
                    price: 0,
                    discount: 0
                }],
                paymentMethod: '',
                locationId: '',
                customer: {
                    name: ''
                },
                notes: '',
                tax: 0,
                discount: 0
            });
        } catch (error) {
            console.error('Error creating sale:', error);
            const message =
                error.response?.data?.message ||
                error.message ||
                'Failed to create sale';
            toast.error(message);
        }
    };

    // Edit an existing sale
    const editSale = async (saleId, updatedSale) => {
        try {
            const response = await api.put(`/sales/${saleId}`, updatedSale);
            setSales(sales.map((sale) => (sale._id === saleId ? response.data : sale)));
            setEditingSale(null);
        } catch (error) {
            console.error('Error editing sale:', error);
        }
    };

    // Handle input changes for new sale
    const handleNewSaleChange = (field, value) => {
        if (field.startsWith('customer.')) {
            const customerField = field.split('.')[1];
            setNewSale({
                ...newSale,
                customer: {
                    ...newSale.customer,
                    [customerField]: value
                }
            });
        } else {
            setNewSale({ ...newSale, [field]: value });
        }
    };

    // Handle input changes for editing sale
    const handleEditSaleChange = (field, value) => {
        setEditingSale(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle changes for items array
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...newSale.items];
        updatedItems[index][field] = value;
        setNewSale({ ...newSale, items: updatedItems });
    };

    // Calculate item total with discount
    const calculateItemTotal = (item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        const discount = item.discount || 0;
        return price * quantity * (1 - discount / 100);
    };

    // Calculate sale total with tax and discount
    const calculateSaleTotal = () => {
        const itemsTotal = newSale.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
        const tax = newSale.tax || 0;
        const discount = newSale.discount || 0;
        return itemsTotal + (itemsTotal * tax / 100) - (itemsTotal * discount / 100);
    };

    // Handle product selection
    const handleProductSelect = (index, productId) => {
        const selectedProduct = products.find(p => p.value === productId);
        if (selectedProduct) {
            const updatedItems = [...newSale.items];
            updatedItems[index] = {
                ...updatedItems[index],
                product: productId,
                price: selectedProduct.price,
                quantity: 1
            };
            setNewSale({ ...newSale, items: updatedItems });
        }
    };

    // Handle quantity change
    const handleQuantityChange = (index, quantity) => {
        const updatedItems = [...newSale.items];
        updatedItems[index] = {
            ...updatedItems[index],
            quantity: parseInt(quantity) || 0
        };
        setNewSale({ ...newSale, items: updatedItems });
    };

    // Add new item row
    const addItemRow = () => {
        setNewSale({
            ...newSale,
            items: [...newSale.items, {
                product: '',
                quantity: 1,
                price: 0,
                discount: 0
            }]
        });
    };

    // Remove item row
    const removeItemRow = (index) => {
        const updatedItems = newSale.items.filter((_, i) => i !== index);
        setNewSale({ ...newSale, items: updatedItems });
    };

    // Handle location change
    const handleLocationChange = (option) => {
        const locationId = option ? option.value : null;
        setNewSale(prev => ({
            ...prev,
            locationId,
            items: [{
                product: '',
                quantity: 1,
                price: 0,
                discount: 0
            }]
        }));
        if (locationId) {
            fetchProducts(locationId);
        } else {
            setProducts([]);
        }
    };

    const handleDeleteClick = (sale) => {
        setSaleToDelete(sale);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!saleToDelete) return;

        try {
            await api.delete(`/sales/${saleToDelete._id}`);
            setSales(sales.filter(sale => sale._id !== saleToDelete._id));
            toast.success('Sale deleted successfully');
            setShowDeleteModal(false);
            setSaleToDelete(null);
        } catch (error) {
            console.error('Error deleting sale:', error);
            toast.error(error.response?.data?.message || 'Failed to delete sale');
        }
    };

    const handleEditClick = (sale) => {
        // Fetch products for the sale's location first
        fetchProducts(sale.location._id).then(() => {
            setEditingSale({
                ...sale,
                locationId: sale.location._id,
                items: sale.items.map(item => ({
                    ...item,
                    product: item.product._id,
                    price: item.price || 0,
                    quantity: item.quantity || 1,
                    discount: item.discount || 0
                }))
            });
            setShowEditModal(true);
        });
    };

    const handleEditItemChange = (index, field, value) => {
        const updatedItems = [...editingSale.items];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value
        };
        setEditingSale(prev => ({
            ...prev,
            items: updatedItems
        }));
    };

    const handleEditProductSelect = (index, productId) => {
        const selectedProduct = products.find(p => p.value === productId);
        if (selectedProduct) {
            const updatedItems = [...editingSale.items];
            updatedItems[index] = {
                ...updatedItems[index],
                product: productId,
                price: selectedProduct.price,
                quantity: 1
            };
            setEditingSale(prev => ({
                ...prev,
                items: updatedItems
            }));
        }
    };

    const handleEditQuantityChange = (index, quantity) => {
        const updatedItems = [...editingSale.items];
        updatedItems[index] = {
            ...updatedItems[index],
            quantity: parseInt(quantity) || 0
        };
        setEditingSale(prev => ({
            ...prev,
            items: updatedItems
        }));
    };

    const handleEditLocationChange = (option) => {
        const locationId = option ? option.value : null;
        setEditingSale(prev => ({
            ...prev,
            locationId
        }));
        if (locationId) {
            fetchProducts(locationId);
        }
    };

    const updateSale = async () => {
        try {
            await api.put(`/sales/${editingSale._id}`, editingSale);
            await fetchSales(); // Refresh the sales list
            setShowEditModal(false);
            setEditingSale(null);
            toast.success('Sale updated successfully!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } catch (error) {
            console.error('Error updating sale:', error);
            const message =
                error.response?.data?.message ||
                error.message ||
                'Failed to update sale';
            toast.error(message);
        }
    };

    const handleGenerateInvoice = (sale) => {
        setSelectedSaleForInvoice(sale);
        setShowInvoiceModal(true);
    };

    const handleSaleDetailClick = (sale) => {
        setSelectedSaleForDetail(sale);
        setShowSaleDetailModal(true);
    };

    // Test API connectivity and user permissions
    const testConnectivity = async () => {
        try {
            console.log('📞 Testing API connectivity and user permissions...');
            
            // First test basic auth endpoint
            const authResponse = await api.get('/auth/me');
            console.log('✅ API connectivity test passed:', authResponse.status);
            console.log('👤 Current user:', authResponse.data);
            
            // Check user role for sales access
            const userRole = authResponse.data.role;
            console.log('💼 User role:', userRole);
            
            if (!['admin', 'manager'].includes(userRole)) {
                toast.error(`Access denied: Sales requires Manager or Admin role. Your role: ${userRole}`);
                return false;
            }
            
            console.log('✅ User has sufficient permissions for sales access');
            return true;
        } catch (error) {
            console.error('❌ Connectivity/Permission test failed:', error);
            
            if (error.response?.status === 401) {
                toast.error('Authentication failed. Please log in again.');
            } else if (error.response?.status === 403) {
                toast.error('Access denied. You need Manager or Admin role to view sales.');
            } else if (error.code === 'ECONNREFUSED') {
                toast.error('Cannot connect to server. Please ensure the backend is running on port 3005.');
            } else {
                toast.error(`Connection error: ${error.message}`);
            }
            
            return false;
        }
    };

    // Component mounted, test connectivity then fetch initial data
    useEffect(() => {
        const initializeData = async () => {
            const isConnected = await testConnectivity();
            if (isConnected) {
                fetchSales();
                fetchLocations();
            } else {
                console.log('🚫 Skipping data fetch due to connectivity issues');
            }
        };
        
        initializeData();
    }, []);

    // Filter options
    const statusOptions = [
        { value: '', label: 'Choose Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
    ];
    
    const paymentStatusOptions = [
        { value: '', label: 'Choose Payment Status' },
        { value: 'cash', label: 'Cash' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'debit_card', label: 'Debit Card' },
        { value: 'mobile_payment', label: 'Mobile Payment' },
        { value: 'other', label: 'Other' },
    ];
    
    // Sorting options for the form-sort dropdown
    const oldandlatestvalue = [
        { value: 'date', label: 'Sort by Date' },
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
    ];
    
    // Generate customer options from sales data
    const customerOptions = [
        { value: '', label: 'Choose Customer Name' },
        ...Array.from(new Set(sales.map(sale => sale.customer?.name).filter(Boolean)))
            .map(name => ({ value: name, label: name }))
    ];
    const customer = [
        { value: 'Choose Customer', label: 'Choose Customer' },
        { value: 'Customer Name', label: 'Customer Name' },
    ];
    const suppliername = [
        { value: 'Supplier', label: 'Supplier' },
        { value: 'Supplier Name', label: 'Supplier Name' },
    ];
    const statusupdate = [
        { value: 'Supplier', label: 'Choose' },
        { value: 'Completed', label: 'Completed' },
        { value: 'InProgress', label: 'InProgress' },
    ];
    const paymenttype = [
        { value: 'Choose', label: 'Choose' },
        { value: 'Cash', label: 'Cash' },
        { value: 'Online', label: 'Online' },
    ];
    const [selectedDate, setSelectedDate] = useState(new Date());
    const handleDateChange = (date) => {
        setSelectedDate(date);
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

    // Payment method options
    const paymentMethods = [
        { value: 'cash', label: 'Cash' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'debit_card', label: 'Debit Card' },
        { value: 'mobile_payment', label: 'Mobile Payment' }
    ];

    const columns = [
        {
            title: "Product Image",
            dataIndex: "items",
            render: (items) => {
                const backendBaseUrl = process.env.REACT_APP_FILE_BASE_URL; // Use base URL from .env
                return items.map((item, index) => {
                    const imageSource = item.product.imageUrl
                        ? `${backendBaseUrl}${item.product.imageUrl.startsWith('/') ? item.product.imageUrl : `/${item.product.imageUrl}`}`
                        : '/assets/img/placeholder-product.png';

                    return (
                        <img
                            key={index}
                            src={imageSource}
                            alt={item.product.name || 'Product'}
                            style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/img/placeholder-product.png';
                            }}
                        />
                    );
                });
            },
        },
        // Other columns...
    ];

    return (
        <div>
            <ToastContainer />
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="add-item d-flex">
                            <div className="page-title">
                                <h4>Sales List</h4>
                                <h6>Manage Your Sales</h6>
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
                        <div className="page-btn">
                            <Link to="/pos" className="btn btn-success me-2">
                                <StopCircle className="me-2" />
                                POS Terminal
                            </Link>
                            <Button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                                <PlusCircle className="me-2" />
                                Add New Sales
                            </Button>
                        </div>
                    </div>
                    {/* /product list */}
                    <div className="card table-list-card">
                        <div className="card-body">
                            <div className="table-top d-flex justify-content-between align-items-center flex-wrap gap-3">
                                {/* Enhanced Search Input */}
                                <div className="search-set flex-grow-1" style={{ maxWidth: '450px' }}>
                                    <div className="search-input">
                                        <input
                                            type="text"
                                            placeholder="🔍 Search sales by customer, reference..."
                                            className="form-control formsearch"
                                            value={filters.customer} // Assuming customer name is the primary search
                                            onChange={(e) => handleFilterChange('customer', e.target.value)}
                                        />
                                        <button className="btn btn-searchset" onClick={applyFilters}>
                                            <Search size={18} />
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Filter Controls */}
                                <div className="search-path">
                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        {/* Customer Filter (if different from search) */}
                                        {/* <div style={{ minWidth: '160px' }}>
                                            <Select
                                                options={customerOptions}
                                                value={customerOptions.find(opt => opt.value === filters.customer) || null}
                                                onChange={(option) => handleFilterChange('customer', option?.value || '')}
                                                placeholder="👤 All Customers"
                                                isClearable
                                                classNamePrefix="react-select"
                                            />
                                        </div> */}
                                        
                                        {/* Status Filter */}
                                        <div style={{ minWidth: '160px' }}>
                                            <Select
                                                options={statusOptions}
                                                value={statusOptions.find(opt => opt.value === filters.status) || null}
                                                onChange={(option) => handleFilterChange('status', option?.value || '')}
                                                placeholder="📊 All Status"
                                                isClearable
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        
                                        {/* Payment Method Filter */}
                                        <div style={{ minWidth: '160px' }}>
                                            <Select
                                                options={paymentStatusOptions}
                                                value={paymentStatusOptions.find(opt => opt.value === filters.paymentMethod) || null}
                                                onChange={(option) => handleFilterChange('paymentMethod', option?.value || '')}
                                                placeholder="💳 All Payments"
                                                isClearable
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        
                                        {/* Location Filter */}
                                        <div style={{ minWidth: '160px' }}>
                                            <Select
                                                options={locations}
                                                value={locations.find(opt => opt.value === filters.location) || null}
                                                onChange={(option) => handleFilterChange('location', option?.value || '')}
                                                placeholder="📍 All Locations"
                                                isClearable
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        
                                        {/* Date Range Filter (Start Date) */}
                                        <div style={{ minWidth: '140px' }}>
                                            <DatePicker
                                                selected={filters.startDate}
                                                onChange={(date) => handleFilterChange('startDate', date)}
                                                placeholderText="📅 Start Date"
                                                className="form-control form-control-sm datetimepicker"
                                                dateFormat="dd/MM/yyyy"
                                                isClearable
                                            />
                                        </div>
                                        
                                        {/* Date Range Filter (End Date) */}
                                        <div style={{ minWidth: '140px' }}>
                                            <DatePicker
                                                selected={filters.endDate}
                                                onChange={(date) => handleFilterChange('endDate', date)}
                                                placeholderText="📅 End Date"
                                                className="form-control form-control-sm datetimepicker"
                                                dateFormat="dd/MM/yyyy"
                                                isClearable
                                            />
                                        </div>
                                        
                                        {/* Apply Filters Button */}
                                        <Button 
                                            variant="primary" 
                                            size="sm" 
                                            onClick={applyFilters}
                                            disabled={loading}
                                            className="d-flex align-items-center gap-1"
                                            style={{ minWidth: '100px', height: '44px' }}
                                        >
                                            <Search size={14} />
                                            Search
                                        </Button>
                                        
                                        {/* Clear Filters Button */}
                                        <Button 
                                            variant="outline-secondary" 
                                            size="sm" 
                                            onClick={clearFilters}
                                            disabled={loading}
                                            className="d-flex align-items-center gap-1"
                                            style={{ minWidth: '100px', height: '44px' }}
                                        >
                                            <RotateCcw size={14} />
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {/* /Filter */}
                            <div className="table-responsive">
                                <table className="table datanew">
                                    <thead>
                                        <tr>
                                            <th className="no-sort">
                                                <label className="checkboxs">
                                                    <input type="checkbox" id="select-all" />
                                                    <span className="checkmarks" />
                                                </label>
                                            </th>
                                            <th>Sale ID</th>
                                            <th>Customer Name</th>
                                            <th>Date</th>
                                            <th>Payment Method</th>
                                            <th>Location</th>
                                            <th>Items</th>
                                            <th>Subtotal</th>
                                            <th>Tax</th>
                                            <th>Discount</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="sales-list">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="13" className="text-center py-4">
                                                    <div className="d-flex justify-content-center align-items-center">
                                                        <div className="spinner-border text-primary me-2" role="status">
                                                            <span className="visually-hidden">Loading...</span>
                                                        </div>
                                                        Loading sales data...
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : displaySales.length === 0 ? (
                                            <tr>
                                                <td colSpan="13" className="text-center py-4">
                                                    <div className="empty-state">
                                                        <FileText size={48} className="text-muted mb-3" />
                                                        <h5 className="text-muted">No Sales Found</h5>
                                                        <p className="text-muted">There are no sales records to display. Start by creating a new sale or check your filter settings.</p>
                                                        <div className="mt-3">
                                                            <small className="text-muted d-block mb-2">
                                                                Debug: Sales array length = {sales.length}, Loading = {loading.toString()}
                                                            </small>
                                                            <div className="mt-2">
                                                                <button 
                                                                    className="btn btn-outline-primary btn-sm me-2"
                                                                    onClick={() => window.location.reload()}
                                                                >
                                                                    Refresh Page
                                                                </button>
                                                                <button 
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    onClick={() => {
                                                                        console.log('🔄 Manual data fetch triggered');
                                                                        fetchSales();
                                                                    }}
                                                                >
                                                                    Retry Fetch
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            displaySales.map((sale, index) => {
                                                console.log(`🎯 Rendering sale ${index + 1}:`, sale);
                                                return (
                                                    <tr key={sale._id || index}>
                                                <td>
                                                    <label className="checkboxs">
                                                        <input type="checkbox" />
                                                        <span className="checkmarks" />
                                                    </label>
                                                </td>
                                                <td className="fw-bold">#{sale._id?.slice(-6) || 'N/A'}</td>
                                                <td>{sale.customer?.name || 'Walk-in Customer'}</td>
                                                <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                                                <td>{sale.paymentMethod}</td>
                                                <td>{sale.location?.name || 'N/A'}</td>
                                                <td>
                                                    {sale.items?.map((item, index) => {
                                                        // Get the image URL from the product object
                                                        const productImageUrl = item.product?.imageUrl || null;
                                                        const imageUrl = productImageUrl
                                                            ? `${process.env.REACT_APP_FILE_BASE_URL}${productImageUrl}`
                                                            : '/assets/img/placeholder-product.png';

                                                        return (
                                                            <div key={`${sale._id}-${index}`} className="d-flex align-items-center mb-2">
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={item.product?.name || 'Product'}
                                                                    style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = '/assets/img/placeholder-product.png';
                                                                    }}
                                                                />
                                                                <div>
                                                                    <div className="fw-bold">{item.product?.name || 'Unknown Product'}</div>
                                                                    <div className="text-muted small">
                                                                        Qty: {item.quantity} × ${item.price?.toFixed(2) || '0.00'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </td>
                                                <td>${sale.subtotal?.toFixed(2) || '0.00'}</td>
                                                <td>${(sale.tax || 0).toFixed(2)}</td>
                                                <td>${(sale.discount || 0).toFixed(2)}</td>
                                                <td>${sale.total?.toFixed(2) || '0.00'}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        sale.status === 'completed' ? 'bg-success' :
                                                        sale.status === 'pending' ? 'bg-warning' :
                                                        sale.status === 'cancelled' ? 'bg-danger' :
                                                        sale.status === 'refunded' ? 'bg-info' :
                                                        'bg-secondary'
                                                    }`}>
                                                        {sale.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <Link
                                                        className="action-set"
                                                        to="#"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="true"
                                                    >
                                                        <i className="fa fa-ellipsis-v" aria-hidden="true" />
                                                    </Link>
                                                    <ul className="dropdown-menu">
                                                        <li>
                                                            <Link
                                                                to="#"
                                                                className="dropdown-item"
                                                                onClick={() => handleSaleDetailClick(sale)}
                                                            >
                                                                <i data-feather="eye" className="info-img" />
                                                                Sale Detail
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link
                                                                to="#"
                                                                className="dropdown-item"
                                                                onClick={() => handleEditClick(sale)}
                                                            >
                                                                <i data-feather="edit" className="info-img" />
                                                                Edit Sale
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link
                                                                to="#"
                                                                className="dropdown-item"
                                                                onClick={() => handleGenerateInvoice(sale)}
                                                            >
                                                                <i data-feather="file-text" className="info-img" />
                                                                Generate Invoice
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link
                                                                to="#"
                                                                className="dropdown-item confirm-text mb-0"
                                                                onClick={() => handleDeleteClick(sale)}
                                                            >
                                                                <i data-feather="trash-2" className="info-img" />
                                                                Delete Sale
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    {/* /product list */}
                </div>
            </div>
            <>
                {/*add popup */}
                <div className="modal fade" id="add-sales-new">
                    <div className="modal-dialog add-centered">
                        <div className="modal-content">
                            <div className="page-wrapper p-0 m-0">
                                <div className="content p-0">
                                    <div className="modal-header border-0 custom-modal-header">
                                        <div className="page-title">
                                            <h4> Add Sales</h4>
                                        </div>
                                        <button
                                            type="button"
                                            className="close"
                                            data-bs-dismiss="modal"
                                            aria-label="Close"
                                        >
                                            <span aria-hidden="true">×</span>
                                        </button>
                                    </div>
                                    <div className="card">
                                        <div className="card-body">
                                            <form>
                                                <div className="row">
                                                    <div className="col-lg-4 col-sm-6 col-12">
                                                        <div className="input-blocks">
                                                            <label>Customer Name</label>
                                                            <div className="row">
                                                                <div className="col-lg-10 col-sm-10 col-10">
                                                                    <Select
                                                                        className="select"
                                                                        options={customer}
                                                                        placeholder="Newest"
                                                                    />
                                                                </div>
                                                                <div className="col-lg-2 col-sm-2 col-2 ps-0">
                                                                    <div className="add-icon">
                                                                        <Link to="#" className="choose-add">

                                                                            <PlusCircle className="plus" />
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-4 col-sm-6 col-12">
                                                        <div className="input-blocks">
                                                            <label>Date</label>
                                                            <div className="input-groupicon calender-input">

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
                                                    <div className="col-lg-4 col-sm-6 col-12">
                                                        <div className="input-blocks">
                                                            <label>Supplier</label>

                                                            <Select
                                                                className="select"
                                                                options={suppliername}
                                                                placeholder="Newest"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-12 col-sm-6 col-12">
                                                        <div className="input-blocks">
                                                            <label>Product Name</label>
                                                            <div className="input-groupicon select-code">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Please type product code and select"
                                                                />
                                                                <div className="addonset">
                                                                    <Image
                                                                        src="assets/img/icons/qrcode-scan.svg"
                                                                        alt="img"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="table-responsive no-pagination">
                                                    <table className="table  datanew">
                                                        <thead>
                                                            <tr>
                                                                <th>Product</th>
                                                                <th>Qty</th>
                                                                <th>Purchase Price($)</th>
                                                                <th>Discount($)</th>
                                                                <th>Tax(%)</th>
                                                                <th>Tax Amount($)</th>
                                                                <th>Unit Cost($)</th>
                                                                <th>Total Cost(%)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td />
                                                                <td />
                                                                <td />
                                                                <td />
                                                                <td />
                                                                <td />
                                                                <td />
                                                                <td />
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="row">
                                                    <div className="col-lg-6 ms-auto">
                                                        <div className="total-order w-100 max-widthauto m-auto mb-4">
                                                            <ul>
                                                                <li>
                                                                    <h4>Order Tax</h4>
                                                                    <h5>$ 0.00</h5>
                                                                </li>
                                                                <li>
                                                                    <h4>Discount</h4>
                                                                    <h5>$ 0.00</h5>
                                                                </li>
                                                                <li>
                                                                    <h4>Shipping</h4>
                                                                    <h5>$ 0.00</h5>
                                                                </li>
                                                                <li>
                                                                    <h4>Grand Total</h4>
                                                                    <h5>$ 0.00</h5>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-lg-3 col-sm-6 col-12">
                                                        <div className="input-blocks">
                                                            <label>Order Tax</label>
                                                            <div className="input-groupicon select-code">
                                                                <input type="text" defaultValue={0} className="p-2" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-3 col-sm-6 col-12">
                                                        <div className="input-blocks">
                                                            <label>Discount</label>
                                                            <div className="input-groupicon select-code">
                                                                <input type="text" defaultValue={0} className="p-2" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-3 col-sm-6 col-12">
                                                        <div className="input-blocks">
                                                            <label>Shipping</label>
                                                            <div className="input-groupicon select-code">
                                                                <input type="text" defaultValue={0} className="p-2" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-3 col-sm-6 col-12">
                                                        <div className="input-blocks mb-5">
                                                            <label>Status</label>

                                                            <Select
                                                                className="select"
                                                                options={statusupdate}
                                                                placeholder="status"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-12 text-end">
                                                        <button
                                                            type="button"
                                                            className="btn btn-cancel add-cancel me-3"
                                                            data-bs-dismiss="modal"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <Link to="#" className="btn btn-submit add-sale">
                                                            Submit
                                                        </Link>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* /add popup */}
                {/* details popup */}
                <div className="modal fade" id="sales-details-new">
                    <div className="modal-dialog sales-details-modal">
                        <div className="modal-content">
                            <div className="page-wrapper details-blk">
                                <div className="content p-0">
                                    <div className="page-header p-4 mb-0">
                                        <div className="add-item d-flex">
                                            <div className="page-title modal-datail">
                                                <h4>Sales Detail : SL0101</h4>
                                            </div>
                                            <div className="page-btn">
                                                <Link
                                                    to="#"
                                                    className="btn btn-added"
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#add-payroll-new"
                                                >
                                                    <PlusCircle className="me-2" />
                                                    Add New
                                                    Sales
                                                </Link>
                                            </div>
                                        </div>
                                        <ul className="table-top-head">
                                            <li>
                                                <Link
                                                    data-bs-toggle="tooltip"
                                                    data-bs-placement="top"
                                                    title="Pdf"
                                                >
                                                    <i
                                                        data-feather="edit"
                                                        className="action-edit sales-action"
                                                    />
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    data-bs-toggle="tooltip"
                                                    data-bs-placement="top"
                                                    title="Pdf"
                                                >
                                                    <Image src="assets/img/icons/pdf.svg" alt="img" />
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    data-bs-toggle="tooltip"
                                                    data-bs-placement="top"
                                                    title="Excel"
                                                >
                                                    <Image src="assets/img/icons/excel.svg" alt="img" />
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    data-bs-toggle="tooltip"
                                                    data-bs-placement="top"
                                                    title="Print"
                                                >
                                                    <i data-feather="printer" className="feather-rotate-ccw" />
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="card">
                                        <div className="card-body">
                                            <form>
                                                <div
                                                    className="invoice-box table-height"
                                                    style={{
                                                        maxWidth: 1600,
                                                        width: "100%",
                                                        overflow: "auto",
                                                        padding: 0,
                                                        fontSize: 14,
                                                        lineHeight: 24,
                                                        color: "#555"
                                                    }}
                                                >
                                                    <div className="sales-details-items d-flex">
                                                        <div className="details-item">
                                                            <h6>Customer Info</h6>
                                                            <p>
                                                                walk-in-customer
                                                                <br />
                                                                walk-in-customer@example.com
                                                                <br />
                                                                123456780
                                                                <br />
                                                                N45 , Dhaka
                                                            </p>
                                                        </div>
                                                        <div className="details-item">
                                                            <h6>Company Info</h6>
                                                            <p>
                                                                DGT
                                                                <br />
                                                                admin@example.com
                                                                <br />
                                                                6315996770
                                                                <br />
                                                                3618 Abia Martin Drive
                                                            </p>
                                                        </div>
                                                        <div className="details-item">
                                                            <h6>Invoice Info</h6>
                                                            <p>
                                                                Reference
                                                                <br />
                                                                Payment Status
                                                                <br />
                                                                Status
                                                            </p>
                                                        </div>
                                                        <div className="details-item">
                                                            <h5>
                                                                <span>SL0101</span>Paid
                                                                <br /> Completed
                                                            </h5>
                                                        </div>
                                                    </div>
                                                    <h5 className="order-text">Order Summary</h5>
                                                    <div className="table-responsive no-pagination">
                                                        <table className="table  datanew">
                                                            <thead>
                                                                <tr>
                                                                    <th>Product</th>
                                                                    <th>Qty</th>
                                                                    <th>Purchase Price($)</th>
                                                                    <th>Discount($)</th>
                                                                    <th>Tax(%)</th>
                                                                    <th>Tax Amount($)</th>
                                                                    <th>Unit Cost($)</th>
                                                                    <th>Total Cost(%)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <div className="productimgname">
                                                                            <Link
                                                                                to="#"
                                                                                className="product-img stock-img"
                                                                            >
                                                                                <Image
                                                                                    src="assets/img/products/stock-img-02.png"
                                                                                    alt="product"
                                                                                />
                                                                            </Link>
                                                                            <Link to="#">Nike Jordan</Link>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div className="product-quantity">
                                                                            <span className="quantity-btn">
                                                                                +
                                                                                <i
                                                                                    data-feather="plus-circle"
                                                                                    className="plus-circle"
                                                                                />
                                                                            </span>
                                                                            <input
                                                                                type="text"
                                                                                className="quntity-input"
                                                                                defaultValue={2}
                                                                            />
                                                                            <span className="quantity-btn">
                                                                                <i
                                                                                    data-feather="minus-circle"
                                                                                    className="feather-search"
                                                                                />
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td>2000</td>
                                                                    <td>500</td>
                                                                    <td>0.00</td>
                                                                    <td>0.00</td>
                                                                    <td>0.00</td>
                                                                    <td>1500</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>
                                                                        <div className="productimgname">
                                                                            <Link
                                                                                to="#"
                                                                                className="product-img stock-img"
                                                                            >
                                                                                <Image
                                                                                    src="assets/img/products/stock-img-03.png"
                                                                                    alt="product"
                                                                                />
                                                                            </Link>
                                                                            <Link to="#">
                                                                                Apple Series 5 Watch
                                                                            </Link>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div className="product-quantity">
                                                                            <span className="quantity-btn">
                                                                                +
                                                                                <i
                                                                                    data-feather="plus-circle"
                                                                                    className="plus-circle"
                                                                                />
                                                                            </span>
                                                                            <input
                                                                                type="text"
                                                                                className="quntity-input"
                                                                                defaultValue={2}
                                                                            />
                                                                            <span className="quantity-btn">
                                                                                <i
                                                                                    data-feather="minus-circle"
                                                                                    className="feather-search"
                                                                                />
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td>3000</td>
                                                                    <td>400</td>
                                                                    <td>0.00</td>
                                                                    <td>0.00</td>
                                                                    <td>0.00</td>
                                                                    <td>1700</td>
                                                                </tr>
                                                                <tr>
                                                                    <td>
                                                                        <div className="productimgname">
                                                                            <Link
                                                                                to="#"
                                                                                className="product-img stock-img"
                                                                            >
                                                                                <Image
                                                                                    src="assets/img/products/stock-img-05.png"
                                                                                    alt="product"
                                                                                />
                                                                            </Link>
                                                                            <Link to="#">Lobar Handy</Link>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div className="product-quantity">
                                                                            <span className="quantity-btn">
                                                                                +
                                                                                <i
                                                                                    data-feather="plus-circle"
                                                                                    className="plus-circle"
                                                                                />
                                                                            </span>
                                                                            <input
                                                                                type="text"
                                                                                className="quntity-input"
                                                                                defaultValue={2}
                                                                            />
                                                                            <span className="quantity-btn">
                                                                                <i
                                                                                    data-feather="minus-circle"
                                                                                    className="feather-search"
                                                                                />
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td>2500</td>
                                                                    <td>500</td>
                                                                    <td>0.00</td>
                                                                    <td>0.00</td>
                                                                    <td>0.00</td>
                                                                    <td>2000</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="row">
                                                        <div className="col-lg-6 ms-auto">
                                                            <div className="total-order w-100 max-widthauto m-auto mb-4">
                                                                <ul>
                                                                    <li>
                                                                        <h4>Order Tax</h4>
                                                                        <h5>$ 0.00</h5>
                                                                    </li>
                                                                    <li>
                                                                        <h4>Discount</h4>
                                                                        <h5>$ 0.00</h5>
                                                                    </li>
                                                                    <li>
                                                                        <h4>Grand Total</h4>
                                                                        <h5>$ 5200.00</h5>
                                                                    </li>
                                                                    <li>
                                                                        <h4>Paid</h4>
                                                                        <h5>$ 5200.00</h5>
                                                                    </li>
                                                                    <li>
                                                                        <h4>Due</h4>
                                                                        <h5>$ 0.00</h5>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* /details popup */}
                {/* show payment Modal */}
                <div
                    className="modal fade"
                    id="showpayment"
                    tabIndex={-1}
                    aria-labelledby="showpayment"
                    aria-hidden="true"
                >
                    <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
                        <div className="modal-content">
                            <div className="page-wrapper-new p-0">
                                <div className="content">
                                    <div className="modal-header border-0 custom-modal-header">
                                        <div className="page-title">
                                            <h4>Show Payments</h4>
                                        </div>
                                        <button
                                            type="button"
                                            className="close"
                                            data-bs-dismiss="modal"
                                            aria-label="Close"
                                        >
                                            <span aria-hidden="true">×</span>
                                        </button>
                                    </div>
                                    <div className="modal-body custom-modal-body">
                                        <div className="row">
                                            <div className="col-lg-12">
                                                <div className="modal-body-table total-orders">
                                                    <div className="table-responsive">
                                                        <table className="table  datanew">
                                                            <thead>
                                                                <tr>
                                                                    <th>Date</th>
                                                                    <th>Reference</th>
                                                                    <th>Amount</th>
                                                                    <th>Paid By</th>
                                                                    <th className="no-sort">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>19 Jan 2023</td>
                                                                    <td>INV/SL0101</td>
                                                                    <td>$1500</td>
                                                                    <td>Cash</td>
                                                                    <td className="action-table-data">
                                                                        <div className="edit-delete-action">
                                                                            <Link
                                                                                className="me-3 p-2"
                                                                                to="#"
                                                                            >
                                                                                <i
                                                                                    data-feather="printer"
                                                                                    className="feather-rotate-ccw"
                                                                                />
                                                                            </Link>
                                                                            <Link
                                                                                className="me-3 p-2"
                                                                                to="#"
                                                                                data-bs-toggle="modal"
                                                                                data-bs-target="#editpayment"
                                                                            >
                                                                                <i
                                                                                    data-feather="edit"
                                                                                    className="feather-edit"
                                                                                />
                                                                            </Link>
                                                                            <Link
                                                                                className="confirm-text p-2"
                                                                                to="#"
                                                                            >
                                                                                <i
                                                                                    data-feather="trash-2"
                                                                                    className="feather-trash-2"
                                                                                />
                                                                            </Link>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* show payment Modal */}
                {/* Create payment Modal */}
                <div
                    className="modal fade"
                    id="createpayment"
                    tabIndex={-1}
                    aria-labelledby="createpayment"
                    aria-hidden="true"
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4>Create Payments</h4>
                                </div>
                                <button
                                    type="button"
                                    className="close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                >
                                    <span aria-hidden="true">×</span>
                                </button>
                            </div>
                            <div className="modal-body custom-modal-body">
                                <form>
                                    <div className="row">
                                        <div className="col-lg-6">
                                            <div className="input-blocks">
                                                <label> Date</label>
                                                <div className="input-groupicon calender-input">
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
                                        <div className="col-lg-6 col-sm-12 col-12">
                                            <div className="input-blocks">
                                                <label>Reference</label>
                                                <input type="text" className="form-control" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-lg-4 col-sm-12 col-12">
                                            <div className="input-blocks">
                                                <label>Received Amount</label>
                                                <div className="input-groupicon calender-input">
                                                    <i data-feather="dollar-sign" className="info-img" />
                                                    <input type="text" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 col-sm-12 col-12">
                                            <div className="input-blocks">
                                                <label>Paying Amount</label>
                                                <div className="input-groupicon calender-input">
                                                    <i data-feather="dollar-sign" className="info-img" />
                                                    <input type="text" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 col-sm-12 col-12">
                                            <div className="input-blocks">
                                                <label>Payment type</label>

                                                <Select
                                                className="select"
                                                options={paymenttype}
                                                placeholder="Newest"
                                            />
                                            </div>
                                        </div>
                                        <div className="col-lg-12">
                                            <div className="input-blocks">
                                                <label>Description</label>
                                                <textarea className="form-control" defaultValue={""} />
                                                <p>Maximum 60 Characters</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="modal-footer-btn">
                                            <button
                                                type="button"
                                                className="btn btn-cancel me-2"
                                                data-bs-dismiss="modal"
                                            >
                                                Cancel
                                            </button>
                                            <Link to="#" className="btn btn-submit">
                                                Submit
                                            </Link>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Create payment Modal */}
                {/* edit payment Modal */}
                <div
                    className="modal fade"
                    id="editpayment"
                    tabIndex={-1}
                    aria-labelledby="editpayment"
                    aria-hidden="true"
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4>Edit Payments</h4>
                                </div>
                                <button
                                    type="button"
                                    className="close"
                                    data-bs-dismiss="modal"
                                    aria-label="Close"
                                >
                                    <span aria-hidden="true">×</span>
                                </button>
                            </div>
                            <div className="modal-body custom-modal-body">
                                <form>
                                    <div className="row">
                                        <div className="col-lg-6">
                                            <div className="input-blocks">
                                                <label>19 Jan 2023</label>
                                                <div className="input-groupicon calender-input">
                                                    <i data-feather="calendar" className="info-img" />
                                                    <input
                                                        type="text"
                                                        className="datetimepicker form-control"
                                                        placeholder="Select Date"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-6 col-sm-12 col-12">
                                            <div className="input-blocks">
                                                <label>Reference</label>
                                                <input type="text" defaultValue="INV/SL0101" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-lg-4 col-sm-12 col-12">
                                            <div className="input-blocks">
                                                <label>Received Amount</label>
                                                <div className="input-groupicon calender-input">
                                                    <i data-feather="dollar-sign" className="info-img" />
                                                    <input type="text" defaultValue={1500} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 col-sm-12 col-12">
                                            <div className="input-blocks">
                                                <label>Paying Amount</label>
                                                <div className="input-groupicon calender-input">
                                                    <i data-feather="dollar-sign" className="info-img" />
                                                    <input type="text" defaultValue={1500} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4 col-sm-12 col-12">
                                            <div className="input-blocks">
                                                <label>Payment type</label>
                                                <select className="select">
                                                    <option>Cash</option>
                                                    <option>Online</option>
                                                    <option>Inprogress</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-lg-12">
                                            <div className="input-blocks summer-description-box transfer">
                                                <label>Description</label>
                                                <textarea className="form-control" defaultValue={""} />
                                            </div>
                                            <p>Maximum 60 Characters</p>
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="modal-footer-btn mb-3 me-3">
                                            <button
                                                type="button"
                                                className="btn btn-cancel me-2"
                                                data-bs-dismiss="modal"
                                            >
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-submit">
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                {/* edit payment Modal */}
                <div className="customizer-links" id="setdata">
                    <ul className="sticky-sidebar">
                        <li className="sidebar-icons">
                            <Link
                                to="#"
                                className="navigation-add"
                                data-bs-toggle="tooltip"
                                data-bs-placement="left"
                                data-bs-original-title="Theme"
                            >
                                <i data-feather="settings" className="feather-five" />
                            </Link>
                        </li>
                    </ul>
                </div>
            </>

            {/* Add Sale Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add New Sale</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Store Location</Form.Label>
                                    <Select
                                        options={locations}
                                        value={locations.find(loc => loc.value === newSale.locationId)}
                                        onChange={handleLocationChange}
                                        placeholder="Select Store Location"
                                        isClearable
                                        required
                                        className="basic-single"
                                        classNamePrefix="select"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Customer Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newSale.customer.name}
                                        onChange={(e) => handleNewSaleChange('customer.name', e.target.value)}
                                        placeholder="Enter customer name"
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Payment Method</Form.Label>
                                    <Select
                                        options={paymentMethods}
                                        value={paymentMethods.find(method => method.value === newSale.paymentMethod)}
                                        onChange={(option) => handleNewSaleChange('paymentMethod', option?.value)}
                                        placeholder="Select Payment Method"
                                        isClearable
                                        required
                                        className="basic-single"
                                        classNamePrefix="select"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={newSale.notes}
                                        onChange={(e) => handleNewSaleChange('notes', e.target.value)}
                                        placeholder="Enter any additional notes"
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5>Items</h5>
                                <Button variant="outline-primary" onClick={addItemRow}>
                                    Add Item
                                </Button>
                            </div>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Discount (%)</th>
                                            <th>Total</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newSale.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Select
                                                        options={products}
                                                        value={products.find(p => p.value === item.product)}
                                                        onChange={(option) => handleProductSelect(index, option?.value)}
                                                        placeholder="Select Product"
                                                        formatOptionLabel={formatOptionLabel}
                                                        isClearable
                                                        required
                                                        isDisabled={!newSale.locationId}
                                                        className="select"
                                                        classNamePrefix="react-select"
                                                        noOptionsMessage={() =>
                                                            !newSale.locationId
                                                                ? "Please select a location first"
                                                                : products.length === 0
                                                                    ? "No products available"
                                                                    : "No products match your search"
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                        required
                                                        disabled={!item.product}
                                                    />
                                                </td>
                                                <td>${item.price.toFixed(2)}</td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={item.discount}
                                                        onChange={(e) => {
                                                            const updatedItems = [...newSale.items];
                                                            updatedItems[index].discount = parseFloat(e.target.value) || 0;
                                                            setNewSale({ ...newSale, items: updatedItems });
                                                        }}
                                                        disabled={!item.product}
                                                    />
                                                </td>
                                                <td>${calculateItemTotal(item).toFixed(2)}</td>
                                                <td>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => removeItemRow(index)}
                                                        disabled={newSale.items.length === 1}
                                                    >
                                                        Remove
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Tax (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newSale.tax}
                                        onChange={(e) => handleNewSaleChange('tax', parseFloat(e.target.value))}
                                        min="0"
                                        max="100"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Discount (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newSale.discount}
                                        onChange={(e) => handleNewSaleChange('discount', parseFloat(e.target.value))}
                                        min="0"
                                        max="100"
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 offset-md-6">
                                <div className="card">
                                    <div className="card-body">
                                        <h5>Total Summary</h5>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Subtotal:</span>
                                            <span>${newSale.items.reduce((sum, item) => sum + calculateItemTotal(item), 0).toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Tax ({newSale.tax}%):</span>
                                            <span>${(newSale.items.reduce((sum, item) => sum + calculateItemTotal(item), 0) * newSale.tax / 100).toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Discount ({newSale.discount}%):</span>
                                            <span>${(newSale.items.reduce((sum, item) => sum + calculateItemTotal(item), 0) * newSale.discount / 100).toFixed(2)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between">
                                            <strong>Total:</strong>
                                            <strong>${calculateSaleTotal().toFixed(2)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={createSale}
                        disabled={!newSale.locationId || !newSale.items.some(item => item.product) || !newSale.paymentMethod}
                    >
                        Create Sale
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} size="lg">
                <div className="page-wrapper p-0 m-0">
                    <div className="content p-0">
                        <div className="modal-header border-0 custom-modal-header">
                            <div className="page-title">
                                <h4>Delete Sale</h4>
                            </div>
                            <button
                                type="button"
                                className="close"
                                onClick={() => setShowDeleteModal(false)}
                                aria-label="Close"
                            >
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>
                        <div className="card">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-12">
                                        <div className="input-blocks">
                                            <p className="mb-4">Are you sure you want to delete this sale? This action cannot be undone.</p>
                                            {saleToDelete && (
                                                <div className="sale-details mb-4">
                                                    <div className="table-responsive">
                                                        <table className="table">
                                                            <tbody>
                                                                <tr>
                                                                    <td><strong>Sale ID:</strong></td>
                                                                    <td>{saleToDelete._id}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Customer:</strong></td>
                                                                    <td>{saleToDelete.customer?.name || 'Walk-in Customer'}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Date:</strong></td>
                                                                    <td>{new Date(saleToDelete.createdAt).toLocaleDateString()}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Total:</strong></td>
                                                                    <td>${saleToDelete.total?.toFixed(2) || '0.00'}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td><strong>Status:</strong></td>
                                                                    <td>
                                                                        <span className={`badge ${
                                                                            saleToDelete.status === 'completed' ? 'bg-success' :
                                                                            saleToDelete.status === 'pending' ? 'bg-warning' :
                                                                            saleToDelete.status === 'cancelled' ? 'bg-danger' :
                                                                            saleToDelete.status === 'refunded' ? 'bg-info' :
                                                                            'bg-secondary'
                                                                        }`}>
                                                                            {saleToDelete.status || 'Pending'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-lg-12 text-end">
                                        <button
                                            type="button"
                                            className="btn btn-cancel add-cancel me-3"
                                            onClick={() => setShowDeleteModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-submit add-sale"
                                            onClick={handleDeleteConfirm}
                                        >
                                            Delete Sale
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Edit Sale Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Sale</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Store Location</Form.Label>
                                    <Select
                                        options={locations}
                                        value={locations.find(loc => loc.value === editingSale?.locationId)}
                                        onChange={handleEditLocationChange}
                                        placeholder="Select Store Location"
                                        isClearable
                                        required
                                        className="basic-single"
                                        classNamePrefix="select"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Customer Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editingSale?.customer?.name || ''}
                                        onChange={(e) => handleEditSaleChange('customer.name', e.target.value)}
                                        placeholder="Enter customer name"
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Payment Method</Form.Label>
                                    <Select
                                        options={paymentMethods}
                                        value={paymentMethods.find(method => method.value === editingSale?.paymentMethod)}
                                        onChange={(option) => handleEditSaleChange('paymentMethod', option?.value)}
                                        placeholder="Select Payment Method"
                                        isClearable
                                        required
                                        className="basic-single"
                                        classNamePrefix="select"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={editingSale?.notes || ''}
                                        onChange={(e) => handleEditSaleChange('notes', e.target.value)}
                                        placeholder="Enter any additional notes"
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5>Items</h5>
                                <Button variant="outline-primary" onClick={() => {
                                    setEditingSale(prev => ({
                                        ...prev,
                                        items: [...prev.items, {
                                            product: '',
                                            quantity: 1,
                                            price: 0,
                                            discount: 0
                                        }]
                                    }));
                                }}>
                                    Add Item
                                </Button>
                            </div>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Discount (%)</th>
                                            <th>Total</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {editingSale?.items?.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Select
                                                        options={products}
                                                        value={products.find(p => p.value === item.product)}
                                                        onChange={(option) => handleEditProductSelect(index, option?.value)}
                                                        placeholder="Select Product"
                                                        formatOptionLabel={formatOptionLabel}
                                                        isClearable
                                                        required
                                                        isDisabled={!editingSale.locationId}
                                                        className="select"
                                                        classNamePrefix="react-select"
                                                        noOptionsMessage={() =>
                                                            !editingSale.locationId
                                                                ? "Please select a location first"
                                                                : products.length === 0
                                                                    ? "No products available"
                                                                    : "No products match your search"
                                            }
                                        />
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleEditQuantityChange(index, e.target.value)}
                                            required
                                            disabled={!item.product}
                                        />
                                    </td>
                                    <td>${item.price.toFixed(2)}</td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.discount}
                                            onChange={(e) => handleEditItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                                            disabled={!item.product}
                                        />
                                    </td>
                                    <td>${(item.price * item.quantity * (1 - item.discount / 100)).toFixed(2)}</td>
                                    <td>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => {
                                                setEditingSale(prev => ({
                                                    ...prev,
                                                    items: prev.items.filter((_, i) => i !== index)
                                                }));
                                            }}
                                            disabled={editingSale.items.length === 1}
                                        >
                                            Remove
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Tax (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editingSale?.tax || 0}
                                        onChange={(e) => handleEditSaleChange('tax', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        max="100"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Discount (%)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editingSale?.discount || 0}
                                        onChange={(e) => handleEditSaleChange('discount', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        max="100"
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 offset-md-6">
                                <div className="card">
                                    <div className="card-body">
                                        <h5>Total Summary</h5>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Subtotal:</span>
                                            <span>${editingSale?.items?.reduce((sum, item) =>
                                                sum + (item.price * item.quantity * (1 - item.discount / 100)), 0).toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Tax ({editingSale?.tax || 0}%):</span>
                                            <span>${(editingSale?.items?.reduce((sum, item) =>
                                                sum + (item.price * item.quantity * (1 - item.discount / 100)), 0) * (editingSale?.tax || 0) / 100).toFixed(2)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Discount ({editingSale?.discount || 0}%):</span>
                                            <span>${(editingSale?.items?.reduce((sum, item) =>
                                                sum + (item.price * item.quantity * (1 - item.discount / 100)), 0) * (editingSale?.discount || 0) / 100).toFixed(2)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between">
                                            <strong>Total:</strong>
                                            <strong>${(editingSale?.items?.reduce((sum, item) =>
                                                sum + (item.price * item.quantity * (1 - item.discount / 100)), 0) *
                                                (1 + (editingSale?.tax || 0) / 100) *
                                                (1 - (editingSale?.discount || 0) / 100)).toFixed(2)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={updateSale}
                        disabled={!editingSale?.locationId || !editingSale?.items?.some(item => item.product) || !editingSale?.paymentMethod}
                    >
                        Update Sale
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Invoice Modal */}
            <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Invoice</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSaleForInvoice && (
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
                                        <p>Invoice #: {selectedSaleForInvoice._id.slice(-6).toUpperCase()}</p>
                                        <p>Date: {new Date(selectedSaleForInvoice.createdAt).toLocaleDateString()}</p>
                                        <p>Status: <span className={`badge ${
                                            selectedSaleForInvoice.status === 'completed' ? 'bg-success' :
                                            selectedSaleForInvoice.status === 'pending' ? 'bg-warning' :
                                            selectedSaleForInvoice.status === 'cancelled' ? 'bg-danger' :
                                            selectedSaleForInvoice.status === 'refunded' ? 'bg-info' :
                                            'bg-secondary'
                                        }`}>{selectedSaleForInvoice.status || 'Pending'}</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="invoice-customer mb-4">
                                <div className="row">
                                    <div className="col-6">
                                        <h5>Bill To:</h5>
                                        <p>{selectedSaleForInvoice.customer?.name || 'Walk-in Customer'}</p>
                                        {selectedSaleForInvoice.customer?.email && <p>{selectedSaleForInvoice.customer.email}</p>}
                                        {selectedSaleForInvoice.customer?.contact && <p>{selectedSaleForInvoice.customer.contact}</p>}
                                    </div>
                                    <div className="col-6 text-end">
                                        <h5>Store Location:</h5>
                                        <p>{selectedSaleForInvoice.location?.name || 'N/A'}</p>
                                        <p>Payment Method: {selectedSaleForInvoice.paymentMethod}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="invoice-items mb-4">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>SKU</th>
                                            <th className="text-end">Quantity</th>
                                            <th className="text-end">Price</th>
                                            <th className="text-end">Discount</th>
                                            <th className="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedSaleForInvoice.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <img
                                                            src={item.product?.imageUrl ? `${process.env.REACT_APP_FILE_BASE_URL}${item.product.imageUrl}` : '/assets/img/placeholder-product.png'}
                                                            alt={item.product?.name}
                                                            style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = '/assets/img/placeholder-product.png';
                                                            }}
                                                        />
                                                        <span>{item.product?.name || 'Unknown Product'}</span>
                                                    </div>
                                                </td>
                                                <td>{item.product?.sku || 'N/A'}</td>
                                                <td className="text-end">{item.quantity}</td>
                                                <td className="text-end">${item.price.toFixed(2)}</td>
                                                <td className="text-end">{item.discount}%</td>
                                                <td className="text-end">${(item.price * item.quantity * (1 - item.discount / 100)).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="invoice-summary">
                                <div className="row">
                                    <div className="col-6">
                                        <h5>Notes:</h5>
                                        <p>{selectedSaleForInvoice.notes || 'No additional notes.'}</p>
                                    </div>
                                    <div className="col-6">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td>Subtotal:</td>
                                                    <td className="text-end">${selectedSaleForInvoice.subtotal?.toFixed(2) || '0.00'}</td>
                                                </tr>
                                                <tr>
                                                    <td>Tax ({selectedSaleForInvoice.tax || 0}%):</td>
                                                    <td className="text-end">${((selectedSaleForInvoice.subtotal || 0) * (selectedSaleForInvoice.tax || 0) / 100).toFixed(2)}</td>
                                                </tr>
                                                <tr>
                                                    <td>Discount ({selectedSaleForInvoice.discount || 0}%):</td>
                                                    <td className="text-end">${((selectedSaleForInvoice.subtotal || 0) * (selectedSaleForInvoice.discount || 0) / 100).toFixed(2)}</td>
                                                </tr>
                                                <tr className="fw-bold">
                                                    <td>Total:</td>
                                                    <td className="text-end">${selectedSaleForInvoice.total?.toFixed(2) || '0.00'}</td>
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
                    <Button variant="primary" onClick={() => window.print()}>
                        Print Invoice
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Sale Detail Modal */}
            <Modal show={showSaleDetailModal} onHide={() => setShowSaleDetailModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Sale Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSaleForDetail && (
                        <div className="sale-detail-container">
                            <div className="sale-header mb-4">
                                <div className="row">
                                    <div className="col-6">
                                        <h4>StockFlow</h4>
                                        <p>123 Business Street</p>
                                        <p>City, State 12345</p>
                                        <p>Phone: (123) 456-7890</p>
                                    </div>
                                    <div className="col-6 text-end">
                                        <h4>SALE DETAILS</h4>
                                        <p>Sale ID: {selectedSaleForDetail._id.slice(-6).toUpperCase()}</p>
                                        <p>Date: {new Date(selectedSaleForDetail.createdAt).toLocaleDateString()}</p>
                                        <p>Status: <span className={`badge ${
                                            selectedSaleForDetail.status === 'completed' ? 'bg-success' :
                                            selectedSaleForDetail.status === 'pending' ? 'bg-warning' :
                                            selectedSaleForDetail.status === 'cancelled' ? 'bg-danger' :
                                            selectedSaleForDetail.status === 'refunded' ? 'bg-info' :
                                            'bg-secondary'
                                        }`}>{selectedSaleForDetail.status || 'Pending'}</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="sale-customer mb-4">
                                <div className="row">
                                    <div className="col-6">
                                        <h5>Customer Information</h5>
                                        <p>Name: {selectedSaleForDetail.customer?.name || 'Walk-in Customer'}</p>
                                        {selectedSaleForDetail.customer?.email && <p>Email: {selectedSaleForDetail.customer.email}</p>}
                                        {selectedSaleForDetail.customer?.contact && <p>Contact: {selectedSaleForDetail.customer.contact}</p>}
                                    </div>
                                    <div className="col-6 text-end">
                                        <h5>Store Information</h5>
                                        <p>Location: {selectedSaleForDetail.location?.name || 'N/A'}</p>
                                        <p>Payment Method: {selectedSaleForDetail.paymentMethod}</p>
                                        {selectedSaleForDetail.notes && <p>Notes: {selectedSaleForDetail.notes}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="sale-items mb-4">
                                <h5>Items</h5>
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>SKU</th>
                                                <th className="text-end">Quantity</th>
                                                <th className="text-end">Price</th>
                                                <th className="text-end">Discount</th>
                                                <th className="text-end">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSaleForDetail.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={item.product?.imageUrl ? `${process.env.REACT_APP_FILE_BASE_URL}${item.product.imageUrl}` : '/assets/img/placeholder-product.png'}
                                                                alt={item.product?.name}
                                                                style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = '/assets/img/placeholder-product.png';
                                                                }}
                                                            />
                                                            <span>{item.product?.name || 'Unknown Product'}</span>
                                                        </div>
                                                    </td>
                                                    <td>{item.product?.sku || 'N/A'}</td>
                                                    <td className="text-end">{item.quantity}</td>
                                                    <td className="text-end">${item.price.toFixed(2)}</td>
                                                    <td className="text-end">{item.discount}%</td>
                                                    <td className="text-end">${(item.price * item.quantity * (1 - item.discount / 100)).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="sale-summary">
                                <div className="row">
                                    <div className="col-6">
                                        <h5>Additional Information</h5>
                                        <p>Created By: {selectedSaleForDetail.createdBy?.name || 'System'}</p>
                                        <p>Created At: {new Date(selectedSaleForDetail.createdAt).toLocaleString()}</p>
                                        {selectedSaleForDetail.updatedAt && (
                                            <p>Last Updated: {new Date(selectedSaleForDetail.updatedAt).toLocaleString()}</p>
                                        )}
                                    </div>
                                    <div className="col-6">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td>Subtotal:</td>
                                                    <td className="text-end">${selectedSaleForDetail.subtotal?.toFixed(2) || '0.00'}</td>
                                                </tr>
                                                <tr>
                                                    <td>Tax ({selectedSaleForDetail.tax || 0}%):</td>
                                                    <td className="text-end">${((selectedSaleForDetail.subtotal || 0) * (selectedSaleForDetail.tax || 0) / 100).toFixed(2)}</td>
                                                </tr>
                                                <tr>
                                                    <td>Discount ({selectedSaleForDetail.discount || 0}%):</td>
                                                    <td className="text-end">${((selectedSaleForDetail.subtotal || 0) * (selectedSaleForDetail.discount || 0) / 100).toFixed(2)}</td>
                                                </tr>
                                                <tr className="fw-bold">
                                                    <td>Total:</td>
                                                    <td className="text-end">${selectedSaleForDetail.total?.toFixed(2) || '0.00'}</td>
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
                    <Button variant="secondary" onClick={() => setShowSaleDetailModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => window.print()}>
                        Print Details
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
                    .sale-detail-container, .sale-detail-container * {
                        visibility: visible;
                    }
                    .sale-detail-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .modal-footer {
                        display: none !important;
                    }
                }
                .sale-detail-container {
                    padding: 20px;
                }
            `}</style>
        </div>
    )
}

export default SalesList;

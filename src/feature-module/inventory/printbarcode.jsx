import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { ChevronUp, MinusCircle, PlusCircle, RotateCcw, Search, Printer, Download, Eye } from 'feather-icons-react/build/IconComponents';
import Image from '../../core/img/image';
import { OverlayTrigger, Tooltip, Modal, Button } from 'react-bootstrap';
import { setToogleHeader } from '../../core/redux/action';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import BarcodeDisplay from '../../components/barcode/BarcodeDisplay';
import barcodeService from '../../services/barcodeService';

const API_BASE_URL = process.env.REACT_APP_API_URL;
const FILE_BASE_URL = process.env.REACT_APP_FILE_BASE_URL;

const PrintBarcode = () => {
    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header);

    // State variables
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [printItems, setPrintItems] = useState([]);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewItems, setPreviewItems] = useState([]);
    const [paperSize, setPaperSize] = useState('A4');
    const [barcodeFormat, setBarcodeFormat] = useState('CODE128');
    const [barcodeHeight, setBarcodeHeight] = useState(100);
    const [barcodeWidth, setBarcodeWidth] = useState(2);

    const paperSizes = [
        { value: 'A4', label: 'A4 (210×297mm)' },
        { value: 'A5', label: 'A5 (148×210mm)' },
        { value: 'Label', label: 'Label (100×50mm)' },
        { value: 'Custom', label: 'Custom Size' }
    ];

    const barcodeFormats = [
        { value: 'CODE128', label: 'CODE 128' },
        { value: 'CODE39', label: 'CODE 39' },
        { value: 'EAN13', label: 'EAN-13' },
        { value: 'EAN8', label: 'EAN-8' },
        { value: 'UPC', label: 'UPC' }
    ];

    // Fetch locations and products on component mount
    useEffect(() => {
        fetchLocations();
        fetchProducts();
    }, []);

    // Filter products based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/locations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const locationsArray = response.data?.locations || response.data || [];
            const formattedLocations = locationsArray.map(loc => ({
                value: loc._id,
                label: `${loc.name} (${loc.type || 'Location'})`
            }));
            setLocations(formattedLocations);
        } catch (error) {
            console.error('Error fetching locations:', error);
            toast.error('Failed to load locations');
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Handle different response formats - some APIs return direct array, others wrap in products property
            const productsArray = response.data.products || response.data || [];
            
            // Only include products that have barcodes
            const productsWithBarcodes = productsArray.filter(product => product.barcode);
            setProducts(productsWithBarcodes);
            setFilteredProducts(productsWithBarcodes);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const addToPrintList = (product) => {
        const existingItem = printItems.find(item => item.productId === product._id);
        if (existingItem) {
            setPrintItems(printItems.map(item =>
                item.productId === product._id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setPrintItems([...printItems, {
                productId: product._id,
                name: product.name,
                sku: product.sku,
                barcode: product.barcode,
                imageUrl: product.imageUrl,
                quantity: 1
            }]);
        }
        toast.success(`${product.name} added to print list`);
    };

    const removeFromPrintList = (productId) => {
        setPrintItems(printItems.filter(item => item.productId !== productId));
        toast.info('Item removed from print list');
    };

    const updatePrintQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromPrintList(productId);
            return;
        }
        setPrintItems(printItems.map(item =>
            item.productId === productId
                ? { ...item, quantity: Math.max(1, newQuantity) }
                : item
        ));
    };

    const handlePreview = () => {
        if (printItems.length === 0) {
            toast.warning('Please add items to print list first');
            return;
        }
        setPreviewItems(printItems);
        setShowPreviewModal(true);
    };

    const handlePrint = async () => {
        if (printItems.length === 0) {
            toast.warning('Please add items to print list first');
            return;
        }

        try {
            // Generate print-ready barcode data with images
            const printData = [];
            for (const item of printItems) {
                for (let i = 0; i < item.quantity; i++) {
                    // Create a temporary canvas to generate barcode image
                    const canvas = document.createElement('canvas');
                    
                    // Use JsBarcode to render the barcode to the canvas
                    const JsBarcode = await import('jsbarcode');
                    JsBarcode.default(canvas, item.barcode, {
                        format: barcodeFormat,
                        width: barcodeWidth,
                        height: barcodeHeight,
                        displayValue: true,
                        fontSize: 14,
                        margin: 5,
                        background: '#ffffff',
                        lineColor: '#000000'
                    });
                    
                    // Convert canvas to base64 image
                    const barcodeImage = canvas.toDataURL('image/png');
                    
                    printData.push({
                        name: item.name,
                        sku: item.sku,
                        barcode: item.barcode,
                        format: barcodeFormat,
                        barcodeImage: barcodeImage
                    });
                }
            }

            // Create print content with images
            const printContent = generatePrintContent(printData);
            
            // Open print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // Wait for the content to load then print
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            };

            toast.success('Print job sent successfully');
        } catch (error) {
            console.error('Error printing barcodes:', error);
            toast.error('Failed to print barcodes');
        }
    };

    const generatePrintContent = (printData) => {
        const barcodeItems = printData.map((item, index) => `
            <div class="barcode-item">
                <div class="barcode-container">
                    <img src="${item.barcodeImage}" class="barcode-image" alt="Barcode for ${item.barcode}" />
                </div>
                <div class="barcode-info">
                    <div class="product-name">${item.name}</div>
                    <div class="product-sku">SKU: ${item.sku}</div>
                    <div class="barcode-text">${item.barcode}</div>
                </div>
            </div>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Barcodes</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 20px; 
                        background: white;
                    }
                    .barcode-container {
                        display: block;
                        max-width: 300px;
                        margin: 0 auto;
                    }
                    .barcode-item {
                        border: 1px solid #ddd;
                        padding: 15px;
                        text-align: center;
                        width: 100%;
                        margin: 0 0 10px 0;
                        page-break-inside: avoid;
                        background: white;
                        box-sizing: border-box;
                    }
                    .barcode-image {
                        margin: 10px auto;
                        display: block;
                        max-width: 100%;
                        height: auto;
                    }
                    .product-name {
                        font-weight: bold;
                        font-size: 14px;
                        margin: 5px 0;
                        color: #333;
                        line-height: 1.2;
                    }
                    .product-sku {
                        font-size: 12px;
                        color: #666;
                        margin: 3px 0;
                    }
                    .barcode-text {
                        font-size: 12px;
                        font-weight: bold;
                        margin: 5px 0;
                        color: #333;
                        word-break: break-all;
                    }
                    @media print {
                        body { 
                            margin: 0; 
                            padding: 5px;
                        }
                        .barcode-container {
                            max-width: 100%;
                            margin: 0;
                        }
                        .barcode-item { 
                            margin: 0 0 8px 0;
                            border: 1px solid #000;
                            background: white !important;
                            padding: 10px;
                            page-break-inside: avoid;
                            page-break-after: avoid;
                        }
                        .barcode-image {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                            color-adjust: exact;
                            margin: 8px auto;
                            max-width: 100%;
                            height: auto;
                        }
                        .product-name {
                            font-size: 13px;
                            margin: 4px 0;
                            color: #000 !important;
                        }
                        .product-sku {
                            font-size: 11px;
                            margin: 2px 0;
                            color: #000 !important;
                        }
                        .barcode-text {
                            font-size: 11px;
                            margin: 4px 0;
                            color: #000 !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="barcode-container">
                    ${barcodeItems}
                </div>
            </body>
            </html>
        `;
    };

    const renderTooltip = (text) => (props) => (
        <Tooltip id="tooltip" {...props}>
            {text}
        </Tooltip>
    );

    return (
        <div className="page-wrapper">
            <div className="content">
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Print Barcodes</h4>
                            <h6>Manage and print product barcodes</h6>
                        </div>
                    </div>
                    <div className="d-flex align-items-center">
                        <ul className="table-top-head">
                            <li>
                                <OverlayTrigger placement="top" overlay={renderTooltip("Refresh")}>
                                    <Link onClick={fetchProducts} data-bs-toggle="tooltip" data-bs-placement="top">
                                        <RotateCcw />
                                    </Link>
                                </OverlayTrigger>
                            </li>
                            <li>
                                <OverlayTrigger placement="top" overlay={renderTooltip("Collapse")}>
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
                </div>

                <div className="barcode-content-list">
                    {/* Filter Section */}
                    <div className="row mb-4">
                        <div className="col-lg-4">
                            <label className="form-label">Location</label>
                            <Select
                                options={locations}
                                value={selectedLocation}
                                onChange={setSelectedLocation}
                                placeholder="Select Location"
                                isClearable
                            />
                        </div>
                        <div className="col-lg-4">
                            <label className="form-label">Paper Size</label>
                            <Select
                                options={paperSizes}
                                value={paperSizes.find(size => size.value === paperSize)}
                                onChange={(option) => setPaperSize(option.value)}
                                placeholder="Select Paper Size"
                            />
                        </div>
                        <div className="col-lg-4">
                            <label className="form-label">Barcode Format</label>
                            <Select
                                options={barcodeFormats}
                                value={barcodeFormats.find(format => format.value === barcodeFormat)}
                                onChange={(option) => setBarcodeFormat(option.value)}
                                placeholder="Select Format"
                            />
                        </div>
                    </div>

                    {/* Search Section */}
                    <div className="row mb-4">
                        <div className="col-lg-8">
                            <div className="input-blocks search-form">
                                <label className="form-label">Search Product</label>
                                <div className="searchInput">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by name, SKU, or barcode..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <div className="icon">
                                        <Search />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 d-flex align-items-end justify-content-end">
                            <div className="barcode-action-buttons">
                                <Button
                                    variant="outline-primary"
                                    onClick={handlePreview}
                                    className="me-2"
                                    disabled={printItems.length === 0}
                                    size="sm"
                                >
                                    <Eye size={16} className="me-1" />
                                    Preview ({printItems.length})
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handlePrint}
                                    disabled={printItems.length === 0}
                                    size="sm"
                                >
                                    <Printer size={16} className="me-1" />
                                    Print All
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="table-responsive">
                        <table className="table datanew">
                            <thead>
                                <tr>
                                    <th style={{ width: '30%' }}>Product</th>
                                    <th style={{ width: '15%' }}>SKU</th>
                                    <th style={{ width: '25%' }}>Barcode</th>
                                    <th style={{ width: '15%' }}>Preview</th>
                                    <th style={{ width: '10%' }}>Print Qty</th>
                                    <th className="text-center" style={{ width: '5%' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center">
                                            <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center">
                                            No products with barcodes found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const printItem = printItems.find(item => item.productId === product._id);
                                        return (
                                            <tr key={product._id}>
                                                <td>
                                                    <div className="productimgname">
                                                        <Link to="#" className="product-img stock-img">
                                                            <Image 
                                                                src={product.imageUrl ? `${FILE_BASE_URL}${product.imageUrl}` : "assets/img/products/noimage.png"} 
                                                                alt={product.name}
                                                                width={40}
                                                                height={40}
                                                                className="product-thumbnail"
                                                                onError={(e) => {
                                                                    e.target.src = "assets/img/products/noimage.png";
                                                                }}
                                                            />
                                                        </Link>
                                                        <Link to="#" className="product-name-link">{product.name}</Link>
                                                    </div>
                                                </td>
                                                <td>
                                                    <code>{product.sku}</code>
                                                </td>
                                                <td>
                                                    <code>{product.barcode}</code>
                                                </td>
                                                <td>
                                                    <div className="barcode-preview-container" style={{ width: '100px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px' }}>
                                                        {product.barcode ? (
                                                            <img 
                                                                src="assets/img/barcode/barcode-01.png" 
                                                                alt="Barcode Preview" 
                                                                style={{ 
                                                                    width: '80px', 
                                                                    height: '30px', 
                                                                    objectFit: 'contain',
                                                                    opacity: 0.8
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="barcode-placeholder" style={{ 
                                                                width: '80px', 
                                                                height: '30px', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center',
                                                                backgroundColor: '#f8f9fa',
                                                                border: '1px dashed #dee2e6',
                                                                borderRadius: '4px',
                                                                color: '#6c757d',
                                                                fontSize: '10px'
                                                            }}>
                                                                No Barcode
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {printItem ? (
                                                        <div className="product-quantity d-flex align-items-center justify-content-center">
                                                            <button 
                                                                className="btn btn-outline-secondary btn-sm quantity-btn" 
                                                                onClick={() => updatePrintQuantity(product._id, printItem.quantity - 1)}
                                                                type="button"
                                                                style={{ padding: '4px 8px', minWidth: '32px' }}
                                                                disabled={printItem.quantity <= 1}
                                                            >
                                                                <MinusCircle size={14} />
                                                            </button>
                                                            <input
                                                                type="number"
                                                                className="form-control form-control-sm quantity-input mx-2"
                                                                value={printItem.quantity}
                                                                onChange={(e) => updatePrintQuantity(product._id, parseInt(e.target.value) || 0)}
                                                                min="1"
                                                                style={{ width: '60px', textAlign: 'center' }}
                                                            />
                                                            <button 
                                                                className="btn btn-outline-secondary btn-sm quantity-btn" 
                                                                onClick={() => updatePrintQuantity(product._id, printItem.quantity + 1)}
                                                                type="button"
                                                                style={{ padding: '4px 8px', minWidth: '32px' }}
                                                            >
                                                                <PlusCircle size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex align-items-center justify-content-center">
                                                            <button 
                                                                className="btn btn-outline-primary btn-sm" 
                                                                onClick={() => addToPrintList(product)}
                                                                type="button"
                                                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                                            >
                                                                <PlusCircle size={14} className="me-1" />
                                                                Add
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="action-table-data text-center">
                                                    <div className="edit-delete-action">
                                                        {printItem ? (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => removeFromPrintList(product._id)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => addToPrintList(product)}
                                                            >
                                                                Add to Print
                                                            </Button>
                                                        )}
                                                    </div>
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

            {/* Preview Modal */}
            <Modal 
                show={showPreviewModal} 
                onHide={() => setShowPreviewModal(false)}
                size="xl"
                centered
                className="barcode-preview-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Barcode Print Preview</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div className="barcode-preview-container">
                        <div className="container-fluid">
                            <div className="row g-3">
                                {previewItems.map((item, index) => (
                                    Array.from({ length: item.quantity }).map((_, qtyIndex) => (
                                        <div key={`${index}-${qtyIndex}`} className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
                                            <div className="barcode-preview-item border p-3 text-center bg-white h-100" style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', minHeight: '200px' }}>
                                                <div className="mb-2">
                                                    <strong style={{ fontSize: '14px', color: '#333', lineHeight: '1.2', display: 'block', height: '32px', overflow: 'hidden' }}>{item.name}</strong>
                                                </div>
                                                <div className="mb-2 d-flex justify-content-center align-items-center" style={{ height: '80px' }}>
                                                    <BarcodeDisplay
                                                        value={item.barcode}
                                                        format={barcodeFormat}
                                                        height={barcodeHeight}
                                                        width={barcodeWidth}
                                                        displayValue={true}
                                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                                    />
                                                </div>
                                                <div className="small text-muted" style={{ fontSize: '12px' }}>
                                                    SKU: {item.sku}
                                                </div>
                                                <div className="small text-muted" style={{ fontSize: '11px', marginTop: '5px', wordBreak: 'break-all' }}>
                                                    {item.barcode}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ))}
                            </div>
                        </div>
                        {previewItems.length === 0 && (
                            <div className="text-center py-5">
                                <p className="text-muted">No items selected for printing</p>
                            </div>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => { setShowPreviewModal(false); handlePrint(); }}>
                        Print Now
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default PrintBarcode;
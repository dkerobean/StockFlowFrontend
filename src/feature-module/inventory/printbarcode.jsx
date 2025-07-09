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
                ? { ...item, quantity: newQuantity }
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
            // Generate print-ready barcode data
            const printData = [];
            for (const item of printItems) {
                for (let i = 0; i < item.quantity; i++) {
                    printData.push({
                        name: item.name,
                        sku: item.sku,
                        barcode: item.barcode,
                        format: barcodeFormat
                    });
                }
            }

            // Create print content
            const printContent = generatePrintContent(printData);
            
            // Open print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();

            toast.success('Print job sent successfully');
        } catch (error) {
            console.error('Error printing barcodes:', error);
            toast.error('Failed to print barcodes');
        }
    };

    const generatePrintContent = (printData) => {
        const barcodeItems = printData.map(item => `
            <div class="barcode-item">
                <div class="barcode-container">
                    <canvas class="barcode-canvas" data-barcode="${item.barcode}" data-format="${item.format}"></canvas>
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
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 20px; 
                        background: white;
                    }
                    .barcode-container {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 15px;
                        justify-content: center;
                    }
                    .barcode-item {
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: center;
                        width: 250px;
                        margin: 5px;
                        page-break-inside: avoid;
                    }
                    .barcode-canvas {
                        margin: 10px 0;
                    }
                    .product-name {
                        font-weight: bold;
                        font-size: 14px;
                        margin: 5px 0;
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
                    }
                    @media print {
                        body { margin: 0; }
                        .barcode-item { 
                            margin: 5px; 
                            border: 1px solid #000;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="barcode-container">
                    ${barcodeItems}
                </div>
                <script>
                    window.onload = function() {
                        const canvases = document.querySelectorAll('.barcode-canvas');
                        canvases.forEach(canvas => {
                            const barcode = canvas.dataset.barcode;
                            const format = canvas.dataset.format;
                            JsBarcode(canvas, barcode, {
                                format: format,
                                width: ${barcodeWidth},
                                height: ${barcodeHeight},
                                displayValue: true,
                                fontSize: 14,
                                margin: 5
                            });
                        });
                    };
                </script>
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
                        <div className="col-lg-6">
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
                        <div className="col-lg-6 d-flex align-items-end">
                            <Button
                                variant="primary"
                                onClick={handlePreview}
                                className="me-2"
                                disabled={printItems.length === 0}
                            >
                                <Eye size={16} className="me-1" />
                                Preview ({printItems.length})
                            </Button>
                            <Button
                                variant="success"
                                onClick={handlePrint}
                                disabled={printItems.length === 0}
                            >
                                <Printer size={16} className="me-1" />
                                Print All
                            </Button>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="table-responsive">
                        <table className="table datanew">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Barcode</th>
                                    <th>Preview</th>
                                    <th>Print Qty</th>
                                    <th className="text-center">Action</th>
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
                                                                src={product.imageUrl || "assets/img/products/noimage.png"} 
                                                                alt={product.name} 
                                                            />
                                                        </Link>
                                                        <Link to="#">{product.name}</Link>
                                                    </div>
                                                </td>
                                                <td>{product.sku}</td>
                                                <td>
                                                    <code>{product.barcode}</code>
                                                </td>
                                                <td>
                                                    <div style={{ width: '120px', height: '40px' }}>
                                                        <BarcodeDisplay
                                                            value={product.barcode}
                                                            format={barcodeFormat}
                                                            height={30}
                                                            width={1}
                                                            displayValue={false}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    {printItem ? (
                                                        <div className="product-quantity">
                                                            <span 
                                                                className="quantity-btn" 
                                                                onClick={() => updatePrintQuantity(product._id, printItem.quantity - 1)}
                                                            >
                                                                <MinusCircle />
                                                            </span>
                                                            <input
                                                                type="text"
                                                                className="quantity-input"
                                                                value={printItem.quantity}
                                                                onChange={(e) => updatePrintQuantity(product._id, parseInt(e.target.value) || 0)}
                                                            />
                                                            <span 
                                                                className="quantity-btn" 
                                                                onClick={() => updatePrintQuantity(product._id, printItem.quantity + 1)}
                                                            >
                                                                <PlusCircle />
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">-</span>
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
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Barcode Print Preview</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="barcode-preview-container">
                        <div className="row">
                            {previewItems.map((item, index) => (
                                Array.from({ length: item.quantity }).map((_, qtyIndex) => (
                                    <div key={`${index}-${qtyIndex}`} className="col-lg-4 col-md-6 mb-3">
                                        <div className="barcode-preview-item border p-3 text-center">
                                            <div className="mb-2">
                                                <strong>{item.name}</strong>
                                            </div>
                                            <div className="mb-2">
                                                <BarcodeDisplay
                                                    value={item.barcode}
                                                    format={barcodeFormat}
                                                    height={barcodeHeight}
                                                    width={barcodeWidth}
                                                />
                                            </div>
                                            <div className="small text-muted">
                                                SKU: {item.sku}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ))}
                        </div>
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
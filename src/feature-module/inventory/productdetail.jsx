import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components & Config
import Image from '../../core/img/image';
import { all_routes } from '../../Router/all_routes';
import { ArrowLeft, Printer } from 'feather-icons-react/build/IconComponents'; // Added ArrowLeft
import BarcodeDisplay from '../../components/barcode/BarcodeDisplay';

// Config and Helper
const API_URL = process.env.REACT_APP_API_URL;
const FILE_BASE_URL = process.env.REACT_APP_FILE_BASE_URL; // Assuming you set this up for EditProduct

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token not found.");
        return null;
    }
    return { Authorization: `Bearer ${token}` };
};

const ProductDetail = () => {
    const route = all_routes;
    const { productId } = useParams(); // Get productId from URL
    const navigate = useNavigate();

    // --- State ---
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Product Details ---
    const fetchProductDetails = useCallback(async () => {
        if (!productId) {
            setError("Product ID is missing.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            toast.error("Authentication required. Please log in.");
            setIsLoading(false);
            navigate(route.login);
            return;
        }
        if (!API_URL || !FILE_BASE_URL) {
            console.error("API_URL or FILE_BASE_URL is not configured.");
            toast.error("Application configuration error.");
            setError("Application configuration error.");
            setIsLoading(false);
            return;
        }

        try {
            console.log(`[ProductDetail] Fetching product with ID: ${productId}`);
            // Fetch product and populate related fields
            const response = await axios.get(`${API_URL}/products/${productId}`, {
                headers: authHeader,
                params: {
                    populate: 'category,brand,createdBy' // Populate necessary fields
                }
            });
            console.log("[ProductDetail] Received product data:", response.data);
            setProduct(response.data);
        } catch (err) {
            console.error("[ProductDetail] Error fetching product details:", err.response ? err.response.data : err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch product details.";
            setError(errorMessage);
            toast.error(errorMessage);

            if (err.response?.status === 401) {
                toast.error("Session expired. Please log in again.");
                localStorage.removeItem('token');
                navigate(route.login);
            } else if (err.response?.status === 404) {
                setError(`Product with ID ${productId} not found.`); // Specific 404 error
            }
        } finally {
            setIsLoading(false);
        }
    }, [productId, navigate, route.login]); // Dependencies

    // --- useEffect to Fetch Data ---
    useEffect(() => {
        fetchProductDetails();
    }, [fetchProductDetails]); // Run when fetchProductDetails changes (mainly on productId change)

    // --- Helper to format Price ---
    const formatPrice = (price) => {
        if (price === undefined || price === null) return 'N/A';
        return `$${Number(price).toFixed(2)}`;
    };

    // --- Print Barcode Function ---
    const printBarcode = async () => {
        if (!product.barcode) {
            toast.warning('No barcode available to print');
            return;
        }

        try {
            // Create a temporary canvas to generate barcode image
            const canvas = document.createElement('canvas');
            
            // Use JsBarcode to render the barcode to the canvas
            const JsBarcode = await import('jsbarcode');
            JsBarcode.default(canvas, product.barcode, {
                format: 'CODE128',
                width: 2,
                height: 100,
                displayValue: false,
                fontSize: 14,
                margin: 10,
                background: '#ffffff',
                lineColor: '#000000'
            });
            
            // Convert canvas to base64 image
            const barcodeImage = canvas.toDataURL('image/png');
            
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Print Barcode - ${product.name}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 20px; 
                            background: white;
                            text-align: center;
                        }
                        .barcode-container {
                            border: 2px solid #000;
                            padding: 20px;
                            margin: 20px auto;
                            width: fit-content;
                            max-width: 400px;
                        }
                        .product-info {
                            margin-bottom: 15px;
                        }
                        .product-name {
                            font-size: 18px;
                            font-weight: bold;
                            margin-bottom: 5px;
                            color: #000;
                        }
                        .product-sku {
                            font-size: 14px;
                            color: #666;
                            margin-bottom: 10px;
                        }
                        .barcode-image {
                            margin: 15px 0;
                            max-width: 100%;
                            height: auto;
                        }
                        .barcode-text {
                            font-size: 14px;
                            font-weight: bold;
                            margin-top: 10px;
                            color: #000;
                        }
                        @media print {
                            body { margin: 0; padding: 10px; }
                            .barcode-container { border: 2px solid #000; }
                            .barcode-image {
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                                color-adjust: exact;
                            }
                            .product-name, .barcode-text {
                                color: #000 !important;
                            }
                            .product-sku {
                                color: #666 !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="barcode-container">
                        <div class="product-info">
                            <div class="product-name">${product.name}</div>
                            <div class="product-sku">SKU: ${product.sku}</div>
                        </div>
                        <img src="${barcodeImage}" alt="Barcode" class="barcode-image" />
                        <div class="barcode-text">${product.barcode}</div>
                    </div>
                    <script>
                        window.onload = function() {
                            // Auto-print after content is loaded
                            setTimeout(() => {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
        } catch (error) {
            console.error('Error generating barcode for print:', error);
            toast.error('Failed to generate barcode for printing');
        }
    };

    // --- Construct Image URL ---
    const getImageUrl = (relativePath) => {
        if (!relativePath) return "/assets/img/placeholder-product.png"; // Default placeholder

        if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
            return relativePath; // Already absolute
        } else if (relativePath.startsWith('/') && FILE_BASE_URL) {
            return `${FILE_BASE_URL}${relativePath}`; // Prepend base URL
        } else {
            console.warn(`[ProductDetail] Unrecognized image URL format: ${relativePath}. Using placeholder.`);
            return "/assets/img/placeholder-product.png";
        }
    };

    // --- Render Logic ---

    if (isLoading) {
        return (
            <div className="page-wrapper"> <div className="content">
                <div className="page-header"> <div className="page-title"><h4>Product Details</h4><h6>Loading...</h6></div> </div>
                <div className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>
            </div> </div>
        );
    }

    if (error) {
        return (
            <div className="page-wrapper"> <div className="content">
                <div className="page-header">
                    <div className="page-title"><h4>Product Details</h4><h6>Error</h6></div>
                    <div className="page-btn"> <Link to={route.productlist} className="btn btn-dark"> <ArrowLeft className="me-2" size={16}/> Back to List </Link> </div>
                </div>
                <div className="alert alert-danger">Error: {error}</div>
                 {/* Optionally add a retry button */}
                 <button onClick={fetchProductDetails} className="btn btn-warning ms-2">Retry</button>
            </div> </div>
        );
    }

    if (!product) {
         // This case might be covered by the 404 error handling, but good as a fallback
        return (
            <div className="page-wrapper"> <div className="content">
                 <div className="page-header">
                     <div className="page-title"><h4>Product Details</h4><h6>Not Found</h6></div>
                     <div className="page-btn"> <Link to={route.productlist} className="btn btn-dark"> <ArrowLeft className="me-2" size={16}/> Back to List </Link> </div>
                 </div>
                <div className="alert alert-warning">Product data could not be loaded.</div>
            </div> </div>
        );
    }

    // --- Render Product Details ---
    const mainImageUrl = getImageUrl(product.imageUrl);

    return (
        <div>
            <ToastContainer position="top-right" autoClose={3000} />
            <style jsx>{`
                .detail-item {
                    border-bottom: 1px solid #e9ecef;
                    padding-bottom: 10px;
                }
                .detail-item:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                .detail-label {
                    font-weight: 600;
                    color: #495057;
                    font-size: 0.875rem;
                    margin-bottom: 5px;
                    display: block;
                }
                .detail-value {
                    color: #212529;
                    font-size: 1rem;
                    line-height: 1.4;
                }
                .description-text {
                    max-height: 100px;
                    overflow-y: auto;
                    padding: 10px;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                    border: 1px solid #e9ecef;
                }
                .barcode-display-container {
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                    display: inline-block;
                }
                .barcode-section .card {
                    border-radius: 10px;
                    overflow: hidden;
                }
                .barcode-section .card-header {
                    border-bottom: 2px solid #dee2e6;
                }
                .product-details-section .card {
                    border-radius: 10px;
                    transition: box-shadow 0.3s ease;
                }
                .product-details-section .card:hover {
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
                }
            `}</style>
            <div className="page-wrapper">
                <div className="content">
                    <div className="page-header">
                        <div className="page-title">
                            <h4>Product Details</h4>
                            <h6>Full details for: {product.name || 'N/A'}</h6>
                        </div>
                         {/* Add Back Button */}
                        <div className="page-btn">
                             <Link to={route.productlist} className="btn btn-dark">
                                <ArrowLeft className="me-2" size={16}/>
                                Back to Product List
                            </Link>
                        </div>
                    </div>

                    <div className="row">
                        {/* --- Left Column: Details --- */}
                        <div className="col-lg-8 col-sm-12">
                            <div className="card">
                                <div className="card-body">
                                    {/* Barcode Area */}
                                    {product.barcode && ( // Only show if barcode exists
                                        <div className="barcode-section mb-4">
                                            <div className="card border-0 shadow-sm">
                                                <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between">
                                                    <h6 className="mb-0 text-white">
                                                        <i className="fas fa-barcode me-2"></i>
                                                        Product Barcode
                                                    </h6>
                                                    <button 
                                                        className="btn btn-light btn-sm"
                                                        onClick={printBarcode}
                                                        title="Print Barcode"
                                                    >
                                                        <Printer size={16} className="me-1" />
                                                        Print
                                                    </button>
                                                </div>
                                                <div className="card-body text-center p-4">
                                                    <div className="barcode-display-container mb-3">
                                                        <BarcodeDisplay
                                                            value={product.barcode}
                                                            format="CODE128"
                                                            height={80}
                                                            width={2}
                                                            displayValue={true}
                                                            style={{ margin: '10px 0' }}
                                                        />
                                                    </div>
                                                    <div className="barcode-info">
                                                        <span className="badge bg-secondary px-3 py-2">
                                                            {product.barcode}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="product-details-section">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="card border-0 shadow-sm h-100">
                                                    <div className="card-header bg-light">
                                                        <h6 className="mb-0 text-primary">
                                                            <i className="fas fa-info-circle me-2"></i>
                                                            Basic Information
                                                        </h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="detail-item mb-3">
                                                            <label className="detail-label">Product Name</label>
                                                            <div className="detail-value">{product.name || 'N/A'}</div>
                                                        </div>
                                                        <div className="detail-item mb-3">
                                                            <label className="detail-label">SKU</label>
                                                            <div className="detail-value">
                                                                <span className="badge bg-primary">{product.sku || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="detail-item mb-3">
                                                            <label className="detail-label">Category</label>
                                                            <div className="detail-value">{product.category?.name || <span className="text-muted">None</span>}</div>
                                                        </div>
                                                        <div className="detail-item mb-3">
                                                            <label className="detail-label">Brand</label>
                                                            <div className="detail-value">{product.brand?.name || <span className="text-muted">None</span>}</div>
                                                        </div>
                                                        <div className="detail-item mb-3">
                                                            <label className="detail-label">Price</label>
                                                            <div className="detail-value">
                                                                <span className="badge bg-success fs-6">{formatPrice(product.price)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="detail-item mb-3">
                                                            <label className="detail-label">Status</label>
                                                            <div className="detail-value">
                                                                <span className={`badge ${product.isActive ? 'bg-success' : 'bg-danger'}`}>
                                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="card border-0 shadow-sm h-100">
                                                    <div className="card-header bg-light">
                                                        <h6 className="mb-0 text-primary">
                                                            <i className="fas fa-clock me-2"></i>
                                                            Additional Information
                                                        </h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="detail-item mb-3">
                                                            <label className="detail-label">Description</label>
                                                            <div className="detail-value description-text">
                                                                {product.description || <span className="text-muted">No description provided.</span>}
                                                            </div>
                                                        </div>
                                                        <div className="detail-item mb-3">
                                                            <label className="detail-label">Created By</label>
                                                            <div className="detail-value">{product.createdBy?.name || <span className="text-muted">Unknown</span>}</div>
                                                        </div>
                                                        <div className="detail-item mb-3">
                                                            <label className="detail-label">Created At</label>
                                                            <div className="detail-value">
                                                                <small className="text-muted">
                                                                    {product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'}
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <div className="detail-item mb-3">
                                                            <label className="detail-label">Last Updated</label>
                                                            <div className="detail-value">
                                                                <small className="text-muted">
                                                                    {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : 'N/A'}
                                                                </small>
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

                        {/* --- Right Column: Image --- */}
                        <div className="col-lg-4 col-sm-12">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title">Product Image</h5>
                                    {/* Removed slider, just show the main image */}
                                    <div className="product-img-details text-center">
                                        {product.imageUrl ? (
                                            <img
                                                src={mainImageUrl}
                                                alt={product.name || 'Product Image'}
                                                className="img-fluid" // Make image responsive
                                                style={{ maxHeight: '300px', objectFit: 'contain', border: '1px solid #eee', padding: '5px', borderRadius: '4px' }}
                                                onError={(e) => {
                                                    console.error(`[ProductDetail] Failed to load image: ${mainImageUrl}`);
                                                    e.target.onerror = null;
                                                    e.target.src = "/assets/img/placeholder-product.png"; // Fallback placeholder
                                                    e.target.alt = "Failed to load image";
                                                }}
                                            />
                                        ) : (
                                            <img
                                                src="/assets/img/placeholder-product.png"
                                                alt="No Image Available"
                                                className="img-fluid"
                                                style={{ maxHeight: '300px', objectFit: 'contain', border: '1px solid #eee', padding: '5px', borderRadius: '4px' }}
                                             />
                                        )}
                                        {/* Optionally display filename if needed */}
                                        {/* {product.imageUrl && <h6>{product.imageUrl.split('/').pop()}</h6>} */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* /add */}
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;
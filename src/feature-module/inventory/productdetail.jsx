import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components & Config
import Image from '../../core/img/image';
import { all_routes } from '../../Router/all_routes';
import { ArrowLeft, Printer } from 'feather-icons-react/build/IconComponents'; // Added ArrowLeft

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
                                    {/* Barcode Area (Keep placeholder, implement later if needed) */}
                                    {product.barcode && ( // Only show if barcode exists
                                        <div className="bar-code-view mb-4">
                                            {/* Placeholder for barcode image generation */}
                                            <span className="text-muted small">Barcode: {product.barcode}</span>
                                            {/* <Image src="assets/img/barcode/barcode1.png" alt="barcode" /> */}
                                            {/* Print function needs implementation */}
                                            {/* <a className="printimg" href="#">
                                                <Image src="assets/img/icons/printer.svg" alt="print" />
                                            </a> */}
                                        </div>
                                    )}

                                    <div className="productdetails">
                                        <ul className="product-bar">
                                            <li>
                                                <h4>Product Name</h4>
                                                <h6>{product.name || 'N/A'}</h6>
                                            </li>
                                            <li>
                                                <h4>Category</h4>
                                                {/* Use optional chaining ?. */}
                                                <h6>{product.category?.name || <span className="text-muted">None</span>}</h6>
                                            </li>
                                            {/* Remove Sub Category if not in your model */}
                                            {/* <li> <h4>Sub Category</h4> <h6>None</h6> </li> */}
                                            <li>
                                                <h4>Brand</h4>
                                                <h6>{product.brand?.name || <span className="text-muted">None</span>}</h6>
                                            </li>
                                            {/* Remove Unit if not in your model */}
                                            {/* <li> <h4>Unit</h4> <h6>Piece</h6> </li> */}
                                            <li>
                                                <h4>SKU</h4>
                                                <h6>{product.sku || 'N/A'}</h6>
                                            </li>
                                             {/* Remove Min Qty/Qty if not directly on product (likely in Inventory) */}
                                            {/* <li> <h4>Minimum Qty</h4> <h6>5</h6> </li> */}
                                            {/* <li> <h4>Quantity</h4> <h6>50</h6> </li> */}
                                             {/* Remove Tax/Discount if not on product */}
                                            {/* <li> <h4>Tax</h4> <h6>0.00 %</h6> </li> */}
                                            {/* <li> <h4>Discount Type</h4> <h6>Percentage</h6> </li> */}
                                            <li>
                                                <h4>Price</h4>
                                                <h6>{formatPrice(product.price)}</h6>
                                            </li>
                                            <li>
                                                <h4>Status</h4>
                                                <h6>{product.isActive ? 'Active' : 'Inactive'}</h6>
                                            </li>
                                            <li>
                                                <h4>Description</h4>
                                                {/* Use dangerouslySetInnerHTML ONLY if description contains safe HTML, otherwise just display text */}
                                                <h6>{product.description || <span className="text-muted">No description provided.</span>}</h6>
                                            </li>
                                             <li>
                                                <h4>Created By</h4>
                                                <h6>{product.createdBy?.name || <span className="text-muted">Unknown</span>}</h6>
                                            </li>
                                             <li>
                                                <h4>Created At</h4>
                                                 {/* Format date if needed */}
                                                <h6>{product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'}</h6>
                                            </li>
                                             <li>
                                                <h4>Last Updated At</h4>
                                                 {/* Format date if needed */}
                                                <h6>{product.updatedAt ? new Date(product.updatedAt).toLocaleString() : 'N/A'}</h6>
                                            </li>
                                        </ul>
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
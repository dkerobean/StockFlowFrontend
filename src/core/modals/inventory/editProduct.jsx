import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Modals
import AddCategory from "../../core/modals/inventory/addcategory";
import AddBrand from "../../core/modals/addbrand";

// Import Icons
import {
    ArrowLeft, Info, Image as ImageIcon,
    PlusCircle, X, ChevronUp
} from "feather-icons-react/build/IconComponents";
import { useDispatch, useSelector } from "react-redux";
import { setToogleHeader } from "../../core/redux/action";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import ImageWithBasePath from "../../core/img/imagewithbasebath"; // Used for upload icon in template
import { all_routes } from "../../Router/all_routes";

// Helper function to get Authentication Token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token not found.");
        return null; // Handle appropriately in calling functions
    }
    return { Authorization: `Bearer ${token}` };
};

// Configuration
const API_URL = process.env.REACT_APP_API_URL;
const BACKEND_BASE_URL = API_URL ? API_URL.replace('/api', '') : ''; // For constructing image URLs if needed

// Custom styles for react-select
const selectStyles = {
    control: (baseStyles, state) => ({
        ...baseStyles,
        minHeight: 'calc(1.5em + 0.75rem + 2px)',
        borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
        boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#86b7fe' : '#adb5bd',
        },
    }),
    menu: base => ({ ...base, zIndex: 5 }),
};


const EditProduct = () => {
    const route = all_routes;
    const navigate = useNavigate();
    const { productId } = useParams(); // Get productId from URL parameters
    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header); // For UI toggle

    // --- Form State ---
    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [sku, setSku] = useState('');
    const [barcode, setBarcode] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null); // Holds the { value, label } object for react-select
    const [selectedBrand, setSelectedBrand] = useState(null);     // Holds the { value, label } object for react-select
    const [imageUrl, setImageUrl] = useState('');           // Current image URL (can be original URL or blob: preview URL)
    const [originalImageUrl, setOriginalImageUrl] = useState(''); // Stores the image URL fetched from the DB initially
    const [imageFile, setImageFile] = useState(null);       // Holds the File object if a new image is selected
    const [isActive, setIsActive] = useState(true);         // Product status

    // --- Data for Select Dropdowns ---
    const [categories, setCategories] = useState([]); // Stores array of { value: id, label: name } for categories
    const [brands, setBrands] = useState([]);       // Stores array of { value: id, label: name } for brands

    // --- State to hold raw IDs from the fetched product ---
    // These are needed temporarily to bridge the gap until dropdown options are loaded
    const [productCategoryId, setProductCategoryId] = useState(null);
    const [productBrandId, setProductBrandId] = useState(null);

    // --- UI & Loading State ---
    // Separate loading states for each async operation
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isLoadingBrands, setIsLoadingBrands] = useState(true);
    const [isLoadingProduct, setIsLoadingProduct] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false); // For form submission process
    const [error, setError] = useState(null); // To store potential fetch errors

    // --- Fetch Categories ---
    const fetchCategories = useCallback(async () => {
        setIsLoadingCategories(true);
        console.log("Fetching Categories...");
        const authHeader = getAuthHeader();
        if (!authHeader || !API_URL) {
            toast.error(!authHeader ? "Authentication required." : "API URL not configured.");
            setIsLoadingCategories(false);
            return;
        }
        try {
            const response = await axios.get(`${API_URL}/categories`, { headers: authHeader });
            const categoryOptions = response.data.map(cat => ({ value: cat._id, label: cat.name }));
            setCategories(categoryOptions);
            console.log("Categories fetched:", categoryOptions.length);
        } catch (err) {
            console.error("Error fetching categories:", err);
            toast.error("Failed to load categories.");
            setError(err); // Store error object
            if (err.response?.status === 401) { localStorage.removeItem('token'); navigate(route.login); }
        } finally {
            setIsLoadingCategories(false);
        }
    }, [API_URL, navigate, route.login]);

    // --- Fetch Brands ---
    const fetchBrands = useCallback(async () => {
        setIsLoadingBrands(true);
        console.log("Fetching Brands...");
        const authHeader = getAuthHeader();
         if (!authHeader || !API_URL) {
             toast.error(!authHeader ? "Authentication required." : "API URL not configured.");
             setIsLoadingBrands(false);
             return;
         }
        try {
            const response = await axios.get(`${API_URL}/brands`, { headers: authHeader });
            const brandOptions = response.data.map(br => ({ value: br._id, label: br.name }));
            setBrands(brandOptions);
            console.log("Brands fetched:", brandOptions.length);
        } catch (err) {
            console.error("Error fetching brands:", err);
            toast.error("Failed to load brands.");
            setError(err);
            if (err.response?.status === 401) { localStorage.removeItem('token'); navigate(route.login); }
        } finally {
            setIsLoadingBrands(false);
        }
    }, [API_URL, navigate, route.login]);


    // --- Fetch Existing Product Data ---
    const fetchProductData = useCallback(async () => {
        if (!productId) { toast.error("Product ID missing."); navigate(route.productlist); return; }
        setIsLoadingProduct(true);
        console.log(`Fetching product data for ID: ${productId}`);
        const authHeader = getAuthHeader();
         if (!authHeader || !API_URL) {
             toast.error(!authHeader ? "Authentication required." : "API URL not configured.");
             setIsLoadingProduct(false);
             if(!authHeader) navigate(route.login);
             return;
         }
        try {
            const response = await axios.get(`${API_URL}/products/${productId}`, { headers: authHeader });
            const product = response.data;
            console.log("Product data fetched:", product);

            // Set basic form fields
            setProductName(product.name || '');
            setDescription(product.description || '');
            setPrice(product.price?.toString() || '');
            setSku(product.sku || '');
            setBarcode(product.barcode || '');
            setImageUrl(product.imageUrl || '');
            setOriginalImageUrl(product.imageUrl || ''); // Store the initial URL
            setIsActive(product.isActive !== undefined ? product.isActive : true);

            // Store the raw IDs received from the API
            const catId = product.category?._id || product.category || null; // Handle direct ID or populated object
            const brandId = product.brand?._id || product.brand || null;
            console.log(`Storing Raw IDs - Category: ${catId}, Brand: ${brandId}`);
            setProductCategoryId(catId);
            setProductBrandId(brandId);

        } catch (err) {
            console.error("Error fetching product data:", err);
            setError(err);
             if (err.response) {
                 if (err.response.status === 404) { toast.error("Product not found."); navigate(route.productlist); }
                 else if (err.response.status === 401) { toast.error("Session expired."); localStorage.removeItem('token'); navigate(route.login); }
                 else { toast.error("Failed to load product data."); }
            } else { toast.error("Network error loading product."); }
        } finally {
            setIsLoadingProduct(false);
        }
    }, [productId, API_URL, navigate, route.login, route.productlist]);


    // --- Effect to Fetch Initial Data Concurrently ---
    // This runs once when the component mounts
    useEffect(() => {
        fetchCategories();
        fetchBrands();
        fetchProductData();
    }, [fetchCategories, fetchBrands, fetchProductData]); // Depend on the memoized fetch functions


    // --- Effect to Set Selected Category *AFTER* data is loaded ---
    // This effect watches for changes in category data dependencies
    useEffect(() => {
        // Conditions to run: Categories AND Product have finished loading, AND we have a category ID from the product
        if (!isLoadingCategories && !isLoadingProduct && productCategoryId) {
            // Only proceed if selectedCategory state is still null (to avoid re-running unnecessarily)
            if (selectedCategory === null) {
                console.log(`Effect: Attempting to find category option for ID: ${productCategoryId}`);
                // Find the category option object that matches the stored productCategoryId
                const categoryOption = categories.find(c => c.value === productCategoryId);
                if (categoryOption) {
                    console.log("Effect: Found category option, setting state:", categoryOption);
                    setSelectedCategory(categoryOption); // Set the state with the {value, label} object
                } else {
                    // Log a warning if the ID exists but isn't in the loaded options
                    console.warn(`Effect: Category ID ${productCategoryId} exists but not found in loaded options (${categories.length} options). Maybe inactive or deleted?`);
                     // You could potentially display a message to the user here
                     // toast.warn("Product's category seems inactive or was deleted.");
                     // Set to null explicitly if you want to clear any previous potentially wrong value
                     // setSelectedCategory(null);
                }
            } else {
                 console.log("Effect: selectedCategory already set, skipping category find.");
            }
        } else {
             // Log why this effect isn't running yet
            // console.log(`Effect: Category set conditions not met - isLoadingCategories: ${isLoadingCategories}, isLoadingProduct: ${isLoadingProduct}, productCategoryId: ${productCategoryId}`);
        }
    // Dependencies ensure this runs when any of these values change.
    // Crucially includes `selectedCategory` to prevent re-running once successfully set.
    }, [isLoadingCategories, isLoadingProduct, productCategoryId, categories, selectedCategory]);

    // --- Effect to Set Selected Brand *AFTER* data is loaded ---
    // Similar logic to the category effect
    useEffect(() => {
        if (!isLoadingBrands && !isLoadingProduct && productBrandId) {
             if (selectedBrand === null) {
                console.log(`Effect: Attempting to find brand option for ID: ${productBrandId}`);
                const brandOption = brands.find(b => b.value === productBrandId);
                if (brandOption) {
                    console.log("Effect: Found brand option, setting state:", brandOption);
                    setSelectedBrand(brandOption);
                } else {
                    console.warn(`Effect: Brand ID ${productBrandId} exists but not found in loaded options (${brands.length} options).`);
                    // setSelectedBrand(null);
                }
             } else {
                 console.log("Effect: selectedBrand already set, skipping brand find.");
             }
        } else {
             // console.log(`Effect: Brand set conditions not met - isLoadingBrands: ${isLoadingBrands}, isLoadingProduct: ${isLoadingProduct}, productBrandId: ${productBrandId}`);
        }
    }, [isLoadingBrands, isLoadingProduct, productBrandId, brands, selectedBrand]);


    // --- Handlers ---
    const handleGenerateSku = () => { setSku(uuidv4().substring(0, 12).toUpperCase()); };
    const handleGenerateBarcode = () => { setBarcode(uuidv4()); };

    // Handle new image file selection
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Basic validation
            if (file.size > 5 * 1024 * 1024) { toast.error("Image file size max 5MB."); return; }
            if (!file.type.startsWith('image/')) { toast.error("Please select an image file."); return; }
            // Store the File object for upload
            setImageFile(file);
            // Generate a temporary URL for preview
            setImageUrl(URL.createObjectURL(file));
        }
    };

    // Handle removing the current/selected image
    const handleRemoveImage = () => {
        setImageUrl('');      // Clear the displayed URL (preview or original)
        setImageFile(null);   // Clear the staged file object
        // Reset the file input visually
        const fileInput = document.getElementById('product-image-upload');
        if (fileInput) fileInput.value = '';
        console.log("Image removed/cleared.");
    };

    // --- Form Submission Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const authHeader = getAuthHeader();
        if (!authHeader) { toast.error("Auth failed."); setIsSubmitting(false); navigate(route.login); return; }

        const parsedPrice = parseFloat(price);

        // --- Client-side Validation ---
        if (!productName || !price || !selectedCategory || !sku) {
            toast.error("Please fill all required fields (*)."); setIsSubmitting(false); return;
        }
         if (isNaN(parsedPrice) || parsedPrice <= 0) {
             toast.error("Selling Price must be a positive number."); setIsSubmitting(false); return;
         }

        let finalImageUrl = imageUrl; // Assume current URL state initially

        // --- Image Upload Logic (Only if a *new* file was staged) ---
        if (imageFile) {
            console.log("New image file detected, attempting upload...");
            const formData = new FormData();
            formData.append('productImage', imageFile); // Key must match backend expected key
            try {
                toast.info("Uploading new image...");
                const uploadRes = await axios.post(`${API_URL}/upload/product-image`, formData, {
                    headers: { ...authHeader, 'Content-Type': 'multipart/form-data' },
                });
                finalImageUrl = uploadRes.data.imageUrl; // Get the *new* permanent URL from backend response
                console.log("Image uploaded successfully, new URL:", finalImageUrl);
                toast.dismiss(); // Dismiss the 'uploading' toast
                toast.success("Image updated!");
                setImageFile(null); // Clear the file state after successful upload
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
                toast.error(uploadError.response?.data?.message || "Image upload failed.");
                setIsSubmitting(false); return; // Stop form submission on upload failure
            }
        } else if (imageUrl === '' && originalImageUrl !== '') {
            // Case: Image was explicitly removed by the user (preview cleared, no new file)
            console.log("Image was removed by user, setting finalImageUrl to empty.");
            finalImageUrl = ''; // Send empty string to backend to signify removal
        } else {
            // Case: No new file selected AND image wasn't removed OR there was never an image
            // Keep the original URL (or empty if it was always empty)
            console.log("No new image file or removal, using original image URL:", originalImageUrl);
            finalImageUrl = originalImageUrl;
        }

        // --- Prepare Updated Product Data Payload ---
        const productUpdateData = {
            name: productName.trim(),
            description: description.trim(),
            price: parsedPrice,
            sku: sku.trim(),
            barcode: barcode ? barcode.trim() : null, // Allow empty/null barcode
            category: selectedCategory.value, // Send the ID from the selected object
            brand: selectedBrand ? selectedBrand.value : null, // Send ID or null
            imageUrl: finalImageUrl, // Send the determined final URL (new, original, or empty)
            isActive: isActive,
            // NOTE: Do not send fields like _id, createdBy, createdAt, auditLog
        };
        console.log("Submitting update data:", productUpdateData);

        try {
            // --- Send PUT Request to Update Product ---
            const response = await axios.put(`${API_URL}/products/${productId}`, productUpdateData, { headers: authHeader });
            toast.success(`Product "${response.data.name}" updated successfully!`);
            navigate(route.productlist); // Redirect on success

        } catch (error) {
            console.error("Error updating product:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to update product.";
            if (errorMsg.includes("SKU already exists")) { toast.error("Update failed: SKU already exists."); }
            else if (errorMsg.includes("Barcode already exists")) { toast.error("Update failed: Barcode already exists."); }
            else { toast.error(`Update Failed: ${errorMsg}`); }
            if (error.response?.status === 401) { localStorage.removeItem('token'); navigate(route.login); }
            if (error.response?.status === 404) { toast.error("Update failed: Product not found."); navigate(route.productlist); }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Tooltip render function
    const renderCollapseTooltip = (props) => ( <Tooltip id="refresh-tooltip" {...props}> Collapse </Tooltip> );

    // --- Determine combined initial loading state ---
    const initialLoading = isLoadingProduct || isLoadingCategories || isLoadingBrands;

    // --- Render Logic ---
    return (
        <div className="page-wrapper">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

            <div className="content">
                {/* Page Header */}
                <div className="page-header">
                     <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Edit Product</h4>
                             {/* Show Loading state in subtitle */}
                            <h6>{initialLoading ? 'Loading product details...' : 'Update product details'}</h6>
                        </div>
                    </div>
                     <ul className="table-top-head">
                        <li> <div className="page-btn"> <Link to={route.productlist} className="btn btn-dark"> <ArrowLeft className="me-2" size={16}/> Back </Link> </div> </li>
                         {/* Optional Collapse Button */}
                         {data !== undefined && ( <li> <OverlayTrigger placement="top" overlay={renderCollapseTooltip}> <Link to="#" id="collapse-header" className={data ? "active" : ""} onClick={(e) => { e.preventDefault(); dispatch(setToogleHeader(!data)); }}> <ChevronUp /> </Link> </OverlayTrigger> </li> )}
                    </ul>
                </div>

                {/* Show main loading spinner ONLY during the combined initial load */}
                {initialLoading && (
                     <div className="text-center p-5"> <div className="spinner-border text-warning" role="status"> <span className="visually-hidden">Loading...</span> </div> </div>
                )}

                {/* Render form only when initial load is complete */}
                {!initialLoading && error && ( // Show error message if fetch failed
                    <div className="alert alert-danger">
                        Failed to load product data. Please <Link to={route.productlist}>go back</Link> and try again.
                        {/* Optionally show error details: <pre>{JSON.stringify(error, null, 2)}</pre> */}
                    </div>
                )}

                {!initialLoading && !error && ( // Render form only if loading is finished AND there was no critical error
                    <form onSubmit={handleSubmit}>
                        <div className="card">
                            <div className="card-body pb-0">

                                {/* Section 1: Product Information */}
                                <div className="mb-4 border-bottom pb-3">
                                    <h5 className="form-section-title d-flex align-items-center mb-3"> <Info className="me-2" size={20} /> Product Information </h5>
                                    <div className="row">
                                        {/* Row 1: Name & Price */}
                                        <div className="col-lg-6 mb-3"> <label htmlFor="productName" className="form-label">Name <span className="text-danger">*</span></label> <input type="text" id="productName" className="form-control" value={productName} onChange={(e) => setProductName(e.target.value)} required /> </div>
                                        <div className="col-lg-6 mb-3"> <label htmlFor="productPrice" className="form-label">Price <span className="text-danger">*</span></label> <input type="number" id="productPrice" step="0.01" min="0.01" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required /> </div>

                                        {/* Row 2: Category & Brand */}
                                        <div className="col-lg-6 mb-3">
                                            <label htmlFor="productCategory" className="form-label d-block">Category <span className="text-danger">*</span>
                                                <Link to="#" className="float-end text-primary small" data-bs-toggle="modal" data-bs-target="#add-units-category"> <PlusCircle className="me-1" size={14}/>Add New </Link>
                                            </label>
                                            <Select
                                                inputId="productCategory"
                                                styles={selectStyles}
                                                options={categories}
                                                value={selectedCategory} // Value is now correctly set by useEffect
                                                onChange={setSelectedCategory}
                                                placeholder={isLoadingCategories ? "Loading..." : "Choose Category..."} // Reflect loading state
                                                isClearable
                                                required
                                                isDisabled={isLoadingCategories} // Disable while loading options
                                                classNamePrefix="react-select"
                                                noOptionsMessage={() => isLoadingCategories ? 'Loading...' : 'No categories found'}
                                            />
                                            {/* Warning if product had an ID but it wasn't found in options */}
                                            {!isLoadingCategories && productCategoryId && !selectedCategory && <small className='text-warning d-block mt-1'>Could not find assigned category (ID: {productCategoryId}). It might be inactive.</small>}
                                        </div>
                                        <div className="col-lg-6 mb-3">
                                            <label htmlFor="productBrand" className="form-label d-block">Brand
                                                <Link to="#" className="float-end text-primary small" data-bs-toggle="modal" data-bs-target="#add-units-brand"> <PlusCircle className="me-1" size={14}/>Add New </Link>
                                            </label>
                                            <Select
                                                inputId="productBrand"
                                                styles={selectStyles}
                                                options={brands}
                                                value={selectedBrand} // Value is now correctly set by useEffect
                                                onChange={setSelectedBrand}
                                                placeholder={isLoadingBrands ? "Loading..." : "Choose Brand..."} // Reflect loading state
                                                isClearable
                                                isDisabled={isLoadingBrands} // Disable while loading options
                                                classNamePrefix="react-select"
                                                noOptionsMessage={() => isLoadingBrands ? 'Loading...' : 'No brands found'}
                                            />
                                            {!isLoadingBrands && productBrandId && !selectedBrand && <small className='text-warning d-block mt-1'>Could not find assigned brand (ID: {productBrandId}). It might be inactive.</small>}
                                        </div>

                                        {/* Row 3: SKU & Barcode */}
                                        <div className="col-lg-6 mb-3"> <label htmlFor="productSku" className="form-label">SKU <span className="text-danger">*</span></label> <div className="input-group"> <input type="text" id="productSku" className="form-control" value={sku} onChange={(e) => setSku(e.target.value)} required /> <button type="button" className="btn btn-warning text-dark fw-bold" onClick={handleGenerateSku}> Generate </button> </div> </div>
                                        <div className="col-lg-6 mb-3"> <label htmlFor="productBarcode" className="form-label">Barcode</label> <div className="input-group"> <input type="text" id="productBarcode" className="form-control" value={barcode} onChange={(e) => setBarcode(e.target.value)} /> <button type="button" className="btn btn-warning text-dark fw-bold" onClick={handleGenerateBarcode}> Generate </button> </div> </div>

                                        {/* Row 4: Description */}
                                        <div className="col-lg-12 mb-3"> <label htmlFor="productDescription" className="form-label">Description</label> <textarea id="productDescription" className="form-control" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /> </div>

                                        {/* Row 5: Product Status */}
                                        <div className="col-lg-6 mb-3"> <label className="form-label">Product Status</label> <div className="form-check form-switch"> <input className="form-check-input" type="checkbox" role="switch" id="productStatusSwitch" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> <label className="form-check-label" htmlFor="productStatusSwitch"> {isActive ? 'Active' : 'Inactive'} </label> </div> <small className="text-muted">Inactive products won't be available.</small> </div>
                                    </div>
                                </div>

                                {/* Section 2: Product Image */}
                                <div className="mb-4">
                                    <h5 className="form-section-title d-flex align-items-center mb-3"> <ImageIcon className="me-2" size={20}/> Product Image </h5>
                                    <div className="col-lg-12">
                                        {/* Upload Area */}
                                        <div className="image-upload-box text-center p-4 p-lg-5 border rounded" style={{ borderStyle: 'dashed !important', cursor: 'pointer', backgroundColor: '#f8f9fa' }} onClick={() => document.getElementById('product-image-upload')?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleImageChange({ target: e.dataTransfer }); }}>
                                            <input type="file" id="product-image-upload" accept="image/*" onChange={handleImageChange} className="d-none" />
                                            <ImageWithBasePath src="assets/img/icons/upload.svg" alt="upload" className="mb-2" style={{width: '50px', opacity: 0.7}}/>
                                            <p className="mb-0 text-muted small"> Drag & drop or click here to replace image </p>
                                        </div>
                                        {/* Preview Area */}
                                        {imageUrl && ( /* Show preview if imageUrl is not empty */
                                            <div className="mt-3">
                                                <p className="mb-1 small text-muted">Current Image Preview:</p>
                                                <div style={{ maxWidth: '150px', position: 'relative', display:'inline-block', border: '1px solid #dee2e6', padding: '5px', borderRadius: '4px' }}>
                                                    <img
                                                        src={imageUrl} // This will show original URL or blob preview URL
                                                        alt="Product Preview"
                                                        style={{ width: '100%', height: 'auto', display: 'block' }}
                                                        // Add fallback directly to img tag
                                                        onError={(e) => { e.target.onerror = null; e.target.src="/assets/img/placeholder-product.png"; }}
                                                    />
                                                    <button type="button" className="btn btn-sm btn-danger p-0" onClick={handleRemoveImage} style={{ position: 'absolute', top: '5px', right: '5px', width: '24px', height: '24px', lineHeight: '1', borderRadius: '50%' }} title="Remove Image"> <X size={16}/> </button>
                                                </div>
                                            </div>
                                        )}
                                        {!imageUrl && <p className="mt-2 text-muted small">No image uploaded.</p>}
                                    </div>
                                </div>
                            </div> {/* End card-body */}
                        </div> {/* End card */}

                        {/* Action Buttons Area */}
                        <div className="text-end mb-4 pt-2 me-2">
                            <button type="button" className="btn btn-secondary me-2" onClick={() => navigate(route.productlist)} disabled={isSubmitting}> Cancel </button>
                            <button type="submit" className="btn btn-warning text-dark fw-bold" disabled={isSubmitting || initialLoading}> {/* Disable if initially loading */}
                                {isSubmitting ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                 )} {/* End conditional rendering of form */}
            </div> {/* End content */}

            {/* Modals - Pass specific refresh function */}
            <AddCategory onSuccess={fetchCategories} />
            <AddBrand onSuccess={fetchBrands} />

        </div> /* End page-wrapper */
    );
};

export default EditProduct;
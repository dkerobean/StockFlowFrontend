import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom"; // Added useParams
import Select from "react-select";
// Removed DatePicker and dayjs as we removed the inventory section
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
    PlusCircle, X, ChevronUp // Removed Calendar, LifeBuoy
} from "feather-icons-react/build/IconComponents";
import { useDispatch, useSelector } from "react-redux";
import { setToogleHeader } from "../../core/redux/action";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import ImageWithBasePath from "../../core/img/imagewithbasebath";
import { all_routes } from "../../Router/all_routes";

// Helper function to get Authentication Token (Keep as is)
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token not found.");
        return null;
    }
    return { Authorization: `Bearer ${token}` };
};


const EditProduct = () => {
    const route = all_routes;
    const navigate = useNavigate();
    const { productId } = useParams(); // <-- Get productId from URL
    const dispatch = useDispatch();
    const data = useSelector((state) => state.toggle_header);
    const API_URL = process.env.REACT_APP_API_URL;

    // --- Form State ---
    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [sku, setSku] = useState('');
    const [barcode, setBarcode] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [imageUrl, setImageUrl] = useState(''); // Stores the *current* image URL (from DB or preview)
    const [originalImageUrl, setOriginalImageUrl] = useState(''); // Stores the initial image URL from DB
    const [imageFile, setImageFile] = useState(null); // For handling a *new* file upload
    const [isActive, setIsActive] = useState(true); // Add state for product status

    // --- Data for Select Dropdowns ---
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    // --- UI & Loading State ---
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false); // For dropdown data
    const [isLoadingProduct, setIsLoadingProduct] = useState(true); // For fetching the product
    const [isSubmitting, setIsSubmitting] = useState(false); // For form submission

// --- Fetch Dropdown Data (Categories, Brands) ---
    const fetchDropdownData = useCallback(async () => {
        console.log("[EditProduct] fetchDropdownData: Fetching Categories and Brands...");
        setIsLoadingDropdowns(true);
        const authHeader = getAuthHeader();
        if (!authHeader) { /* ... */ return; }

        let categoryOptions = [];
        let brandOptions = [];

        try {
            const [categoryRes, brandRes] = await Promise.all([
                axios.get(`${API_URL}/product-categories`, { headers: authHeader }),
                axios.get(`${API_URL}/brands`, { headers: authHeader })
            ]);

            console.log("[EditProduct] fetchDropdownData: Raw Product Categories:", categoryRes?.data);
            console.log("[EditProduct] fetchDropdownData: Raw Brands:", brandRes?.data);

            if (categoryRes?.data && Array.isArray(categoryRes.data)) {
                 categoryOptions = categoryRes.data.map(cat => ({ value: cat._id, label: cat.name }));
                 console.log("[EditProduct] fetchDropdownData: Mapped Product Category Options:", categoryOptions);
            } else { console.warn("[EditProduct] fetchDropdownData: Product category data invalid."); }

            if (brandRes?.data && Array.isArray(brandRes.data)) {
                brandOptions = brandRes.data.map(br => ({ value: br._id, label: br.name }));
                console.log("[EditProduct] fetchDropdownData: Mapped Brand Options:", brandOptions);
            } else { console.warn("[EditProduct] fetchDropdownData: Brand data invalid."); }

            setCategories(categoryOptions);
            setBrands(brandOptions);
            console.log("[EditProduct] fetchDropdownData: Updated dropdown state.");

        } catch (error) {
            console.error("[EditProduct] fetchDropdownData: Error:", error);
            toast.error("Failed to load categories/brands.");
            setCategories([]); setBrands([]); // Reset on error
             if (error.response?.status === 401) { /* ... */ }
        } finally {
            console.log("[EditProduct] fetchDropdownData: Finished. Setting isLoadingDropdowns=false.");
            setIsLoadingDropdowns(false);
        }
    }, [API_URL, navigate, route.login]);

    // --- Fetch Existing Product Data ---
    // Accepts fetched dropdown options to ensure correct matching
    const fetchProductData = useCallback(async (fetchedCategories, fetchedBrands) => {
        if (!productId) { return; }
        console.log(`[EditProduct] fetchProductData: Fetching product ID: ${productId}`);
        setIsLoadingProduct(true);
        const authHeader = getAuthHeader();
        if (!authHeader) { /* ... */ return; }

        try {
            const response = await axios.get(`${API_URL}/products/${productId}?populate=category,brand`, { headers: authHeader });
            const product = response.data;
            console.log("[EditProduct] fetchProductData: Received product data:", product);

            // ** Populate ALL Form State Fields **
            setProductName(product.name || '');
            setDescription(product.description || '');
            setPrice(product.price?.toString() || '');
            setSku(product.sku || '');
            setBarcode(product.barcode || '');
            setImageUrl(product.imageUrl || ''); // Use this for display logic
            setOriginalImageUrl(product.imageUrl || ''); // Keep track of the original
            setIsActive(product.isActive !== undefined ? product.isActive : true);
            console.log("[EditProduct] fetchProductData: Populated basic fields.");

            // --- Set Selected Dropdown Value ---
            console.log("[EditProduct] fetchProductData: Using fetched options for matching - Categories:", fetchedCategories, "Brands:", fetchedBrands);
            if (fetchedCategories?.length > 0 && product.category) {
                const categoryIdToFind = product.category._id || product.category;
                const categoryOption = fetchedCategories.find(c => c.value === categoryIdToFind);
                console.log(`[EditProduct] fetchProductData: Found Category Option for initial select:`, categoryOption);
                setSelectedCategory(categoryOption || null);
            } else { setSelectedCategory(null); }

            if (fetchedBrands?.length > 0 && product.brand) {
                 const brandIdToFind = product.brand._id || product.brand;
                const brandOption = fetchedBrands.find(b => b.value === brandIdToFind);
                console.log(`[EditProduct] fetchProductData: Found Brand Option for initial select:`, brandOption);
                setSelectedBrand(brandOption || null);
            } else { setSelectedBrand(null); }

        } catch (error) {
            console.error("[EditProduct] fetchProductData: Error:", error);
            toast.error("Failed to load product data.");
            // Reset form on product fetch error? Optional.
             if (error.response?.status === 401) { /* ... */ }
             if (error.response?.status === 404) { navigate(route.productlist); }
             // Reset dropdown selections if product fetch fails
             setSelectedCategory(null);
             setSelectedBrand(null);
        } finally {
            console.log("[EditProduct] fetchProductData: Finished. Setting isLoadingProduct=false.");
            setIsLoadingProduct(false);
        }
    }, [productId, API_URL, navigate, route.login, route.productlist]);


    // --- useEffect Hooks for Data Fetching ---
    useEffect(() => {
        // Fetch dropdowns first on component mount
        console.log("[EditProduct] useEffect 1: Calling fetchDropdownData.");
        fetchDropdownData();
    }, [fetchDropdownData]); // Depends only on the stable callback

    useEffect(() => {
        // Fetch product details only after dropdowns are loaded AND productId is available
        console.log(`[EditProduct] useEffect 2: Checking conditions - isLoadingDropdowns: ${isLoadingDropdowns}, productId: ${!!productId}`);
        if (!isLoadingDropdowns && productId) {
            console.log("[EditProduct] useEffect 2: Conditions met. Calling fetchProductData, passing current dropdown state.");
            // Pass the current state of categories/brands directly
            fetchProductData(categories, brands);
        } else {
            console.log("[EditProduct] useEffect 2: Skipping product data fetch.");
        }
    // Rerun if dropdown loading state changes, product ID changes,
    // or if the dropdown data arrays themselves change (to potentially re-match selection)
    }, [isLoadingDropdowns, productId, fetchProductData, categories, brands]);


    // --- Effect to Fetch Dropdowns ---
    useEffect(() => {
    // Only proceed if dropdowns are done loading and we have a productId
    if (!isLoadingDropdowns && productId) {
        console.log("Dependencies met, calling fetchProductData...");
        // We call fetchProductData which is stable due to useCallback,
        // unless its own dependencies (categories/brands) change.
        fetchProductData();
    } else {
        // Log why it's not fetching (useful for debugging)
        console.log(
            "Skipping fetchProductData call. Conditions:",
            { isLoadingDropdowns: !isLoadingDropdowns, productId: !!productId }
        );
    }

}, [productId, isLoadingDropdowns, fetchProductData]); // <-- CORRECTED DEPENDENCIES


    // --- Handlers ---

    const handleGenerateSku = () => {
        setSku(uuidv4().substring(0, 12).toUpperCase());
    };

    const handleGenerateBarcode = () => {
        setBarcode(uuidv4());
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
             if (file.size > 5 * 1024 * 1024) {
                 toast.error("Image file size should be less than 5MB.");
                 return;
            }
            if (!file.type.startsWith('image/')) {
                 toast.error("Please select a valid image file.");
                 return;
            }
            setImageFile(file); // Store the *new* file
            setImageUrl(URL.createObjectURL(file)); // Show *preview* of the new file
        }
    };

    const handleRemoveImage = () => {
        setImageUrl('');      // Clear preview / current URL
        setImageFile(null);   // Remove staged file
        // We don't reset originalImageUrl here. In handleSubmit,
        // we'll check if imageUrl is now empty and send accordingly.
        const fileInput = document.getElementById('product-image-upload');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // --- Form Submission Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            toast.error("Authentication failed. Please log in.");
            setIsSubmitting(false);
            navigate(route.login);
            return;
        }

        const parsedPrice = parseFloat(price);

        // --- Client-side Validation ---
        if (!productName || !price || !selectedCategory || !sku) {
            toast.error("Please fill all required fields (*).");
            setIsSubmitting(false);
            return;
        }
         if (isNaN(parsedPrice) || parsedPrice <= 0) {
             toast.error("Selling Price must be a positive number.");
             setIsSubmitting(false);
             return;
         }

        let finalImageUrl = imageUrl; // Start with the current URL in state (could be original or preview)

        // --- Image Upload Logic (Only if a *new* file was selected) ---
        if (imageFile) {
            const formData = new FormData();
            formData.append('productImage', imageFile); // Key matches backend middleware

            try {
                toast.info("Uploading new image...");
                const uploadRes = await axios.post(`${API_URL}/upload/product-image`, formData, {
                    headers: { ...authHeader, 'Content-Type': 'multipart/form-data' },
                });
                finalImageUrl = uploadRes.data.imageUrl; // Get the *new* permanent URL
                toast.dismiss();
                toast.success("Image updated successfully!");
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError.response ? uploadError.response.data : uploadError);
                toast.error(uploadError.response?.data?.message || "Image upload failed.");
                setIsSubmitting(false);
                return; // Stop submission
            }
        } else if (imageUrl === '' && originalImageUrl !== '') {
            // If the image was removed (imageUrl is empty, but there was an original one)
            // We set finalImageUrl to empty string to signal removal in the update.
            finalImageUrl = '';
        } else {
            // No new file, image wasn't removed, keep the original URL
            finalImageUrl = originalImageUrl;
        }


        // --- Prepare Updated Product Data ---
        const productUpdateData = {
            name: productName.trim(),
            description: description.trim(),
            price: parsedPrice,
            sku: sku.trim(),
            barcode: barcode ? barcode.trim() : null, // Allow clearing barcode
            category: selectedCategory.value, // Send ObjectId
            brand: selectedBrand ? selectedBrand.value : null, // Send ObjectId or null
            imageUrl: finalImageUrl, // Send the determined final URL (new, original, or empty)
            isActive: isActive, // Include status
            // Do NOT send: createdBy, createdAt, auditLog etc. Backend handles these.
        };

        try {
            // --- Send PUT Request to Update ---
            const response = await axios.put(`${API_URL}/products/${productId}`, productUpdateData, { headers: authHeader });
            toast.success(`Product "${response.data.name}" updated successfully!`);
           setTimeout(() => {
                console.log("[EditProduct] handleSubmit: Delay finished, navigating to product list.");
                navigate(route.productlist); // Redirect after the delay
            }, 1000);

        } catch (error) {
            console.error("Error updating product:", error.response ? error.response.data : error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to update product.";
            // Handle specific errors like duplicate SKU/Barcode
            if (errorMsg.includes("SKU already exists")) {
                 toast.error("Update failed: Another product with this SKU already exists.");
            } else if (errorMsg.includes("Barcode already exists")) {
                toast.error("Update failed: Another product with this Barcode already exists.");
            } else {
                 toast.error(`Update failed: ${errorMsg}`);
            }

             if (error.response && error.response.status === 401) {
                 toast.error("Authentication error. Please log in again.");
                 localStorage.removeItem('token');
                 navigate(route.login);
             }
             // Note: 404 might occur if product was deleted between loading and submitting
             if (error.response && error.response.status === 404) {
                toast.error("Update failed: Product not found. It might have been deleted.");
                navigate(route.productlist);
             }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Tooltip render function (keep if used)
    const renderCollapseTooltip = (props) => (
        <Tooltip id="refresh-tooltip" {...props}>
            Collapse
        </Tooltip>
    );

    // Custom styles for react-select (keep as is)
    const selectStyles = {
        control: (baseStyles, state) => ({ /* ... styles ... */ }),
        menu: base => ({ ...base, zIndex: 5 }),
    };


    // --- Render Logic ---

    if (isLoadingProduct) {
        return (
            <div className="page-wrapper">
                <div className="content">
                     <div className="page-header">
                        <div className="page-title">
                            <h4>Edit Product</h4>
                            <h6>Loading product details...</h6>
                        </div>
                    </div>
                    <div className="text-center p-5">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />

            <div className="content">
                {/* Page Header */}
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>Edit Product</h4>
                            <h6>Update product details</h6>
                        </div>
                    </div>
                    <ul className="table-top-head">
                        <li>
                            <div className="page-btn">
                                <Link to={route.productlist} className="btn btn-dark">
                                    <ArrowLeft className="me-2" size={16}/>
                                    Back to Product List
                                </Link>
                            </div>
                        </li>
                        {/* Optional Collapse Button */}
                        {data !== undefined && (
                           <li> {/* ... collapse button code ... */} </li>
                        )}
                    </ul>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="card">
                        <div className="card-body pb-0">

                            {/* Section 1: Product Information */}
                            <div className="mb-4 border-bottom pb-3">
                                <h5 className="form-section-title d-flex align-items-center mb-3">
                                    <Info className="me-2" size={20} /> Product Information
                                </h5>
                                <div className="row">
                                    {/* Row 1: Name & Price */}
                                    <div className="col-lg-6 mb-3">
                                        <label htmlFor="productName" className="form-label">Product Name <span className="text-danger">*</span></label>
                                        <input type="text" id="productName" className="form-control" value={productName} onChange={(e) => setProductName(e.target.value)} required />
                                    </div>
                                    <div className="col-lg-6 mb-3">
                                        <label htmlFor="productPrice" className="form-label">Selling Price <span className="text-danger">*</span></label>
                                        <input type="number" id="productPrice" step="0.01" min="0.01" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="e.g., 19.99" />
                                    </div>

                                    {/* Row 2: Category & Brand */}
                                     <div className="col-lg-6 mb-3">
                                        <label htmlFor="productCategory" className="form-label d-block">Category <span className="text-danger">*</span>
                                            <Link to="#" className="float-end text-primary small" data-bs-toggle="modal" data-bs-target="#add-units-category">
                                                <PlusCircle className="me-1" size={14}/>Add New
                                            </Link>
                                        </label>
                                        <Select
                                            inputId="productCategory"
                                            styles={selectStyles}
                                            options={categories}
                                            value={selectedCategory}
                                            onChange={setSelectedCategory}
                                            placeholder="Choose Category..."
                                            isClearable
                                            required
                                            isLoading={isLoadingDropdowns} // Use dropdown loading state
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                    <div className="col-lg-6 mb-3">
                                        <label htmlFor="productBrand" className="form-label d-block">Brand
                                             <Link to="#" className="float-end text-primary small" data-bs-toggle="modal" data-bs-target="#add-units-brand">
                                                <PlusCircle className="me-1" size={14}/>Add New
                                            </Link>
                                        </label>
                                        <Select
                                            inputId="productBrand"
                                            styles={selectStyles}
                                            options={brands}
                                            value={selectedBrand}
                                            onChange={setSelectedBrand}
                                            placeholder="Choose Brand (Optional)..."
                                            isClearable
                                            isLoading={isLoadingDropdowns} // Use dropdown loading state
                                            classNamePrefix="react-select"
                                        />
                                    </div>


                                    {/* Row 3: SKU & Barcode */}
                                    <div className="col-lg-6 mb-3">
                                        <label htmlFor="productSku" className="form-label">SKU <span className="text-danger">*</span></label>
                                        <div className="input-group">
                                            <input type="text" id="productSku" className="form-control" placeholder="Enter or Generate SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
                                            <button type="button" className="btn btn-warning text-dark fw-bold" onClick={handleGenerateSku}> Generate </button>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 mb-3">
                                        <label htmlFor="productBarcode" className="form-label">Barcode (Optional)</label>
                                        <div className="input-group">
                                            <input type="text" id="productBarcode" className="form-control" placeholder="Enter or Generate Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                                            <button type="button" className="btn btn-warning text-dark fw-bold" onClick={handleGenerateBarcode}> Generate </button>
                                        </div>
                                    </div>

                                    {/* Row 4: Description */}
                                    <div className="col-lg-12 mb-3">
                                        <label htmlFor="productDescription" className="form-label">Description</label>
                                        <textarea id="productDescription" className="form-control" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter product description..." />
                                    </div>

                                    {/* Row 5: Product Status */}
                                    <div className="col-lg-6 mb-3">
                                         <label className="form-label">Product Status</label>
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                id="productStatusSwitch"
                                                checked={isActive}
                                                onChange={(e) => setIsActive(e.target.checked)}
                                            />
                                            <label className="form-check-label" htmlFor="productStatusSwitch">
                                                {isActive ? 'Active' : 'Inactive'}
                                            </label>
                                        </div>
                                         <small className="text-muted">Inactive products won't be available for new transactions.</small>
                                    </div>
                                </div>
                            </div>

                            {/* REMOVED: Initial Stock Information Section */}

                            {/* Section 2: Product Image */}
            <div className="mb-4">
                <h5 className="form-section-title d-flex align-items-center mb-3">
                    <ImageIcon className="me-2" size={20}/> Product Image (Optional)
                </h5>
                <div className="col-lg-12">
                    {/* --- Image Upload Trigger Area --- */}
                    {/* This part allows selecting/dropping a NEW image to REPLACE the current one */}
                    <div
                        className="image-upload-box text-center p-4 p-lg-5 border rounded mb-3" // Added margin-bottom for spacing
                        style={{ borderStyle: 'dashed !important', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                        onClick={() => document.getElementById('product-image-upload')?.click()} // Triggers hidden input
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handleImageChange({ target: e.dataTransfer }); }} // Handles drop
                    >
                        <input
                            type="file"
                            id="product-image-upload"
                            accept="image/*"
                            onChange={handleImageChange} // Updates imageFile and imageUrl (for preview)
                            className="d-none" // Hide the standard file input
                        />
                        {/* Upload Icon and Text */}
                        <ImageWithBasePath src="assets/img/icons/upload.svg" alt="upload" className="mb-2" style={{width: '50px', opacity: 0.7}}/>
                        <p className="mb-0 text-muted small">
                            Drag and drop a file to upload <br/> or click here to replace the current image
                        </p>
                    </div>

                    {/* --- Image Display/Preview Area --- */}
                    {/* This section shows the CURRENT image: either the one fetched from DB */}
                    {/* OR the preview of a NEWLY selected file. It uses the imageUrl state. */}
                    {/* --- Image Display/Preview Area --- */}
            {imageUrl && (
                <div className="mt-3">
                    <p className="mb-1 small text-muted">Current Image:</p>
                    <div style={{ maxWidth: '150px', position: 'relative', display:'inline-block', border: '1px solid #dee2e6', padding: '5px', borderRadius: '4px' }}>
                        <img
                            // --- MODIFIED SRC LOGIC ---
                            src={
                                imageUrl // Check if imageUrl exists
                                ? (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('blob:'))
                                    ? imageUrl // It's already an absolute URL (http/https) or a temporary Blob URL (preview) - use directly
                                    : `${process.env.REACT_APP_FILE_BASE_URL}${imageUrl}` // It's relative (starts with /), prepend API Base URL
                                : '' // If imageUrl is null/empty, use empty string
                            }
                            // --- END MODIFIED SRC LOGIC ---
                            alt="Product Preview"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            onError={(e) => {
                                // Construct the full URL again for accurate error logging
                                const finalSrc = imageUrl
                                    ? (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('blob:'))
                                        ? imageUrl
                                        : `${process.env.REACT_APP_FILE_BASE_URL}${imageUrl}`
                                    : '';
                                console.error(`[EditProduct] Render: Failed to load image from calculated src: ${finalSrc}`);
                                e.target.onerror = null;
                                e.target.alt = "Failed to load image";
                                // Optionally hide: e.target.style.display = 'none';
                            }}
                        />
                        {/* Remove Button */}
                        <button
                            type="button"
                            className="btn btn-sm btn-danger p-0"
                            onClick={handleRemoveImage}
                            style={{ position: 'absolute', top: '5px', right: '5px', width: '24px', height: '24px', lineHeight: '1', borderRadius: '50%' }}
                            title="Remove Image"
                            aria-label="Remove Image"
                        >
                            <X size={16}/>
                        </button>
                    </div>
                </div>
            )}
            {!imageUrl && (
                <p className="mt-2 text-muted small">No image is currently set for this product.</p>
            )}
                </div>
            </div>
            {/* End Section 2: Product Image */}

                        </div> {/* End card-body */}
                    </div> {/* End card */}

                    {/* Action Buttons Area */}
                    <div className="text-end mb-4 pt-2 me-2">
                        <button
                            type="button"
                            className="btn btn-secondary me-2"
                            onClick={() => navigate(route.productlist)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-warning text-dark fw-bold" // Keep style consistent
                            disabled={isSubmitting || isLoadingProduct || isLoadingDropdowns} // Disable during loads/submit
                        >
                            {isSubmitting ? (
                                <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Saving...</>
                            ) : (
                                'Save Changes' // Update button text
                            )}
                        </button>
                    </div>
                </form>

            </div> {/* End content */}

            {/* --- Modals --- */}
            {/* Keep modals, pass fetchDropdownData for refresh */}
            <AddCategory onSuccess={fetchDropdownData} />
            <AddBrand onSuccess={fetchDropdownData} />

        </div> /* End page-wrapper */
    );
};

export default EditProduct;
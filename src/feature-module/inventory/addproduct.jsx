import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import { DatePicker } from "antd";
import dayjs from 'dayjs'; // Import dayjs for DatePicker
import axios from 'axios'; // For making API calls
import { v4 as uuidv4 } from 'uuid'; // For generating SKU/Barcode
import { toast, ToastContainer } from 'react-toastify'; // For notifications
import 'react-toastify/dist/ReactToastify.css'; // Toast styles

// Import Modals (ensure these paths are correct)
import AddCategory from "../../core/modals/inventory/addcategory";
import AddBrand from "../../core/modals/addbrand";

// Import Icons
import {
    ArrowLeft, Calendar, ChevronUp, Info, LifeBuoy, Image as ImageIcon,
    PlusCircle, X
} from "feather-icons-react/build/IconComponents";
import { useDispatch, useSelector } from "react-redux"; // Keep if used for header toggle
import { setToogleHeader } from "../../core/redux/action"; // Keep if used
import { OverlayTrigger, Tooltip } from "react-bootstrap"; // Keep if used for collapse tooltip
import ImageWithBasePath from "../../core/img/imagewithbasebath"; // Your image component
import { all_routes } from "../../Router/all_routes"; // Your routes definition

// Helper function to get Authentication Token
const getAuthHeader = () => {
    const token = localStorage.getItem('token'); // Adjust if your token key is different
    if (!token) {
        console.error("Authentication token not found.");
        // Redirect to login or handle appropriately
        return null;
    }
    return { Authorization: `Bearer ${token}` };
};


const AddProduct = () => {
    const route = all_routes;
    const navigate = useNavigate();
    const dispatch = useDispatch(); // Keep if redux toggle is used
    const data = useSelector((state) => state.toggle_header); // Keep if redux toggle is used
    const API_URL = process.env.REACT_APP_API_URL; // Get API URL from .env

    // --- Form State ---
    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [sku, setSku] = useState('');
    const [barcode, setBarcode] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null); // Brand is optional based on model
    const [imageUrl, setImageUrl] = useState(''); // For storing the preview or final URL
    const [imageFile, setImageFile] = useState(null); // For handling the actual file upload

    // --- Initial Inventory State ---
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [initialQuantity, setInitialQuantity] = useState(''); // Keep as string for input field compatibility
    const [expiryDate, setExpiryDate] = useState(null); // For Inventory
    const [minStock, setMinStock] = useState('5'); // Keep as string for input field default
    const [notifyAt, setNotifyAt] = useState('5'); // Keep as string for input field default

    // --- Data for Select Dropdowns ---
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [locations, setLocations] = useState([]); // Stores/Warehouses

    // --- UI & Loading State ---
    const [isLoading, setIsLoading] = useState(false); // For fetching initial data
    const [isSubmitting, setIsSubmitting] = useState(false); // For form submission

    // --- Fetch Initial Data (Categories, Brands, Locations) ---
    const fetchData = async () => {
        console.log("Refreshing dropdown data..."); // Log for debugging refresh calls
        setIsLoading(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
             toast.error("Authentication required. Please log in.");
             setIsLoading(false);
             navigate(route.login); // Redirect to login if no token
             return;
        }

        try {
            // Use Promise.all for concurrent fetching
            const [categoryRes, brandRes, locationRes] = await Promise.all([
                axios.get(`${API_URL}/categories`, { headers: authHeader }),
                axios.get(`${API_URL}/brands`, { headers: authHeader }),
                axios.get(`${API_URL}/locations`, { headers: authHeader }) // Assuming /api/locations endpoint exists
            ]);

            // Format data for react-select: { value: _id, label: name }
            setCategories(categoryRes.data.map(cat => ({ value: cat._id, label: cat.name })));
            setBrands(brandRes.data.map(br => ({ value: br._id, label: br.name })));
            setLocations(locationRes.data.map(loc => ({ value: loc._id, label: `${loc.name} (${loc.type})` }))); // Include type in label for clarity

        } catch (error) {
            console.error("Error fetching initial data:", error);
            toast.error("Failed to load necessary data. Please refresh the page or try again.");
            // Handle specific errors (e.g., 401 Unauthorized) if needed
             if (error.response && error.response.status === 401) {
                 toast.error("Session expired. Please log in again.");
                 localStorage.removeItem('token'); // Clear invalid token
                 navigate(route.login);
             }
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data when the component mounts
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once on mount

    // --- Handlers ---

    const handleGenerateSku = () => {
        setSku(uuidv4().substring(0, 12).toUpperCase()); // Example: Generate a shorter UUID
    };

    const handleGenerateBarcode = () => {
        // You might want a different format or source for barcodes
        setBarcode(uuidv4());
    };

    // Handle file selection for image upload
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Basic validation (optional)
            if (file.size > 5 * 1024 * 1024) { // e.g., limit to 5MB
                 toast.error("Image file size should be less than 5MB.");
                 return;
            }
            if (!file.type.startsWith('image/')) {
                 toast.error("Please select a valid image file.");
                 return;
            }
            setImageFile(file); // Store the file object for potential upload
            setImageUrl(URL.createObjectURL(file)); // Show preview using temporary URL
            // ** Reminder: Actual upload logic needs to be implemented in handleSubmit **
        }
    };

    // Remove the selected image preview
    const handleRemoveImage = () => {
        setImageUrl('');
        setImageFile(null);
        // Reset the file input visually
         const fileInput = document.getElementById('product-image-upload');
         if (fileInput) {
             fileInput.value = '';
         }
    };

    // Handle date change from Ant Design DatePicker
    const handleDateChange = (date) => {
        // Store as ISO string (UTC) or null if cleared
        setExpiryDate(date ? date.toISOString() : null);
    };

    // --- Form Submission Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form submission
        setIsSubmitting(true);
        const authHeader = getAuthHeader();
        if (!authHeader) {
            toast.error("Authentication failed. Please log in.");
            setIsSubmitting(false);
            navigate(route.login);
            return;
        }

        // --- Parse numeric fields for validation & submission ---
        const parsedPrice = parseFloat(price);
        const parsedQuantity = parseInt(initialQuantity); // Allow 0
        const parsedMinStock = parseInt(minStock) >= 0 ? parseInt(minStock) : 0; // Default to 0 if invalid/negative
        const parsedNotifyAt = parseInt(notifyAt) >= 0 ? parseInt(notifyAt) : parsedMinStock; // Default to parsedMinStock if invalid/negative

        // --- Client-side Validation ---
        if (!productName || !price || !selectedCategory || !sku || !selectedLocation || initialQuantity === '') {
            toast.error("Please fill all required fields (*).");
            setIsSubmitting(false);
            return;
        }
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
             toast.error("Selling Price must be a positive number.");
             setIsSubmitting(false);
             return;
        }
        if (isNaN(parsedQuantity) || parsedQuantity < 0) {
             toast.error("Initial Quantity must be a non-negative number (0 or more).");
             setIsSubmitting(false);
             return;
        }
        // Note: MinStock and NotifyAt validation already handled during parsing.

        // --- !!! Placeholder for Actual Image Upload Logic !!! ---
        // You would typically upload the `imageFile` here to your backend or cloud storage
        // and get back the permanent `finalImageUrl`.
        let finalImageUrl = imageUrl; // Use preview URL for now if no upload logic exists
        // if (imageFile) {
        //    try {
        //        // const uploadedImageUrl = await uploadImageFunction(imageFile, authHeader);
        //        // finalImageUrl = uploadedImageUrl;
        //        toast.info("Simulating image upload..."); // Placeholder message
        //    } catch (uploadError) {
        //        console.error("Image upload failed:", uploadError);
        //        toast.error("Image upload failed. Product not saved.");
        //        setIsSubmitting(false);
        //        return; // Stop submission if upload fails
        //    }
        // }
        // --- End Placeholder ---


        // --- Prepare Product Data Payload ---
        const productData = {
            name: productName.trim(),
            description: description.trim(),
            price: parsedPrice, // Use parsed numeric value
            sku: sku.trim(),
            barcode: barcode ? barcode.trim() : null, // Send null if empty, backend allows sparse
            category: selectedCategory.value, // Send ObjectId (_id)
            brand: selectedBrand ? selectedBrand.value : null, // Send ObjectId or null
            imageUrl: finalImageUrl || '', // Use the final uploaded URL or empty string
            // `createdBy` will be set by the backend using the authenticated user from the token
        };

        try {
            // --- Step 1: Create the Product Definition ---
            const productResponse = await axios.post(`${API_URL}/products`, productData, { headers: authHeader });
            const createdProduct = productResponse.data;
            toast.success(`Product "${createdProduct.name}" created successfully!`);

            // --- Step 2: Create Initial Inventory Record (if location selected) ---
            // Create inventory record even if quantity is 0, to establish the product at that location
            if (selectedLocation && parsedQuantity >= 0) {
                const inventoryData = {
                    product: createdProduct._id,       // Link to the newly created product's ID
                    location: selectedLocation.value, // Link to the selected location's ID
                    quantity: parsedQuantity,          // Use parsed numeric value (can be 0)
                    expiryDate: expiryDate || null,      // Optional: Use ISO string or null
                    minStock: parsedMinStock,          // Use parsed numeric value
                    notifyAt: parsedNotifyAt,          // Use parsed numeric value
                    // Add audit log info on the backend if needed for 'initial_stock'
                };

                try {
                    await axios.post(`${API_URL}/inventory`, inventoryData, { headers: authHeader });
                    if (parsedQuantity > 0) {
                         toast.info(`Added ${inventoryData.quantity} units to ${selectedLocation.label}.`);
                    } else {
                        toast.info(`Inventory record created with 0 stock at ${selectedLocation.label}.`);
                    }
                } catch (inventoryError) {
                    console.error("Error creating initial inventory record:", inventoryError.response ? inventoryError.response.data : inventoryError);
                    // Product was created, but inventory failed. Inform user.
                    toast.warn(`Product created, but failed to add initial stock. Please add stock manually via Inventory Management. Error: ${inventoryError.response?.data?.message || inventoryError.message}`);
                }
            }

            // --- Success: Navigate to Product List ---
            navigate(route.productlist); // Redirect after successful creation

        } catch (error) {
            console.error("Error during product creation process:", error.response ? error.response.data : error);
            toast.error(`Failed to create product: ${error.response?.data?.message || error.message}`);
            // Handle specific errors like duplicate SKU/Barcode if the backend sends distinct messages
             if (error.response && error.response.status === 401) {
                 toast.error("Authentication error. Please log in again.");
                 localStorage.removeItem('token');
                 navigate(route.login);
             }
        } finally {
            setIsSubmitting(false); // Re-enable the submit button
        }
    };

    // Tooltip render function (keep if used for collapse button)
    const renderCollapseTooltip = (props) => (
        <Tooltip id="refresh-tooltip" {...props}>
            Collapse
        </Tooltip>
    );

    // Custom styles for react-select to better match Bootstrap form controls
    const selectStyles = {
        control: (baseStyles, state) => ({
            ...baseStyles,
            minHeight: 'calc(1.5em + 0.75rem + 2px)', // Match Bootstrap default input height
            borderColor: state.isFocused ? '#86b7fe' : '#ced4da', // Match Bootstrap focus/default border color
            boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none', // Match Bootstrap focus shadow
            '&:hover': {
                borderColor: state.isFocused ? '#86b7fe' : '#adb5bd', // Slightly darker border on hover (non-focus)
            },
        }),
        // You can add more style overrides if needed (e.g., menu, option)
        menu: base => ({ ...base, zIndex: 5 }), // Ensure dropdown appears above other elements if needed
    };


    return (
        <div className="page-wrapper">
            {/* Toast Container for Notifications */}
            <ToastContainer
                position="top-right"
                autoClose={3000} // Toasts auto-close after 3 seconds
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            <div className="content">
                {/* Page Header */}
                <div className="page-header">
                    <div className="add-item d-flex">
                        <div className="page-title">
                            <h4>New Product</h4>
                            <h6>Create new product</h6>
                        </div>
                    </div>
                    {/* Top Buttons */}
                    <ul className="table-top-head">
                        <li>
                            <div className="page-btn">
                                {/* Back Button */}
                                <Link to={route.productlist} className="btn btn-dark">
                                    <ArrowLeft className="me-2" size={16}/>
                                    Back to Product List
                                </Link>
                            </div>
                        </li>
                        {/* Optional Collapse Button (using Redux state) */}
                        {data !== undefined && ( // Conditionally render if redux state exists
                            <li>
                                <OverlayTrigger placement="top" overlay={renderCollapseTooltip}>
                                    <Link
                                        to="#"
                                        data-bs-toggle="tooltip"
                                        data-bs-placement="top"
                                        title="Collapse"
                                        id="collapse-header"
                                        className={data ? "active" : ""}
                                        onClick={(e) => { e.preventDefault(); dispatch(setToogleHeader(!data)); }}
                                    >
                                        <ChevronUp />
                                    </Link>
                                </OverlayTrigger>
                            </li>
                        )}
                    </ul>
                </div>

                {/* Loading Indicator */}
                {isLoading && <div className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}

                {/* Form - Render only when not loading initial data */}
                {!isLoading && (
                    <form onSubmit={handleSubmit}>
                        <div className="card">
                            <div className="card-body pb-0"> {/* Removed add-product class here */}

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
                                                {/* Trigger for Add Category Modal */}
                                                <Link
                                                    to="#"
                                                    className="float-end text-primary small" // Styled link
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#add-units-category" // Matches Modal ID
                                                >
                                                    <PlusCircle className="me-1" size={14}/>Add New
                                                </Link>
                                            </label>
                                            <Select
                                                inputId="productCategory"
                                                styles={selectStyles} // Apply custom styles for Bootstrap look
                                                options={categories}
                                                value={selectedCategory}
                                                onChange={setSelectedCategory}
                                                placeholder="Choose Category..."
                                                isClearable
                                                required
                                                isLoading={isLoading} // Show loading state if refetching
                                                classNamePrefix="react-select" // Useful for specific CSS targeting
                                            />
                                        </div>
                                        <div className="col-lg-6 mb-3">
                                            <label htmlFor="productBrand" className="form-label d-block">Brand
                                                {/* Trigger for Add Brand Modal */}
                                                <Link
                                                    to="#"
                                                    className="float-end text-primary small" // Styled link
                                                    data-bs-toggle="modal"
                                                    data-bs-target="#add-units-brand" // Matches Modal ID
                                                >
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
                                                isLoading={isLoading}
                                                classNamePrefix="react-select"
                                            />
                                        </div>

                                        {/* Row 3: SKU & Barcode */}
                                        <div className="col-lg-6 mb-3">
                                            <label htmlFor="productSku" className="form-label">SKU <span className="text-danger">*</span></label>
                                            <div className="input-group">
                                                <input type="text" id="productSku" className="form-control" placeholder="Enter or Generate SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
                                                {/* Generate Button - styled like screenshot */}
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
                                    </div>
                                </div>

                                {/* Section 2: Initial Stock Information */}
                                <div className="mb-4 border-bottom pb-3">
                                    <h5 className="form-section-title d-flex align-items-center mb-3">
                                        <LifeBuoy className="me-2" size={20} /> Initial Stock Information
                                    </h5>
                                    <div className="row">
                                        {/* Row 1: Location, Quantity, Expiry */}
                                        <div className="col-lg-4 mb-3">
                                            <label htmlFor="stockLocation" className="form-label">Add Initial Stock To <span className="text-danger">*</span></label>
                                            <Select
                                                inputId="stockLocation"
                                                styles={selectStyles}
                                                options={locations}
                                                value={selectedLocation}
                                                onChange={setSelectedLocation}
                                                placeholder="Choose Location..."
                                                isClearable
                                                required
                                                isLoading={isLoading}
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                        <div className="col-lg-4 mb-3">
                                            <label htmlFor="initialQuantity" className="form-label">Initial Quantity <span className="text-danger">*</span></label>
                                            <input type="number" id="initialQuantity" className="form-control" min="0" step="1" value={initialQuantity} onChange={(e) => setInitialQuantity(e.target.value)} required placeholder="e.g., 10" />
                                        </div>
                                        <div className="col-lg-4 mb-3">
                                            <label htmlFor="expiryDate" className="form-label">Expiry Date (Optional)</label>
                                            <div className="input-group"> {/* Use input-group for consistent styling */}
                                                <span className="input-group-text"><Calendar size={16} /></span>
                                                <DatePicker
                                                    id="expiryDate"
                                                    value={expiryDate ? dayjs(expiryDate) : null} // Use dayjs object for value
                                                    onChange={handleDateChange} // Correct handler
                                                    className="form-control" // Use form-control class
                                                    format="DD-MM-YYYY" // Display format
                                                    placeholder="Choose Expiry Date"
                                                    allowClear // Allow clearing the date
                                                    style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} // Fix border radius next to icon
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2: Min Stock & Notify Threshold */}
                                        <div className="col-lg-6 mb-3">
                                            <label htmlFor="minStock" className="form-label">Minimum Stock Alert</label>
                                            <input type="number" id="minStock" className="form-control" min="0" step="1" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="e.g., 5" />
                                        </div>
                                        <div className="col-lg-6 mb-3">
                                            <label htmlFor="notifyAt" className="form-label">Notification Threshold</label>
                                            <input type="number" id="notifyAt" className="form-control" min="0" step="1" value={notifyAt} onChange={(e) => setNotifyAt(e.target.value)} placeholder="Default: Min Stock" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Product Image */}
                                <div className="mb-4">
                                    <h5 className="form-section-title d-flex align-items-center mb-3">
                                        <ImageIcon className="me-2" size={20}/> Product Image (Optional)
                                    </h5>
                                    <div className="col-lg-12">
                                        {/* Styled Dropzone Area */}
                                        <div
                                            className="image-upload-box text-center p-4 p-lg-5 border rounded"
                                            style={{ borderStyle: 'dashed !important', cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                                            onClick={() => document.getElementById('product-image-upload')?.click()} // Trigger hidden file input
                                            onDragOver={(e) => e.preventDefault()} // Necessary for drop events
                                            onDrop={(e) => { e.preventDefault(); handleImageChange({ target: e.dataTransfer }); }} // Handle drop event
                                        >
                                            <input
                                                type="file"
                                                id="product-image-upload"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="d-none" // Hide the actual input
                                            />
                                            {/* Use your image component or a simple img tag */}
                                            <ImageWithBasePath src="assets/img/icons/upload.svg" alt="upload" className="mb-2" style={{width: '50px', opacity: 0.7}}/>
                                            <p className="mb-0 text-muted small">
                                                Drag and drop a file to upload <br/> or click here
                                            </p>
                                        </div>
                                        {/* Image Preview Area */}
                                        {imageUrl && (
                                            <div className="mt-3">
                                                <p className="mb-1 small text-muted">Preview:</p>
                                                <div style={{ maxWidth: '150px', position: 'relative', display:'inline-block', border: '1px solid #dee2e6', padding: '5px', borderRadius: '4px' }}>
                                                    <img src={imageUrl} alt="Product Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                                    {/* Remove Button */}
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-danger p-0" // Use Bootstrap button classes
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
                                    </div>
                                </div>

                            </div> {/* End card-body */}
                        </div> {/* End card */}

                        {/* Action Buttons Area */}
                        <div className="text-end mb-4 pt-2 me-2"> {/* Align buttons right, add padding top */}
                            {/* Cancel Button */}
                            <button
                                type="button"
                                className="btn btn-secondary me-2" // Standard secondary button
                                onClick={() => navigate(route.productlist)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn btn-warning text-dark fw-bold" // Match screenshot style
                                disabled={isSubmitting || isLoading} // Disable when submitting or loading initial data
                            >
                                {isSubmitting ? ( // Show loading indicator on submit
                                    <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Saving...</>
                                ) : (
                                    'Save Product'
                                )}
                            </button>
                        </div>
                    </form>
                )} {/* End !isLoading conditional rendering */}
            </div> {/* End content */}

            {/* --- Modals --- */}
            {/* Render modals directly. They are controlled by Bootstrap data attributes */}
            {/* Pass the fetchData function so modals can trigger a refresh on success */}
            <AddCategory onSuccess={fetchData} />
            <AddBrand onSuccess={fetchData} />

        </div> /* End page-wrapper */
    );
};

export default AddProduct;
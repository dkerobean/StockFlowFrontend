import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import { OverlayTrigger, Tooltip, Modal, Button, Form } from 'react-bootstrap'; // Assuming Form is needed for modals
import Image from '../../core/img/image';
import {
  ShoppingCart,
  RefreshCcw as RefreshIcon, // Assuming RefreshIcon should be RefreshCcw
  UserPlus,
  Search,
  MinusCircle,
  PlusCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Edit, // Added Edit icon based on commented out code
  Pause, // Added Pause icon based on data-feather attribute
  CreditCard, // Added CreditCard icon based on data-feather attribute
  Smartphone, // Added Smartphone icon
  Grid, // Added Grid icon for All Categories
  CheckSquare // Added CheckSquare for product selection
} from 'feather-icons-react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import withReactContent from 'sweetalert2-react-content';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } // For potential Redux usage if needed later
from 'react-redux';
// import { setToogleHeader } from '../../core/redux/action'; // If you use this for header collapse

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Pos = () => {
  // const dispatch = useDispatch();
  // const isHeaderCollapsed = useSelector((state) => state.toggle_header); // If using Redux for header

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null); // Stores the selected location OBJECT
  const [products, setProducts] = useState([]); // Products available at selectedLocation
  const [filteredProducts, setFilteredProducts] = useState([]); // For search/category filter
  const [categories, setCategories] = useState([]); // RE-ADD categories state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductsForCart, setSelectedProductsForCart] = useState(new Set()); // New state for selected products

  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: 'Walk-in Customer', contact: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0); // Assuming tax is a percentage
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Recent Sales State
  const [recentSales, setRecentSales] = useState([]);

  // Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false); // Added
  const [showEditProductModal, setShowEditProductModal] = useState(false); // Added
  const [productToEditInCart, setProductToEditInCart] = useState(null); // Added
  const [showHoldOrderModal, setShowHoldOrderModal] = useState(false); // Added
  const [showRecentTransactionsModal, setShowRecentTransactionsModal] = useState(false); // Added
  const [showViewOrdersModal, setShowViewOrdersModal] = useState(false); // Added
  const [showPrintReceiptModal, setShowPrintReceiptModal] = useState(false); // Added

  const productSliderRef = useRef(null);
  const categorySliderRef = useRef(null);

  // Fetch locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/locations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Fix: Extract locations array from response object
        const locationsArray = response.data?.locations || [];
        setLocations(locationsArray);
        if (locationsArray && locationsArray.length > 0) {
          // Auto-select the first active location or a default one
          const firstActiveLocation = locationsArray.find(loc => loc.isActive);
          setSelectedLocation(firstActiveLocation || locationsArray[0]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Failed to load locations.");
        // Ensure locations is always an array even on error
        setLocations([]);
      }
    };
    fetchLocations();
  }, []);

  // Fetch products and categories when selectedLocation changes
  useEffect(() => {
    if (selectedLocation && selectedLocation._id) {
      const fetchProductsAndCategories = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const productsResponse = await axios.get(`${API_BASE_URL}/products?locationId=${selectedLocation._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const activeProducts = (productsResponse.data || []).filter(p => p.isActive);
          setProducts(activeProducts);
          setFilteredProducts(activeProducts);

          // Fetch product categories again for the slider
          const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const uniqueCategories = [];
          const categoryNames = new Set();
          activeProducts.forEach(p => {
            if (p.category && p.category.name && !categoryNames.has(p.category.name)) {
              categoryNames.add(p.category.name);
              uniqueCategories.push({ _id: p.category._id || p.category.name, name: p.category.name });
            } else if (typeof p.category === 'string' && !categoryNames.has(p.category)) {
               categoryNames.add(p.category);
               uniqueCategories.push({ _id: p.category, name: p.category });
            }
          });
          // Use unique categories from products first, then fallback to general categories API if needed and available
          setCategories(uniqueCategories.length > 0 ? uniqueCategories : (categoriesResponse.data.categories || categoriesResponse.data || []));

        } catch (error) {
          console.error("Error fetching products/categories:", error);
          toast.error("Failed to load products or categories for the selected location.");
          setProducts([]);
          setFilteredProducts([]);
          setCategories([]);
        } finally {
          setLoading(false);
        }
      };
      fetchProductsAndCategories();
    } else {
      setProducts([]);
      setFilteredProducts([]);
      setCategories([]);
    }
  }, [selectedLocation]);

  // Filter products based on searchTerm and selectedCategory
  useEffect(() => {
    let tempProducts = [...products];
    if (selectedCategory && selectedCategory !== 'all') { // Re-enable category filtering logic
      tempProducts = tempProducts.filter(p => (p.category?.name || p.category) === selectedCategory);
    }
    if (searchTerm) {
      tempProducts = tempProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredProducts(tempProducts);
  }, [searchTerm, products, selectedCategory]);


  const handleLocationChange = (selectedOption) => {
    const locationObj = locations.find(loc => loc._id === selectedOption.value);
    setSelectedLocation(locationObj);
    setCart([]); // Clear cart when location changes
  };

  const handleOpenEditProductModal = (cartItem) => {
    setProductToEditInCart(cartItem);
    setShowEditProductModal(true);
  };

  // Define the missing function
  const handleEditProductInCartSubmit = (e) => {
    e.preventDefault();
    // Logic to update product in cart (e.g., price, unit, specific discount)
    // This is a placeholder. You would typically get data from a form in this modal
    // and then update the cart state.
    // For example: updateCartItemDetails(productToEditInCart.product._id, updatedDetails);
    toast.info('Update item in cart - TBD');
    setShowEditProductModal(false);
    setProductToEditInCart(null);
  };

  const handleProductSelection = (product) => {
    setSelectedProductsForCart((prevSelected) => {
      const isSelected = prevSelected.has(product._id);
      const updatedSelected = new Set(prevSelected);

      if (isSelected) {
        updatedSelected.delete(product._id);
        // When deselecting from the multi-select list, we don't alter the cart here.
        // The item remains in the cart if it was there.
      } else {
        updatedSelected.add(product._id);
        // Product is being added to the multi-selection list.
        // Now, let's interact with the cart.
        setCart((prevCart) => {
          const existingProductInCart = prevCart.find((item) => item.product._id === product._id);
          if (existingProductInCart) {
            // Product is already in the cart.
            // We don't increment its quantity here to prevent the jump from 1 to 2
            // if it was added via another method (like 'Add Selected to Cart')
            // and is now being re-selected into the multi-select list.
            return prevCart; // Cart quantity remains unchanged by this selection action.
          } else {
            // Product is not in the cart, so add it with quantity 1.
            // Use sellingPrice for consistency with addToCart function.
            const stockAvailable = getProductStockForLocation(product);
            if (stockAvailable > 0) {
              return [...prevCart, { product, quantity: 1, price: product.sellingPrice, discount: 0 }];
            } else {
              toast.warn(`Cannot add ${product.name}. Out of stock at this location.`);
              // Also, remove it from selection if it can't be added to cart due to no stock
              updatedSelected.delete(product._id);
              return prevCart;
            }
          }
        });
      }
      return updatedSelected;
    });
  };

  // ... (rest of the component will be built out in subsequent steps)

  // Placeholder for existing static data, will be removed or adapted
  const staticCustomers = [
    { value: 'walkInCustomer', label: 'Walk in Customer' },
    { value: 'john', label: 'John' },
  ];
  const staticGst = [
    { value: '0', label: 'GST 0%' },
    { value: '5', label: 'GST 5%' },
  ];
  const staticShipping = [
    { value: '0', label: '0' },
    { value: '15', label: '15' },
  ];
  const staticDiscountOptions = [
    { value: '0', label: '0%' },
    { value: '10', label: '10%' },
  ];
  const staticTaxOptions = [
    { value: 'exclusive', label: 'Exclusive' },
    { value: 'inclusive', label: 'Inclusive' },
  ];

  // --- CART LOGIC ---
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      const stockAvailable = getProductStockForLocation(product);
      if (existingItem) {
        if (existingItem.quantity < stockAvailable) {
          return prevCart.map(item =>
            item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          toast.warn(`Cannot add more ${product.name}. Stock limit reached at this location.`);
          return prevCart;
        }
      } else {
        if (stockAvailable > 0) {
          return [...prevCart, { product, quantity: 1, price: product.sellingPrice, discount: 0 }];
        } else {
          toast.warn(`Cannot add ${product.name}. Out of stock at this location.`);
          return prevCart;
        }
      }
    });
  };

  const updateCartQuantity = (productId, newQuantity) => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.product._id === productId);
      if (!itemToUpdate) return prevCart;
      const productInCatalog = products.find(p => p._id === productId);
      if (!productInCatalog) return prevCart; // Should not happen

      const stockAvailable = getProductStockForLocation(productInCatalog);
      // --- DEBUG LOGS ---
      console.log('[updateCartQuantity] Product ID:', productId);
      console.log('[updateCartQuantity] New Quantity:', newQuantity);
      console.log('[updateCartQuantity] Product in Catalog:', productInCatalog);
      console.log('[updateCartQuantity] Stock Available (from getProductStockForLocation):', stockAvailable);
      // --- END DEBUG LOGS ---

      if (newQuantity <= 0) {
        // Remove from cart if quantity is zero or less
        return prevCart.filter(item => item.product._id !== productId);
      } else if (newQuantity > stockAvailable) {
        toast.warn(`Cannot exceed available stock (${stockAvailable}) for this product.`);
        return prevCart;
      } else {
        return prevCart.map(item =>
          item.product._id === productId ? { ...item, quantity: newQuantity } : item
        );
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product._id !== productId));
  };

  const handleCartItemDiscountChange = (productId, discountValue) => {
    const discount = parseFloat(discountValue);
    if (isNaN(discount) || discount < 0 || discount > 100) {
        toast.error("Item discount must be between 0 and 100.");
        return;
    }
    setCart(prevCart => prevCart.map(item =>
        item.product._id === productId ? { ...item, discount: discount } : item
    ));
  };

  // --- CALCULATIONS ---
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.price || item.product.sellingPrice;
      const itemTotal = itemPrice * item.quantity * (1 - (item.discount || 0) / 100);
      return sum + itemTotal;
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    // For simplicity, assuming taxRate and overallDiscount are percentages applied to subtotal
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = subtotal * (overallDiscount / 100);
    let finalTotal = subtotal + taxAmount - discountAmount;
    return finalTotal < 0 ? 0 : parseFloat(finalTotal.toFixed(2));
  };

  // --- SALE SUBMISSION ---
  const handleSubmitSale = async () => {
    if (!selectedLocation || !selectedLocation._id) {
      toast.error("Please select a location for the sale.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Cart is empty. Please add products to proceed.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    setLoading(true);
    const saleData = {
      items: cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price || item.product.sellingPrice, // Price at the time of sale
        discount: item.discount || 0,
      })),
      paymentMethod,
      customer,
      locationId: selectedLocation._id, // Send location ID
      notes,
      tax: parseFloat(taxRate) || 0, // Assuming taxRate is a percentage
      discount: parseFloat(overallDiscount) || 0, // Overall discount percentage
      // subtotal and total will be calculated by backend based on items, tax, and discount
    };

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/sales`, saleData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Sale completed successfully!", { position: "top-right" });
      setCart([]); // Clear cart
      setCustomer({ name: 'Walk-in Customer', contact: '', email: '' }); // Reset customer
      setOverallDiscount(0);
      setTaxRate(0);
      setNotes('');
      // Refresh recent sales after successful sale
      fetchRecentSales();
      // The post-save hook on the backend should handle inventory and income.
    } catch (error) {
      console.error("Error creating sale:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to create sale.");
    } finally {
      setLoading(false);
      setShowPaymentModal(false); // Close payment modal if it was open
    }
  };

  // Fetch recent sales from the backend
  const fetchRecentSales = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/sales?limit=5&sort=-createdAt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentSales(response.data.slice(0, 5)); // Get only last 5 sales
    } catch (error) {
      console.error("Error fetching recent sales:", error);
    }
  };

  // Fetch recent sales on component mount
  useEffect(() => {
    fetchRecentSales();
  }, []);

  // Slider settings (can be adjusted)
  const productSliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
        { breakpoint: 1200, settings: { slidesToShow: 4, slidesToScroll: 2 } },
        { breakpoint: 992, settings: { slidesToShow: 3, slidesToScroll: 1 } },
        { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1 } },
        { breakpoint: 576, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  // Define categoryCarouselSettings (was missing)
  const categoryCarouselSettings = {
    dots: false,
    autoplay: false, // As per your new design snippet
    infinite: false, // Usually better for categories
    slidesToShow: 5, // Match initial design, adjust if needed based on categories.length
    slidesToScroll: 1, // As per your new design snippet for categories
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    variableWidth: true, // From previous implementation, seems useful for category names
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 5,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 5,
        },
      },
      {
        breakpoint: 776,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 567,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };


  // Custom arrows for sliders
  function PrevArrow(props) {
    const { className, style, onClick } = props;
    return (
      <button type="button" className={`slick-prev ${className}`} style={{ ...style}} onClick={onClick}>
        <ChevronLeft size={24} />
      </button>
    );
  }

  function NextArrow(props) {
    const { className, style, onClick } = props;
    return (
      <button type="button" className={`slick-next ${className}`} style={{ ...style}} onClick={onClick}>
        <ChevronRight size={24} />
      </button>
    );
  }

  // --- Original static quantity handlers (to be removed or adapted) ---
  // const [quantity, setQuantity] = useState(4);
  // const handleDecrement = () => setQuantity(prev => Math.max(0, prev - 1));
  // const handleIncrement = () => setQuantity(prev => prev + 1);
  // ... (similar for quantity1, quantity2, quantity3)

  const MySwal = withReactContent(Swal);

  const showCartItemDeleteConfirmation = (productId) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        confirmButton: 'btn btn-primary me-1',
        cancelButton: 'btn btn-danger ms-1'
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        removeFromCart(productId);
        toast.success('Item removed from cart.');
      }
    });
  };

  const subtotal = calculateSubtotal();
  const total = calculateTotal();


  // Helper to get available stock for a product at the selected location
  const getProductStockForLocation = (product) => {
    // --- DEBUG LOGS for getProductStockForLocation ---
    console.log('[getProductStockForLocation] Product:', product);
    console.log('[getProductStockForLocation] Selected Location:', selectedLocation);
    // --- END DEBUG LOGS ---

    if (!product) return 0;
    if (product.inventory && Array.isArray(product.inventory) && selectedLocation?._id) {
      const inv = product.inventory.find(inv => {
        const invLocationId = (typeof inv.location === 'object' && inv.location?._id)
                                ? inv.location._id.toString()
                                : inv.location?.toString(); // Added nullish coalescing for inv.location
        const selectedLocId = selectedLocation._id.toString();
        return invLocationId === selectedLocId;
      });
      if (inv) return inv.quantity ?? 0; // Default to 0 if quantity is null/undefined
    }
    // Fallback to totalStock if inventory array is missing or no match is found
    const fallbackStock = product.totalStock ?? 0; // Default to 0 if totalStock is null/undefined
    console.log('[getProductStockForLocation] Falling back to totalStock. Product totalStock:', fallbackStock);
    return fallbackStock;
  };

  // Render
  return (
    <>
      <style>{`
        @keyframes selectionPulse {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes selectionGlow {
          0%, 100% {
            box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15), 0 0 0 1px rgba(0, 123, 255, 0.1);
          }
          50% {
            box-shadow: 0 8px 25px rgba(0, 123, 255, 0.25), 0 0 0 1px rgba(0, 123, 255, 0.2);
          }
        }
        
        .product-selected {
          animation: selectionGlow 2s ease-in-out infinite;
        }
        
        .product-info:active {
          transform: scale(0.98) !important;
          transition: transform 0.1s ease-out;
        }
        
        .selection-badge {
          animation: slideInLeft 0.3s ease-out;
        }
        
        @keyframes slideInLeft {
          0% {
            transform: translateX(-20px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .product-card-ripple {
          position: relative;
          overflow: hidden;
        }
        
        .product-card-ripple::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(0, 123, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .product-card-ripple.ripple-active::after {
          width: 300px;
          height: 300px;
        }
        
        @keyframes slideInDown {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .selection-counter-badge {
          animation: bounceIn 0.4s ease-out;
        }
        
        @keyframes bounceIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      <div className="page-wrapper pos-pg-wrapper ms-0">
        <ToastContainer position="top-right" autoClose={3000} />
      <div className="content pos-design p-0">
        <div className="btn-row d-sm-flex align-items-center">
          <button // Changed to button, will control modal with state
            className="btn btn-secondary mb-xs-3"
            onClick={() => setShowViewOrdersModal(true)} // Example: Control with state
          >
            <span className="me-1 d-flex align-items-center">
              <ShoppingCart className="feather-16" />
            </span>
            View Orders
          </button>
          <Link to="/sales-list" className="btn btn-success mb-xs-3">
            <span className="me-1 d-flex align-items-center">
              <CheckCircle className="feather-16" />
            </span>
            Sales List
          </Link>
          <button onClick={() => setCart([])} className="btn btn-info">
            <span className="me-1 d-flex align-items-center">
              <RefreshIcon className="feather-16" /> {/* Changed RotateCw to RefreshIcon */}
            </span>
            Reset Cart
          </button>
          <button // Changed to button
            className="btn btn-primary"
            onClick={() => setShowRecentTransactionsModal(true)} // Example: Control with state
          >
            <span className="me-1 d-flex align-items-center">
              <RefreshIcon className="feather-16" />
            </span>
            Transaction
          </button>
        </div>
        <div className="row align-items-start pos-wrapper">
          <div className="col-md-12 col-lg-8">
            <div className="pos-categories tabs_wrapper mb-4">
              <h5 className="mb-2">Categories</h5>
              <p className="text-muted mb-3">Select from Below Categories</p>
              {products.length > 0 && (
                <div className="category-scroll-container">
                  <div className="d-flex align-items-center" style={{ overflowX: 'auto', paddingBottom: '10px', gap: '12px' }}>
                    <div className="category-item" style={{ minWidth: 'auto', flexShrink: 0 }}>
                      <button
                        className={`btn category-btn d-flex flex-column align-items-center justify-content-center ${
                          !selectedCategory || selectedCategory === 'all' 
                            ? 'btn-primary text-white' 
                            : 'btn-light border text-dark'
                        }`}
                        onClick={() => setSelectedCategory('all')}
                        style={{ 
                          width: '100px', 
                          height: '80px', 
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}
                      >
                        <Grid size={20} className="mb-1"/>
                        <span>All Categories</span>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>80 Items</small>
                      </button>
                    </div>
                    {(categories || []).map((category) => {
                      const categoryItemCount = filteredProducts.filter(p => 
                        (p.category?.name || p.category) === category.name
                      ).length;
                      
                      return (
                        <div key={category._id || category.name} className="category-item" style={{ minWidth: 'auto', flexShrink: 0 }}>
                          <button
                            className={`btn category-btn d-flex flex-column align-items-center justify-content-center ${
                              selectedCategory === category.name 
                                ? 'btn-primary text-white' 
                                : 'btn-light border text-dark'
                            }`}
                            onClick={() => setSelectedCategory(category.name)}
                            style={{ 
                              width: '100px', 
                              height: '80px', 
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}
                          >
                            {/* Category icon based on name */}
                            {category.name.toLowerCase().includes('phone') || category.name.toLowerCase().includes('mobile') ? (
                              <Smartphone size={20} className="mb-1"/>
                            ) : category.name.toLowerCase().includes('shoe') ? (
                              <Grid size={20} className="mb-1"/>
                            ) : category.name.toLowerCase().includes('watch') ? (
                              <Grid size={20} className="mb-1"/>
                            ) : category.name.toLowerCase().includes('laptop') || category.name.toLowerCase().includes('computer') ? (
                              <Grid size={20} className="mb-1"/>
                            ) : (
                              <Grid size={20} className="mb-1"/>
                            )}
                            <span style={{ lineHeight: '1.1', textAlign: 'center' }}>{category.name}</span>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{categoryItemCount} Items</small>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pos-products">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0 fw-bold">Products</h5>
                <div className="d-flex align-items-center gap-2">
                  <div className="search-container position-relative">
                    <input 
                      type="text" 
                      className="form-control ps-5" 
                      placeholder="Search Product..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: '280px', borderRadius: '25px', backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}
                    />
                    <Search 
                      size={18} 
                      className="position-absolute" 
                      style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d' }}
                    />
                  </div>
                  <div className="location-select-pos">
                    <Select
                        className="select"
                        options={Array.isArray(locations) ? locations.map(loc => ({ value: loc._id, label: loc.name })) : []}
                        value={selectedLocation ? { value: selectedLocation._id, label: selectedLocation.name } : null}
                        onChange={handleLocationChange}
                        placeholder="Select Location"
                        isDisabled={!Array.isArray(locations) || locations.length === 0}
                        styles={{
                          control: (base) => ({
                            ...base,
                            minWidth: '200px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0'
                          })
                        }}
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Add Selected to Cart Button */}
              {selectedProductsForCart.size > 0 && (
                <div className="mb-3">
                  <div 
                    className="alert alert-primary d-flex align-items-center justify-content-between p-3 border-0 shadow-sm"
                    style={{ 
                      backgroundColor: '#e3f2fd',
                      borderRadius: '12px',
                      animation: 'slideInDown 0.3s ease-out'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <div 
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                        style={{ width: '40px', height: '40px', fontSize: '0.9rem', fontWeight: 'bold' }}
                      >
                        {selectedProductsForCart.size}
                      </div>
                      <div>
                        <strong>Products Selected</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <React.Fragment>
                <div className="tabs_container">
                  <div className="tab_content active" data-tab="all">
                    <div className="row ps-md-3">
                      {loading && <div className="col-12 text-center p-5">Loading products...</div>}
                      {!loading && filteredProducts.length === 0 && <div className="col-12 text-center p-5">No products found.</div>}
                      {filteredProducts.map((product) => {
                        const imageBaseUrl = process.env.REACT_APP_FILE_BASE_URL;
                        const imageUrlFromProduct = product.imageUrl;
                        let finalSrc = 'assets/img/products/product-default.png'; // Default placeholder
                        const isSelected = selectedProductsForCart.has(product._id); // Check if product is selected

                        if (imageUrlFromProduct) {
                          if (imageUrlFromProduct.startsWith('http://') || imageUrlFromProduct.startsWith('https://')) {
                            finalSrc = imageUrlFromProduct; // Absolute URL
                          } else if (imageBaseUrl) {
                            // Construct URL carefully, ensuring no double slashes
                            if (imageUrlFromProduct.startsWith('/')) {
                              finalSrc = `${imageBaseUrl}${imageUrlFromProduct}`;
                            } else {
                              finalSrc = `${imageBaseUrl}/${imageUrlFromProduct}`;
                            }
                          } else {
                            console.warn(`REACT_APP_FILE_BASE_URL is not set. Cannot construct image URL for: ${imageUrlFromProduct}`);
                          }
                        }

                        // console.log(
                        //   `Product: "${product.name}", product.imageUrl: "${imageUrlFromProduct}", Constructed src: "${finalSrc}"`
                        // );

                        let quantityForDisplay = 0;
                        if (product.inventory && Array.isArray(product.inventory) && selectedLocation?._id) {
                          const inventoryRecord = product.inventory.find(inv => {
                            if (!inv.location || !selectedLocation?._id) return false;
                            // Robustly get location ID from inv.location (whether it's an object or a string ID)
                            const invLocationId = (typeof inv.location === 'object' && inv.location._id)
                                                  ? inv.location._id.toString()
                                                  : inv.location.toString();
                            return invLocationId === selectedLocation._id.toString();
                          });

                          if (inventoryRecord && typeof inventoryRecord.quantity === 'number') {
                            quantityForDisplay = inventoryRecord.quantity;
                          } else if (typeof product.totalStock === 'number') {
                            quantityForDisplay = product.totalStock;
                          }
                        } else if (typeof product.totalStock === 'number') {
                          quantityForDisplay = product.totalStock;
                        }

                        // Use the helper to get correct stock for this product at the selected location
                        const stock = getProductStockForLocation(product);

                        return (
                          <div className="col-sm-6 col-md-4 col-lg-2 col-xl-2 mb-3" key={product._id}>
                            <div
                              className={`product-info default-cover card h-100 ${isSelected ? 'product-selected' : 'product-unselected'}`}
                              onClick={() => handleProductSelection(product)}
                              style={{
                                cursor: 'pointer', 
                                position: 'relative', 
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isSelected ? 'translateY(-4px) scale(1.02)' : 'translateY(0px) scale(1)',
                                border: isSelected ? '3px solid #007bff' : '2px solid transparent',
                                backgroundColor: isSelected ? '#f8f9ff' : '#ffffff',
                                boxShadow: isSelected 
                                  ? '0 8px 25px rgba(0, 123, 255, 0.15), 0 0 0 1px rgba(0, 123, 255, 0.1)' 
                                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                                borderRadius: '12px'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                }
                              }}
                            >
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  zIndex: 10,
                                  animation: 'selectionPulse 0.6s ease-out'
                                }}>
                                  <div style={{
                                    backgroundColor: '#007bff',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0, 123, 255, 0.4)',
                                    border: '2px solid white'
                                  }}>
                                    <CheckCircle size={18} color="white" />
                                  </div>
                                </div>
                              )}
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '6px',
                                  left: '6px',
                                  zIndex: 5
                                }}>
                                  <span 
                                    className="selection-badge"
                                    style={{
                                      backgroundColor: '#28a745',
                                      color: 'white',
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)'
                                    }}
                                  >
                                    Selected
                                  </span>
                                </div>
                              )}
                              {/* Image container with fixed height */}
                              <div style={{ 
                                height: '120px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                padding: '8px', 
                                backgroundColor: isSelected ? '#f0f4ff' : '#f8f9fa', 
                                borderTopLeftRadius: '10px', 
                                borderTopRightRadius: '10px',
                                position: 'relative',
                                overflow: 'hidden'
                              }}>
                                <img
                                  src={finalSrc}
                                  alt={product.name}
                                  style={{maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px'}}
                                  onError={(e) => {
                                    console.error(`IMAGE LOAD ERROR for src: ${finalSrc} (Product: ${product.name})`);
                                    e.target.onerror = null;
                                    e.target.src = 'assets/img/products/product-default.png';
                                  }}
                                />
                              </div>
                              <div className="card-body p-2"> {/* Reduced padding for more compact look */}
                                <div className="text-center">
                                  <div className="text-muted small mb-1" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {product.category?.name || product.category || 'Uncategorized'}
                                  </div>
                                  <h6 className="product-name mb-2 fw-bold" style={{ fontSize: '0.85rem', lineHeight: '1.2', minHeight: '32px', color: '#333' }}>
                                    {product.name}
                                  </h6>
                                  <div className="d-flex align-items-center justify-content-between px-1">
                                    <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>{stock} Pcs</span>
                                    <span className="fw-bold" style={{ fontSize: '1rem', color: '#007bff' }}>
                                      {typeof product.sellingPrice === 'number'
                                        ? `$${product.sellingPrice.toFixed(0)}`
                                        : typeof product.price === 'number'
                                          ? `$${product.price.toFixed(0)}`
                                          : <span className="text-muted small">N/A</span>}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </React.Fragment>

            </div>
          </div>

          <div className="col-md-12 col-lg-4 ps-0">
            <aside className="product-order-list bg-white rounded-3 shadow-sm border">
              <div className="head d-flex align-items-center justify-content-between w-100 p-3 border-bottom">
                <div>
                  <h5 className="mb-1 fw-bold">Order List</h5>
                  <span className="text-muted small">Transaction ID : #{Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                </div>
                <div>
                  <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => setCart([])} disabled={cart.length === 0}>
                    Clear All
                  </button>
                </div>
              </div>
              <div className="customer-info block-section p-3">
                <h6 className="mb-2 fw-semibold">Customer Information</h6>
                <div className="input-block d-flex align-items-center gap-2">
                  <div className="flex-grow-1">
                     <input 
                       type="text" 
                       className="form-control" 
                       placeholder="Choose a Name" 
                       value={customer.name} 
                       onChange={(e) => setCustomer(prev => ({...prev, name: e.target.value}))}
                       style={{ borderRadius: '8px' }}
                     />
                  </div>
                  <button
                    className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                    onClick={() => setShowCreateCustomerModal(true)}
                    style={{ width: '40px', height: '40px' }}
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              </div>
              <div className="product-added block-section px-3 pb-3">
                <div className="head-text d-flex align-items-center justify-content-between mb-3">
                  <h6 className="d-flex align-items-center mb-0 fw-semibold">
                    Product Added
                    <span className="count ms-2 badge bg-warning text-dark rounded-pill">{cart.length}</span>
                  </h6>
                </div>
                <div className="product-wrap cart-items-pos" style={{maxHeight: '280px', overflowY: 'auto'}}>
                  {cart.length === 0 && (
                    <div className="text-center py-5 text-muted">
                      <ShoppingCart size={48} className="mb-3 opacity-50" />
                      <p className="mb-0">Cart is empty.</p>
                    </div>
                  )}
                  {cart.map(item => (
                    <div className="product-list d-flex align-items-center justify-content-between" key={item.product._id}>
                      <div className="d-flex align-items-center product-info-flex">
                        <Link to="#" className="img-bg me-2" style={{width: '40px', height: '40px'}}>
                          <img
                            src={item.product.imageUrl
                                 ? (item.product.imageUrl.startsWith('http')
                                   ? item.product.imageUrl
                                   : `${process.env.REACT_APP_FILE_BASE_URL}${item.product.imageUrl.startsWith('/') ? item.product.imageUrl : `/${item.product.imageUrl}`}`)
                                 : 'assets/img/products/product-default.png'}
                            alt={item.product.name}
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            onError={(e) => { e.target.onerror = null; e.target.src = 'assets/img/products/product-default.png'; }}
                          />
                        </Link>
                        <div className="info">
                          <span className="text-muted small d-block">{item.product.sku || 'N/A'}</span>
                          <h6>
                            <Link to="#">{item.product.name}</Link>
                          </h6>
                          <p className="mb-0 fw-bold">${item.price?.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="cart-item-actions d-flex align-items-center">
                        <div className="qty-item text-center d-flex align-items-center me-2">
                          <button className="btn btn-outline-secondary btn-sm p-1 lh-1" onClick={() => updateCartQuantity(item.product._id, item.quantity - 1)}>
                              <MinusCircle style={{ width: '14px', height: '14px' }} />
                          </button>
                          <input
                            type="number"
                            className="form-control form-control-sm text-center mx-1"
                            style={{width: '45px', height: '28px'}}
                            value={item.quantity}
                            min={0}
                            max={getProductStockForLocation(item.product)}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) updateCartQuantity(item.product._id, val);
                            }}
                          />
                          <button className="btn btn-outline-secondary btn-sm p-1 lh-1" onClick={() => updateCartQuantity(item.product._id, item.quantity + 1)}>
                              <PlusCircle style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                        <button
                          onClick={() => showCartItemDeleteConfirmation(item.product._id)}
                          className="btn btn-outline-danger btn-sm p-1 lh-1"
                          title="Remove item"
                        >
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="block-section">
                <div className="selling-info">
                  <div className="row">
                    <div className="col-12 col-sm-6 mb-2">
                      <div className="input-blocks">
                        <label>Order Tax (%)</label>
                        <input type="number" className="form-control" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} min="0" placeholder="0" />
                      </div>
                    </div>
                    <div className="col-12 col-sm-6 mb-2">
                      <div className="input-blocks">
                        <label>Discount (%)</label>
                        <input type="number" className="form-control" value={overallDiscount} onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)} min="0" placeholder="0" />
                      </div>
                    </div>
                    {/* Shipping can be added if needed */}
                  </div>
                </div>
                <div className="order-total">
                  <table className="table table-responsive table-borderless">
                    <tbody>
                      <tr>
                        <td>Sub Total</td>
                        <td className="text-end">${subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Tax ({taxRate}%)</td>
                        <td className="text-end">${(subtotal * taxRate / 100).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="text-danger">Discount ({overallDiscount}%)</td>
                        <td className="text-danger text-end">-${(subtotal * overallDiscount / 100).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Total</td>
                        <td className="text-end fw-bold text-success">${total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="block-section payment-method">
                <h6>Payment Method</h6>
                <div className="row d-flex align-items-center justify-content-center methods">
                    {[
                        {value: 'cash', label: 'CASH', iconName: 'cash', isFeather: false },
                        {value: 'credit_card', label: 'CREDIT CARD', iconName: 'credit-card', isFeather: false},
                        {value: 'mobile_payment', label: 'MOBILE PAYMENT', iconName: 'Smartphone', isFeather: true}
                    ].map(methodOpt => (
                        <div className="col-4 item p-1" key={methodOpt.value}>
                            <div className={`default-cover text-center p-2 rounded ${paymentMethod === methodOpt.value ? 'active-payment' : ''}`}
                                 onClick={() => setPaymentMethod(methodOpt.value)} style={{cursor: 'pointer', border: paymentMethod === methodOpt.value ? '2px solid var(--bs-primary)' : '1px solid #eee'}}>
                                {methodOpt.isFeather ? (
                                    // Use imported Smartphone icon directly
                                    <Smartphone size={24} style={{ marginBottom: '5px'}} />
                                ) : (
                                    <Image
                                        src={`assets/img/icons/${methodOpt.iconName}.svg`}
                                        alt={methodOpt.label}
                                        style={{height: '24px', marginBottom: '5px'}}
                                    />
                                )}
                                <span style={{fontSize: '0.75rem', display: 'block'}}>{methodOpt.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
              <div className="d-grid btn-block">
                <button className="btn btn-secondary" type="button">
                  Grand Total : ${total.toFixed(2)}
                </button>
              </div>
              <div className="btn-row d-sm-flex align-items-center justify-content-between">
                <button
                  type="button"
                  className="btn btn-info btn-icon flex-fill me-1"
                  onClick={() => setShowHoldOrderModal(true)} // Control with state
                >
                  <span className="me-1 d-flex align-items-center">
                    <Pause className="feather-16" />
                  </span>
                  Hold
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-icon flex-fill ms-1"
                  onClick={() => { /* Void logic here */ toast.info('Void action TBD'); }}
                >
                  <span className="me-1 d-flex align-items-center">
                    <Trash2 className="feather-16" />
                  </span>
                  Void
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-icon flex-fill ms-1"
                  onClick={() => setShowPaymentModal(true)} // Control with state
                  disabled={cart.length === 0 || loading}
                >
                  <span className="me-1 d-flex align-items-center">
                    <CreditCard className="feather-16" />
                  </span>
                  {loading ? 'Processing...' : 'Payment'}
                </button>
              </div>

              {/* Recent Sales Section */}
              <div className="block-section mt-3">
                <h6 className="mb-2">Recent Sales</h6>
                <div className="recent-sales-list">
                  {recentSales.length === 0 ? (
                    <p className="text-muted text-center py-2">No recent sales</p>
                  ) : (
                    recentSales.map((sale) => (
                      <div key={sale._id} className="recent-sale-item d-flex justify-content-between align-items-center py-2 border-bottom">
                        <div className="sale-info">
                          <div className="customer-name fw-bold">{sale.customer?.name || 'Walk-in'}</div>
                          <div className="sale-time text-muted small">
                            {new Date(sale.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="sale-amount">
                          <span className="fw-bold text-success">${sale.total?.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Payment Modal (already implemented with react-bootstrap) */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Complete Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Total: ${total.toFixed(2)}</h5>
          <Form.Group className="mb-3">
            <Form.Label>Payment Method</Form.Label>
            <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="mobile_payment">Mobile Payment</option>
              <option value="other">Other</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control as="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitSale} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Sale'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Customer Modal (Example using react-bootstrap) */}
      <Modal show={showCreateCustomerModal} onHide={() => setShowCreateCustomerModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => { e.preventDefault(); /* Handle customer creation */ toast.info('Create customer TBD'); setShowCreateCustomerModal(false); }}>
            <Form.Group className="mb-3">
              <Form.Label>Customer Name</Form.Label>
              <Form.Control type="text" placeholder="Enter customer name" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" placeholder="Enter email" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control type="text" placeholder="Enter phone" />
            </Form.Group>
            {/* Add more fields as needed */}
            <Button variant="primary" type="submit" className="mt-2">
              Save Customer
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Product in Cart Modal (Placeholder) */}
       <Modal show={showEditProductModal} onHide={() => {setShowEditProductModal(false); setProductToEditInCart(null);}} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit: {productToEditInCart?.product?.name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditProductInCartSubmit}>
            <Modal.Body>
                <p>Edit functionality for cart item (e.g., price, unit, specific discount) to be implemented.</p>
                <Form.Group className="mb-3">
                    <Form.Label>Price</Form.Label>
                    <Form.Control type="number" defaultValue={productToEditInCart?.price} />
                </Form.Group>
                 <Form.Group className="mb-3">
                    <Form.Label>Item Discount (%)</Form.Label>
                    <Form.Control type="number" defaultValue={productToEditInCart?.discount} min="0" max="100" />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={() => {setShowEditProductModal(false); setProductToEditInCart(null);}}>
                Cancel
            </Button>
            <Button variant="primary" type="submit">
                Update Item
            </Button>
            </Modal.Footer>
        </Form>
      </Modal>

      {/* Hold Order Modal (Placeholder) */}
      <Modal show={showHoldOrderModal} onHide={() => setShowHoldOrderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hold Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>Order holding functionality to be implemented.</p>
            <Form.Group className="mb-3">
                <Form.Label>Reference (Optional)</Form.Label>
                <Form.Control type="text" placeholder="Add a reference for this held order" />
            </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHoldOrderModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {toast.info('Hold order TBD'); setShowHoldOrderModal(false);}}>Confirm Hold</Button>
        </Modal.Footer>
      </Modal>

      {/* Recent Transactions Modal (Placeholder - needs dynamic content) */}
      <Modal show={showRecentTransactionsModal} onHide={() => setShowRecentTransactionsModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Recent Transactions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Recent transactions list to be implemented here.</p>
          {/* Static content from your design for now */}
          <div className="table-responsive">
            <table className="table datanew">
              <thead><tr><th>Date</th><th>Reference</th><th>Customer</th><th>Amount</th><th>Action</th></tr></thead>
              <tbody><tr><td>12 May 2025</td><td>INV/SL0101</td><td>Walk-in Customer</td><td>$100.00</td><td>View</td></tr></tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>

       {/* View Orders Modal (Placeholder - needs dynamic content) */}
      <Modal show={showViewOrdersModal} onHide={() => setShowViewOrdersModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>View Orders (Held/Pending)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>List of held or pending orders to be implemented here.</p>
        </Modal.Body>
      </Modal>

      {/* Payment Completed & Print Receipt Modals (using data-bs-target for now, should be state controlled) */}
      {/* These are left as data-bs-target for now as per original design, but ideally convert to React state */}
      <div className="modal fade modal-default" id="payment-completed" aria-labelledby="payment-completed">
        {/* ... content from your design ... */}
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body text-center">
                <div className="icon-head"><Link to="#"><CheckCircle className="feather-40"/></Link></div>
                <h4>Payment Completed</h4>
                <p className="mb-0">Do you want to Print Receipt for the Completed Order</p>
                <div className="modal-footer d-sm-flex justify-content-between">
                  <button type="button" className="btn btn-primary flex-fill me-1" data-bs-dismiss="modal" onClick={() => setShowPrintReceiptModal(true)} >Print Receipt</button>
                  <button type="button" className="btn btn-secondary flex-fill" data-bs-dismiss="modal">Next Order</button>
                </div>
            </div>
          </div>
        </div>
      </div>

      <Modal show={showPrintReceiptModal} onHide={() => setShowPrintReceiptModal(false)} centered size="md">
        <Modal.Header closeButton>
            <Modal.Title>Print Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <div className="icon-head text-center">
                <Link to="#"><Image src="assets/img/logo.png" width={100} height={30} alt="Receipt Logo"/></Link>
            </div>
            <div className="text-center info text-center">
                <h6>Your Company Name</h6>
                <p className="mb-0">Phone: Your Phone</p>
                <p className="mb-0">Email: <Link to="#">your.email@example.com</Link></p>
            </div>
            <div className="tax-invoice"><h6 className="text-center">Tax Invoice</h6>
                {/* Populate with actual sale data */}
            </div>
            <table className="table-borderless w-100 table-fit">
                <thead><tr><th># Item</th><th>Price</th><th>Qty</th><th className="text-end">Total</th></tr></thead>
                <tbody>
                    {cart.map((item, index) => (
                        <tr key={item.product._id}>
                            <td>{index + 1}. {item.product.name}</td>
                            <td>${item.price?.toFixed(2)}</td>
                            <td>{item.quantity}</td>
                            <td className="text-end">${(item.price * item.quantity * (1 - (item.discount || 0)/100)).toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr><td colSpan={4}><hr/></td></tr>
                    <tr><td>Sub Total :</td><td colSpan={2}></td><td className="text-end">${subtotal.toFixed(2)}</td></tr>
                    <tr><td>Tax ({taxRate}%) :</td><td colSpan={2}></td><td className="text-end">${(subtotal * taxRate / 100).toFixed(2)}</td></tr>
                    <tr><td className="text-danger">Discount ({overallDiscount}%) :</td><td colSpan={2}></td><td className="text-danger text-end">-${(subtotal * overallDiscount / 100).toFixed(2)}</td></tr>
                    <tr><td className="fw-bold">Total Bill :</td><td colSpan={2}></td><td className="text-end fw-bold">${total.toFixed(2)}</td></tr>
                </tbody>
            </table>
            <div className="text-center invoice-bar mt-3">
                <p>Thank You For Shopping With Us. Please Come Again</p>
                <Button variant="primary" onClick={() => {toast.info('Print action TBD'); setShowPrintReceiptModal(false);}}>Print Actual Receipt</Button>
            </div>
        </Modal.Body>
      </Modal>

    </div>
    </>
  );
};

export default Pos;
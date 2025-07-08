/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FeatherIcon from "feather-icons-react";
import Image from "../../core/img/image";
import { Search, XCircle } from "react-feather";
import { all_routes } from "../../Router/all_routes";
import { toast } from "react-toastify";
import { Dropdown, Modal, Button } from "react-bootstrap";
import { getProfileImageUrl, getDefaultAvatar } from "../../services/userService";
import ModernNotifications from "../../feature-module/dashboard/ModernNotifications";
import { Plus } from "react-feather";

const Header = () => {
  const route = all_routes;
  const navigate = useNavigate();
  const [toggle, SetToggle] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);

  const isElementVisible = (element) => {
    return element.offsetWidth > 0 || element.offsetHeight > 0;
  };

  const slideDownSubmenu = () => {
    const subdropPlusUl = document.getElementsByClassName("subdrop");
    for (let i = 0; i < subdropPlusUl.length; i++) {
      const submenu = subdropPlusUl[i].nextElementSibling;
      if (submenu && submenu.tagName.toLowerCase() === "ul") {
        submenu.style.display = "block";
      }
    }
  };

  const slideUpSubmenu = () => {
    const subdropPlusUl = document.getElementsByClassName("subdrop");
    for (let i = 0; i < subdropPlusUl.length; i++) {
      const submenu = subdropPlusUl[i].nextElementSibling;
      if (submenu && submenu.tagName.toLowerCase() === "ul") {
        submenu.style.display = "none";
      }
    }
  };

  useEffect(() => {
    const handleMouseover = (e) => {
      e.stopPropagation();

      const body = document.body;
      const toggleBtn = document.getElementById("toggle_btn");

      if (
        body.classList.contains("mini-sidebar") &&
        isElementVisible(toggleBtn)
      ) {
        const target = e.target.closest(".sidebar, .header-left");

        if (target) {
          body.classList.add("expand-menu");
          slideDownSubmenu();
        } else {
          body.classList.remove("expand-menu");
          slideUpSubmenu();
        }

        e.preventDefault();
      }
    };

    document.addEventListener("mouseover", handleMouseover);

    return () => {
      document.removeEventListener("mouseover", handleMouseover);
    };
  }, []); // Empty dependency array ensures that the effect runs only once on mount
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ||
          document.mozFullScreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  // Load user data from localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();

    // Listen for custom profile update events
    const handleProfileUpdate = (event) => {
      if (event.detail && event.detail.user) {
        setUser(event.detail.user);
      } else {
        // Fallback to re-reading from localStorage
        loadUserData();
      }
    };

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (event) => {
      if (event.key === 'user') {
        loadUserData();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('colorschema');
    setIsDarkMode(savedTheme === 'dark_mode');
  }, []);

  // Get profile image URL with fallback
  const getProfileImage = () => {
    if (user?.profileImage) {
      return getProfileImageUrl(user.profileImage);
    }
    return getDefaultAvatar();
  };

  // Logout handler with proper cleanup
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    setIsLoggingOut(true);
    
    try {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear user state
      setUser(null);
      
      toast.success('Logged out successfully');
      
      // Navigate to signin page
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Theme switching functions
  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light_mode' : 'dark_mode';
    localStorage.setItem('colorschema', newTheme);
    setIsDarkMode(!isDarkMode);
    document.documentElement.setAttribute('data-layout-mode', newTheme);
  };

  const handlesidebar = () => {
    document.body.classList.toggle("mini-sidebar");
    SetToggle((current) => !current);
  };
  const expandMenu = () => {
    document.body.classList.remove("expand-menu");
  };
  const expandMenuOpen = () => {
    document.body.classList.add("expand-menu");
  };
  const sidebarOverlay = () => {
    document?.querySelector(".main-wrapper")?.classList?.toggle("slide-nav");
    document?.querySelector(".sidebar-overlay")?.classList?.toggle("opened");
    document?.querySelector("html")?.classList?.toggle("menu-opened");
  };

  let pathname = location.pathname;

  const exclusionArray = [
    "/reactjs/template/dream-pos/index-three",
    "/reactjs/template/dream-pos/index-one",
  ];
  if (exclusionArray.indexOf(window.location.pathname) >= 0) {
    return "";
  }




  const toggleFullscreen = (elem) => {
    elem = elem || document.documentElement;
    if (
      !document.fullscreenElement &&
      !document.mozFullScreenElement &&
      !document.webkitFullscreenElement &&
      !document.msFullscreenElement
    ) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  return (
    <>
      <div className="header">
        {/* Logo */}
        <div
          className={`header-left ${toggle ? "" : "active"}`}
          onMouseLeave={expandMenu}
          onMouseOver={expandMenuOpen}
        >
          <Link to="/dashboard" className="logo logo-normal">
            <Image src="assets/img/logo.png" alt="img" />
          </Link>
          <Link to="/dashboard" className="logo logo-white">
            <Image src="assets/img/logo-white.png" alt="img" />
          </Link>
          <Link to="/dashboard" className="logo-small">
            <Image src="assets/img/logo-small.png" alt="img" />
          </Link>
        </div>
        {/* /Logo */}
        <Link
          id="mobile_btn"
          className="mobile_btn"
          to="#"
          onClick={sidebarOverlay}
        >
          <span className="bar-icon">
            <span />
            <span />
            <span />
          </span>
        </Link>
        {/* Header Menu */}
        <ul className="nav user-menu modern-nav-menu ms-auto">
          {/* Action Buttons */}
          <li className="nav-item nav-action-buttons">
            <div className="action-buttons d-flex align-items-center gap-3">
              {/* Add New Button */}
              <button 
                className="btn action-btn-primary d-flex align-items-center px-4 py-2"
                onClick={() => setShowAddOptionsModal(true)}
              >
                <Plus size={16} className="me-2" />
                Add New
              </button>

              {/* POS Button */}
              <Link to="/pos" className="btn action-btn-secondary d-flex align-items-center px-4 py-2 text-decoration-none">
                <FeatherIcon icon="credit-card" size={16} className="me-2" />
                POS
              </Link>
            </div>
          </li>
          {/* Fullscreen */}
          <li className="nav-item nav-item-box">
            <Link
              to="#"
              id="btnFullscreen"
              onClick={() => toggleFullscreen()}
              className="modern-icon-btn"
              title={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
            >
              <FeatherIcon icon="maximize" size={20} />
            </Link>
          </li>

          {/* Notifications */}
          <li className="nav-item nav-item-box">
            <ModernNotifications />
          </li>

          {/* Settings */}
          <li className="nav-item dropdown main-drop">
            <Dropdown>
              <Dropdown.Toggle
                variant="link"
                className="nav-link userset dropdown-toggle-no-arrow"
                id="dropdown-user"
              >
                <span className="user-info">
                  <span className="user-letter">
                    <Image
                      src={getProfileImage()}
                      alt="Profile"
                      className="img-fluid"
                    />
                  </span>
                  <span className="user-detail">
                    <span className="user-name">{user?.name || 'User'}</span>
                    <span className="user-role">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</span>
                  </span>
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="menu-drop-user">
              <div className="profilename">
                <div className="profileset">
                  <span className="user-img">
                    <Image
                      src={getProfileImage()}
                      alt="Profile"
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        display: 'block',
                        border: 'none',
                        outline: 'none'
                      }}
                    />
                    <span className="status online" />
                  </span>
                  <div className="profilesets">
                    <h6>{user?.name || 'User'}</h6>
                    <h5>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</h5>
                  </div>
                </div>
                <hr className="m-0" />
                <Link className="dropdown-item" to={route.profile}>
                  <i className="me-2" data-feather="user" /> My Profile
                </Link>
                <hr className="m-0" />
                <button 
                  className="dropdown-item logout pb-0 border-0 bg-transparent w-100 text-start" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  style={{ cursor: isLoggingOut ? 'not-allowed' : 'pointer' }}
                >
                  <Image
                    src="assets/img/icons/log-out.svg"
                    alt="img"
                    className="me-2"
                  />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
              </Dropdown.Menu>
            </Dropdown>
          </li>
        </ul>
        {/* /Header Menu */}
        {/* Mobile Menu */}
        <div className="dropdown mobile-user-menu">
          <Link
            to="#"
            className="nav-link dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fa fa-ellipsis-v" />
          </Link>
          <div className="dropdown-menu dropdown-menu-right">
            <Link className="dropdown-item" to="profile">
              My Profile
            </Link>
            <button 
              className="dropdown-item border-0 bg-transparent w-100 text-start" 
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{ cursor: isLoggingOut ? 'not-allowed' : 'pointer' }}
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
        {/* /Mobile Menu */}
      </div>
      <AddOptionsModal 
        show={showAddOptionsModal} 
        handleClose={() => setShowAddOptionsModal(false)} 
        navigate={navigate} 
        route={route} 
      />
    </>
  );
};

const AddOptionsModal = ({ show, handleClose, navigate, route }) => {
  const addOptions = [
    {
      name: 'Product',
      icon: 'package',
      route: route.addproduct,
      color: '#00b894'
    },
    {
      name: 'Purchase',
      icon: 'shopping-cart',
      route: route.purchaselist,
      color: '#0984e3'
    },
    {
      name: 'Sale',
      icon: 'shopping-bag',
      route: route.saleslist,
      color: '#00cec9'
    },
    {
      name: 'Customer',
      icon: 'users',
      route: route.customers,
      color: '#ffeaa7'
    },
    {
      name: 'Supplier',
      icon: 'truck',
      route: route.suppliers,
      color: '#fd79a8'
    },
    {
      name: 'Category',
      icon: 'layers',
      route: route.categorylist,
      color: '#6c5ce7'
    }
  ];

  const handleOptionClick = (optionRoute) => {
    handleClose();
    navigate(optionRoute);
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add New</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '2rem' }}>
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            maxWidth: '100%'
          }}
        >
          {addOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleOptionClick(option.route)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem 1rem',
                borderRadius: '12px',
                border: '1px solid #e9ecef',
                backgroundColor: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
                minHeight: '120px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              className="add-option-card"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: `${option.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem'
                }}
              >
                <FeatherIcon 
                  icon={option.icon} 
                  size={24} 
                  color={option.color}
                />
              </div>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#2d3748',
                  lineHeight: '1.2'
                }}
              >
                {option.name}
              </span>
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default Header;

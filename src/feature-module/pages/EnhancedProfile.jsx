import React, { useState, useEffect } from "react";
import Image from "../../core/img/image";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  getCurrentUser, 
  updateProfile, 
  uploadProfileImage, 
  validateImageFile, 
  getProfileImageUrl, 
  getDefaultAvatar,
  validatePhoneNumber
} from "../../services/userService";
import { EyeOff, Eye } from "feather-icons-react";

const EnhancedProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await getCurrentUser();
      const userData = response.user;
      setUser(userData);
      
      // Split name into first and last name
      const nameParts = (userData.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      setFormData({
        firstName,
        lastName,
        username: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        password: ''
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    // Password validation (only if provided)
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'firstName':
        if (!value.trim()) {
          newErrors.firstName = 'First name is required';
        } else {
          delete newErrors.firstName;
        }
        break;
      case 'lastName':
        if (!value.trim()) {
          newErrors.lastName = 'Last name is required';
        } else {
          delete newErrors.lastName;
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (!value.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!validatePhoneNumber(value)) {
          newErrors.phone = 'Please enter a valid phone number';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'username':
        if (!value.trim()) {
          newErrors.username = 'Username is required';
        } else {
          delete newErrors.username;
        }
        break;
      case 'password':
        if (value && value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters long';
        } else {
          delete newErrors.password;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate field on change if it has been touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  // Handle field blur for validation
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, e.target.value);
  };

  // Handle profile image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateImageFile(file);
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(error.message);
      e.target.value = '';
    }
  };

  // Upload profile image
  const handleImageUpload = async () => {
    if (!profileImage) return null;

    try {
      setUploading(true);
      const response = await uploadProfileImage(profileImage);
      toast.success('Profile image uploaded successfully');
      return response.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload profile image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    try {
      setUpdating(true);
      
      // First upload image if there's a new one
      let imageUrl = user?.profileImage;
      if (profileImage) {
        const uploadedImageUrl = await handleImageUpload();
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }

      // Prepare update data (excluding address)
      const updateData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        profileImage: imageUrl
      };

      // Only include password if it's provided
      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
      }

      const response = await updateProfile(updateData);
      
      // Update local user data
      setUser(response.user);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Dispatch custom event to notify Header component
      const profileUpdateEvent = new CustomEvent('profileUpdated', {
        detail: { user: response.user }
      });
      window.dispatchEvent(profileUpdateEvent);
      
      // Reset form state
      setProfileImage(null);
      setImagePreview(null);
      setFormData(prev => ({ ...prev, password: '' }));
      
      // Enhanced success toast
      const originalName = `${formData.firstName} ${formData.lastName}`.trim();
      const updatedFields = [];
      if (originalName !== (user?.name || '')) updatedFields.push('name');
      if (formData.email !== user?.email) updatedFields.push('email');
      if (formData.phone !== user?.phone) updatedFields.push('phone');
      if (formData.username !== user?.username) updatedFields.push('username');
      if (profileImage) updatedFields.push('profile image');
      if (formData.password && formData.password.trim()) updatedFields.push('password');
      
      const fieldsText = updatedFields.length > 0 
        ? ` (${updatedFields.join(', ')})` 
        : '';
      
      toast.success(`Profile updated successfully${fieldsText}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  // Get current profile image URL
  const getCurrentProfileImage = () => {
    if (imagePreview) return imagePreview;
    if (user?.profileImage) return getProfileImageUrl(user.profileImage);
    return getDefaultAvatar();
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4>Profile</h4>
            <h6>User Profile</h6>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="profile-set">
              <div className="profile-head"></div>
              <div className="profile-top">
                <div className="profile-content">
                  <div className="profile-contentimg">
                    <Image
                      src={getCurrentProfileImage()}
                      alt="Profile"
                      id="blah"
                    />
                    <div className="profileupload">
                      <input 
                        type="file" 
                        id="imgInp" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <a href="#" onClick={(e) => e.preventDefault()}>
                        <Image src="assets/img/icons/edit-set.svg" alt="Edit" />
                      </a>
                    </div>
                  </div>
                  <div className="profile-contentname">
                    <h2>{user?.name || 'User'}</h2>
                    <h4>Update Your Photo and Personal Details.</h4>
                  </div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Basic Information Section */}
              <div className="card-title-head mb-4">
                <h6>
                  <i className="feather-user me-2"></i>
                  Basic Information
                </h6>
              </div>
              
              <div className="row">
                <div className="col-lg-6 col-sm-12">
                  <div className="input-blocks">
                    <label className="form-label">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="admin2"
                      required
                    />
                    {errors.firstName && (
                      <div className="invalid-feedback">{errors.firstName}</div>
                    )}
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="input-blocks">
                    <label className="form-label">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="amenyo2"
                      required
                    />
                    {errors.lastName && (
                      <div className="invalid-feedback">{errors.lastName}</div>
                    )}
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="input-blocks">
                    <label className="form-label">Email <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="admin2@tempolabs.com"
                      required
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="input-blocks">
                    <label className="form-label">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="17468314286"
                      required
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone}</div>
                    )}
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="input-blocks">
                    <label className="form-label">
                      User Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Jeffry Jordan"
                      required
                    />
                    {errors.username && (
                      <div className="invalid-feedback">{errors.username}</div>
                    )}
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="input-blocks">
                    <label className="form-label">
                      Password <span className="text-danger">*</span>
                    </label>
                    <div className="pass-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`form-control pass-input ${errors.password ? 'is-invalid' : ''}`}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Leave empty to keep current password"
                      />
                      <span 
                        className="fas toggle-password fa-eye-slash"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </span>
                    </div>
                    {errors.password && (
                      <div className="invalid-feedback">{errors.password}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Read-only fields */}
              <div className="row mt-3">
                <div className="col-lg-6 col-sm-12">
                  <div className="input-blocks">
                    <label className="form-label">Role</label>
                    <input
                      type="text"
                      className="form-control"
                      value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                      disabled
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="input-blocks">
                    <label className="form-label">Account Status</label>
                    <input
                      type="text"
                      className="form-control"
                      value={user?.active ? 'Active' : 'Inactive'}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="col-12 mt-4">
                <div className="text-end">
                  <Link to="/dashboard" className="btn btn-cancel me-2">
                    Cancel
                  </Link>
                  <button 
                    type="submit" 
                    className="btn btn-submit"
                    disabled={updating || uploading}
                  >
                    {updating ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfile;
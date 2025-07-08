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
  getDefaultAvatar 
} from "../../services/userService";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
      setFormData({
        name: userData.name || '',
        email: userData.email || ''
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

      // Update profile data
      const updateData = {
        name: formData.name,
        email: formData.email,
        profileImage: imageUrl
      };

      const response = await updateProfile(updateData);
      
      // Update local user data
      setUser(response.user);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Reset form state
      setProfileImage(null);
      setImagePreview(null);
      
      toast.success('Profile updated successfully');
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
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                    <div className="profileupload">
                      <input 
                        type="file" 
                        id="imgInp" 
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="imgInp" style={{ cursor: 'pointer' }}>
                        <Image src="assets/img/icons/edit-set.svg" alt="Edit" />
                      </label>
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
              <div className="row">
                <div className="col-lg-6 col-sm-12">
                  <div className="input-blocks">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-sm-12">
                  <div className="input-blocks">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
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
                <div className="col-12">
                  <button 
                    type="submit" 
                    className="btn btn-submit me-2"
                    disabled={updating || uploading}
                  >
                    {updating ? 'Updating...' : 'Update Profile'}
                  </button>
                  <Link to="/dashboard" className="btn btn-cancel">
                    Cancel
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
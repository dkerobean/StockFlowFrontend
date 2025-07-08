import api from '../core/api';

// Get current user profile
export const getCurrentUser = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        console.error('Error getting current user:', error);
        throw error;
    }
};

// Update user profile
export const updateProfile = async (profileData) => {
    try {
        const response = await api.put('/auth/profile', profileData);
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

// Validate phone number (basic validation)
export const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
};

// Upload profile image
export const uploadProfileImage = async (imageFile) => {
    try {
        const formData = new FormData();
        formData.append('profileImage', imageFile);
        
        const response = await api.post('/upload/profile-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error uploading profile image:', error);
        throw error;
    }
};

// Helper function to get full image URL
export const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // If it's a relative path, construct full URL using file base URL
    const baseUrl = process.env.REACT_APP_FILE_BASE_URL || 'http://localhost:3005';
    return `${baseUrl}${imagePath}`;
};

// Default avatar fallback
export const getDefaultAvatar = () => {
    return '/assets/img/profiles/avatar-01.jpg';
};

// Validate image file
export const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, JPEG, PNG, GIF, and WEBP are allowed.');
    }
    
    if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 2MB.');
    }
    
    return true;
};
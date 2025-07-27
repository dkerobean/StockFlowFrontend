// Image service for handling product images and other static images

// Helper function to get full product image URL
export const getProductImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // If it's a relative path, construct full URL using file base URL
    const baseUrl = process.env.REACT_APP_FILE_BASE_URL || 'http://localhost:3005';
    
    // Ensure the path starts with a forward slash
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    return `${baseUrl}${cleanPath}`;
};

// Get default product image fallback
export const getDefaultProductImage = () => {
    return '/assets/img/product/noimage.png';
};

// Helper function to get full profile image URL (re-exported from userService for consistency)
export const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // If it's a relative path, construct full URL using file base URL
    const baseUrl = process.env.REACT_APP_FILE_BASE_URL || 'http://localhost:3005';
    
    // Ensure the path starts with a forward slash
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    return `${baseUrl}${cleanPath}`;
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
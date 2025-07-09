import axios from 'axios';

// Use environment variable for API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
});

// Log the API configuration for debugging
console.log('🔧 API Configuration:', {
    baseURL: api.defaults.baseURL,
    envURL: process.env.REACT_APP_API_URL,
    fileBaseURL: process.env.REACT_APP_FILE_BASE_URL,
    headers: api.defaults.headers
});

// Log every request to see exactly what URL is being called
api.interceptors.request.use(
    (config) => {
        console.log('🌐 Making API request to:', config.baseURL + config.url);
        return config;
    },
    (error) => {
        console.error('🌐 Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add request interceptor to add token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
import axios from 'axios';

// Force the correct API URL - OVERRIDE any environment variables
const FORCED_API_URL = 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: FORCED_API_URL, // Force the correct URL
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
});

// Log the API configuration for debugging
console.log('🔧 API Configuration (FORCED):', {
    baseURL: api.defaults.baseURL,
    forcedURL: FORCED_API_URL,
    envURL: process.env.REACT_APP_API_URL,
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
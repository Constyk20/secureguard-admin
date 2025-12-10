import axios from 'axios';

// Debug: Log the API URL being used
console.log('🔧 Environment check:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  NODE_ENV: import.meta.env.MODE,
  PROD: import.meta.env.PROD
});

// Use the environment variable or fallback to your Render backend
const API_URL = import.meta.env.VITE_API_URL || "https://secureguard-backend.onrender.com";

console.log('🚀 Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor - Add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Added token to request');
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    
    console.log(`📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Response ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        console.log('🔒 Unauthorized - Removing token');
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
      }
      
      // Return structured error
      return Promise.reject({
        status,
        message: data?.message || `HTTP Error ${status}`,
        errors: data?.errors || [],
        data: data
      });
    } else if (error.request) {
      // Request made but no response
      console.error('🌐 Network error - No response received');
      return Promise.reject({
        status: 0,
        message: 'Cannot connect to server. Please check if backend is running.',
        details: 'No response received from server'
      });
    } else {
      // Error in request setup
      console.error('⚙️ Request setup error:', error.message);
      return Promise.reject({
        status: 0,
        message: error.message || 'Request configuration error',
      });
    }
  }
);

// Test function to check backend connection
export const testBackendConnection = async () => {
  try {
    console.log('🔌 Testing backend connection...');
    const response = await axios.get(`${API_URL}/health`, {
      timeout: 5000
    });
    console.log('✅ Backend connection successful:', response.data);
    return {
      success: true,
      data: response.data,
      url: API_URL
    };
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return {
      success: false,
      error: error.message,
      url: API_URL
    };
  }
};

export default api;
import axios from 'axios';

// Debug: Log the API URL being used
console.log('🔧 API Service Initialized');
console.log('📍 VITE_API_URL:', import.meta.env.VITE_API_URL);

// Use the environment variable or fallback
const API_URL = import.meta.env.VITE_API_URL || "https://secureguard-backend.onrender.com";

console.log('🚀 Using API URL:', API_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000,
  withCredentials: false // Important: Set to false for Render
});

// Store token functions
const tokenManager = {
  getToken: () => {
    const token = localStorage.getItem('adminToken');
    console.log('🔑 Token from localStorage:', token ? 'Present' : 'Missing');
    return token;
  },
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('adminToken', token);
      console.log('💾 Token saved to localStorage');
    }
  },
  
  removeToken: () => {
    localStorage.removeItem('adminToken');
    console.log('🗑️ Token removed from localStorage');
  },
  
  getTokenType: () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return 'no-token';
    
    try {
      // Try to decode the token to see what's in it
      const parts = token.split('.');
      if (parts.length !== 3) return 'invalid-format';
      
      const payload = JSON.parse(atob(parts[1]));
      console.log('🔍 Token payload:', payload);
      
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return 'expired';
      }
      
      return 'valid';
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return 'invalid';
    }
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Response ${response.status} from ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: originalRequest?.url
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔒 401 Unauthorized - Checking token...');
      
      const tokenType = tokenManager.getTokenType();
      console.log('🔍 Token status:', tokenType);
      
      // Clear invalid token
      tokenManager.removeToken();
      
      // Don't redirect on login page
      if (!window.location.pathname.includes('/login')) {
        console.log('🔁 Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network error - No response from server');
      if (!window.location.pathname.includes('/login')) {
        return Promise.reject({
          status: 0,
          message: 'Cannot connect to server. Please check your connection.',
          isNetworkError: true
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// Test backend connection
export const testBackendConnection = async () => {
  try {
    console.log('🔌 Testing backend connection without token...');
    const response = await axios.get(`${API_URL}/health`, { timeout: 10000 });
    return {
      success: true,
      data: response.data,
      url: API_URL
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: API_URL
    };
  }
};

// Auth service functions
export const authService = {
  login: async (credentials) => {
    try {
      console.log('🔑 Attempting login...', credentials);
      
      // First, test if backend is accessible
      const connectionTest = await testBackendConnection();
      if (!connectionTest.success) {
        throw new Error(`Cannot connect to backend: ${connectionTest.error}`);
      }
      
      // Try login endpoint
      const response = await api.post('/api/auth/login', credentials);
      
      if (response.data.success && response.data.token) {
        // Save token
        tokenManager.setToken(response.data.token);
        
        // Verify the token works
        try {
          const verifyResponse = await api.get('/api/auth/me');
          console.log('✅ Login verified:', verifyResponse.data);
          
          return {
            success: true,
            user: response.data.user || verifyResponse.data.user,
            token: response.data.token
          };
        } catch (verifyError) {
          console.error('❌ Token verification failed:', verifyError);
          tokenManager.removeToken();
          throw new Error('Login successful but token verification failed');
        }
      }
      
      throw new Error(response.data.message || 'Login failed');
      
    } catch (error) {
      console.error('❌ Login error:', error);
      tokenManager.removeToken();
      throw error;
    }
  },
  
  logout: () => {
    tokenManager.removeToken();
    window.location.href = '/login';
  },
  
  checkAuth: async () => {
    const token = tokenManager.getToken();
    if (!token) {
      return { isAuthenticated: false, reason: 'no-token' };
    }
    
    try {
      const response = await api.get('/api/auth/me');
      return {
        isAuthenticated: true,
        user: response.data.user,
        token: token
      };
    } catch (error) {
      return {
        isAuthenticated: false,
        reason: error.response?.status === 401 ? 'expired' : 'error',
        error: error.message
      };
    }
  },
  
  getTokenInfo: () => {
    return tokenManager.getTokenType();
  }
};

export default api;
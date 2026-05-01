import axios from 'axios';
import store from '../store/index.js';
import { logout, refreshTokenSuccess } from '../store/slices/authSlice.js';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true, // Important for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token using the refresh endpoint
        const response = await axios.post(
          `${axiosInstance.defaults.baseURL}/auth/refresh`,
          {},
          {
            withCredentials: true, // Important for httpOnly cookies
          }
        );

        // Server returns { success: true, data: { accessToken: '...' } }
        const token = response.data?.data?.accessToken;
        if (!token) throw new Error('No access token in refresh response');

        // Update Redux store with new token
        store.dispatch(refreshTokenSuccess({ token }));

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout user
        store.dispatch(logout());
        // Use navigate instead of window.location for React Router
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;

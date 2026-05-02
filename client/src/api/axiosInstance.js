import axios from 'axios';
import store from '../store/index.js';
import { logout, refreshTokenSuccess } from '../store/slices/authSlice.js';

// Base URL: full backend host (no /api suffix — paths below carry /api/ themselves)
// Dev:    VITE_API_BASE_URL=http://localhost:5000  → direct to local server
// Prod:   VITE_API_BASE_URL=https://your-api.vercel.app → deployed backend
// Vercel: leave VITE_API_BASE_URL empty → relative /api/* paths hit Vercel rewrite
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  withCredentials: true, // Important for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor (token refresh)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use axiosInstance baseURL with full API path
        const response = await axios.post(
          `${axiosInstance.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const token = response.data?.data?.accessToken;

        if (!token) throw new Error('No access token');

        store.dispatch(refreshTokenSuccess({ token }));

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);

      } catch (err) {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
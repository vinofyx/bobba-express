import axios from 'axios';
import store from '../store/index.js';
import { logout, refreshTokenSuccess } from '../store/slices/authSlice.js';

// baseURL strategy:
//   Dev:  VITE_API_BASE_URL is empty → baseURL = '/api' → Vite proxy forwards
//         /api/* to http://localhost:5000/api/* (same-origin, no CORS issues)
//   Prod: VITE_API_BASE_URL=https://your-api.onrender.com/api → direct to backend
// API files use paths like /customers, /auth/login (NO /api/ prefix)
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Always use the same baseURL for refresh
        const response = await axios.post(
          `${axiosInstance.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const token = response.data?.data?.accessToken;
        if (!token) throw new Error('No access token returned');

        store.dispatch(refreshTokenSuccess({ token }));
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      } catch {
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

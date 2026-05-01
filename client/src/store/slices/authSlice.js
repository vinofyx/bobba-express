import { createSlice } from '@reduxjs/toolkit';

// Load token and user from localStorage — sanitize both values on startup
const rawToken = localStorage.getItem('token');
// Guard against literal "undefined" stored by a broken refresh interceptor
const savedToken = (rawToken && rawToken !== 'undefined') ? rawToken : null;
if (!savedToken && rawToken) localStorage.removeItem('token'); // wipe bad value

let savedUserObj = null;
try {
  const raw = localStorage.getItem('user');
  savedUserObj = raw ? JSON.parse(raw) : null;
  // Wipe user if there's no valid token — they go together
  if (!savedToken) { localStorage.removeItem('user'); savedUserObj = null; }
} catch {
  localStorage.removeItem('user');
  savedUserObj = null;
}

const initialState = {
  user:            savedUserObj,
  token:           savedToken,
  isAuthenticated: !!(savedToken && savedUserObj),
  loading:         false,
  error:           null,
  role:            savedUserObj?.role || null,
  registered:      false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.user?.role || null;
      state.error = null;
      state.registered = false; // Reset registered flag on login
      
      // Save token and user to localStorage
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.role = null;
      state.registered = false;
      
      // Clear localStorage on failed login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    logout: (state) => {
      // Clear both token and user from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      state.error = null;
      state.registered = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setRegistered: (state, action) => {
      state.registered = action.payload;
    },
    clearRegistered: (state) => {
      state.registered = false;
    },
    refreshTokenSuccess: (state, action) => {
      state.token = action.payload.token;
      // Update token in localStorage
      localStorage.setItem('token', action.payload.token);
      // Don't change user state on refresh
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  setRegistered,
  clearRegistered,
  refreshTokenSuccess,
} = authSlice.actions;

export default authSlice.reducer;

// Also export as named export for debugging
export { authSlice };

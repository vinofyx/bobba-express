import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setRegistered,
  clearRegistered,
} from '../slices/authSlice.js';
import { authAPI } from '../../api/auth.api.js';

// Login action
export const loginUser = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());

    // authAPI.login returns response.data (the full server body):
    // { success, message, data: { user, accessToken } }
    const response = await authAPI.login(credentials);

    dispatch(loginSuccess({
      user:  response.data.user,
      token: response.data.accessToken,
    }));

    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    dispatch(loginFailure(errorMessage));
    throw error;
  }
};

// Register action
export const registerUser = (userData) => async (dispatch) => {
  try {
    dispatch(loginStart());

    const response = await authAPI.register(userData);

    dispatch(loginSuccess({
      user:  response.data.user,
      token: response.data.accessToken,
    }));
    dispatch(setRegistered(true));

    return response;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
    dispatch(loginFailure(errorMessage));
    throw error;
  }
};

// Clear registered flag
export const clearRegisteredFlag = () => (dispatch) => {
  dispatch(clearRegistered());
};

// Logout action — calls API to clear refresh token on server, then clears local state
export const logoutUser = () => async (dispatch) => {
  try {
    await authAPI.logout(); // clears httpOnly refresh cookie on server
  } catch (_) {
    // ignore network errors — still clear local state
  } finally {
    dispatch(logout());
  }
};

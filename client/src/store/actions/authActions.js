import {
  loginStart,
  loginSuccess,
  loginFailure,
  setRegistered,
  clearRegistered,
} from '../slices/authSlice.js';
import { authAPI } from '../../api/auth.api.js';

// Login action
export const loginUser = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());
    
    const response = await authAPI.login(credentials);
    
    dispatch(loginSuccess({
      user: response.user,
      token: response.token
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
      user: response.user,
      token: response.token
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

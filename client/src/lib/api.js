// API utility functions and constants

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  CUSTOMERS: {
    GET_ALL: '/customers',
    GET_BY_ID: '/customers/:id',
    CREATE: '/customers',
    UPDATE: '/customers/:id',
    DELETE: '/customers/:id',
    SEARCH: '/customers/search',
  },
  PICKUPS: {
    GET_ALL: '/pickups',
    GET_BY_ID: '/pickups/:id',
    CREATE: '/pickups',
    UPDATE: '/pickups/:id',
    UPDATE_STATUS: '/pickups/:id/status',
    BY_STATUS: '/pickups/by-status',
    BY_AGENT: '/pickups/by-agent',
    ASSIGN_AGENT: '/pickups/:id/assign',
  },
  PARCELS: {
    GET_ALL: '/parcels',
    GET_BY_ID: '/parcels/:id',
    CREATE: '/parcels',
    UPDATE_STATUS: '/parcels/:id/status',
    BY_STATUS: '/parcels/by-status',
    BY_CUSTOMER: '/parcels/by-customer',
    SEARCH_TRACKING: '/parcels/search',
    UPDATE: '/parcels/:id',
    HISTORY: '/parcels/:id/history',
  },
  SHIPMENTS: {
    GET_ALL: '/shipments',
    GET_BY_ID: '/shipments/:id',
    CREATE: '/shipments',
    DISPATCH: '/shipments/:id/dispatch',
    RECEIVE: '/shipments/:id/receive',
    BY_STATUS: '/shipments/by-status',
    BY_VEHICLE: '/shipments/by-vehicle',
    BY_DRIVER: '/shipments/by-driver',
    ACTIVE: '/shipments/active',
    CANCEL: '/shipments/:id/cancel',
    HISTORY: '/shipments/:id/history',
  },
  TRACKING: {
    GET_BY_TRACKING_ID: '/tracking/:trackingId',
    CREATE_EVENT: '/tracking',
    BY_PARCEL: '/tracking/parcel/:parcelId',
  },
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

// API error types
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
};

// Utility function to check if error is network related
export const isNetworkError = (error) => {
  return !error.response && error.code !== 'ECONNABORTED';
};

// Utility function to get error message from API response
export const getErrorMessage = (error) => {
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection.';
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.errors) {
    return error.response.data.errors.join(', ');
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Utility function to check if error is authentication related
export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};

// Utility function to check if error is validation related
export const isValidationError = (error) => {
  return error.response?.status === 400 || error.response?.status === 422;
};

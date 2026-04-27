import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';

// Configure Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here as needed
    // customers: customerReducer,
    // pickups: pickupReducer,
    // parcels: parcelReducer,
    // shipments: shipmentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredPaths: ['register'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export default store;

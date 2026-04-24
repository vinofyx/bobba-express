// Test Redux imports
import authReducer from './store/slices/authSlice.js';
import store from './store/index.js';

console.log('Testing Redux imports...');
console.log('authReducer:', authReducer);
console.log('store:', store);
console.log('store state:', store.getState());

export default function testRedux() {
  console.log('Redux test completed');
}

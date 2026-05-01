const axios = require('axios');

async function testAuth() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@bobba.com',
      password: 'Admin@1234'
    }, { withCredentials: true });
    
    console.log('✅ Auth successful');
    console.log('Token:', response.data.data.accessToken);
    
  } catch (error) {
    console.error('❌ Auth failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAuth();

// Load .env from the server/ directory regardless of where Node is invoked from
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const app  = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log(`[Server] JWT_SECRET loaded: ${!!process.env.JWT_SECRET}`);
  console.log(`[Server] MONGODB_URI loaded: ${!!process.env.MONGODB_URI}`);
});

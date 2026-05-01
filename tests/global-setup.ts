import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up BobbaExpress E2E tests...');
  
  // Set up test environment
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await page.goto('http://localhost:3000/health');
    
    const healthResponse = await page.textContent('body');
    if (healthResponse?.includes('success')) {
      console.log('✅ Server is ready');
    } else {
      throw new Error('Server health check failed');
    }
    
    // Check if database is ready
    console.log('🗄️ Checking database connection...');
    await page.goto('http://localhost:3000/api/health');
    
    const dbHealthResponse = await page.textContent('body');
    if (dbHealthResponse?.includes('database')) {
      console.log('✅ Database is ready');
    } else {
      console.log('⚠️ Database might not be ready, proceeding anyway...');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('✅ E2E test setup completed successfully!');
}

export default globalSetup;

import { test, expect } from '@playwright/test';

test.describe('Customers - Create Customer', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@bobba.com');
    await page.fill('input[name="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create new customer successfully', async ({ page }) => {
    await page.goto('/customers');
    await page.click('button:has-text("Add Customer")');
    
    // Fill customer form
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '01234567890');
    
    // Fill address
    await page.fill('input[name="address.line1"]', '123 Main Street');
    await page.fill('input[name="address.city"]', 'Kuala Lumpur');
    await page.fill('input[name="address.state"]', 'Kuala Lumpur');
    await page.fill('input[name="address.postalCode"]', '500001');
    
    await page.click('button:has-text("Create Customer")');
    
    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Customer created successfully');
    
    // Verify customer appears in list
    await expect(page.locator('.customer-list:has-text("John Doe")')).toBeVisible();
  });

  test('should validate customer form fields', async ({ page }) => {
    await page.goto('/customers');
    await page.click('button:has-text("Add Customer")');
    
    // Try to submit empty form
    await page.click('button:has-text("Create Customer")');
    
    // Verify validation errors
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Name is required');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/customers');
    await page.click('button:has-text("Add Customer")');
    
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button:has-text("Create Customer")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid email format');
  });
});

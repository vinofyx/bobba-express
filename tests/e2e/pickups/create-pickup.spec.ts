import { test, expect } from '@playwright/test';

test.describe('Pickups - Create Pickup', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@bobba.com');
    await page.fill('input[name="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create new pickup successfully', async ({ page }) => {
    await page.goto('/pickups');
    await page.click('button:has-text("Schedule Pickup")');
    
    // Select customer
    await page.selectOption('select[name="customerId"]', { label: 'John Doe' });
    
    // Fill pickup details
    await page.fill('input[name="address.line1"]', '456 Pickup Street');
    await page.fill('input[name="address.city"]', 'Kuala Lumpur');
    await page.fill('input[name="address.state"]', 'Kuala Lumpur');
    await page.fill('input[name="address.postalCode"]', '502001');
    
    // Set schedule
    await page.fill('input[name="scheduledDate"]', '2025-05-01');
    await page.selectOption('select[name="pickupTime"]', '10:00 AM');
    
    // Set parcel count
    await page.fill('input[name="parcelCount"]', '3');
    
    await page.click('button:has-text("Schedule Pickup")');
    
    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Pickup scheduled successfully');
    
    // Verify pickup appears in list
    await expect(page.locator('.pickup-list:has-text("PU-2025")')).toBeVisible();
  });

  test('should validate pickup form fields', async ({ page }) => {
    await page.goto('/pickups');
    await page.click('button:has-text("Schedule Pickup")');
    
    // Try to submit empty form
    await page.click('button:has-text("Schedule Pickup")');
    
    // Verify validation errors
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Customer is required');
  });

  test('should validate parcel count', async ({ page }) => {
    await page.goto('/pickups');
    await page.click('button:has-text("Schedule Pickup")');
    
    await page.selectOption('select[name="customerId"]', { label: 'John Doe' });
    await page.fill('input[name="parcelCount"]', '0');
    await page.click('button:has-text("Schedule Pickup")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Parcel count must be at least 1');
  });

  test('should validate future date', async ({ page }) => {
    await page.goto('/pickups');
    await page.click('button:has-text("Schedule Pickup")');
    
    await page.selectOption('select[name="customerId"]', { label: 'John Doe' });
    await page.fill('input[name="scheduledDate"]', '2020-01-01'); // Past date
    await page.click('button:has-text("Schedule Pickup")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Scheduled date must be in the future');
  });
});

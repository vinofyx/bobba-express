import { test, expect } from '@playwright/test';

test.describe('Parcels - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@bobba.com');
    await page.fill('input[name="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create and manage parcel complete flow', async ({ page }) => {
    // Navigate to parcels
    await page.goto('/parcels');
    
    // Create new parcel
    await page.click('button:has-text("Add Parcel")');
    
    // Select pickup
    await page.selectOption('select[name="pickupId"]', { label: 'PU-2025' });
    
    // Fill parcel details
    await page.fill('input[name="weight"]', '2.5');
    await page.fill('input[name="dimensions.length"]', '20');
    await page.fill('input[name="dimensions.width"]', '15');
    await page.fill('input[name="dimensions.height"]', '10');
    await page.selectOption('select[name="type"]', 'package');
    
    // Fill sender info
    await page.fill('input[name="sender.name"]', 'John Sender');
    await page.fill('input[name="sender.phone"]', '01234567891');
    await page.fill('input[name="sender.address.line1"]', '789 Sender Street');
    await page.fill('input[name="sender.address.city"]', 'Kuala Lumpur');
    await page.fill('input[name="sender.address.state"]', 'Kuala Lumpur');
    
    // Fill receiver info
    await page.fill('input[name="receiver.name"]', 'Jane Receiver');
    await page.fill('input[name="receiver.phone"]', '01234567892');
    await page.fill('input[name="receiver.address.line1"]', '321 Receiver Street');
    await page.fill('input[name="receiver.address.city"]', 'Johor Bahru');
    await page.fill('input[name="receiver.address.state"]', 'Johor');
    
    await page.click('button:has-text("Create Parcel")');
    
    // Verify parcel created
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Parcel created successfully');
    
    // Get tracking ID
    const trackingId = await page.locator('.tracking-id').textContent();
    expect(trackingId).toMatch(/^BE\d{6}$/);
    
    // Generate label
    await page.click('button:has-text("Generate Label")');
    await expect(page.locator('.label-preview')).toBeVisible();
    
    // Update parcel
    await page.click('button:has-text("Edit Parcel")');
    await page.fill('input[name="weight"]', '3.0');
    await page.click('button:has-text("Update Parcel")');
    
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Parcel updated successfully');
    
    // Verify tracking page shows updated parcel
    await page.goto(`/tracking`);
    await page.fill('input[name="trackingId"]', trackingId);
    await page.click('button:has-text("Track")');
    
    await expect(page.locator('.tracking-results')).toBeVisible();
    await expect(page.locator('.tracking-results')).toContainText(trackingId);
    await expect(page.locator('.tracking-results')).toContainText('3.0 kg');
  });

  test('should validate parcel creation form', async ({ page }) => {
    await page.goto('/parcels');
    await page.click('button:has-text("Add Parcel")');
    
    // Try to submit empty form
    await page.click('button:has-text("Create Parcel")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Pickup is required');
  });

  test('should validate weight field', async ({ page }) => {
    await page.goto('/parcels');
    await page.click('button:has-text("Add Parcel")');
    
    await page.selectOption('select[name="pickupId"]', { label: 'PU-2025' });
    await page.fill('input[name="weight"]', '0');
    await page.click('button:has-text("Create Parcel")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Weight must be greater than 0');
  });

  test('should validate receiver address', async ({ page }) => {
    await page.goto('/parcels');
    await page.click('button:has-text("Add Parcel")');
    
    await page.selectOption('select[name="pickupId"]', { label: 'PU-2025' });
    await page.fill('input[name="weight"]', '2.5');
    // Leave receiver address empty
    await page.click('button:has-text("Create Parcel")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Receiver information is incomplete');
  });
});

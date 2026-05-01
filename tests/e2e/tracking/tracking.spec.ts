import { test, expect } from '@playwright/test';

test.describe('Tracking - Public Tracking', () => {
  test('should track parcel with valid ID', async ({ page }) => {
    await page.goto('/tracking');
    
    await page.fill('input[name="trackingId"]', 'BE001234');
    await page.click('button:has-text("Track")');
    
    await expect(page.locator('.tracking-results')).toBeVisible();
    await expect(page.locator('.timeline')).toBeVisible();
    
    // Verify timeline steps
    await expect(page.locator('.timeline-step')).toHaveCount(5);
    await expect(page.locator('.timeline-step:has-text("Picked Up")')).toBeVisible();
    await expect(page.locator('.timeline-step:has-text("At Warehouse")')).toBeVisible();
    await expect(page.locator('.timeline-step:has-text("In Transit")')).toBeVisible();
    await expect(page.locator('.timeline-step:has-text("Out for Delivery")')).toBeVisible();
    await expect(page.locator('.timeline-step:has-text("Delivered")')).toBeVisible();
  });

  test('should show error for invalid tracking ID', async ({ page }) => {
    await page.goto('/tracking');
    
    await page.fill('input[name="trackingId"]', 'INVALID123');
    await page.click('button:has-text("Track")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Parcel not found');
  });

  test('should validate empty tracking ID', async ({ page }) => {
    await page.goto('/tracking');
    
    await page.click('button:has-text("Track")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Enter tracking number');
  });

  test('should show sender/receiver info with partial masking', async ({ page }) => {
    await page.goto('/tracking');
    
    await page.fill('input[name="trackingId"]', 'BE001234');
    await page.click('button:has-text("Track")');
    
    await expect(page.locator('.sender-info')).toBeVisible();
    await expect(page.locator('.receiver-info')).toBeVisible();
    
    // Verify phone numbers are masked
    const phoneElements = page.locator('.phone-number');
    for (let i = 0; i < await phoneElements.count(); i++) {
      const phone = await phoneElements.nth(i).textContent();
      expect(phone).toMatch(/\d{4}XXXX/);
    }
  });

  test('should display ETA for in-transit parcels', async ({ page }) => {
    await page.goto('/tracking');
    
    await page.fill('input[name="trackingId"]', 'BE001234');
    await page.click('button:has-text("Track")');
    
    await expect(page.locator('.eta-display')).toBeVisible();
    await expect(page.locator('.eta-display')).toContainText('Estimated delivery');
  });

  test('should generate shareable link', async ({ page }) => {
    await page.goto('/tracking');
    
    await page.fill('input[name="trackingId"]', 'BE001234');
    await page.click('button:has-text("Track")');
    
    await expect(page.locator('.share-link')).toBeVisible();
    await expect(page.locator('.share-link')).toContainText('/track?id=BE001234');
  });

  test('should download PDF tracking information', async ({ page }) => {
    await page.goto('/tracking');
    
    await page.fill('input[name="trackingId"]', 'BE001234');
    await page.click('button:has-text("Track")');
    
    // Test PDF download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download PDF")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/tracking.*\.pdf/i);
  });

  test('should subscribe to email updates', async ({ page }) => {
    await page.goto('/tracking');
    
    await page.fill('input[name="trackingId"]', 'BE001234');
    await page.click('button:has-text("Track")');
    
    await page.fill('input[placeholder*="email"]', 'test@example.com');
    await page.click('button:has-text("Subscribe")');
    
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Successfully subscribed');
  });

  test('should show all steps green for delivered parcel', async ({ page }) => {
    await page.goto('/tracking');
    
    // Use delivered parcel tracking ID
    await page.fill('input[name="trackingId"]', 'BE001235');
    await page.click('button:has-text("Track")');
    
    await expect(page.locator('.tracking-results')).toBeVisible();
    
    // Verify all timeline steps are completed
    const completedSteps = page.locator('.timeline-step.completed');
    await expect(completedSteps).toHaveCount(5);
    
    // Verify delivery date is shown
    await expect(page.locator('.delivery-date')).toBeVisible();
    
    // Verify no ETA for delivered parcels
    await expect(page.locator('.eta-display')).not.toBeVisible();
  });

  test('should handle tracking via URL parameter', async ({ page }) => {
    // Test direct tracking link
    await page.goto('/tracking?id=BE001234');
    
    await expect(page.locator('.tracking-results')).toBeVisible();
    await expect(page.locator('.tracking-results')).toContainText('BE001234');
  });

  test('should validate email format for subscription', async ({ page }) => {
    await page.goto('/tracking');
    
    await page.fill('input[name="trackingId"]', 'BE001234');
    await page.click('button:has-text("Track")');
    
    await page.fill('input[placeholder*="email"]', 'invalid-email');
    await page.click('button:has-text("Subscribe")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Please enter a valid email address');
  });
});

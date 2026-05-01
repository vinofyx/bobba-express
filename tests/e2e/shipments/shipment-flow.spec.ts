import { test, expect } from '@playwright/test';

test.describe('Shipments - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@bobba.com');
    await page.fill('input[name="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create and complete shipment flow', async ({ page }) => {
    // Navigate to shipments
    await page.goto('/shipments');
    
    // Create new shipment
    await page.click('button:has-text("Create Shipment")');
    
    // Set route
    await page.selectOption('select[name="route.origin.city"]', 'Kuala Lumpur');
    await page.selectOption('select[name="route.destination.city"]', 'Johor Bahru');
    
    // Assign driver
    await page.selectOption('select[name="driver.userId"]', { label: 'Rajan Kumar' });
    
    // Set vehicle
    await page.fill('input[name="vehicle.number"]', 'WXY 1234');
    await page.selectOption('select[name="vehicle.type"]', 'van');
    
    // Set departure time
    await page.fill('input[name="departureTime"]', '2025-05-01T08:00');
    
    // Add parcels
    await page.click('button:has-text("Add Parcels")');
    await page.click('.parcel-item:has-text("BE001234") .add-parcel');
    await page.click('.parcel-item:has-text("BE001235") .add-parcel');
    await page.click('.parcel-item:has-text("BE001236") .add-parcel');
    await page.click('button:has-text("Confirm Selection")');
    
    await page.click('button:has-text("Create Shipment")');
    
    // Verify shipment created
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Shipment created successfully');
    
    // Get shipment ID
    const shipmentId = await page.locator('.shipment-id').textContent();
    expect(shipmentId).toMatch(/^SH-2025-\d{3}$/);
    
    // Verify parcel statuses updated
    await page.goto('/parcels');
    const inTransitParcels = page.locator('.parcel-item:has(.status:has-text("In Transit"))');
    await expect(inTransitParcels).toHaveCount(3);
    
    // Generate manifest
    await page.goto('/shipments');
    await page.click(`.shipment-item:has-text("${shipmentId}") button:has-text("Generate Manifest")`);
    
    await expect(page.locator('.manifest-preview')).toBeVisible();
    await expect(page.locator('.manifest-preview')).toContainText(shipmentId);
    await expect(page.locator('.manifest-preview')).toContainText('3 parcels');
    
    // Mark as delivered
    await page.click(`.shipment-item:has-text("${shipmentId}") button:has-text("Mark Delivered")`);
    
    // Fill delivery form
    await page.setInputFiles('input[name="photoProof"]', 'test-files/delivery-proof.jpg');
    await page.fill('input[name="recipientName"]', 'Siti Aminah');
    
    // Add signature
    const signatureCanvas = page.locator('#signatureCanvas');
    if (await signatureCanvas.isVisible()) {
      await signatureCanvas.hover({ position: { x: 10, y: 10 } });
      await page.mouse.down();
      await page.mouse.move(50, 50);
      await page.mouse.up();
    }
    
    await page.fill('textarea[name="note"]', 'Delivered to recipient at office entrance');
    await page.click('button:has-text("Complete Delivery")');
    
    // Verify delivery completed
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.success-message')).toContainText('Delivery completed successfully');
    
    // Verify shipment status
    await page.reload();
    await expect(page.locator(`.shipment-item:has-text("${shipmentId}") .status`)).toContainText('Completed');
    
    // Verify invoice generated
    await expect(page.locator('.invoice-modal')).toBeVisible();
    await expect(page.locator('.invoice-id')).toContainText('INV-');
    
    // Verify tracking page shows delivered status
    await page.goto('/tracking');
    await page.fill('input[name="trackingId"]', 'BE001234');
    await page.click('button:has-text("Track")');
    
    await expect(page.locator('.tracking-results')).toBeVisible();
    await expect(page.locator('.timeline-step.completed')).toHaveCount(5);
    await expect(page.locator('.timeline-step:has-text("Delivered").completed')).toBeVisible();
  });

  test('should validate shipment creation form', async ({ page }) => {
    await page.goto('/shipments');
    await page.click('button:has-text("Create Shipment")');
    
    // Try to submit empty form
    await page.click('button:has-text("Create Shipment")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Route information is required');
  });

  test('should validate driver assignment', async ({ page }) => {
    await page.goto('/shipments');
    await page.click('button:has-text("Create Shipment")');
    
    await page.selectOption('select[name="route.origin.city"]', 'Kuala Lumpur');
    await page.selectOption('select[name="route.destination.city"]', 'Johor Bahru');
    // Don't select driver
    await page.click('button:has-text("Create Shipment")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Driver assignment is required');
  });

  test('should validate parcel selection', async ({ page }) => {
    await page.goto('/shipments');
    await page.click('button:has-text("Create Shipment")');
    
    await page.selectOption('select[name="route.origin.city"]', 'Kuala Lumpur');
    await page.selectOption('select[name="route.destination.city"]', 'Johor Bahru');
    await page.selectOption('select[name="driver.userId"]', { label: 'Rajan Kumar' });
    await page.fill('input[name="vehicle.number"]', 'WXY 1234');
    await page.fill('input[name="departureTime"]', '2025-05-01T08:00');
    // Don't add parcels
    await page.click('button:has-text("Create Shipment")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('At least one parcel is required');
  });

  test('should validate departure time', async ({ page }) => {
    await page.goto('/shipments');
    await page.click('button:has-text("Create Shipment")');
    
    await page.selectOption('select[name="route.origin.city"]', 'Kuala Lumpur');
    await page.selectOption('select[name="route.destination.city"]', 'Johor Bahru');
    await page.selectOption('select[name="driver.userId"]', { label: 'Rajan Kumar' });
    await page.fill('input[name="vehicle.number"]', 'WXY 1234');
    await page.fill('input[name="departureTime"]', '2020-01-01T08:00'); // Past time
    await page.click('button:has-text("Create Shipment")');
    
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Departure time must be in the future');
  });
});

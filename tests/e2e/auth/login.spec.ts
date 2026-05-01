import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsAgent, verifyErrorMessage } from '../../helpers/auth.helper';

test.describe('Authentication - Login', () => {
  test('should login as admin successfully', async ({ page }) => {
    await loginAsAdmin(page);
    
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should login as agent successfully', async ({ page }) => {
    await loginAsAgent(page);
    
    await expect(page.locator('h1')).toContainText('Agent Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await verifyErrorMessage(page, 'Invalid credentials');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('button[type="submit"]');
    
    await verifyErrorMessage(page, 'Email is required');
  });
});

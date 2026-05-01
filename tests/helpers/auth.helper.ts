import { Page, expect } from '@playwright/test'

export async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', 'admin@bobba.com')
  await page.fill('[name="password"]', 'Admin@1234')
  await page.click('[type="submit"]')
  await page.waitForURL('/dashboard')
}

export async function loginAsAgent(page: Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', 'agent@bobba.com')
  await page.fill('[name="password"]', 'Agent@1234')
  await page.click('[type="submit"]')
  await page.waitForURL('/agent/dashboard')
}

export async function loginAsCustomer(page: Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', 'customer@bobba.com')
  await page.fill('[name="password"]', 'Customer@1234')
  await page.click('[type="submit"]')
  await page.waitForURL('/customer/dashboard')
}

export async function logout(page: Page) {
  await page.click('button:has-text("Logout")')
  await page.waitForURL('/login')
}

export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [fieldName, value] of Object.entries(formData)) {
    const input = page.locator(`[name="${fieldName}"]`)
    
    const tagName = await input.evaluate(el => el.tagName.toLowerCase())
    
    if (tagName === 'select') {
      await input.selectOption({ label: value })
    } else {
      await input.fill(value)
    }
  }
}

export async function verifySuccessMessage(page: Page, expectedMessage: string) {
  await expect(page.locator('.success-message')).toBeVisible()
  await expect(page.locator('.success-message')).toContainText(expectedMessage)
}

export async function verifyErrorMessage(page: Page, expectedMessage: string) {
  await expect(page.locator('.error-message')).toBeVisible()
  await expect(page.locator('.error-message')).toContainText(expectedMessage)
}

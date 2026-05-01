# BobbaExpress E2E Tests

This directory contains end-to-end tests for the BobbaExpress application using Playwright.

## 📁 Test Structure

```
tests/
├── e2e/
│   ├── auth/
│   │   └── login.spec.ts          # Authentication tests
│   ├── customers/
│   │   └── create-customer.spec.ts # Customer creation tests
│   ├── pickups/
│   │   └── create-pickup.spec.ts   # Pickup scheduling tests
│   ├── parcels/
│   │   └── parcel-flow.spec.ts     # Parcel management tests
│   ├── shipments/
│   │   └── shipment-flow.spec.ts   # Shipment management tests
│   └── tracking/
│       └── tracking.spec.ts        # Public tracking tests
├── fixtures/
│   └── test-data.ts               # Test data and constants
├── helpers/
│   └── auth.helper.ts             # Authentication helpers
├── test-files/                    # Test assets (images, etc.)
├── global-setup.ts                # Global test setup
└── playwright.config.ts            # Playwright configuration
```

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Install Playwright Browsers
```bash
npx playwright install
```

### Run Tests
```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (shows browser window)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Generate test code
npm run test:e2e:codegen

# View test report
npm run test:e2e:report
```

## 📋 Test Coverage

### Authentication (`auth/`)
- ✅ Admin login
- ✅ Agent login
- ✅ Customer login
- ✅ Invalid credentials validation
- ✅ Required field validation

### Customers (`customers/`)
- ✅ Create new customer
- ✅ Customer form validation
- ✅ Email format validation
- ✅ Address validation

### Pickups (`pickups/`)
- ✅ Schedule pickup
- ✅ Pickup form validation
- ✅ Parcel count validation
- ✅ Future date validation

### Parcels (`parcels/`)
- ✅ Create parcel
- ✅ Parcel management flow
- ✅ Weight validation
- ✅ Receiver address validation
- ✅ Label generation
- ✅ Tracking integration

### Shipments (`shipments/`)
- ✅ Create shipment
- ✅ Route management
- ✅ Driver assignment
- ✅ Vehicle management
- ✅ Parcel linking
- ✅ Manifest generation
- ✅ Delivery completion
- ✅ Invoice generation
- ✅ ETA calculation

### Tracking (`tracking/`)
- ✅ Public tracking lookup
- ✅ Invalid tracking ID handling
- ✅ Empty input validation
- ✅ Timeline display
- ✅ Sender/receiver info masking
- ✅ ETA display
- ✅ Share link generation
- ✅ PDF download
- ✅ Email subscription
- ✅ Delivered parcel display

## 🔧 Configuration

### Base Configuration
- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests/e2e`
- **Parallel Execution**: Enabled
- **Retry Logic**: 2 retries on CI
- **Reporting**: HTML + List reporters

### Browser Support
- **Chromium**: Desktop Chrome
- **Mobile Safari**: iPhone 14
- **Additional browsers**: Can be easily added

### Features
- **Screenshot on failure**: Automatic capture
- **Video recording**: For failed tests
- **Trace collection**: On first retry
- **Global setup**: Server readiness checks

## 🧪 Test Data

### Test Users
- **Admin**: `admin@bobba.com` / `Admin@1234`
- **Agent**: `agent@bobba.com` / `Agent@1234`
- **Customer**: `customer@bobba.com` / `Customer@1234`

### Test Fixtures
- **Authentication helpers**: Login/logout utilities
- **Test data**: Constants and sample data
- **Form helpers**: Common form operations
- **API helpers**: Test data creation/cleanup

## 📝 Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/some-page');
    await expect(page.locator('h1')).toContainText('Expected Title');
  });
});
```

### Using Authentication Helpers
```typescript
import { test, expect } from '../helpers/auth.helper';

test.describe('Authenticated Feature', () => {
  test('should work for admin', async ({ adminPage }) => {
    // Already logged in as admin
    await adminPage.goto('/admin/dashboard');
    await expect(adminPage.locator('h1')).toContainText('Admin Dashboard');
  });
});
```

### Using Test Data
```typescript
import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_PARCELS } from '../fixtures/test-data';

test('should use test data', async ({ page }) => {
  await page.fill('input[name="trackingId"]', TEST_PARCELS.valid.trackingId);
  // ... rest of test
});
```

## 🐛 Debugging

### UI Mode
```bash
npm run test:e2e:ui
```
- Interactive test runner
- Step-by-step execution
- Live debugging

### Debug Mode
```bash
npm run test:e2e:debug
```
- Pause execution at each step
- Inspect page state
- Console access

### Code Generation
```bash
npm run test:e2e:codegen
```
- Generate test code from browser interactions
- Great for creating new tests quickly

## 🔄 Continuous Integration

### GitHub Actions
- Automatic test runs on push/PR
- Parallel execution
- Artifact upload for failed tests
- HTML report generation

### Environment Setup
- Global setup ensures server readiness
- Database connection checks
- Test environment validation

## 📊 Reports

### HTML Report
```bash
npm run test:e2e:report
```
- Detailed test results
- Screenshots and videos
- Execution timeline
- Error details

### Test Metrics
- Pass/fail rates
- Execution time
- Browser performance
- Coverage reports

## 🛠️ Maintenance

### Adding New Tests
1. Create `.spec.ts` file in appropriate directory
2. Follow existing naming conventions
3. Use authentication helpers when needed
4. Include proper assertions
5. Add test data to fixtures if needed

### Updating Test Data
1. Modify `test-data.ts` for constants
2. Update helper functions for new features
3. Add new fixtures for complex scenarios

### Troubleshooting
- Check server logs for backend issues
- Verify test data exists in database
- Use UI mode for interactive debugging
- Check network tab for API failures

## 🎯 Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow the existing directory structure
- Keep tests independent and isolated

### Page Interactions
- Use explicit waits for dynamic content
- Verify element visibility before interaction
- Handle async operations properly
- Clean up test data when needed

### Assertions
- Use specific assertions (`toContainText`, `toBeVisible`, etc.)
- Include meaningful error messages
- Test both positive and negative cases
- Verify user-visible states

### Performance
- Use `page.goto()` with specific URLs when possible
- Avoid unnecessary waits
- Reuse page objects for complex interactions
- Run tests in parallel when safe

---

## 🚀 Ready to Test!

Your BobbaExpress E2E test suite is now organized and ready for comprehensive testing of all major features. Run `npm run test:e2e:ui` to get started!

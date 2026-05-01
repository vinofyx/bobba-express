# 🌴 Cypress E2E Testing Guide for BobbaExpress

## 🚀 Quick Start

### **Install Cypress**
```bash
npm install cypress --save-dev
```

### **Open Cypress Test Runner**
```bash
npx cypress open
```

### **Run All Tests**
```bash
npm run test:cypress
```

### **Run Tests with Browser Window**
```bash
npm run test:cypress:headed
```

---

## 📁 Cypress Structure

```
cypress/
├── e2e/
│   ├── auth.cy.js                    # Authentication tests
│   ├── full-flow.cy.js               # Complete workflow tests
│   ├── tc-008-tracking.cy.js         # TC-008 tracking tests
│   └── tc-009-shipment-delivery.cy.js # TC-009 delivery tests
├── fixtures/
│   └── delivery-proof.jpg            # Test assets
├── support/
│   ├── commands.js                   # Custom commands
│   └── e2e.js                        # Support file
└── cypress.config.js                 # Configuration
```

---

## 🧪 Test Coverage

### **Authentication Tests** (`auth.cy.js`)
- ✅ Admin login
- ✅ Agent login
- ✅ Customer login
- ✅ Invalid credentials validation
- ✅ Required field validation
- ✅ Logout functionality

### **Full Flow Tests** (`full-flow.cy.js`)
- ✅ Create customer → pickup → shipment → track
- ✅ Complete end-to-end workflow
- ✅ API-based authentication (faster)

### **TC-008 Tracking Tests** (`tc-008-tracking.cy.js`)
- ✅ Track parcel with valid ID
- ✅ Invalid tracking ID validation
- ✅ Empty tracking ID validation
- ✅ Sender/receiver info with partial masking
- ✅ ETA display for in-transit parcels
- ✅ Shareable link generation
- ✅ PDF download tracking information
- ✅ Email subscription
- ✅ All steps green for delivered parcel
- ✅ Handle tracking via URL parameter
- ✅ Email format validation for subscription

### **TC-009 Shipment Delivery Tests** (`tc-009-shipment-delivery.cy.js`)
- ✅ Complete shipment delivery workflow
- ✅ Delivery form validation (missing photo proof)
- ✅ Delivery form validation (missing recipient name)
- ✅ Verify all parcels marked as delivered
- ✅ Verify tracking page shows all steps green
- ✅ Generate invoice after delivery

---

## 🛠️ Cypress Commands

### **Basic Commands**
```bash
# Open Cypress Test Runner (interactive)
npx cypress open

# Run all tests (headless)
npm run test:cypress

# Run tests with browser window
npm run test:cypress:headed

# Run on specific browser
npm run test:cypress:chrome
npm run test:cypress:firefox
npm run test:cypress:edge

# Run specific test file
npx cypress run cypress/e2e/auth.cy.js

# Run specific test by pattern
npx cypress run --spec "cypress/e2e/tc-008-*.cy.js"
```

### **Advanced Commands**
```bash
# Run tests with specific reporter
npx cypress run --reporter json

# Run tests with specific config file
npx cypress run --config-file cypress.config.js

# Run tests with environment variables
npx cypress run --env apiUrl=http://localhost:3000

# Run tests in parallel
npx cypress run --parallel

# Record test run to Cypress Dashboard
npx cypress run --record
```

---

## 🎯 Custom Commands

### **Authentication Commands**
```javascript
// Login as specific users
cy.loginAsAdmin()
cy.loginAsAgent()
cy.loginAsCustomer()

// Manual login with credentials
cy.login('admin@bobba.com', 'Admin@1234')
```

### **Business Logic Commands**
```javascript
// Create customer
cy.createCustomer({
  fullName: 'Ahmad Zulkifli',
  email: 'ahmad@test.com',
  phone: '0123456789'
})

// Create pickup
cy.createPickup({
  customerName: 'Ahmad',
  scheduledDate: '2025-04-29',
  pickupTime: '10:00',
  parcelCount: '3'
})

// Track parcel
cy.trackParcel('BE001234')

// Complete shipment delivery
cy.completeShipmentDelivery({
  photoProof: 'cypress/fixtures/delivery-proof.jpg',
  recipientName: 'Siti Aminah',
  note: 'Delivered to recipient'
})
```

### **Utility Commands**
```javascript
// Verify messages
cy.verifySuccess('Customer created successfully')
cy.verifyError('Email is required')

// Form interactions
cy.fillForm({
  fullName: 'Ahmad Zulkifli',
  email: 'ahmad@test.com'
})

// Element checks
cy.shouldBeVisible('[data-testid="success-message"]')
cy.shouldContainText('[data-testid="tracking-id"]', 'BE001234')
cy.shouldHaveAttribute('[data-testid="step-transit"]', 'data-status', 'active')
```

---

## 📝 Test Examples

### **Basic Test Structure**
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    cy.loginAsAdmin()
  })

  it('should do something', () => {
    cy.visit('/some-page')
    cy.get('[data-testid="some-element"]').should('be.visible')
    cy.get('[data-testid="some-button"]').click()
    cy.verifySuccess('Operation completed')
  })
})
```

### **API-based Authentication**
```javascript
beforeEach(() => {
  // Login via API (faster than UI login)
  cy.request('POST', '/api/auth/login', {
    email: 'admin@bobba.com',
    password: 'Admin@1234'
  }).then((resp) => {
    window.localStorage.setItem('token', resp.body.token)
  })
})
```

### **File Upload Testing**
```javascript
cy.get('[data-testid="photo-proof-input"]')
  .selectFile('cypress/fixtures/delivery-proof.jpg')
```

### **PDF Download Testing**
```javascript
cy.get('[data-testid="btn-download-pdf"]').click()
cy.readFile('cypress/downloads/tracking*.pdf').should('exist')
```

---

## 🔧 Configuration

### **Base Configuration** (`cypress.config.js`)
```javascript
module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0
    },
    env: {
      apiUrl: 'http://localhost:3000/api'
    }
  }
})
```

### **Environment Variables**
```javascript
// In cypress.config.js
env: {
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@bobba.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@1234'
}
```

---

## 🐛 Debugging

### **Cypress Test Runner**
```bash
npx cypress open
```
- Visual test runner interface
- Time-travel debugging
- Command log
- DOM inspection
- Network requests

### **Debug Commands**
```javascript
// Pause execution
cy.pause()

// Debug specific command
cy.get('[data-testid="element"]').debug()

// Log to console
cy.log('Debug message')

// Take screenshot
cy.screenshot('debug-screenshot')

// Get element details
cy.get('[data-testid="element"]').then(($el) => {
  console.log($el.text())
})
```

### **Common Debugging Techniques**
```javascript
// Wait for element
cy.get('[data-testid="element"]', { timeout: 10000 }).should('be.visible')

// Check if element exists
cy.get('[data-testid="element"]').should('exist')

// Check element text
cy.get('[data-testid="element"]').should('contain', 'Expected text')

// Check element visibility
cy.get('[data-testid="element"]').should('be.visible')

// Check URL
cy.url().should('include', '/expected-path')
```

---

## 📊 Reports and Results

### **Built-in Reports**
```javascript
// HTML Report (default)
npm run test:cypress

// JSON Report
npx cypress run --reporter json --reporter-options reportFile=results.json

// JUnit Report
npx cypress run --reporter junit --reporter-options mochaFile=results.xml
```

### **Screenshots and Videos**
- **Screenshots**: Automatically taken on failure
- **Videos**: Recorded for each test run
- **Location**: `cypress/screenshots/` and `cypress/videos/`

### **Test Results**
```bash
# View test results
npx cypress run --reporter spec

# Generate HTML report
npx cypress run --reporter html
```

---

## 🔄 Continuous Integration

### **GitHub Actions Example**
```yaml
name: Cypress Tests
on: [push, pull_request]
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        with:
          start: npm run dev
          wait-on: 'http://localhost:3000'
          browser: chrome
```

### **Docker Support**
```bash
# Run Cypress in Docker
docker run -it -v $PWD:/e2e -w /e2e cypress/included:13.6.1
```

---

## 🎯 Best Practices

### **Test Organization**
1. **Group related tests** in `describe` blocks
2. **Use descriptive test names**
3. **Follow naming convention**: `feature-description.cy.js`
4. **Keep tests independent** and isolated

### **Selector Strategy**
1. **Use data-testid attributes**: `[data-testid="element-name"]`
2. **Avoid complex CSS selectors**
3. **Use meaningful test IDs**
4. **Keep selectors stable**

### **Test Data Management**
1. **Use fixtures** for test data
2. **Clean up test data** after each test
3. **Use API calls** for data setup (faster)
4. **Avoid hardcoding** test data

### **Performance Optimization**
1. **Use API authentication** instead of UI login
2. **Reuse page state** between tests when possible
3. **Avoid unnecessary waits**
4. **Use custom commands** for repeated actions

### **Error Handling**
1. **Handle network failures** gracefully
2. **Use retry logic** for flaky tests
3. **Provide meaningful error messages**
4. **Use try-catch** for complex operations

---

## 🆚 Cypress vs Playwright

### **When to Use Cypress**
- **JavaScript/TypeScript projects**
- **Chrome-based testing**
- **Fast feedback loop**
- **Excellent debugging experience**
- **Rich ecosystem and plugins**

### **When to Use Playwright**
- **Multi-browser testing** required
- **Mobile testing** needed
- **Network control** important
- **Parallel execution** critical
- **Cross-platform testing**

### **BobbaExpress Recommendation**
- **Use both**: Cypress for development, Playwright for CI
- **Cypress**: Fast development feedback
- **Playwright**: Comprehensive cross-browser testing

---

## 🚀 Getting Started

### **1. Install Cypress**
```bash
npm install cypress --save-dev
```

### **2. Open Cypress**
```bash
npx cypress open
```

### **3. Run Your First Test**
```bash
npm run test:cypress:open
```

### **4. Explore Tests**
- Click on any test file in the Cypress Test Runner
- Watch tests run in real-time
- Use the command log for debugging
- Explore the DOM and network tabs

---

## 🎉 Ready to Test!

Your BobbaExpress Cypress setup is complete with:

- ✅ **4 test files** covering all major features
- ✅ **Custom commands** for common operations
- ✅ **TC-008 & TC-009** complete coverage
- ✅ **Authentication** for all user types
- ✅ **File upload** and **download** testing
- ✅ **Configuration** ready for CI/CD

### **Quick Start Commands:**
```bash
# Open Cypress (recommended for development)
npx cypress open

# Run all tests
npm run test:cypress

# Run with browser window
npm run test:cypress:headed

# Run specific test
npx cypress run cypress/e2e/full-flow.cy.js
```

Happy testing with Cypress! 🌴

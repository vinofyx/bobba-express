# 🎭 BobbaExpress E2E Testing Guide

## 🚀 Quick Start Commands

### **Run All Tests**
```bash
npx playwright test
```

### **Run Specific Flow**
```bash
npx playwright test full-flow.spec.ts
```

### **Run with UI (Visual Mode - Great for Debugging)**
```bash
npx playwright test --ui
```

### **Run Headed (Watch Browser)**
```bash
npx playwright test --headed
```

### **Show HTML Report After Run**
```bash
npx playwright show-report
```

### **Run on Specific Browser Only**
```bash
npx playwright test --project=chromium
```

### **Debug Single Test**
```bash
npx playwright test --debug TC-008
```

---

## 📊 Test Coverage Overview

### **Total Tests**: 62 tests across 6 files

### **Test Files Structure**:
```
tests/e2e/
├── auth/
│   └── login.spec.ts              # 4 tests (Authentication)
├── customers/
│   └── create-customer.spec.ts     # 3 tests (Customer Management)
├── pickups/
│   └── create-pickup.spec.ts       # 4 tests (Pickup Scheduling)
├── parcels/
│   └── parcel-flow.spec.ts         # 4 tests (Parcel Management)
├── shipments/
│   └── shipment-flow.spec.ts       # 5 tests (Shipment Management)
└── tracking/
    └── tracking.spec.ts           # 11 tests (Public Tracking)
```

### **Browser Coverage**:
- **Chromium** (Desktop Chrome)
- **Mobile Safari** (iPhone 14)

---

## 🧪 Test Cases by Feature

### **Authentication Tests** (`auth/login.spec.ts`)
- ✅ Admin login successfully
- ✅ Agent login successfully
- ✅ Invalid credentials validation
- ✅ Required fields validation

### **Customer Tests** (`customers/create-customer.spec.ts`)
- ✅ Create new customer successfully
- ✅ Validate customer form fields
- ✅ Email format validation

### **Pickup Tests** (`pickups/create-pickup.spec.ts`)
- ✅ Create new pickup successfully
- ✅ Validate pickup form fields
- ✅ Parcel count validation
- ✅ Future date validation

### **Parcel Tests** (`parcels/parcel-flow.spec.ts`)
- ✅ Create and manage parcel complete flow
- ✅ Validate parcel creation form
- ✅ Weight field validation
- ✅ Receiver address validation

### **Shipment Tests** (`shipments/shipment-flow.spec.ts`)
- ✅ Create and complete shipment flow
- ✅ Validate shipment creation form
- ✅ Driver assignment validation
- ✅ Parcel selection validation
- ✅ Departure time validation

### **Tracking Tests** (`tracking/tracking.spec.ts`)
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

---

## 🎯 Running Specific Test Cases

### **Run TC-008 Tracking Tests**
```bash
# Run all tracking tests
npx playwright test tests/e2e/tracking/tracking.spec.ts

# Run specific tracking test
npx playwright test --grep "should track parcel with valid ID"

# Debug tracking test
npx playwright test --debug tests/e2e/tracking/tracking.spec.ts
```

### **Run TC-009 Shipment Delivery Tests**
```bash
# Run all shipment tests
npx playwright test tests/e2e/shipments/shipment-flow.spec.ts

# Run specific delivery test
npx playwright test --grep "should create and complete shipment flow"
```

### **Run Authentication Tests**
```bash
# Run all auth tests
npx playwright test tests/e2e/auth/login.spec.ts

# Run specific auth test
npx playwright test --grep "should login as admin successfully"
```

---

## 🛠️ Advanced Testing Options

### **Run Tests in Parallel**
```bash
# Run all tests in parallel (default)
npx playwright test

# Run with specific number of workers
npx playwright test --workers=4
```

### **Generate Test Code**
```bash
# Generate code from browser interactions
npx playwright codegen http://localhost:3000
```

### **Run Tests with Specific Timeout**
```bash
# Set custom timeout (in milliseconds)
npx playwright test --timeout=60000
```

### **Run Tests with Specific Reporter**
```bash
# Generate HTML report
npx playwright test --reporter=html

# Generate JSON report
npx playwright test --reporter=json

# Generate multiple reports
npx playwright test --reporter=html,json
```

### **Run Tests on Specific Browser**
```bash
# Chromium only
npx playwright test --project=chromium

# Mobile Safari only
npx playwright test --project="Mobile Safari"

# WebKit (Safari)
npx playwright test --project=webkit

# Firefox
npx playwright test --project=firefox
```

---

## 🐛 Debugging Tips

### **1. UI Mode (Recommended for Development)**
```bash
npx playwright test --ui
```
- Visual test runner interface
- Step-by-step execution
- Live debugging capabilities
- Pick specific tests to run

### **2. Debug Mode**
```bash
# Debug specific test
npx playwright test --debug tests/e2e/tracking/tracking.spec.ts

# Debug by grep pattern
npx playwright test --debug --grep "should track parcel"
```
- Pause execution at each step
- Inspect page state
- Access browser console
- Step through code line by line

### **3. Headed Mode**
```bash
npx playwright test --headed
```
- Watch tests run in real browser
- See actual user interactions
- Useful for visual debugging

### **4. Trace Viewer**
```bash
# Run tests with trace collection
npx playwright test --trace on

# View trace
npx playwright show-trace
```
- Detailed execution timeline
- Network requests
- Console logs
- Screenshots

---

## 📱 Mobile Testing

### **Mobile Safari Tests**
Your test suite automatically includes Mobile Safari (iPhone 14) testing:

```bash
# Run only mobile tests
npx playwright test --project="Mobile Safari"

# Run specific test on mobile
npx playwright test tests/e2e/tracking/tracking.spec.ts --project="Mobile Safari"
```

### **Mobile Test Features**
- iPhone 14 viewport
- Touch interactions
- Mobile-specific UI testing
- Responsive design validation

---

## 📊 Reports and Results

### **HTML Report**
```bash
# Generate and view HTML report
npx playwright test --reporter=html
npx playwright show-report
```

Features:
- Interactive test results
- Screenshots and videos
- Execution timeline
- Error details and stack traces
- Filtering and search capabilities

### **List Reporter**
```bash
# Console output
npx playwright test --reporter=list
```

Features:
- Real-time test progress
- Pass/fail status
- Execution time
- Error messages

### **JSON Reporter**
```bash
# Generate JSON results
npx playwright test --reporter=json --output-file=results.json
```

Features:
- Machine-readable results
- CI/CD integration
- Custom reporting tools

---

## 🔧 Environment Setup

### **Prerequisites**
1. **Development Server Running**: `npm run dev`
2. **Database Connected**: MongoDB with test data
3. **Test Users Available**: Admin, Agent, Customer accounts

### **Test Users**
- **Admin**: `admin@bobba.com` / `Admin@1234`
- **Agent**: `agent@bobba.com` / `Agent@1234`
- **Customer**: `customer@bobba.com` / `Customer@1234`

### **Test Data**
- Test parcels with tracking IDs (BE001234, BE001235, etc.)
- Test pickups (PU-2025-001)
- Test shipments (SH-2025-001)
- Test customers and addresses

---

## 🚨 Common Issues and Solutions

### **Server Not Ready**
```bash
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution**: Ensure development server is running
```bash
npm run dev
```

### **Test Data Missing**
```bash
Error: Parcel not found
```
**Solution**: Seed test data
```bash
npm run test:setup
```

### **Timeout Issues**
```bash
Error: Test timeout of 30000ms exceeded
```
**Solution**: Increase timeout or check server performance
```bash
npx playwright test --timeout=60000
```

### **Browser Not Installed**
```bash
Error: Executable doesn't exist
```
**Solution**: Install Playwright browsers
```bash
npx playwright install
```

---

## 🔄 Continuous Integration

### **GitHub Actions**
Your tests are configured to run automatically on:
- Push to main/master branch
- Pull requests to main/master branch

### **CI Configuration**
```yaml
# .github/workflows/playwright.yml
- Runs on Ubuntu
- Installs dependencies
- Installs browsers
- Runs tests with retries
- Uploads test reports as artifacts
```

### **Local CI Testing**
```bash
# Simulate CI environment
CI=true npx playwright test
```

---

## 🎯 Best Practices

### **1. Test Organization**
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow existing naming conventions
- Keep tests independent and isolated

### **2. Page Interactions**
- Use explicit waits for dynamic content
- Verify element visibility before interaction
- Handle async operations properly
- Clean up test data when needed

### **3. Assertions**
- Use specific assertions (`toContainText`, `toBeVisible`, etc.)
- Include meaningful error messages
- Test both positive and negative cases
- Verify user-visible states

### **4. Performance**
- Use `page.goto()` with specific URLs
- Avoid unnecessary waits
- Reuse helper functions for common operations
- Run tests in parallel when safe

---

## 🎉 Ready to Test!

Your BobbaExpress E2E test suite is comprehensive and ready for testing all major features. Here are the recommended ways to get started:

### **For Development** 🛠️
```bash
npx playwright test --ui
```

### **For Quick Validation** ⚡
```bash
npx playwright test --project=chromium --grep "should track parcel"
```

### **For Full Testing** 🔄
```bash
npx playwright test
```

### **For Debugging** 🐛
```bash
npx playwright test --debug tests/e2e/tracking/tracking.spec.ts
```

### **For Mobile Testing** 📱
```bash
npx playwright test --project="Mobile Safari"
```

Happy testing! 🚀

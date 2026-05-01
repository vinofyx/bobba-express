# 🚀 E2E Testing & CI/CD Guide

## 📋 Overview

BobbaExpress now has comprehensive E2E testing with both **Playwright** (UI tests) and **Newman** (API tests) integrated into GitHub Actions for continuous integration.

## 🏗️ CI/CD Pipeline Structure

### **Triggers:**
- **Push** to `main` or `develop` branches
- **Pull Request** to `main` branch

### **Jobs:**
1. **test** - Main E2E testing job (multi-node matrix)
2. **integration-tests** - PR commenting and artifact handling

## 🔧 Workflow Features

### **Enhanced Testing Matrix:**
- **Node.js versions**: 18 and 20
- **Parallel execution**: Faster feedback
- **Comprehensive coverage**: UI + API tests

### **Advanced Features:**
- **Dependency caching**: Faster builds
- **Database setup**: Automated test data
- **Server health checks**: Reliable startup
- **Artifact uploads**: Detailed reports
- **PR comments**: Automated feedback

## 📁 File Structure

```
.github/workflows/
├── e2e-tests.yml              # Main E2E workflow
├── playwright.yml             # Playwright-specific workflow
└── newman-api-tests.yml       # Newman-specific workflow

tests/
├── bobba-api-tests.json       # Newman collection
└── bobba-ci-env.json          # CI environment variables

reports/                       # Generated reports
├── api-test-report.html       # Newman HTML report
├── api-test-results.xml       # JUnit format
└── performance-results.csv    # Performance data

playwright-results/            # Playwright reports
├── index.html                 # HTML report
└── trace/                     # Trace files
```

## 🧪 Test Coverage

### **Playwright E2E Tests (62 tests):**
- **Authentication** (4 tests)
- **Customer Management** (3 tests)
- **Pickup Scheduling** (4 tests)
- **Parcel Management** (4 tests)
- **Shipment Management** (5 tests)
- **Tracking** (11 tests)
- **Mobile Testing** (iPhone 14)

### **Newman API Tests (8 requests):**
- **Authentication** - POST /auth/login
- **Customer Creation** - POST /customers
- **Pickup Scheduling** - POST /pickups
- **Agent Assignment** - PATCH /pickups/:id/assign
- **Pickup Completion** - PATCH /pickups/:id/complete
- **Parcel Retrieval** - GET /parcels
- **Shipment Creation** - POST /shipments
- **Public Tracking** - GET /tracking/:id

## 🚀 Local Development

### **Run Tests Locally:**

#### **Playwright Tests:**
```bash
# Install browsers (first time)
npx playwright install

# Run all tests
npm run test:e2e

# Run with UI (recommended for development)
npm run test:e2e:ui

# Run specific test
npx playwright test tests/e2e/tracking/tracking.spec.ts
```

#### **Newman API Tests:**
```bash
# Install Newman (first time)
npm install -g newman newman-reporter-htmlextra

# Run API tests
npm run test:api

# Run with HTML report
npm run test:api:report

# Run in CI mode
npm run test:api:ci
```

#### **Combined Testing:**
```bash
# Start server first
npm run dev:server

# Run Playwright tests
npm run test:e2e

# Run Newman tests
npm run test:api:report
```

## 🔍 Debugging CI Failures

### **Common Issues:**

#### **1. Server Startup Failures**
```
Error: Server not ready
```
**Solutions:**
- Check `DATABASE_URL` secret configuration
- Verify database connection
- Review server logs in workflow

#### **2. Test Timeouts**
```
Error: Test timeout exceeded
```
**Solutions:**
- Increase timeout values in workflow
- Check server performance
- Review test complexity

#### **3. Authentication Failures**
```
Status: 401 Unauthorized
```
**Solutions:**
- Verify test user creation
- Check JWT token configuration
- Review authentication endpoints

#### **4. Database Issues**
```
Error: Database connection failed
```
**Solutions:**
- Verify `TEST_DATABASE_URL` secret
- Check database schema
- Review migration scripts

### **Debugging Steps:**

#### **1. Review Workflow Logs:**
1. Go to **Actions** tab in GitHub
2. Click on the failed workflow run
3. Review each step's output
4. Check error messages and stack traces

#### **2. Download Artifacts:**
1. In workflow run, click **Artifacts** section
2. Download test reports
3. Review HTML reports for detailed failures
4. Check JUnit XML for specific test failures

#### **3. Local Reproduction:**
```bash
# Setup local environment
export DATABASE_URL="your_test_database_url"
export NODE_ENV="test"

# Run same commands as CI
npm run test:setup
npm run build
npm run start &
npm run test:e2e
npm run test:api:ci
```

## 📊 Report Analysis

### **Playwright Reports:**
- **HTML Report**: Interactive test results
- **Trace Files**: Detailed execution timeline
- **Screenshots**: Visual evidence of failures
- **Videos**: Screen recordings of test runs

### **Newman Reports:**
- **HTML Report**: Enhanced API test visualization
- **JUnit XML**: CI/CD integration format
- **CSV Data**: Performance metrics
- **Console Output**: Real-time test progress

### **Report Locations:**
- **GitHub Artifacts**: Available for 30 days
- **Local Reports**: `reports/` and `playwright-results/`
- **CI Output**: Console logs and summaries

## 🔧 Configuration

### **Environment Variables:**

#### **Required GitHub Secrets:**
```yaml
TEST_DATABASE_URL: "mongodb://localhost:27017/bobba-express-test"
```

#### **CI Environment Configuration:**
```json
{
  "BASE_URL": "http://localhost:3000/api",
  "TOKEN": "",
  "CUSTOMER_ID": "",
  "PICKUP_ID": "",
  "PARCEL_1": "",
  "PARCEL_2": "",
  "PARCEL_3": "",
  "SHIPMENT_ID": ""
}
```

### **Workflow Customization:**

#### **Timeout Adjustments:**
```yaml
# Increase overall timeout
timeout-minutes: 90

# Increase server wait time
timeout 120 bash -c 'until curl -f http://localhost:3000/api/health; do sleep 5; done'
```

#### **Browser Configuration:**
```yaml
# Add more browsers
strategy:
  matrix:
    node-version: [18, 20]
    browser: [chromium, firefox, webkit]
```

#### **Test Selection:**
```bash
# Run specific test folders
npx playwright test tests/e2e/auth/

# Run specific Newman folder
newman run tests/bobba-api-tests.json --folder "Authentication"
```

## 🚀 Best Practices

### **1. Test Organization:**
- Group related tests in folders
- Use descriptive test names
- Maintain test independence
- Follow naming conventions

### **2. Environment Management:**
- Use separate environments for dev/staging/prod
- Keep sensitive data in GitHub secrets
- Use consistent variable naming
- Validate environment setup

### **3. Performance Optimization:**
- Cache dependencies for faster builds
- Use parallel execution where possible
- Optimize test data setup
- Monitor test execution time

### **4. Error Handling:**
- Use `--bail` flag for CI (fail fast)
- Implement proper error messages
- Add retry logic for flaky tests
- Monitor failure patterns

### **5. Report Management:**
- Generate multiple report formats
- Archive reports for historical analysis
- Use consistent naming conventions
- Set appropriate retention periods

## 🔄 Continuous Integration

### **Branch Strategy:**
- **main**: Production-ready code
- **develop**: Integration branch
- **feature branches**: Development work

### **Pull Request Process:**
1. Create feature branch
2. Make changes and commit
3. Open PR to main/develop
4. CI runs automatically
5. Review test results
6. Merge when all tests pass

### **Release Process:**
1. Merge to main branch
2. CI runs full test suite
3. Generate release artifacts
4. Deploy to production
5. Monitor post-deployment

## 📈 Monitoring & Analytics

### **Test Metrics:**
- **Pass/Fail rates**
- **Execution time trends**
- **Flaky test identification**
- **Performance regression detection**

### **Alerting:**
- **PR comments** with test results
- **Slack notifications** for failures
- **Email alerts** for critical issues
- **Dashboard integration** for metrics

### **Historical Analysis:**
- **Test result trends**
- **Performance over time**
- **Code coverage changes**
- **Bug detection patterns**

## 🎯 Troubleshooting Checklist

### **Before Running Tests:**
- [ ] Server is running on correct port
- [ ] Database is accessible
- [ ] Test data is seeded
- [ ] Environment variables are set
- [ ] Dependencies are installed

### **After Test Failures:**
- [ ] Review workflow logs
- [ ] Download and analyze reports
- [ ] Check server logs
- [ ] Verify database state
- [ ] Reproduce locally if needed

### **Performance Issues:**
- [ ] Check test execution time
- [ ] Monitor resource usage
- [ ] Optimize test data setup
- [ ] Review test complexity
- [ ] Consider parallel execution

## 🚀 Getting Started

### **1. Setup GitHub Secrets:**
```bash
# In GitHub repository settings
TEST_DATABASE_URL=mongodb://localhost:27017/bobba-express-test
```

### **2. Verify Local Tests:**
```bash
# Run tests locally first
npm run test:setup
npm run test:e2e
npm run test:api:report
```

### **3. Push to Trigger CI:**
```bash
git add .
git commit -m "Add comprehensive E2E testing"
git push origin main
```

### **4. Monitor CI Execution:**
- Go to **Actions** tab
- Watch workflow progress
- Review test results
- Download reports for analysis

Your BobbaExpress application now has comprehensive E2E testing with CI/CD integration! 🚀

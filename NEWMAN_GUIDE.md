# 🚀 Newman API Testing Guide

## 📦 Installation

```bash
# Install Newman globally
npm install -g newman newman-reporter-htmlextra
```

## 📁 Files Ready

- `bobba-api-tests.json` - Exported Postman collection
- `bobba-dev-env.json` - Development environment
- `reports/` - Directory for test reports

## 🏃‍♂️ Running Newman Tests

### **1. Basic Run**
```bash
newman run bobba-api-tests.json --environment bobba-dev-env.json
```

### **2. Run with HTML Report**
```bash
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --reporters htmlextra \
  --reporter-htmlextra-export ./reports/api-test-report.html
```

### **3. Run in CI/GitHub Actions**
```bash
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --bail  # stop on first failure
```

### **4. Run with Multiple Reporters**
```bash
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --reporters cli,html,junit \
  --reporter-html-export ./reports/api-test-report.html \
  --reporter-junit-export ./reports/api-test-results.xml
```

### **5. Run Specific Folder**
```bash
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --folder "Authentication"
```

### **6. Run with Iterations**
```bash
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --iteration-count 3
```

## 📊 Report Options

### **Available Reporters**
- `cli` - Command line output
- `html` - Basic HTML report
- `htmlextra` - Enhanced HTML report
- `junit` - JUnit XML format
- `json` - JSON format

### **HTML Extra Report Features**
- Enhanced UI with charts
- Request/response details
- Execution timeline
- Test results summary
- Environment variables display

## 🔧 Advanced Options

### **Timeout Settings**
```bash
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --timeout-request 30000 \
  --timeout-script 5000
```

### **SSL Options**
```bash
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --ignore-rcerts \
  --insecure
```

### **Color Output**
```bash
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --color on
```

### **Verbose Output**
```bash
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --verbose
```

## 🚀 CI/CD Integration

### **GitHub Actions Workflow**
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install Newman
        run: npm install -g newman newman-reporter-htmlextra
      - name: Run API Tests
        run: |
          newman run bobba-api-tests.json \
            --environment bobba-dev-env.json \
            --reporters htmlextra,junit \
            --reporter-htmlextra-export ./reports/api-test-report.html \
            --reporter-junit-export ./reports/api-test-results.xml \
            --bail
      - name: Upload Test Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: api-test-reports
          path: reports/
```

### **Jenkins Pipeline**
```groovy
pipeline {
    agent any
    stages {
        stage('API Tests') {
            steps {
                sh 'npm install -g newman newman-reporter-htmlextra'
                sh '''
                    newman run bobba-api-tests.json \
                        --environment bobba-dev-env.json \
                        --reporters htmlextra,junit \
                        --reporter-htmlextra-export ./reports/api-test-report.html \
                        --reporter-junit-export ./reports/api-test-results.xml \
                        --bail
                '''
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: 'api-test-report.html',
                        reportName: 'API Test Report'
                    ])
                    publishTestResults testResultsPattern: 'reports/*.xml'
                }
            }
        }
    }
}
```

## 📋 Test Collection Structure

### **8 API Endpoints Tested:**
1. **Authentication** - POST /auth/login
2. **Customer Creation** - POST /customers
3. **Pickup Scheduling** - POST /pickups
4. **Agent Assignment** - PATCH /pickups/:id/assign
5. **Pickup Completion** - PATCH /pickups/:id/complete
6. **Parcel Retrieval** - GET /parcels
7. **Shipment Creation** - POST /shipments
8. **Tracking** - GET /tracking/:id

### **Environment Variables Flow:**
```
TOKEN (from login)
  ↓
CUSTOMER_ID (from customer creation)
  ↓
PICKUP_ID (from pickup scheduling)
  ↓
PARCEL_1, PARCEL_2, PARCEL_3 (from parcel retrieval)
  ↓
SHIPMENT_ID (from shipment creation)
```

## 🔍 Test Results Interpretation

### **Success Indicators:**
- ✅ All HTTP status codes correct
- ✅ All test assertions pass
- ✅ Environment variables set correctly
- ✅ Complete workflow execution

### **Failure Indicators:**
- ❌ HTTP status codes not matching
- ❌ Test assertions failing
- ❌ Environment variables not set
- ❌ API endpoints not responding

### **Report Sections:**
- **Summary** - Overall test results
- **Requests** - Individual request details
- **Responses** - API response data
- **Tests** - Assertion results
- **Environment** - Variable values

## 🛠️ Troubleshooting

### **Common Issues:**

#### **1. Connection Refused**
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```
**Solution**: Ensure server is running on port 5000

#### **2. Authentication Failures**
```
Status: 401 Unauthorized
```
**Solution**: Check admin credentials and user existence

#### **3. Environment Variables Not Set**
```
Environment variable TOKEN is not set
```
**Solution**: Ensure requests run in sequence

#### **4. File Upload Issues**
```
Status: 400 Bad Request (file upload)
```
**Solution**: Check file path and permissions

#### **5. SSL Certificate Issues**
```
Error: self-signed certificate
```
**Solution**: Use `--ignore-rcerts` flag

### **Debug Commands:**
```bash
# Run with verbose output
newman run bobba-api-tests.json --environment bobba-dev-env.json --verbose

# Run specific request
newman run bobba-api-tests.json --environment bobba-dev-env.json --folder "Authentication"

# Run with timeout adjustments
newman run bobba-api-tests.json --environment bobba-dev-env.json --timeout-request 60000
```

## 📈 Performance Testing

### **Load Testing with Newman**
```bash
# Run multiple iterations
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --iteration-count 10

# Run with delay between iterations
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --iteration-count 5 \
  --iteration-delay 1000
```

### **Response Time Analysis**
```bash
# Export response times to CSV
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --reporters csv \
  --reporter-csv-export ./reports/response-times.csv
```

## 🎯 Best Practices

### **1. Environment Management**
- Use separate environments for dev/staging/prod
- Keep sensitive data in environment variables
- Use `--bail` flag in CI to stop on first failure

### **2. Report Management**
- Generate multiple report formats for different stakeholders
- Archive reports for historical analysis
- Use consistent naming conventions

### **3. Test Organization**
- Group related requests in folders
- Use descriptive test names
- Add comprehensive test assertions

### **4. CI/CD Integration**
- Fail builds on test failures
- Upload reports as artifacts
- Set up notifications for failures

## 🚀 Quick Start Commands

### **Development Testing:**
```bash
# Quick test run
newman run bobba-api-tests.json --environment bobba-dev-env.json

# With HTML report
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --reporters htmlextra \
  --reporter-htmlextra-export ./reports/api-test-report.html
```

### **CI/CD Testing:**
```bash
# Strict testing (fail fast)
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --bail \
  --reporters junit,htmlextra \
  --reporter-junit-export ./reports/api-test-results.xml \
  --reporter-htmlextra-export ./reports/api-test-report.html
```

### **Performance Testing:**
```bash
# Load testing
newman run bobba-api-tests.json \
  --environment bobba-dev-env.json \
  --iteration-count 20 \
  --reporters csv \
  --reporter-csv-export ./reports/performance-results.csv
```

## 📊 Report Analysis

### **Generated Reports:**
- `api-test-report.html` - Interactive HTML report
- `api-test-results.xml` - JUnit format for CI
- `performance-results.csv` - Response time data

### **Viewing Reports:**
```bash
# Open HTML report
open ./reports/api-test-report.html

# View CSV data
cat ./reports/performance-results.csv
```

Your Newman API testing setup is complete and ready for automation! 🚀

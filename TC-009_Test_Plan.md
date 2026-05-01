# Test Case TC-009: Shipment Delivery Completion

## 🎯 Objective
Verify the complete delivery workflow for shipments, ensuring all parcels are marked as delivered, proper notifications are sent, and tracking is updated correctly.

## 📋 Test Scenarios

### **Scenario 1: Web Application - Shipments Page**
**Navigation**: Shipments → SH-2025-001 → [Mark Delivered]

**Steps**:
1. Login as Admin/Staff user
2. Navigate to Shipments page
3. Locate shipment SH-2025-001
4. Click on shipment to view details
5. Click "Mark Delivered" button
6. Fill delivery completion form:
   - Upload photo proof (image file)
   - Enter recipient name: "Siti Aminah"
   - Collect signature (digital signature pad)
   - Add optional note
7. Submit the form

**Expected Results**:
- ✅ All 3 parcels in shipment change to "Delivered" status
- ✅ Shipment status changes to "Completed"
- ✅ Delivery timestamp is automatically saved
- ✅ Photo proof is uploaded and stored
- ✅ Recipient name is recorded
- ✅ Signature is captured and saved
- ✅ Customer receives SMS notification: "Your parcel has been delivered"
- ✅ Tracking page shows all 5 steps as green (completed)
- ✅ Invoice/receipt is automatically generated

### **Scenario 2: Agent App - My Deliveries**
**Navigation**: Agent App → My Deliveries → [Complete Delivery]

**Steps**:
1. Login as Agent user
2. Navigate to "My Deliveries" section
3. Find the assigned shipment
4. Click "Complete Delivery" button
5. Fill delivery completion form:
   - Upload photo proof from camera/gallery
   - Enter recipient name: "Siti Aminah"
   - Collect signature on mobile device
   - Add delivery notes if needed
6. Submit the form

**Expected Results**:
- ✅ All parcels marked as "Delivered"
- ✅ Shipment status updated to "Completed"
- ✅ GPS location captured (if available)
- ✅ Delivery timestamp saved
- ✅ All delivery proof captured successfully
- ✅ Customer notifications sent
- ✅ Agent's delivery history updated

## 🔍 Verification Checklist

### **Backend API Verification**
- [ ] `PATCH /api/shipments/:id/delivered` endpoint works correctly
- [ ] All parcel statuses updated to "Delivered"
- [ ] Shipment status updated to "Completed"
- [ ] Delivery proof saved in database
- [ ] Tracking logs created for all parcels
- [ ] SMS notifications sent to all customers
- [ ] Invoice/receipt generation triggered

### **Frontend Verification**
- [ ] Delivery completion form renders correctly
- [ ] Photo upload functionality works
- [ ] Signature capture works (both web and mobile)
- [ ] Form validation works properly
- [ ] Loading states displayed during submission
- [ ] Success/error messages shown appropriately
- [ ] Page redirects correctly after completion

### **Database Verification**
- [ ] Shipment document updated correctly
- [ ] All parcel documents updated correctly
- [ ] Delivery proof stored properly
- [ ] Status history updated
- [ ] Tracking logs created
- [ ] Timestamps recorded accurately

### **SMS/Email Verification**
- [ ] Customer receives delivery notification
- [ ] SMS content is correct and personalized
- [ ] Email notifications sent (if configured)
- [ ] Tracking link included in notifications

### **Tracking Page Verification**
- [ ] All 5 tracking steps show as completed
- [ ] Delivery timestamp displayed
- [ ] Delivery proof accessible
- [ ] Status timeline is accurate
- [ ] Real-time updates work correctly

## 🧪 Test Data

### **Sample Shipment Data**
```json
{
  "shipmentId": "SH-2025-001",
  "parcels": [
    { "trackingId": "TRK001", "status": "In Transit" },
    { "trackingId": "TRK002", "status": "In Transit" },
    { "trackingId": "TRK003", "status": "In Transit" }
  ],
  "status": "Dispatched",
  "destinationHub": "Kuala Lumpur Hub"
}
```

### **Delivery Completion Payload**
```json
{
  "photoProof": "https://example.com/delivery-proof.jpg",
  "recipientName": "Siti Aminah",
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB...",
  "note": "Delivered successfully to recipient"
}
```

## 🚨 Edge Cases to Test

### **Negative Scenarios**
- [ ] Try to mark delivered without authentication
- [ ] Try to mark delivered with insufficient permissions
- [ ] Try to mark already delivered shipment
- [ ] Submit form without required fields
- [ ] Upload invalid file format for photo proof
- [ ] Network timeout during submission

### **Performance Scenarios**
- [ ] Mark delivery with large shipment (10+ parcels)
- [ ] Upload large photo file (>5MB)
- [ ] Concurrent delivery completions
- [ ] Slow network conditions

## 📊 Success Metrics

### **Functional Requirements**
- ✅ 100% of parcels marked as delivered
- ✅ Shipment status updated correctly
- ✅ All delivery proof captured
- ✅ Notifications sent successfully
- ✅ Tracking updated in real-time

### **Performance Requirements**
- ✅ API response time < 2 seconds
- ✅ Photo upload completes within 5 seconds
- ✅ Page loads within 3 seconds
- ✅ SMS sent within 10 seconds

### **User Experience Requirements**
- ✅ Intuitive delivery completion flow
- ✅ Clear success/error messages
- ✅ Mobile-friendly interface
- ✅ Accessible design (WCAG 2.1)

## 🔧 Test Environment Setup

### **Prerequisites**
1. BobbaExpress server running on localhost:5000
2. Database populated with test shipment SH-2025-001
3. Test users created (Admin, Staff, Agent)
4. SMS service configured (Fast2SMS API key)
5. File upload directory configured

### **Test Commands**
```bash
# Start the development server
npm run dev

# Run the automated test
node test_tc009.js

# Check database for test results
# Connect to MongoDB and verify:
# - Shipments collection
# - Parcels collection
# - TrackingLogs collection
```

## 📝 Test Results

### **Test Execution Date**: [Date]
### **Test Executor**: [Name]
### **Environment**: Development/Staging

| Test Case | Status | Notes |
|-----------|--------|-------|
| Web Delivery Completion | ✅/❌ | |
| Agent App Delivery Completion | ✅/❌ | |
| API Endpoint Testing | ✅/❌ | |
| SMS Notification Testing | ✅/❌ | |
| Database Verification | ✅/❌ | |
| Tracking Page Update | ✅/❌ | |

### **Issues Found**
1. [Issue description]
2. [Issue description]

### **Recommendations**
1. [Recommendation]
2. [Recommendation]

---

## 🎉 Test Completion

Once all test scenarios pass and verification items are checked, the TC-009 delivery completion feature is ready for production deployment.

**Final Status**: ✅ PASSED / ❌ FAILED

**Sign-off**: _________________________
**Date**: _________________________

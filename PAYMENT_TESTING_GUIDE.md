# Payment Integration Testing Guide

## Quick Start

### 1. Start the Backend
```bash
cd backend
npm install  # if needed
npm start
```

Backend should run on `http://localhost:5000`

### 2. Start the Frontend
```bash
npm run dev
```

Frontend should run on `http://localhost:5173` (or configured Vite port)

---

## Testing the Payment Flow

### Test Case 1: eSewa Payment

**Steps**:
1. Navigate to Admin → Expert Connect page
2. Find an expert card and click the booking button
3. The booking modal should open showing:
   - Expert name and role
   - Consultation fee (e.g., Rs. 500)
   - Payment method options (eSewa selected by default)
   - "What you'll get" section with benefits
4. Click "Pay with eSewa" button
5. Check for success message: "Payment of Rs. [amount] processed successfully!"

**Expected Result**: 
- Modal closes
- Success alert displayed
- Booking added to user's booked experts
- Check database: `db.expertbookings.find({paymentMethod: "esewa"})`

---

### Test Case 2: Bank Transfer Payment

**Steps**:
1. Open Expert Connect and click booking on any expert
2. Select "Bank Transfer" radio button
3. A dropdown appears with bank options:
   - Nepal Bank Limited
   - Rastriya Banijya Bank
   - NABIL Bank
   - Himalayan Bank
   - Siddhartha Bank
4. Select a bank (e.g., "Nepal Bank Limited")
5. Button text changes to "Confirm Bank Transfer"
6. Click the button
7. Check for success message

**Expected Result**:
- Modal closes
- Success alert displayed
- Database shows booking with `selectedBank: "Nepal Bank Limited"`

**Verify in Database**:
```bash
db.expertbookings.find({paymentMethod: "bank_transfer", selectedBank: "Nepal Bank Limited"})
```

---

### Test Case 3: Form Validation

**Test 3a - Bank Transfer without selecting bank**:
1. Select "Bank Transfer" radio button
2. Try clicking "Confirm Bank Transfer" without selecting a bank
3. Should see alert: "Please select a bank for transfer"
4. Modal remains open

**Test 3b - Submit without valid expert**:
1. This shouldn't be possible through normal UI flow
2. Backend validates expertId exists

---

### Test Case 4: Database Verification

Check MongoDB for created bookings:

```bash
# Connect to MongoDB
mongo

# Use your database
use smartagro

# View all bookings
db.expertbookings.find().pretty()

# View eSewa bookings only
db.expertbookings.find({paymentMethod: "esewa"}).pretty()

# View bank transfer bookings
db.expertbookings.find({paymentMethod: "bank_transfer"}).pretty()

# Check payment status
db.expertbookings.find({paymentStatus: "completed"}).pretty()
```

**Expected Fields**:
```json
{
  "_id": ObjectId("..."),
  "expertId": ObjectId("..."),
  "farmerId": "farmer_1234567890",
  "farmerName": "Anonymous Farmer",
  "expertName": "Expert Name",
  "consultationFee": 500,
  "paymentMethod": "esewa" | "bank_transfer",
  "selectedBank": "Nepal Bank Limited" | null,
  "paymentTransactionId": "TXN_1234567890_abc123",
  "paymentStatus": "completed",
  "status": "confirmed",
  "paymentDate": ISODate("2024-01-15T10:30:00Z"),
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

---

## API Endpoint Testing (Using cURL)

### Test eSewa Payment via API

```bash
curl -X POST http://localhost:5000/api/experts/bookings/payment \
  -H "Content-Type: application/json" \
  -d '{
    "expertId": "YOUR_EXPERT_ID",
    "farmerId": "test_farmer_001",
    "farmerName": "Test Farmer",
    "farmerEmail": "test@example.com",
    "expertName": "Test Expert",
    "expertise": "Crop Management",
    "consultationFee": 500,
    "scheduledDate": "2024-01-20",
    "scheduledTime": "10:00 AM",
    "topic": "Crop Disease",
    "description": "Test booking",
    "paymentMethod": "esewa",
    "amount": 500,
    "paymentTransactionId": "TXN_1234567890_test"
  }'
```

### Test Bank Transfer via API

```bash
curl -X POST http://localhost:5000/api/experts/bookings/payment \
  -H "Content-Type: application/json" \
  -d '{
    "expertId": "YOUR_EXPERT_ID",
    "farmerId": "test_farmer_002",
    "farmerName": "Test Farmer",
    "farmerEmail": "test@example.com",
    "expertName": "Test Expert",
    "expertise": "Crop Management",
    "consultationFee": 500,
    "scheduledDate": "2024-01-21",
    "scheduledTime": "11:00 AM",
    "topic": "Soil Analysis",
    "description": "Test bank transfer",
    "paymentMethod": "bank_transfer",
    "selectedBank": "Nepal Bank Limited",
    "amount": 500,
    "paymentTransactionId": "BANK_1234567890_test"
  }'
```

### Expected Success Response

```json
{
  "success": true,
  "message": "Payment processed and booking confirmed successfully",
  "booking": {
    "_id": "ObjectId...",
    "expertId": "ObjectId...",
    "paymentMethod": "esewa",
    "paymentStatus": "completed",
    "status": "confirmed"
  }
}
```

---

## Browser Console Debugging

### Enable Console Logging
The PaymentService logs important information:

```javascript
// Check PaymentService initialization
console.log(PaymentService.getSupportedBanks())
// Output: ['Nepal Bank Limited', 'Rastriya Banijya Bank', ...]

// Generate test transaction ID
console.log(PaymentService.generateTransactionId())
// Output: TXN_1705329600000_a1b2c3d4e

// Get bank details
console.log(PaymentService.getBankTransferDetails('Nepal Bank Limited'))
// Output: { accountName: 'SmartAGRO Agriculture', accountNumber: '1234567890', ... }
```

### Monitor Network Requests
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Perform payment action
4. Look for POST request to `/api/experts/bookings/payment`
5. Check request/response JSON

---

## Common Issues & Troubleshooting

### Issue 1: "Expert is not available at this time"
**Cause**: Booking slot already taken
**Solution**: Try booking with different date/time or different expert

### Issue 2: "Please select a bank for transfer"
**Cause**: Bank Transfer selected but no bank chosen
**Solution**: Select a bank from the dropdown before clicking confirm

### Issue 3: "Payment processing failed"
**Cause**: Backend endpoint not responding
**Solutions**:
- Verify backend server is running on port 5000
- Check MongoDB connection
- Check browser console for error details
- Check server logs for error messages

### Issue 4: Modal shows old data
**Cause**: State not properly reset
**Solution**: Hard refresh page (Ctrl+F5) or clear browser cache

### Issue 5: Database not showing new bookings
**Cause**: MongoDB not connected or wrong database
**Solutions**:
- Check backend logs: `MongoDB connected`
- Verify database name in server.js
- Ensure MongoDB service is running

---

## Success Criteria

✅ eSewa payment flow completes without errors
✅ Bank transfer option shows dropdown with 5 banks
✅ Selecting bank changes button text
✅ Success alert displays correct amount
✅ Modal closes after successful booking
✅ Database record created with correct payment method
✅ Expert booking appears in admin dashboard
✅ Payment status shows "completed"

---

## Notes for Further Testing

1. **eSewa Live Testing**: Currently using test merchant code (EPAYTEST). To test with real eSewa:
   - Get production merchant code from eSewa
   - Update ESEWA_CONFIG.merchantCode in PaymentService.ts
   - Update success/failure URLs
   - Implement real payment verification API call

2. **Bank Transfer Verification**: Currently auto-marked as completed. For real implementation:
   - Add manual verification step
   - Send confirmation to registered bank account
   - Implement webhook for bank payment confirmation
   - Update booking status only after bank confirms

3. **Email Notifications**: Not yet implemented. Consider adding:
   - Confirmation email to farmer
   - Notification email to expert
   - Payment receipt

---

**Testing Version**: 1.0
**Last Updated**: January 2024

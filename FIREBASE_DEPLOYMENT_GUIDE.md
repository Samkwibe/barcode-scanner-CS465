# Firebase Deployment Guide

## ✅ What's Been Set Up

### 1. **Firebase Hosting Configuration**
- ✅ `firebase.json` configured with hosting and function rewrites
- ✅ Build output directory: `dist/`
- ✅ Function rewrite: `/api/upc/**` → Firebase Cloud Function

### 2. **Firebase Cloud Function**
- ✅ Function created: `functions/upc-proxy.js`
- ✅ Handles UPC Database API requests
- ✅ Adds CORS headers
- ✅ Supports query parameters: `?barcode=123` or `?q=search`

### 3. **Frontend Updates**
- ✅ Auto-detects Firebase Hosting and uses `/api/upc` proxy
- ✅ Real-time API lookup when scanning barcodes
- ✅ Product information display (title, brand, description, image)
- ✅ Custom expiration dates in scan confirmation dialog
- ✅ Scan history with countdown timers
- ✅ Firebase/Firestore integration for persistent storage

## 🚀 Deployment Steps

### Step 1: Configure Firebase Function API Key

The Firebase Cloud Function needs your UPC Database API key. Set it using:

```bash
firebase functions:config:set upc.apikey="YOUR_UPC_API_KEY"
```

**Where to get your API key:**
- Sign up at https://upcdatabase.org/
- Get your API key from your account dashboard

### Step 2: Deploy Firebase Cloud Function

```bash
firebase deploy --only functions
```

This will deploy the `upc` function that proxies API requests.

### Step 3: Deploy Frontend to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

Or use the shortcut:
```bash
npm run deploy:firebase
```

## 📋 Complete Feature List

### ✅ Real-Time API Lookup
- When a barcode is scanned, the app immediately queries the UPC Database API
- Product information is fetched and displayed in real-time
- Works through Firebase Cloud Function proxy (keeps API key secure)

### ✅ Product Information Display
- **Product Title**: Name of the product
- **Brand**: Manufacturer/brand name
- **Description**: Product details
- **Image**: Product photo (if available)
- **Barcode**: Scanned barcode value

### ✅ Save to Database
- All scans are saved to Firestore (cloud database)
- Requires user authentication (sign in required)
- Data persists across devices
- Offline support with auto-sync

### ✅ Custom Expiration Dates
- Users can set custom expiration dates in the confirmation dialog
- Default: 30 days from scan date
- Expiration dates are saved to Firestore
- Used for countdown timers and notifications

### ✅ Scan History
- View all scanned items in history
- Search and filter by:
  - Product name
  - Brand
  - Expiration status (fresh, expiring, expired)
- Countdown timers show time until expiration
- Click items to view full product details

### ✅ Timer & Notifications
- Real-time countdown timers for each item
- Visual indicators:
  - ✅ Fresh (more than 7 days)
  - ⏳ Expiring (less than 7 days)
  - 🔴 Expired
- Browser notifications when items are about to expire
- In-app toast notifications

## 🔧 Configuration

### Environment Variables (Firebase Functions)

Set in Firebase Console or via CLI:
```bash
firebase functions:config:set upc.apikey="YOUR_KEY"
```

### Firebase Configuration (Frontend)

Set in Firebase Console → Project Settings → Your apps:
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

These are automatically injected during build if set as environment variables.

## 🌐 Live URLs

After deployment:
- **Hosting**: https://barcode-scanner-cs465.web.app
- **Alternate**: https://barcode-scanner-cs465.firebaseapp.com
- **API Function**: https://barcode-scanner-cs465.web.app/api/upc?barcode=123

## 🧪 Testing

1. **Test API Lookup:**
   - Scan a barcode
   - Verify product info appears immediately
   - Check that image, title, brand, description are displayed

2. **Test Custom Expiration:**
   - Scan a barcode
   - Click "Show confirmation before saving" in settings
   - Set a custom expiration date
   - Save and verify it appears in history with correct countdown

3. **Test History:**
   - Open History dialog
   - Verify all scanned items appear
   - Check countdown timers are updating
   - Test search and filter functionality

4. **Test Firebase Sync:**
   - Sign in with an account
   - Scan items on one device
   - Sign in on another device
   - Verify items sync across devices

## 📝 Notes

- The Firebase Cloud Function keeps your API key secure (not exposed to frontend)
- All data requires authentication (users must sign in)
- Offline scans are automatically synced when connection is restored
- Expiration dates are customizable per item
- Countdown timers update every second for accuracy


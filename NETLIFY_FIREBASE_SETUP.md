# Netlify Firebase Environment Variables Setup

## ✅ Your Firebase Configuration

Based on your Firebase config, here are the values to set in Netlify:

## 📋 Steps to Fix Netlify Environment Variables

1. **Go to Netlify Dashboard**
   - Your Site → Site Settings → Environment Variables

2. **Update/Add these variables with your Firebase values:**

   ```
   FIREBASE_API_KEY = AIzaSyB9rONAKw6unIEsS2f0qptmSIyflM3q-OM
   
   FIREBASE_AUTH_DOMAIN = family-housing-hub.firebaseapp.com
   
   FIREBASE_PROJECT_ID = family-housing-hub
   
   FIREBASE_STORAGE_BUCKET = family-housing-hub.firebasestorage.app
   
   FIREBASE_MESSAGING_SENDER_ID = 677200955206
   
   FIREBASE_APP_ID = 1:677200955206:web:1008d5edde6b1f02be4747
   ```

3. **For each variable:**
   - Click on the variable name
   - Click "Edit" or "Update"
   - Paste the value (no quotes, just the value)
   - Save

4. **Redeploy your site**
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"

## ✅ After Setup

- Firebase will initialize automatically with these credentials
- Users can sign up/sign in
- All scans will save to Firestore
- No more API key errors!

## 🔒 Security Note

These credentials are safe to use in environment variables. They're meant to be public (they're in your client-side code anyway). However, make sure your Firestore security rules are properly configured to protect user data.

---

**Your Firebase Project:** `family-housing-hub`  
**Status:** Ready to configure! ✅


# Fix Netlify Environment Variables to Prevent Firebase Errors

## 🔍 The Problem

You have Firebase environment variables set in Netlify, but they likely contain **invalid or placeholder values**. This causes the "auth/api-key-not-valid" error.

## ✅ Solution: Choose One Option

### Option 1: Remove Firebase Env Vars (RECOMMENDED) ⭐

**Best for:** Letting each user configure their own Firebase project

**Steps:**
1. Go to Netlify Dashboard
2. Your Site → Site Settings → Environment Variables
3. **Delete** these variables:
   - `FIREBASE_API_KEY`
   - `FIREBASE_APP_ID`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
4. **Keep** these (they're fine):
   - `ITEM_INFO_PROXY_URL`
   - `UPC_API_KEY`
   - `NETLIFY_DATABASE_URL` (if you're using it)
   - `NETLIFY_DATABASE_URL_UNPOOLED` (if you're using it)
5. Redeploy your site

**Result:** Users will configure Firebase through the app UI. No errors!

---

### Option 2: Set Valid Firebase Credentials

**Best for:** If you want everyone to use the same Firebase project

**Steps:**
1. Get your Firebase config:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Click the gear icon → Project Settings
   - Scroll to "Your apps" → Web app
   - Copy the config values

2. In Netlify, update each variable with **valid** values:
   - `FIREBASE_API_KEY` → Your actual API key (long string, ~40+ chars)
   - `FIREBASE_APP_ID` → Your actual App ID
   - `FIREBASE_AUTH_DOMAIN` → Your actual auth domain (e.g., `your-project.firebaseapp.com`)
   - `FIREBASE_MESSAGING_SENDER_ID` → Your actual sender ID
   - `FIREBASE_PROJECT_ID` → Your actual project ID
   - `FIREBASE_STORAGE_BUCKET` → Your actual storage bucket

3. **Important:** Make sure values are:
   - ✅ Not placeholders (no "YOUR_", "example", "placeholder")
   - ✅ At least 20 characters for API key
   - ✅ Valid Firebase credentials from your project

4. Redeploy your site

---

## 🛡️ What We Fixed in the Code

The app now:
- ✅ **Validates env vars** before using them
- ✅ **Skips initialization** if env vars look invalid
- ✅ **Shows clear errors** instead of crashing
- ✅ **Allows reconfiguration** through the app UI

## 📋 Quick Checklist

- [ ] Check Netlify env vars for Firebase
- [ ] Either remove them OR set valid values
- [ ] Redeploy site
- [ ] Test - error should be gone!

## 🎯 Recommendation

**I recommend Option 1** (remove the env vars) because:
- ✅ Each user can use their own Firebase project
- ✅ No risk of exposing your Firebase credentials
- ✅ More flexible for different users
- ✅ Users configure once in the app UI

---

**After fixing, the error will stop appearing!** 🎉


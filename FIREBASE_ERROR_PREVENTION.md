# How to Prevent Firebase API Key Errors

## ✅ What We Fixed

The app now has **better validation** to prevent Firebase from trying to initialize with invalid API keys. This means:

1. **No more auto-initialization with invalid keys** - The app checks if API keys look valid before trying to use them
2. **Better error handling** - Invalid keys are caught and reset automatically
3. **Clear error messages** - Users see helpful messages instead of cryptic errors

## 🔍 What Causes the Error

The error "auth/api-key-not-valid" happens when:

1. **Environment variables** in Netlify/build process have invalid Firebase keys
2. **window.__FIREBASE_CONFIG__** is set with invalid values in HTML
3. **Previous configuration** stored somewhere has invalid keys

## 🛡️ How to Prevent It

### For Netlify Deployment:

1. **Check Netlify Environment Variables:**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Make sure `FIREBASE_API_KEY` and other Firebase vars are:
     - ✅ Set to valid values (not placeholders)
     - ✅ At least 20 characters long
     - ✅ Don't contain "YOUR_", "example", or "placeholder"
   - If they're invalid, either:
     - Remove them (let users configure in the app)
     - Set them to valid Firebase credentials

2. **Best Practice:**
   - **Don't set Firebase env vars in Netlify** unless you have valid credentials
   - Let users configure Firebase through the app UI instead
   - This way each user can use their own Firebase project

### For Local Development:

1. **Check for `window.__FIREBASE_CONFIG__`:**
   - Open `src/index.html`
   - Look for any `<script>` tag that sets `window.__FIREBASE_CONFIG__`
   - If it has invalid keys, remove it or update with valid keys

2. **Check `.env` file:**
   - If you have a `.env` file, make sure Firebase variables are valid
   - Or remove them to let users configure in the app

### For Users:

1. **Configure Firebase in the App:**
   - Click "Login" button
   - Paste valid Firebase config JSON
   - Click "Configure Firebase"
   - The app will validate the keys before using them

## ✅ Validation Rules

The app now checks that Firebase config:
- ✅ API key is at least 20 characters
- ✅ API key doesn't contain "YOUR_", "example", or "placeholder"
- ✅ Project ID is at least 3 characters
- ✅ Project ID doesn't contain placeholder text
- ✅ All required fields are present

## 🚨 If You Still See the Error

1. **Clear browser storage:**
   ```javascript
   // In browser console (F12)
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Check Netlify environment variables:**
   - Remove or fix invalid Firebase env vars
   - Redeploy the site

3. **Check HTML for inline config:**
   - Look for `window.__FIREBASE_CONFIG__` in `src/index.html`
   - Remove or fix it

4. **Configure Firebase in the app:**
   - Use the Account dialog to paste valid config
   - The app will validate it before using

## 📝 Summary

**To prevent the error:**
- ✅ Don't set invalid Firebase env vars in Netlify
- ✅ Don't use placeholder values
- ✅ Let users configure Firebase through the app UI
- ✅ The app now validates keys before using them

**The app will:**
- ✅ Skip initialization if keys look invalid
- ✅ Show clear error messages
- ✅ Allow users to reconfigure with valid keys
- ✅ Work in local-only mode if Firebase isn't configured

---

**Last Updated:** December 2025


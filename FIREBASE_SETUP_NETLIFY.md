# Firebase Setup for Netlify Deployment

## Quick Setup Guide

Your app is deployed at: **melodic-sundae-fa3b00.netlify.app**

Firebase is already integrated in your code! You just need to configure it properly for the deployed site.

## Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project OR create a new project
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll to "Your apps" section
5. If you don't have a web app, click **Add app** → Select Web (</>) → Register app
6. Copy the `firebaseConfig` object values

You'll see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 2: Enable Firebase Services

### Enable Authentication
1. In Firebase Console → **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** sign-in method
4. Enable **Anonymous** sign-in method

### Enable Firestore Database
1. In Firebase Console → **Firestore Database**
2. Click **Create database**
3. Choose **Production mode** or **Test mode** (for development)
4. Select your region (closest to your users)
5. Click **Enable**

### Set Firestore Security Rules
1. Go to **Firestore Database** → **Rules** tab
2. Use these rules to secure your data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write only their own scans
    match /scans/{scanId} {
      allow read, write: if request.auth != null 
                         && request.resource.data.userId == request.auth.uid;
      allow create: if request.auth != null 
                    && request.resource.data.userId == request.auth.uid;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

## Step 3: Configure Netlify Environment Variables

### Method A: Using Netlify Dashboard (Recommended)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: **melodic-sundae-fa3b00**
3. Go to **Site configuration** → **Environment variables**
4. Click **Add a variable** and add each of these:

| Variable Name | Value (from Firebase) |
|---------------|----------------------|
| `FIREBASE_API_KEY` | Your API key from Firebase |
| `FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com |
| `FIREBASE_PROJECT_ID` | your-project-id |
| `FIREBASE_STORAGE_BUCKET` | your-project.appspot.com |
| `FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `FIREBASE_APP_ID` | Your app ID |

5. After adding all variables, click **Save**

### Method B: Using Netlify CLI

```bash
# Make sure you're in your project directory
cd /Users/samuelraymond/Documents/GitHub/barcode-scanner-CS465

# Set environment variables (replace with your actual values)
netlify env:set FIREBASE_API_KEY "your-api-key"
netlify env:set FIREBASE_AUTH_DOMAIN "your-project.firebaseapp.com"
netlify env:set FIREBASE_PROJECT_ID "your-project-id"
netlify env:set FIREBASE_STORAGE_BUCKET "your-project.appspot.com"
netlify env:set FIREBASE_MESSAGING_SENDER_ID "your-sender-id"
netlify env:set FIREBASE_APP_ID "your-app-id"
```

## Step 4: Redeploy Your Site

After setting environment variables, you need to redeploy:

### Option A: Via Netlify Dashboard
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**

### Option B: Via Git Push
```bash
# Make a small change (or empty commit)
git commit --allow-empty -m "Trigger rebuild with Firebase env vars"
git push origin main
```

### Option C: Via Netlify CLI
```bash
netlify deploy --prod
```

## Step 5: Verify It Works

1. Visit your deployed site: **https://melodic-sundae-fa3b00.netlify.app**
2. Open browser DevTools (F12) → Console tab
3. Look for any Firebase errors
4. Try signing in:
   - Click the **Account** button
   - Click **Continue Without Account** (anonymous sign-in)
   - Or create an account with email/password
5. Scan a barcode and save it
6. Check if it appears in your Firestore database

## Troubleshooting

### Issue: "Firebase not configured" message
**Solution**: Check that environment variables are set correctly and redeploy

### Issue: Authentication errors
**Solution**: 
- Verify Email/Password and Anonymous are enabled in Firebase Console
- Check that `authDomain` is correct in environment variables
- Add your Netlify domain to Firebase authorized domains:
  1. Firebase Console → Authentication → Settings → Authorized domains
  2. Add: `melodic-sundae-fa3b00.netlify.app`

### Issue: Firestore permission denied
**Solution**: 
- Check Firestore security rules allow authenticated users to read/write
- Verify user is signed in before accessing Firestore

### Issue: Can't see Firebase logs
**Solution**: Open browser DevTools → Console to see Firebase connection status

## Testing Locally with Environment Variables

To test with environment variables locally, create a `.env` file:

```bash
# .env (don't commit this file!)
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

Add `.env` to your `.gitignore`:
```bash
echo ".env" >> .gitignore
```

## Alternative: Hardcode Values (Not Recommended for Production)

If you want to quickly test, you can hardcode values in `src/js/services/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",  // Your actual API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

⚠️ **Note**: This is less secure but works fine for development/class projects.

## Summary Checklist

- [ ] Created Firebase project
- [ ] Enabled Authentication (Email/Password + Anonymous)
- [ ] Created Firestore Database
- [ ] Set Firestore security rules
- [ ] Got Firebase config values
- [ ] Added environment variables to Netlify
- [ ] Redeployed site
- [ ] Added Netlify domain to Firebase authorized domains
- [ ] Tested sign-in on deployed site
- [ ] Tested scanning and saving to history

## Need Help?

If you get stuck:
1. Check browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase services are enabled
4. Check Firestore security rules allow your operations

Your app will work perfectly with Firebase + Netlify once configured! 🚀


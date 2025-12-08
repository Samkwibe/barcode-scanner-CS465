# How to Get Ingredients for a Specific User from Firebase

## Overview

Ingredients are stored as product **titles** in the user's scans collection in Firestore. Each scan document has a `title` field that represents the ingredient/product name.

## Method 1: Using the Existing Helper Function

The easiest way is to use the existing `getUserScans()` function and extract titles:

```javascript
import { getUserScans } from './services/firebase-scans.js';

async function getUserIngredients(userId) {
  // Get all scans for the user
  const { error, scans } = await getUserScans(1000); // Get up to 1000 scans
  
  if (error) {
    console.error('Error getting scans:', error);
    return [];
  }
  
  // Extract unique ingredient titles from scans
  const ingredients = [];
  const seen = new Set();
  
  scans.forEach(scan => {
    const title = scan.title || scan.value; // Use title, fallback to barcode value
    if (title && !seen.has(title.toLowerCase())) {
      ingredients.push(title);
      seen.add(title.toLowerCase());
    }
  });
  
  return ingredients;
}

// Usage
const ingredients = await getUserIngredients();
console.log('User ingredients:', ingredients);
```

## Method 2: Direct Firestore Query

If you need more control or want to query for a specific user ID:

```javascript
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './services/firebase-config.js'; // Make sure db is exported
import { getUserId } from './services/firebase-auth.js';

const SCANS_COLLECTION = 'scans';

async function getUserIngredientsDirect(userId = null) {
  // Use provided userId or get current user's ID
  const targetUserId = userId || getUserId();
  
  if (!targetUserId) {
    throw new Error('User ID is required');
  }
  
  // Query Firestore for all scans by this user
  const scansQuery = query(
    collection(db, SCANS_COLLECTION),
    where('userId', '==', targetUserId),
    orderBy('scannedAt', 'desc'),
    limit(1000) // Adjust limit as needed
  );
  
  const querySnapshot = await getDocs(scansQuery);
  const ingredients = [];
  const seen = new Set();
  
  querySnapshot.forEach(doc => {
    const scanData = doc.data();
    const title = scanData.title || scanData.value;
    
    if (title && !seen.has(title.toLowerCase())) {
      ingredients.push({
        name: title,
        scanId: doc.id,
        scannedAt: scanData.scannedAt?.toDate() || null,
        brand: scanData.brand || '',
        description: scanData.description || ''
      });
      seen.add(title.toLowerCase());
    }
  });
  
  return ingredients;
}

// Usage
const ingredients = await getUserIngredientsDirect();
// Or for a specific user:
// const ingredients = await getUserIngredientsDirect('user-id-here');
```

## Method 3: Create a Dedicated Helper Function

Add this to `src/js/services/firebase-scans.js`:

```javascript
/**
 * Get all unique ingredients (product titles) for the current user
 * @param {number} [maxResults=1000] - Maximum number of scans to check
 * @returns {Promise<{error: null|Error, ingredients: Array<string>}>}
 */
export async function getUserIngredients(maxResults = 1000) {
  const { error, scans } = await getUserScans(maxResults);
  
  if (error) {
    return { error, ingredients: [] };
  }
  
  const ingredients = [];
  const seen = new Set();
  
  scans.forEach(scan => {
    const title = scan.title || scan.value;
    if (title && !seen.has(title.toLowerCase())) {
      ingredients.push(title);
      seen.add(title.toLowerCase());
    }
  });
  
  return { error: null, ingredients };
}
```

Then use it:

```javascript
import { getUserIngredients } from './services/firebase-scans.js';

const { error, ingredients } = await getUserIngredients();

if (error) {
  console.error('Error:', error);
} else {
  console.log('Ingredients:', ingredients);
  // ingredients is an array of strings like:
  // ["Coca Cola Classic", "Oreos", "Cheerios", ...]
}
```

## Data Structure

Each scan document in Firestore has this structure:

```javascript
{
  userId: "user-id-here",
  value: "049000050103", // Barcode value
  title: "Coca Cola Classic", // This is the ingredient name
  brand: "Coca Cola",
  description: "Carbonated Soft Drink",
  format: "ean_13",
  scannedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  metadata: {
    source: "camera",
    hasProductInfo: true
  }
}
```

## Important Notes

1. **Authentication Required**: The user must be authenticated to query their scans
2. **Firebase Must Be Configured**: Firebase must be initialized and configured
3. **Collection Name**: The collection is named `scans` (see `SCANS_COLLECTION` constant)
4. **Deduplication**: The examples above deduplicate ingredients by converting to lowercase
5. **Performance**: For large datasets, consider pagination or limiting results

## Example: Using in a Component

```javascript
import { getUserIngredients } from './services/firebase-scans.js';

class MyComponent extends HTMLElement {
  async connectedCallback() {
    const { error, ingredients } = await getUserIngredients();
    
    if (error) {
      this.renderError(error);
      return;
    }
    
    this.renderIngredients(ingredients);
  }
  
  renderIngredients(ingredients) {
    this.innerHTML = `
      <h2>Your Ingredients (${ingredients.length})</h2>
      <ul>
        ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
      </ul>
    `;
  }
}
```

## Firestore Security Rules

Make sure your Firestore rules allow users to read their own scans:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scans/{scanId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```


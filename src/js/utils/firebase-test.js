/**
 * Firebase Integration Test Utility
 * Helps verify Firebase is working correctly
 */

import { isFirebaseConfigured } from '../services/firebase-config.js';
import { 
  initAuth, 
  signInAnonymous, 
  isAuthenticated, 
  getCurrentUser,
  getUserId 
} from '../services/firebase-auth.js';
import { initFirestore, saveScan, getUserScans } from '../services/firebase-scans.js';
import { log } from './log.js';

/**
 * Test Firebase configuration and functionality
 * @returns {Promise<{success: boolean, results: object}>}
 */
export async function testFirebase() {
  const results = {
    configured: false,
    auth: false,
    firestore: false,
    saveTest: false,
    readTest: false,
    errors: []
  };

  try {
    // Test 1: Check if Firebase is configured
    results.configured = isFirebaseConfigured();
    if (!results.configured) {
      results.errors.push('Firebase not configured - check environment variables');
      return { success: false, results };
    }
    log.info('✅ Firebase is configured');

    // Test 2: Initialize Firestore
    try {
      const firestoreResult = await initFirestore();
      if (!firestoreResult.error) {
        results.firestore = true;
        log.info('✅ Firestore initialized');
      } else {
        results.errors.push(`Firestore init error: ${firestoreResult.error.message}`);
      }
    } catch (error) {
      results.errors.push(`Firestore error: ${error.message}`);
    }

    // Test 3: Initialize Auth
    try {
      const user = await initAuth();
      results.auth = true;
      log.info('✅ Auth initialized', user ? `User: ${user.uid}` : 'No user');
    } catch (error) {
      results.errors.push(`Auth init error: ${error.message}`);
    }

    // Test 4: Sign in anonymously (if not already signed in)
    if (!isAuthenticated()) {
      try {
        const { error, user } = await signInAnonymous();
        if (!error && user) {
          log.info('✅ Anonymous sign-in successful');
        } else {
          results.errors.push(`Anonymous sign-in failed: ${error?.message}`);
        }
      } catch (error) {
        results.errors.push(`Sign-in error: ${error.message}`);
      }
    } else {
      log.info('✅ User already authenticated');
    }

    // Test 5: Save a test scan
    if (isAuthenticated()) {
      try {
        const testScan = {
          value: 'TEST_' + Date.now(),
          format: 'test',
          title: 'Firebase Test Item',
          metadata: { test: true }
        };
        
        const saveResult = await saveScan(testScan);
        if (!saveResult.error) {
          results.saveTest = true;
          log.info('✅ Test scan saved successfully');
          
          // Test 6: Read scans back
          try {
            const { error, scans } = await getUserScans(10);
            if (!error && scans) {
              const testScanFound = scans.find(s => s.value === testScan.value);
              if (testScanFound) {
                results.readTest = true;
                log.info('✅ Test scan retrieved successfully');
              } else {
                results.errors.push('Test scan not found in retrieved scans');
              }
            } else {
              results.errors.push(`Read test failed: ${error?.message}`);
            }
          } catch (error) {
            results.errors.push(`Read error: ${error.message}`);
          }
        } else {
          results.errors.push(`Save test failed: ${error?.message}`);
        }
      } catch (error) {
        results.errors.push(`Save error: ${error.message}`);
      }
    }

    const success = results.configured && results.auth && results.firestore;
    return { success, results };

  } catch (error) {
    results.errors.push(`Test error: ${error.message}`);
    return { success: false, results };
  }
}

/**
 * Get Firebase status for display
 * @returns {object}
 */
export function getFirebaseStatus() {
  const configured = isFirebaseConfigured();
  const authenticated = isAuthenticated();
  const user = getCurrentUser();
  const userId = getUserId();

  return {
    configured,
    authenticated,
    user: user ? {
      uid: user.uid,
      email: user.email,
      isAnonymous: user.isAnonymous
    } : null,
    userId
  };
}


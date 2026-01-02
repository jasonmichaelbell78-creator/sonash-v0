import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"
// AppCheck imports commented out until ready to implement
// import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from "firebase/app-check"
import type { AppCheck } from "firebase/app-check"

const validateEnv = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${key}`)
  }
  return value
}

const getFirebaseConfig = () => ({
  apiKey: validateEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY, "NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: validateEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: validateEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, "NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: validateEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: validateEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: validateEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID, "NEXT_PUBLIC_FIREBASE_APP_ID"),
})

// Lazy initialization - only initialize when accessed in browser
let _app: FirebaseApp | undefined
let _auth: Auth | undefined
let _db: Firestore | undefined
let _appCheck: AppCheck | undefined



// Only initialize Firebase on the client side
const initializeFirebase = () => {
  if (typeof window === 'undefined') {
    // Server-side: return undefined, will be initialized on client
    return
  }

  if (_app) return

  const config = getFirebaseConfig()
  _app = getApps().length === 0 ? initializeApp(config) : getApps()[0]

  _auth = getAuth(_app)
  _db = getFirestore(_app)

  // TEMPORARILY DISABLED: App Check is disabled due to 24-hour throttle
  // Will re-enable after throttle clears (Dec 31, ~01:02 UTC)
  // Initialize App Check for security
  // SECURITY: App Check prevents unauthorized access to Cloud Functions
  /* try {
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY

    if (recaptchaSiteKey) {
      // Set debug token for development before initializing App Check
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN) {
        const debugToken = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN
        if (debugToken) {
          // Convert string "true" to boolean true for auto-generated tokens
          const debugValue = debugToken === 'true' ? true : debugToken;
          // Must set on self (global scope) before App Check initialization
          const globalSelf = self as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean };
          globalSelf.FIREBASE_APPCHECK_DEBUG_TOKEN = debugValue;
        } else {
          console.warn('App Check debug token not set. For local development, set NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN ' +
            'to enable App Check on localhost. See docs/APPCHECK_SETUP.md for details.')
        }
      }

      // Initialize App Check with ReCaptchaEnterpriseProvider (production and development)
      _appCheck = initializeAppCheck(_app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      })
    } else {
      console.warn('App Check not configured: Missing NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY. Cloud Function calls may fail.')
    }
  } catch (error) {
    console.error('Failed to initialize App Check:', error)
  } */
}

// Initialize on module load only if in browser
if (typeof window !== 'undefined') {
  initializeFirebase()
}

/**
 * Get Firebase instances with runtime safety checks.
 * This prevents crashes from accessing undefined instances on server-side.
 *
 * @throws {Error} If Firebase is not initialized (e.g., on server-side)
 * @returns Firebase instances (app, auth, db, appCheck)
 *
 * Note: appCheck is returned but not exported directly because it auto-activates
 * on initialization and doesn't require direct consumer access. Access via getFirebase()
 * only if you need to interact with App Check APIs directly.
 */
export const getFirebase = () => {
  if (!_app || !_auth || !_db) {
    throw new Error(
      "Firebase not initialized. This usually means you're trying to access Firebase on the server. " +
      "Ensure Firebase is only accessed in client components or after checking typeof window !== 'undefined'."
    )
  }
  return { app: _app, auth: _auth, db: _db, appCheck: _appCheck }
}

/**
 * Create a proxy that throws helpful errors when Firebase is accessed on server.
 * This prevents silent crashes from accessing undefined properties.
 */
const createServerGuard = <T extends object>(name: string): T => {
  return new Proxy({} as T, {
    get(_, prop) {
      throw new Error(
        `Cannot access Firebase ${name}.${String(prop)} on server-side. ` +
        `Use 'use client' directive or check typeof window !== 'undefined' before importing.`
      );
    }
  });
};

// Exports with SSR safety
// In browser: real Firebase instances
// On server: proxy objects that throw helpful errors instead of crashing silently
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
  // Client-side: use real Firebase instances
  try {
    const firebase = getFirebase();
    app = firebase.app;
    auth = firebase.auth;
    db = firebase.db;
  } catch (e) {
    // If getFirebase fails on client (shouldn't happen), create guards
    console.error('Firebase initialization failed on client:', e);
    app = createServerGuard<FirebaseApp>('app');
    auth = createServerGuard<Auth>('auth');
    db = createServerGuard<Firestore>('db');
  }
} else {
  // Server-side: provide helpful error proxies instead of undefined
  // This prevents "Cannot read property X of undefined" crashes
  app = createServerGuard<FirebaseApp>('app');
  auth = createServerGuard<Auth>('auth');
  db = createServerGuard<Firestore>('db');
}

export { app, auth, db };


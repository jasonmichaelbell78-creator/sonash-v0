import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check"

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

const initializeAppCheckIfConfigured = (app: FirebaseApp) => {
  // CRITICAL: Completely disable App Check in development to prevent 400 errors
  // Firebase Functions v2 validates App Check tokens at the infrastructure level,
  // even if consumeAppCheckToken is false. If the client initializes App Check
  // but doesn't have valid tokens, all Cloud Function calls will fail with 400.

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  if (!siteKey) {
    const message =
      "⚠️ App Check not configured: Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY. " +
      "Requests to protected Firebase resources will fail."

    if (process.env.NODE_ENV === "production") {
      // In production we surface a hard error so deployments fail fast instead of silently
      // sending unauthenticated requests that the backend will reject.
      throw new Error(message)
    }

    console.warn(message)
    return
  }

  try {
    // Development: Set debug token to bypass reCAPTCHA during local testing
    // SECURITY: Only set in development to prevent production token bypass
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN) {
      // @ts-expect-error - Firebase sets this globally for dev
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;
      console.warn('⚠️ App Check debug token enabled - DEVELOPMENT ONLY');
    }

    // Initialize App Check
    // Reverting to Enterprise Provider as the key is confirmed Enterprise.
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true, // Auto-refresh tokens before expiry
    })
  } catch (error) {
    console.error("⚠️ App Check initialization failed:", error)
    // Non-fatal: App will work but without bot protection
  }
}

// Only initialize Firebase on the client side
const initializeFirebase = () => {
  if (typeof window === 'undefined') {
    // Server-side: return undefined, will be initialized on client
    return
  }

  if (_app) return

  const config = getFirebaseConfig()
  _app = getApps().length === 0 ? initializeApp(config) : getApps()[0]

  // Initialize App Check as early as possible so that subsequent Firestore/Functions
  // requests automatically include the token. Delaying this caused 400/401 errors in
  // production because the backend enforces App Check (`consumeAppCheckToken: true`).
  initializeAppCheckIfConfigured(_app)

  _auth = getAuth(_app)
  _db = getFirestore(_app)
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
 * @returns Firebase instances (app, auth, db)
 */
export const getFirebase = () => {
  if (!_app || !_auth || !_db) {
    throw new Error(
      "Firebase not initialized. This usually means you're trying to access Firebase on the server. " +
      "Ensure Firebase is only accessed in client components or after checking typeof window !== 'undefined'."
    )
  }
  return { app: _app, auth: _auth, db: _db }
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


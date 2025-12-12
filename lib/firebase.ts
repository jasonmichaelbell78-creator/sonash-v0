import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"

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
}

// Initialize on module load only if in browser
if (typeof window !== 'undefined') {
  initializeFirebase()
}

// Export instances (will be undefined on server, initialized on client)
export const app = _app!
export const auth = _auth!
export const db = _db!

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local manually as fallback
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Required for Firebase Hosting static deployment
  images: {
    unoptimized: true,
  },
  experimental: {
    turbopack: {
      root: __dirname,
    },
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyAu8u12YDUsTsgVGkigxuffXB5k532JbsQ',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'sonash-app.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'sonash-app',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'sonash-app.firebasestorage.app',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '236021751794',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:236021751794:web:d5d2fed46a8ff918bf956b',
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: '6LeipCosAAAAAJT6FfFVLsjhGxcm2OlSd_c4i-nH',
    NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN: '8b73048e-8b43-4c73-b099-701e407c1325',
    NEXT_PUBLIC_SENTRY_DSN: 'https://dc518f8a952cfa6e675707388fdd7801@o4510530873589760.ingest.us.sentry.io/4510530875097088',
  },
}

export default nextConfig

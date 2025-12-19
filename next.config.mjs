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
  // Environment variables are loaded from .env.local (gitignored)
  // Do NOT hardcode secrets here - they end up in git history
}

export default nextConfig

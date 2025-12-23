#!/bin/bash
# Script to delete and redeploy admin dashboard functions
# This ensures no lingering App Check configuration

set -e

echo "🔧 Building Cloud Functions..."
cd functions
npm run build
cd ..

echo "🗑️  Deleting old admin dashboard functions..."
firebase functions:delete adminHealthCheck --project sonash-app --force --non-interactive || true
firebase functions:delete adminGetDashboardStats --project sonash-app --force --non-interactive || true

echo "📦 Deploying fresh admin dashboard functions..."
firebase deploy --only functions:adminHealthCheck,functions:adminGetDashboardStats --project sonash-app --non-interactive

echo "✅ Deployment complete!"
echo "🌐 Test at: https://sonash-app.web.app/admin"

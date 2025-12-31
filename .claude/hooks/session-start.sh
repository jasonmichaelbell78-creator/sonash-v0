#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web (remote environments)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "🚀 Installing dependencies for sonash-v0..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install --prefer-offline --no-audit --no-fund

# Install Firebase Functions dependencies
if [ -d "functions" ]; then
  echo "📦 Installing Firebase Functions dependencies..."
  (cd functions && npm install --prefer-offline --no-audit --no-fund && echo "🔨 Building Firebase Functions..." && npm run build)
fi

# Build test files (required for npm test to work)
echo "🔨 Building test files..."
npm run test:build

echo "✅ SessionStart hook completed successfully!"

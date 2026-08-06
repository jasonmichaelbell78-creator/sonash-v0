#!/usr/bin/env bash

# Bootstrap is intentionally additive: it installs workspace dependencies and
# Codex tooling without reading from or writing to the preserved .claude/ tree.
set -euo pipefail

readonly expected_node_major=22
readonly codex_version=0.146.1
readonly firebase_tools_version=15.26.0
readonly playwright_version=1.62.1

actual_node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
if [[ "$actual_node_major" != "$expected_node_major" ]]; then
  echo "Expected Node.js ${expected_node_major}.x, found $(node --version)." >&2
  exit 1
fi

npm ci
npm --prefix functions ci
npx tsc --project scripts/reviews/tsconfig.json
npm install --global "@openai/codex@${codex_version}" "firebase-tools@${firebase_tools_version}"
npx --yes "playwright@${playwright_version}" install --with-deps chromium

for command in node npm git gh codex firebase gitleaks; do
  command -v "$command" >/dev/null
done

node --version
codex --version
firebase --version
gitleaks version

#!/bin/bash
# Multi-AI Review Trigger Check Script
# Run this to detect if any review triggers are active
#
# Usage: ./scripts/check-review-triggers.sh

set -e

echo "========================================"
echo "  Multi-AI Review Trigger Check"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters for triggers
TRIGGERS_FOUND=0

# --- Code Changes ---
echo "=== Code Changes ==="

# Get commits since last tag (or last 50 if no tags)
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "$LAST_TAG" ]; then
  COMMITS_SINCE=$(git rev-list --count HEAD ^"$LAST_TAG")
  echo "Commits since last tag ($LAST_TAG): $COMMITS_SINCE"
else
  COMMITS_SINCE=$(git rev-list --count HEAD 2>/dev/null || echo "0")
  echo "Total commits (no tags): $COMMITS_SINCE"
fi

if [ "$COMMITS_SINCE" -ge 50 ]; then
  echo -e "${YELLOW}[TRIGGER]${NC} 50+ commits - consider code review"
  TRIGGERS_FOUND=$((TRIGGERS_FOUND + 1))
fi

# Files changed in last 10 commits (with guard for short repos)
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
LOOKBACK=$((COMMIT_COUNT < 10 ? COMMIT_COUNT : 10))
if [ "$LOOKBACK" -gt 0 ]; then
  FILES_CHANGED=$(git diff --name-only HEAD~$LOOKBACK 2>/dev/null | wc -l | tr -d ' ')
else
  FILES_CHANGED=0
fi
echo "Files changed (last $LOOKBACK commits): $FILES_CHANGED"
echo ""

# --- Security Triggers ---
echo "=== Security-Sensitive Changes (last $LOOKBACK commits) ==="

if [ "$LOOKBACK" -gt 0 ]; then
  SECURITY_FILES=$(git diff --name-only HEAD~$LOOKBACK 2>/dev/null | grep -iE "(auth|security|firebase|api|secret|env|token|key|password|credential)" || echo "")
else
  SECURITY_FILES=""
fi
if [ -n "$SECURITY_FILES" ]; then
  echo -e "${YELLOW}[TRIGGER]${NC} Security-sensitive files changed:"
  echo "$SECURITY_FILES" | head -10 | sed 's/^/  - /'
  TRIGGERS_FOUND=$((TRIGGERS_FOUND + 1))
else
  echo -e "${GREEN}[OK]${NC} No security-sensitive files changed"
fi
echo ""

# --- Performance Triggers ---
echo "=== Performance Indicators ==="

# Bundle size check
if [ -d ".next/static/chunks" ]; then
  BUNDLE_SIZE=$(du -sh .next/static/chunks 2>/dev/null | cut -f1)
  echo "Bundle size (chunks): $BUNDLE_SIZE"
else
  echo "Bundle: No build found (run npm run build)"
fi

# Check for heavy dependencies added recently
if [ "$LOOKBACK" -gt 0 ]; then
  NEW_DEPS=$(git diff HEAD~$LOOKBACK -- package.json 2>/dev/null | grep "^\+" | grep -E '"(lodash|moment|jquery|rxjs|three|d3|chart)' || echo "")
else
  NEW_DEPS=""
fi
if [ -n "$NEW_DEPS" ]; then
  echo -e "${YELLOW}[TRIGGER]${NC} Heavy dependencies may have been added"
  TRIGGERS_FOUND=$((TRIGGERS_FOUND + 1))
fi
echo ""

# --- Duplication Patterns (Refactoring Triggers) ---
echo "=== Duplication Patterns ==="

# Firebase patterns
COLLECTION_COUNT=$(grep -rn "collection(db" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
SNAPSHOT_COUNT=$(grep -rn "onSnapshot" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')

echo "Firebase collection() calls: $COLLECTION_COUNT"
echo "Firebase onSnapshot() calls: $SNAPSHOT_COUNT"

if [ "$COLLECTION_COUNT" -ge 10 ] || [ "$SNAPSHOT_COUNT" -ge 5 ]; then
  echo -e "${YELLOW}[INFO]${NC} Multiple Firebase access patterns - consider consolidation review"
fi

# Hook patterns
HOOK_COUNT=$(grep -rn "^export function use" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "Custom hooks defined: $HOOK_COUNT"
echo ""

# --- Test Status ---
echo "=== Test Status ==="
if command -v npm &> /dev/null; then
  # Quick test check (just count, don't run full suite)
  TEST_FILES=$(find . -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l | tr -d ' ')
  echo "Test files found: $TEST_FILES"
fi
echo ""

# --- Documentation Status ---
echo "=== Documentation Status ==="

DOC_FILES=$(find ./docs -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
echo "Documentation files: $DOC_FILES"

# Check for stale docs (not modified in last 20 commits)
STALE_DOCS=$(git log --oneline -20 --name-only | grep "\.md$" | sort -u | wc -l | tr -d ' ')
echo "Docs modified (last 20 commits): $STALE_DOCS"
echo ""

# --- Summary ---
echo "========================================"
echo "  SUMMARY"
echo "========================================"

if [ "$TRIGGERS_FOUND" -gt 0 ]; then
  echo -e "${YELLOW}Triggers found: $TRIGGERS_FOUND${NC}"
  echo ""
  echo "Recommended actions:"
  echo "  1. Check MULTI_AI_REVIEW_COORDINATOR.md for review types"
  echo "  2. Select appropriate template"
  echo "  3. Run multi-AI review if significant"
else
  echo -e "${GREEN}No review triggers detected${NC}"
  echo "Continue with normal development workflow"
fi

echo ""
echo "See docs/MULTI_AI_REVIEW_COORDINATOR.md for full trigger checklist"
echo "========================================"

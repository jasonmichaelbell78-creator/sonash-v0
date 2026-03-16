#!/bin/sh
# Shared hook infrastructure — sourced by pre-commit and pre-push
# Created: Wave 1, Hook Systems Audit (C6-G1, C6-G2, C4-G1)

# POSIX-safe EXIT trap chaining — appends cleanup commands without overwriting prior traps
# Uses a shell variable to accumulate trap commands (avoids fragile trap -p parsing)
add_exit_trap() {
  EXIT_TRAP_CHAIN="${EXIT_TRAP_CHAIN:+$EXIT_TRAP_CHAIN; }$1"
  trap "$EXIT_TRAP_CHAIN" EXIT
}

# --- SKIP_CHECKS helpers ---
# Check if a named check should be skipped
# Usage: if is_skipped "check-name"; then ...
is_skipped() {
  case ",$SKIP_CHECKS," in *",$1,"*) return 0 ;; esac
  return 1
}

# Shared guard: any SKIP_ override requires SKIP_REASON (Session #162)
# Validates format, length, and banned phrases.
require_skip_reason() {
  if [ -z "${SKIP_REASON:-}" ]; then
    echo "  ❌ SKIP_REASON is required when overriding checks"
    echo "  Usage: SKIP_REASON=\"your reason\" $1 git commit/push ..."
    echo "  The audit trail is useless without a reason."
    exit 1
  fi
  # Reject multi-line reasons (prevents JSONL/log injection) — POSIX-safe (no grep -P)
  cr="$(printf '\r')"
  if [ "$(printf '%s' "$SKIP_REASON" | wc -l | tr -d ' ')" -gt 1 ] || printf '%s' "$SKIP_REASON" | grep -q "$cr"; then
    echo "  ❌ SKIP_REASON must be a single line (no CR/LF characters)"
    exit 1
  fi
  # Reject control characters (prevents log injection) — POSIX-safe
  if printf '%s' "$SKIP_REASON" | LC_ALL=C grep -q '[[:cntrl:]]'; then
    echo "  ❌ SKIP_REASON must not contain control characters"
    exit 1
  fi
  # Enforce max length to prevent DoS via oversized reasons
  skip_len=${#SKIP_REASON}
  if [ "$skip_len" -gt 500 ]; then
    echo "  ❌ SKIP_REASON must be <= 500 characters (got $skip_len)"
    exit 1
  fi
  # Validate minimum length to prevent meaningless skip reasons like "x" or "test"
  if [ "$skip_len" -lt 10 ]; then
    echo "  ❌ SKIP_REASON must be at least 10 characters (got $skip_len)"
    echo "  Provide a meaningful reason for the audit trail."
    exit 1
  fi
  # Ban "pre-existing" as skip reason (C4-G1) — use known-debt-baseline.json instead
  _skip_reason_lower=$(printf '%s' "$SKIP_REASON" | tr '[:upper:]' '[:lower:]')
  case "$_skip_reason_lower" in
    *pre-exist* | *"pre exist"* | *preexist*)
      echo "  ❌ 'pre-existing' is not a valid skip reason"
      echo "  If the issue is pre-existing debt, it should be in known-debt-baseline.json"
      echo "  Either fix the issue or add it to the baseline."
      exit 1
      ;;
  esac
}

# Initialize fnm so node/npm/npx are available in this shell context (C6-G3)
# Computes fnm/node env once; sourcing scripts reuse the result throughout
_shared_init_fnm() {
  if command -v fnm > /dev/null 2>&1; then
    # Prefer POSIX output where supported; fall back to bash (POSIX-compatible exports)
    FNM_ENV="$(fnm env --shell posix 2>/dev/null || fnm env --shell bash 2>/dev/null || true)"
    if [ -z "$FNM_ENV" ]; then
      echo "  ⚠️ fnm detected but could not initialize (no POSIX or bash shell support)" >&2
      return 0
    fi
    eval "$FNM_ENV"
  else
    echo "⚠️ fnm not available — using system Node.js" >&2
  fi
}

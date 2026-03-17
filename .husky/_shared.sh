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

# Generate end-of-hook summary from checks temp file (Wave 3, D6/D7/D11/D29)
# Usage: generate_hook_summary <hook_name> <checks_tmpfile> <fd_num>
# Requires HOOK_START_NS to be set in the calling scope
generate_hook_summary() {
  _hook_name="$1"
  _tmpfile="$2"
  _fd="$3"  # 3 for pre-commit, 2 for pre-push

  if [ ! -f "$_tmpfile" ] || [ ! -s "$_tmpfile" ]; then
    return 0
  fi

  _total=0; _passed=0; _warned=0; _failed=0; _skipped=0; _autofixed=0
  _warn_checks=""; _fail_checks=""

  while IFS='|' read -r _id _status _dur; do
    _total=$((_total + 1))
    case "$_status" in
      pass) _passed=$((_passed + 1)) ;;
      skip) _skipped=$((_skipped + 1)) ;;
      warn) _warned=$((_warned + 1)); _warn_checks="$_warn_checks $_id" ;;
      fail) _failed=$((_failed + 1)); _fail_checks="$_fail_checks $_id" ;;
      auto-fix) _autofixed=$((_autofixed + 1)) ;;
    esac
  done < "$_tmpfile"

  # Calculate total duration
  HOOK_END_NS=$(date +%s%N 2>/dev/null || date +%s)
  if [ ${#HOOK_START_NS} -gt 10 ]; then
    TOTAL_MS=$(( (HOOK_END_NS - HOOK_START_NS) / 1000000 ))
  else
    TOTAL_MS=$(( (HOOK_END_NS - HOOK_START_NS) * 1000 ))
  fi
  # Format total duration — avoid "mss" bug when bc unavailable (PR #444 R1 fix #6)
  _bc_result=$(echo "scale=1; $TOTAL_MS / 1000" | bc 2>/dev/null || echo "")
  if [ -n "$_bc_result" ]; then
    TOTAL_FMT="${_bc_result}s"
  else
    TOTAL_FMT="${TOTAL_MS}ms"
  fi

  if [ "$_warned" -eq 0 ] && [ "$_failed" -eq 0 ]; then
    # D29: Simple success line
    echo "✅ ${_hook_name}: ${_passed}/${_total} passed (${TOTAL_FMT})" >&"$_fd"
  else
    # D29: Full summary on warn/fail
    echo "" >&"$_fd"
    echo "┌─ ${_hook_name} Summary ────────────────────────────┐" >&"$_fd"
    while IFS='|' read -r _id _status _dur; do
      case "$_status" in
        pass)    _icon="✅" ;;
        skip)    _icon="⏭️ " ;;
        warn)    _icon="⚠️ " ;;
        fail)    _icon="❌" ;;
        auto-fix) _icon="🔧" ;;
        *)       _icon="  " ;;
      esac
      # Format duration — avoid "mss" bug (PR #444 R1 fix #6)
      if [ "$_dur" -gt 1000 ] 2>/dev/null; then
        _bc_dur=$(echo "scale=1; $_dur / 1000" | bc 2>/dev/null || echo "")
        if [ -n "$_bc_dur" ]; then
          _dur_fmt="${_bc_dur}s"
        else
          _dur_fmt="${_dur}ms"
        fi
      else
        _dur_fmt="${_dur}ms"
      fi
      printf "│ %s %-25s %-8s %8s │\n" "$_icon" "$_id" "$_status" "$_dur_fmt" >&"$_fd"
    done < "$_tmpfile"
    echo "├──────────────────────────────────────────────────┤" >&"$_fd"
    echo "│ ${_passed} passed, ${_warned} warning(s), ${_failed} failed (${TOTAL_FMT})" >&"$_fd"

    # D10/D31: Show actions for warn/fail checks
    if [ -n "$_warn_checks" ] || [ -n "$_fail_checks" ]; then
      echo "├─ Actions ────────────────────────────────────────┤" >&"$_fd"
      for _cid in $_warn_checks $_fail_checks; do
        # Read actions from manifest
        _actions=$(node -e "
          try {
            const m = require('./scripts/config/hook-checks.json');
            const c = m.checks.find(x => x.id === '$_cid');
            if (c && c.actions) {
              if (c.actions.fix) console.log('  Fix: ' + c.actions.fix);
              console.log('  Investigate: ' + (c.actions.investigate || 'N/A'));
              console.log('  Defer: ' + (c.actions.defer || 'N/A'));
            }
          } catch {}
        " 2>/dev/null)
        if [ -n "$_actions" ]; then
          echo "│ ⚠️  ${_cid}:" >&"$_fd"
          echo "$_actions" | while read -r _line; do
            echo "│   $_line" >&"$_fd"
          done
        fi
      done
    fi
    echo "└──────────────────────────────────────────────────┘" >&"$_fd"
  fi
}

# Write hook-runs.jsonl entry (D6, D20, D21)
# Usage: write_hook_runs_jsonl <hook_name_lowercase> <checks_tmpfile> <total_ms>
write_hook_runs_jsonl() {
  _wr_hook="$1"
  _wr_tmpfile="$2"
  _wr_total_ms="$3"

  # Pass shell variables via env vars to avoid injection (PR #444 R1 fix #1)
  _WR_HOOK="$_wr_hook" \
  _WR_TMPFILE="$_wr_tmpfile" \
  _WR_TOTAL_MS="$_wr_total_ms" \
  node -e "
    const fs = require('fs');
    const path = require('path');
    const { spawnSync } = require('child_process');
    const runsPath = path.join('.claude', 'state', 'hook-runs.jsonl');

    const git = (args) => {
      try {
        const res = spawnSync('git', args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 });
        return (res.status === 0 && res.stdout) ? res.stdout.trim() : 'unknown';
      } catch { return 'unknown'; }
    };

    // Read checks from temp file
    let lines = [];
    try {
      lines = fs.readFileSync(process.env._WR_TMPFILE || '', 'utf-8').trim().split('\n').filter(Boolean);
    } catch {}
    const checks = lines.map(l => {
      const parts = l.replace(/\r/g, '').split('|');
      return { id: parts[0] || '', status: parts[1] || 'unknown', duration_ms: parseInt(parts[2]) || 0 };
    }).filter(c => c.id);

    const entry = {
      hook: process.env._WR_HOOK || 'unknown',
      timestamp: new Date().toISOString(),
      branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
      commit: git(['rev-parse', '--short', 'HEAD']),
      total_checks: checks.length,
      checks: checks,
      total_duration_ms: parseInt(process.env._WR_TOTAL_MS || '0') || 0,
      outcome: checks.some(c => c.status === 'fail') ? 'fail' : checks.some(c => c.status === 'warn') ? 'warn' : 'pass',
      skipped_checks: checks.filter(c => c.status === 'skip').map(c => c.id),
      warnings: checks.filter(c => c.status === 'warn').length,
      errors: checks.filter(c => c.status === 'fail').length
    };

    // Symlink guard (PR #444 R1 fix #10, R2 fix #7: reject non-file targets)
    try {
      const st = fs.lstatSync(runsPath);
      if (st.isSymbolicLink()) process.exit(0);
      if (!st.isFile()) process.exit(0);
    } catch (e) { if (e.code !== 'ENOENT') process.exit(0); }

    // Ensure directory exists
    try { fs.mkdirSync(path.dirname(runsPath), { recursive: true }); } catch {}

    // Rotation: keep 100 of 200 entries (D21)
    let existing = [];
    try {
      existing = fs.readFileSync(runsPath, 'utf-8').trim().split('\n').filter(Boolean);
    } catch {}

    if (existing.length >= 200) {
      existing = existing.slice(-100);
    }

    existing.push(JSON.stringify(entry));
    fs.writeFileSync(runsPath, existing.join('\n') + '\n');
  " 2>/dev/null || true
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

#!/bin/bash
# Ensures fnm-managed node is available, then executes the given command.
# Used by .claude/settings.json hooks where bare `node` isn't on PATH.

if [ $# -eq 0 ]; then
  echo "ensure-fnm.sh: no command provided" >&2
  exit 2
fi

# Fast-path: only skip fnm if the current node matches the repo-pinned version
if command -v node >/dev/null 2>&1; then
  repo_root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
  if [[ -f "$repo_root/.nvmrc" ]]; then
    expected="$(tr -d ' \t\r\n' < "$repo_root/.nvmrc")"
    current="$(node -v 2>/dev/null | tr -d ' \t\r\n')"
    expected_clean="${expected#v}"
    current_clean="${current#v}"
    # If .nvmrc pins a full semver (e.g. 22.12.0), require exact match
    case "$expected_clean" in
      *.*.*)
        if [[ "$expected_clean" = "$current_clean" ]]; then
          exec "$@"
        fi
        ;;
      *)
        # Major-only comparison (e.g. "22" or "v22") — numeric majors only
        if [[ "$expected_clean" =~ ^[0-9]+(\.|$) ]]; then
          expected_major="${expected_clean%%.*}"
          current_major="${current_clean%%.*}"
          if [[ "$expected_major" = "$current_major" ]]; then
            exec "$@"
          fi
        fi
        ;;
    esac
  else
    exec "$@"
  fi
fi

if ! command -v fnm >/dev/null 2>&1; then
  echo "ensure-fnm.sh: fnm is not installed or not on PATH" >&2
  exit 1
fi

FNM_ENV="$(fnm env --shell bash 2>/dev/null)" || {
  echo "ensure-fnm.sh: fnm detected but failed to initialize" >&2
  exit 1
}
if [ -z "$FNM_ENV" ]; then
  echo "ensure-fnm.sh: fnm produced empty env output" >&2
  exit 1
fi
case "$FNM_ENV" in
  *'`'*|*'$('*|*';'*)
    echo "ensure-fnm.sh: unsafe fnm env output detected" >&2
    exit 1
    ;;
esac
eval "$FNM_ENV"
fnm use --silent-if-unchanged >/dev/null 2>&1 || true

if ! command -v node >/dev/null 2>&1; then
  echo "ensure-fnm.sh: node is not available after fnm initialization" >&2
  exit 1
fi

exec "$@"

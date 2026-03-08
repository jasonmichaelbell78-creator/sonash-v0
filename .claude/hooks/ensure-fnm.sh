#!/bin/bash
# Ensures fnm-managed node is available, then executes the given command.
# Used by .claude/settings.json hooks where bare `node` isn't on PATH.

if [ $# -eq 0 ]; then
  echo "ensure-fnm.sh: no command provided" >&2
  exit 2
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
eval "$FNM_ENV"
fnm use --silent-if-unchanged >/dev/null 2>&1 || true

if ! command -v node >/dev/null 2>&1; then
  echo "ensure-fnm.sh: node is not available after fnm initialization" >&2
  exit 1
fi

exec "$@"

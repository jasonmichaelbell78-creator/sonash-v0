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

eval "$(fnm env --shell bash 2>/dev/null)"

if ! command -v node >/dev/null 2>&1; then
  echo "ensure-fnm.sh: node is not available after fnm initialization" >&2
  exit 1
fi

exec "$@"

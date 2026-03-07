#!/bin/bash
# Ensures fnm-managed node is available, then executes the given command.
# Used by .claude/settings.json hooks where bare `node` isn't on PATH.
eval "$(fnm env --shell bash 2>/dev/null)" || true
exec "$@"

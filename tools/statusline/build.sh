#!/usr/bin/env bash
# tools/statusline/build.sh — Build and install SoNash statusline

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Ensure HOME is set (Windows may only have USERPROFILE)
if [[ -z "${HOME:-}" ]]; then
  if [[ -n "${USERPROFILE:-}" ]]; then
    if command -v cygpath &>/dev/null; then
      HOME="$(cygpath -u "$USERPROFILE")"
    else
      HOME="${USERPROFILE//\\//}"
    fi
    export HOME
  else
    echo "ERROR: HOME is not set (and USERPROFILE is not set); cannot determine install dir." >&2
    exit 1
  fi
fi

INSTALL_DIR="$HOME/.claude/statusline"
BINARY_NAME="sonash-statusline-v2"

# Ensure Go is in PATH (Windows install location)
if ! command -v go &>/dev/null; then
  if [[ -f "/c/Program Files/Go/bin/go.exe" ]]; then
    export PATH="/c/Program Files/Go/bin:$PATH"
  elif [[ -f "C:/Program Files/Go/bin/go.exe" ]]; then
    export PATH="C:/Program Files/Go/bin:$PATH"
  fi
fi

# 1. Verify Go
echo "Checking Go installation..."
go version || { echo "ERROR: Go not found. Install Go first." >&2; exit 1; }

# 2. Run tests
echo ""
echo "Running tests..."
cd "$SCRIPT_DIR"
go test -v ./...

# 3. Compile
echo ""
echo "Building binary..."
GOOS=$(go env GOOS) GOARCH=$(go env GOARCH) go build -o "$BINARY_NAME" .

# Add .exe extension on Windows
if [[ "$(go env GOOS)" = "windows" ]]; then
  if [[ ! -f "${BINARY_NAME}.exe" ]] && [[ -f "$BINARY_NAME" ]]; then
    mv "$BINARY_NAME" "${BINARY_NAME}.exe"
  fi
  BINARY_NAME="${BINARY_NAME}.exe"
fi

# 4. Install
echo ""
echo "Installing to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
cp "$BINARY_NAME" "$INSTALL_DIR/"

# 5. Check for local config
if [[ ! -f "$SCRIPT_DIR/config.local.toml" ]]; then
  echo ""
  echo "NOTE: No config.local.toml found."
  echo "  Copy config.local.toml.example to config.local.toml"
  echo "  and add your weather API key for weather widgets."
fi

# 6. Copy shared config to install dir
cp "$SCRIPT_DIR/config.toml" "$INSTALL_DIR/"
if [[ -f "$SCRIPT_DIR/config.local.toml" ]]; then
  cp "$SCRIPT_DIR/config.local.toml" "$INSTALL_DIR/"
fi

# 7. Test render with sample JSON
echo ""
echo "Test render..."
pwd_json="$(pwd | sed 's/\\/\\\\/g; s/"/\\"/g')"
echo '{"model":{"display_name":"Opus 4.6"},"context_window":{"used_percentage":42,"remaining_percentage":58},"workspace":{"current_dir":"'"$pwd_json"'","project_dir":"'"$pwd_json"'"},"cost":{"total_duration_ms":5000000,"total_lines_added":124,"total_lines_removed":38},"session_id":"build-test"}' | "$INSTALL_DIR/$BINARY_NAME"
echo ""

# 8. Summary
echo ""
echo "=== SoNash Statusline Installed ==="
echo "Binary: $INSTALL_DIR/$BINARY_NAME"
echo "Config: $INSTALL_DIR/config.toml"
echo "Local config: $SCRIPT_DIR/config.local.toml (create from .example if needed)"
echo ""
echo "Widgets active: 22"
echo "Lines: 3"
echo ""
echo "To activate: update .claude/settings.json statusLine.command to:"
echo "  $INSTALL_DIR/$BINARY_NAME"

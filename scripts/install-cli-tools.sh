#!/usr/bin/env bash
# scripts/install-cli-tools.sh — Install CLI tools using best available method
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFEST="$REPO_DIR/.claude/tool-manifest.json"
BIN_DIR="$HOME/bin"

mkdir -p "$BIN_DIR"

# Parse --verify flag
VERIFY_ONLY=false
if [[ "${1:-}" == "--verify" ]]; then
  VERIFY_ONLY=true
fi

echo "=== SoNash CLI Tools Installer ==="
echo "Platform: $(uname -s) $(uname -m)"
echo "Bin dir: $BIN_DIR"
echo ""

# Detect package managers
HAS_WINGET=false; command -v winget &>/dev/null && HAS_WINGET=true
HAS_SCOOP=false; command -v scoop &>/dev/null && HAS_SCOOP=true
HAS_CARGO=false; command -v cargo &>/dev/null && HAS_CARGO=true
HAS_GO=false; command -v go &>/dev/null && HAS_GO=true

echo "Package managers: winget=$HAS_WINGET scoop=$HAS_SCOOP cargo=$HAS_CARGO go=$HAS_GO"
echo ""

installed=0
already=0
failed=0
missing_list=""

# Tool install functions
install_with_winget() {
  local pkg="$1"
  echo "  Installing via winget..."
  winget install --id "$pkg" --accept-package-agreements --accept-source-agreements -e 2>&1 | tail -3
}

install_with_cargo() {
  local pkg="$1"
  echo "  Installing via cargo..."
  cargo install "$pkg" 2>&1 | tail -3
}

install_with_go() {
  local pkg="$1"
  echo "  Installing via go install..."
  go install "$pkg" 2>&1 | tail -3
}

download_github_release() {
  local repo="$1" binary="$2" pattern="$3"
  echo "  Downloading from GitHub: $repo..."
  local url
  url=$(curl -sL "https://api.github.com/repos/$repo/releases/latest" \
    | grep -o "https://[^\"]*$pattern" | head -1)
  if [ -z "$url" ]; then
    echo "  ERROR: Could not find release matching pattern: $pattern"
    return 1
  fi
  local tmp
  tmp=$(mktemp -d)
  curl --proto '=https' --tlsv1.2 -sL "$url" -o "$tmp/download"

  if [[ "$url" == *.zip ]]; then
    (cd "$tmp" && unzip -o download >/dev/null 2>&1)
    local found
    found=$(find "$tmp" -name "$binary" -o -name "${binary}.exe" 2>/dev/null | head -1)
    if [ -n "$found" ]; then
      cp "$found" "$BIN_DIR/"
      chmod +x "$BIN_DIR/$(basename "$found")"
    fi
  elif [[ "$url" == *.tar.gz || "$url" == *.tgz ]]; then
    (cd "$tmp" && tar xzf download 2>/dev/null)
    local found
    found=$(find "$tmp" -name "$binary" -o -name "${binary}.exe" 2>/dev/null | head -1)
    if [ -n "$found" ]; then
      cp "$found" "$BIN_DIR/"
      chmod +x "$BIN_DIR/$(basename "$found")"
    fi
  else
    cp "$tmp/download" "$BIN_DIR/$binary.exe"
    chmod +x "$BIN_DIR/$binary.exe"
  fi
  rm -rf "$tmp"
}

check_tool() {
  local name="$1" check_cmd="$2"
  if eval "$check_cmd" &>/dev/null; then
    local ver
    ver=$(eval "$check_cmd" 2>&1 | head -1)
    printf "  %-12s ✓ %s\n" "$name" "$ver"
    return 0
  fi
  return 1
}

# Tool definitions: name, check_cmd, winget_id, install_method
declare -A WINGET_IDS=(
  [fzf]="junegunn.fzf"
  [bat]="sharkdp.bat"
  [fd]="sharkdp.fd"
  [delta]="dandavison.delta"
  [zoxide]="ajeetdsouza.zoxide"
  [eza]="eza-community.eza"
  [starship]="Starship.Starship"
  [yazi]="sxyazi.yazi"
  [lazygit]="JesseDuffield.lazygit"
  [yq]="MikeFarah.yq"
  [difft]="Wilfred.difftastic"
)

declare -A GITHUB_REPOS=(
  [gron]="tomnomnom/gron"
  [htmlq]="mgdm/htmlq"
)

declare -A GITHUB_PATTERNS=(
  [gron]="windows-amd64.*\\.exe"
  [htmlq]="x86_64-pc-windows.*\\.zip"
)

# Process each tool from manifest
for tool in fzf bat fd delta zoxide eza starship yazi lazygit yq gron htmlq difft; do
  check_cmd="$tool --version"
  [ "$tool" = "difft" ] && check_cmd="difft --version"

  if check_tool "$tool" "$check_cmd" 2>/dev/null; then
    already=$((already + 1))
    continue
  fi

  if $VERIFY_ONLY; then
    printf "  %-12s ✗ MISSING\n" "$tool"
    missing_list="$missing_list $tool"
    failed=$((failed + 1))
    continue
  fi

  echo "[$tool] Installing..."

  # Try winget first
  if $HAS_WINGET && [ -n "${WINGET_IDS[$tool]:-}" ]; then
    if install_with_winget "${WINGET_IDS[$tool]}"; then
      # winget installs to system PATH, may need hash -r
      hash -r 2>/dev/null || true
      if check_tool "$tool" "$check_cmd" 2>/dev/null; then
        installed=$((installed + 1))
        continue
      fi
    fi
  fi

  # Try GitHub release download
  if [ -n "${GITHUB_REPOS[$tool]:-}" ]; then
    if download_github_release "${GITHUB_REPOS[$tool]}" "$tool" "${GITHUB_PATTERNS[$tool]}"; then
      hash -r 2>/dev/null || true
      if check_tool "$tool" "$check_cmd" 2>/dev/null; then
        installed=$((installed + 1))
        continue
      fi
    fi
  fi

  printf "  %-12s ✗ FAILED\n" "$tool"
  missing_list="$missing_list $tool"
  failed=$((failed + 1))
done

echo ""
echo "=== Results ==="
echo "Already installed: $already"
echo "Newly installed: $installed"
echo "Failed: $failed"
if [ -n "$missing_list" ]; then
  echo "Missing:$missing_list"
fi

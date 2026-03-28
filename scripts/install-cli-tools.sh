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

# Platform gate — this installer targets Windows shells only
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) ;;
  *)
    echo "ERROR: This installer supports Windows shells only (assets are .exe/.zip)." >&2
    echo "       Use your OS package manager (brew/apt) instead." >&2
    exit 1
    ;;
esac

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
  return $?
}

install_with_cargo() {
  local pkg="$1"
  echo "  Installing via cargo..."
  cargo install "$pkg" 2>&1 | tail -3
  return $?
}

install_with_go() {
  local pkg="$1"
  echo "  Installing via go install..."
  go install "$pkg" 2>&1 | tail -3
  return $?
}

download_github_release() {
  local repo="$1" binary="$2" pattern="$3"
  echo "  Downloading from GitHub: $repo..."
  local url
  if command -v jq &>/dev/null; then
    url=$(curl --proto '=https' --tlsv1.2 -sL "https://api.github.com/repos/$repo/releases/latest" \
      | jq -r --arg p "$pattern" '.assets[].browser_download_url | select(test($p))' | head -1)
  else
    url=$(curl --proto '=https' --tlsv1.2 -sL "https://api.github.com/repos/$repo/releases/latest" \
      | grep -o "https://[^\"]*$pattern" | head -1)
  fi
  if [[ -z "$url" ]]; then
    echo "  ERROR: Could not find release matching pattern: $pattern" >&2
    return 1
  fi
  local tmp
  tmp=$(mktemp -d)
  curl --proto '=https' --tlsv1.2 -sL "$url" -o "$tmp/download"

  # Check for rename rule (e.g. yq_windows_amd64.exe -> yq.exe)
  local rename_rule="${GITHUB_RENAMES[$binary]:-}"
  local target_name="${binary}.exe"
  if [[ -n "$rename_rule" ]]; then
    target_name="${rename_rule#*:}"
  fi

  if [[ "$url" == *.zip ]]; then
    (cd "$tmp" && unzip -o download >/dev/null 2>&1) || { echo "  ERROR: unzip failed" >&2; rm -rf "$tmp"; return 1; }
    local found
    found=$(find "$tmp" -name "$binary" -o -name "${binary}.exe" 2>/dev/null | head -1)
    if [[ -n "$found" ]]; then
      cp "$found" "$BIN_DIR/$target_name"
      chmod +x "$BIN_DIR/$target_name"
    else
      echo "  ERROR: binary not found in archive" >&2
      rm -rf "$tmp"
      return 1
    fi
  elif [[ "$url" == *.tar.gz || "$url" == *.tgz ]]; then
    (cd "$tmp" && tar xzf download 2>/dev/null) || { echo "  ERROR: tar extract failed" >&2; rm -rf "$tmp"; return 1; }
    local found
    found=$(find "$tmp" -name "$binary" -o -name "${binary}.exe" 2>/dev/null | head -1)
    if [[ -n "$found" ]]; then
      cp "$found" "$BIN_DIR/$target_name"
      chmod +x "$BIN_DIR/$target_name"
    else
      echo "  ERROR: binary not found in archive" >&2
      rm -rf "$tmp"
      return 1
    fi
  else
    # Bare binary download (e.g. yq .exe)
    cp "$tmp/download" "$BIN_DIR/$target_name"
    chmod +x "$BIN_DIR/$target_name"
  fi
  rm -rf "$tmp"
  return 0
}

check_tool() {
  local name="$1"; shift
  if "$@" &>/dev/null; then
    local ver
    ver=$("$@" 2>&1 | head -1)
    printf "  %-12s ✓ %s\n" "$name" "$ver"
    return 0
  fi
  return 1
}

# Tool definitions: name -> winget_id, github_repo, download_pattern
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
  [rg]="BurntSushi.ripgrep"
)

declare -A GITHUB_REPOS=(
  [fzf]="junegunn/fzf"
  [bat]="sharkdp/bat"
  [fd]="sharkdp/fd"
  [delta]="dandavison/delta"
  [zoxide]="ajeetdsouza/zoxide"
  [eza]="eza-community/eza"
  [starship]="starship/starship"
  [yazi]="sxyazi/yazi"
  [lazygit]="jesseduffield/lazygit"
  [yq]="mikefarah/yq"
  [gron]="tomnomnom/gron"
  [htmlq]="mgdm/htmlq"
  [difft]="Wilfred/difftastic"
  [rg]="BurntSushi/ripgrep"
)

declare -A GITHUB_PATTERNS=(
  [fzf]="windows_amd64\\.zip"
  [bat]="x86_64-pc-windows-msvc\\.zip"
  [fd]="x86_64-pc-windows-msvc\\.zip"
  [delta]="x86_64-pc-windows-msvc\\.zip"
  [zoxide]="x86_64-pc-windows-msvc\\.zip"
  [eza]="x86_64-pc-windows-gnu\\.zip"
  [starship]="x86_64-pc-windows-msvc\\.zip"
  [yazi]="x86_64-pc-windows-msvc\\.zip"
  [lazygit]="windows_x86_64\\.zip"
  [yq]="yq_windows_amd64\\.exe"
  [gron]="windows-amd64.*\\.zip"
  [htmlq]="x86_64-windows\\.zip"
  [difft]="x86_64-pc-windows-msvc\\.zip"
  [rg]="x86_64-pc-windows-msvc\\.zip"
)

# yq downloads as a bare .exe with a non-standard name — needs rename
declare -A GITHUB_RENAMES=(
  [yq]="yq_windows_amd64.exe:yq.exe"
)

# Build tool list from manifest (source of truth), fallback to hardcoded list
tools=""
if command -v node &>/dev/null && [[ -f "$MANIFEST" ]]; then
  tools=$(node -e "const m=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));console.log(Object.keys(m.tools||{}).join(' '))" "$MANIFEST" 2>/dev/null) || true
fi
if [[ -z "$tools" ]]; then
  tools="fzf bat fd delta zoxide eza starship yazi lazygit yq gron htmlq difft rg"
fi

for tool in $tools; do
  if check_tool "$tool" "$tool" --version 2>/dev/null; then
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

  # Try winget first (merged conditional — install attempt is part of test)
  if $HAS_WINGET && [[ -n "${WINGET_IDS[$tool]:-}" ]] && install_with_winget "${WINGET_IDS[$tool]}"; then
    hash -r 2>/dev/null || true
    if check_tool "$tool" "$tool" --version 2>/dev/null; then
      installed=$((installed + 1))
      continue
    fi
  fi

  # Try GitHub release download
  if [[ -n "${GITHUB_REPOS[$tool]:-}" ]] && download_github_release "${GITHUB_REPOS[$tool]}" "$tool" "${GITHUB_PATTERNS[$tool]}"; then
    hash -r 2>/dev/null || true
    if check_tool "$tool" "$tool" --version 2>/dev/null; then
      installed=$((installed + 1))
      continue
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
if [[ -n "$missing_list" ]]; then
  echo "Missing:$missing_list"
fi

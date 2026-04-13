#!/usr/bin/env bash
# scripts/repo-analysis/install-tools.sh — Install Tier 1 tools for /repo-analysis
#
# Tools: scc, semgrep, lizard, jscpd, gitleaks, git-quick-stats, repomix
#
# Design: Non-fatal. Missing tools produce warnings, never errors.
# Windows is the primary locale; Mac/Linux supported via portable methods.
#
# Created: Session #257 (repo-analysis Step 2)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BIN_DIR="$HOME/bin"

mkdir -p "$BIN_DIR"

# Parse flags
VERIFY_ONLY=false
if [[ "${1:-}" == "--verify" ]]; then
  VERIFY_ONLY=true
fi

# ── Platform detection ──────────────────────────────────────────────

PLATFORM="unknown"
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) PLATFORM="windows" ;;
  Darwin*)              PLATFORM="macos"   ;;
  Linux*)               PLATFORM="linux"   ;;
  *)
    echo "ERROR: Unsupported platform: $(uname -s)" >&2
    return 1 2>/dev/null || exit 1
    ;;
esac

echo "=== Repo Analysis Tool Installer ==="
echo "Platform: $PLATFORM ($(uname -s) $(uname -m))"
echo "Bin dir:  $BIN_DIR"
echo ""

# ── Package manager detection ───────────────────────────────────────

HAS_NPM=false;    command -v npm    &>/dev/null && HAS_NPM=true
HAS_PIP=false;    command -v pip    &>/dev/null && HAS_PIP=true
HAS_PIP3=false;   command -v pip3   &>/dev/null && HAS_PIP3=true
HAS_GO=false;     command -v go     &>/dev/null && HAS_GO=true
HAS_BREW=false;   command -v brew   &>/dev/null && HAS_BREW=true
HAS_WINGET=false; command -v winget &>/dev/null && HAS_WINGET=true
HAS_SCOOP=false;  command -v scoop  &>/dev/null && HAS_SCOOP=true

echo "Package managers: npm=$HAS_NPM pip=$HAS_PIP pip3=$HAS_PIP3 go=$HAS_GO brew=$HAS_BREW winget=$HAS_WINGET scoop=$HAS_SCOOP"
echo ""

# ── Counters ────────────────────────────────────────────────────────

installed=0
already=0
failed=0
missing_list=""

# ── Constants ──────────────────────────────────────────────────────
MSG_TRYING_BREW="    Trying brew..."

# ── Helpers ─────────────────────────────────────────────────────────

check_tool() {
  local name="$1"; shift
  if "$@" &>/dev/null; then
    local ver
    ver=$("$@" 2>&1 | head -1)
    printf "  %-18s OK  %s\n" "$name" "$ver"
    return 0
  fi
  return 1
}

mark_failed() {
  local name="$1"
  printf "  %-18s MISSING\n" "$name"
  missing_list="$missing_list $name"
  failed=$((failed + 1))
  return 0
}

mark_installed() {
  local name="$1"
  printf "  %-18s INSTALLED\n" "$name"
  installed=$((installed + 1))
  return 0
}

pip_cmd() {
  if $HAS_PIP3; then
    echo "pip3"
  elif $HAS_PIP; then
    echo "pip"
  else
    echo ""
  fi
  return 0
}

download_github_release() {
  local repo="$1" binary="$2" pattern="$3"
  echo "    Downloading from GitHub: $repo..."
  local api_json url
  api_json=$(curl --proto '=https' --tlsv1.2 -fsSL "https://api.github.com/repos/$repo/releases/latest") || {
    echo "    ERROR: Failed to fetch release info for $repo" >&2
    return 1
  }
  if command -v jq &>/dev/null; then
    url=$(printf '%s' "$api_json" \
      | jq -r --arg p "$pattern" '.assets[].browser_download_url | select(test($p))' | head -1)
  else
    url=$(printf '%s' "$api_json" \
      | tr '"' '\n' \
      | grep -E '^https://github\.com/.+/releases/download/.+' \
      | grep -E "$pattern" \
      | head -1)
  fi
  if [[ -z "$url" ]]; then
    echo "    ERROR: Could not find release matching pattern: $pattern" >&2
    return 1
  fi
  if [[ ! "$url" =~ ^https://github\.com/.+/releases/download/ ]]; then
    echo "    ERROR: Refusing non-GitHub release URL" >&2
    return 1
  fi
  local tmp
  tmp=$(mktemp -d)
  curl --proto '=https' --tlsv1.2 -sL "$url" -o "$tmp/download"

  if [[ "$url" == *.zip ]]; then
    local extract_dir="$tmp/extract"
    mkdir -p "$extract_dir"
    # Validate archive entries BEFORE extraction (Zip Slip prevention)
    if unzip -Z1 "$tmp/download" 2>/dev/null | grep -E '(^/|^[A-Za-z]:[\\\/]|(^|[\\\/])\.\.([\\/]|$))' -q; then
      echo "    ERROR: archive contains path traversal or absolute paths" >&2
      rm -rf "$tmp"
      return 1
    fi
    (cd "$extract_dir" && unzip -o "$tmp/download" >/dev/null 2>&1) || { echo "    ERROR: unzip failed" >&2; rm -rf "$tmp"; return 1; }
    local found
    found=$(find "$extract_dir" -name "$binary" -o -name "${binary}.exe" 2>/dev/null | head -1)
    local dest="$BIN_DIR/$binary"
    if [[ "$PLATFORM" == "windows" ]]; then dest="$BIN_DIR/${binary}.exe"; fi
    if [[ -n "$found" ]]; then
      cp "$found" "$dest"
      chmod +x "$dest"
    else
      echo "    ERROR: binary not found in archive" >&2
      rm -rf "$tmp"
      return 1
    fi
  elif [[ "$url" == *.tar.gz || "$url" == *.tgz ]]; then
    local extract_dir="$tmp/extract"
    mkdir -p "$extract_dir"
    # Validate tar entries BEFORE extraction (Tar Slip prevention)
    if tar -tzf "$tmp/download" 2>/dev/null | grep -E '(^/|^[A-Za-z]:[\\\/]|(^|[\\\/])\.\.([\\/]|$))' -q; then
      echo "    ERROR: tar contains path traversal or absolute paths" >&2
      rm -rf "$tmp"
      return 1
    fi
    (cd "$extract_dir" && tar xzf "$tmp/download" --no-same-owner 2>/dev/null) || { echo "    ERROR: tar extract failed" >&2; rm -rf "$tmp"; return 1; }
    local found
    found=$(find "$extract_dir" -name "$binary" -o -name "${binary}.exe" 2>/dev/null | head -1)
    local dest="$BIN_DIR/$binary"
    if [[ "$PLATFORM" == "windows" ]]; then dest="$BIN_DIR/${binary}.exe"; fi
    if [[ -n "$found" ]]; then
      cp "$found" "$dest"
      chmod +x "$dest"
    else
      echo "    ERROR: binary not found in archive" >&2
      rm -rf "$tmp"
      return 1
    fi
  else
    # Bare binary (e.g., .exe direct download)
    local dest="$BIN_DIR/$binary"
    if [[ "$PLATFORM" == "windows" ]]; then dest="$BIN_DIR/${binary}.exe"; fi
    cp "$tmp/download" "$dest"
    chmod +x "$dest"
  fi
  rm -rf "$tmp"
  return 0
}

# ── Tool Installs ───────────────────────────────────────────────────
# Each tool block: check → skip if present → try install → verify → warn

# 1. scc (Succinct Code Counter) — Go binary, GitHub release, or brew
install_scc() {
  local name="scc"
  if check_tool "$name" scc --version 2>/dev/null; then
    already=$((already + 1)); return 0
  fi
  if $VERIFY_ONLY; then mark_failed "$name"; return 0; fi

  echo "[$name] Installing..."

  # Try go install (pinned version per OpenSSF Scorecard)
  if $HAS_GO; then
    echo "    Trying go install..."
    if go install github.com/boyter/scc/v3@v3.7.0 2>&1 | tail -3; then
      hash -r 2>/dev/null || true
      if check_tool "$name" scc --version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  # Try brew (macOS/Linux)
  if $HAS_BREW; then
    echo "$MSG_TRYING_BREW"
    if brew install scc 2>&1 | tail -3; then
      hash -r 2>/dev/null || true
      if check_tool "$name" scc --version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  # Try GitHub release (Windows)
  if [[ "$PLATFORM" == "windows" ]] && download_github_release "boyter/scc" "scc" "Windows_x86_64\\.zip"; then
    hash -r 2>/dev/null || true
    if check_tool "$name" scc --version 2>/dev/null; then mark_installed "$name"; return 0; fi
  fi

  mark_failed "$name"
}

# 2. semgrep — pip install
install_semgrep() {
  local name="semgrep"
  if check_tool "$name" semgrep --version 2>/dev/null; then
    already=$((already + 1)); return 0
  fi
  if $VERIFY_ONLY; then mark_failed "$name"; return 0; fi

  echo "[$name] Installing..."
  local pipcmd
  pipcmd=$(pip_cmd)

  if [[ -n "$pipcmd" ]]; then
    echo "    Trying $pipcmd install..."
    if $pipcmd install semgrep 2>&1 | tail -5; then
      hash -r 2>/dev/null || true
      if check_tool "$name" semgrep --version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  # Try brew (macOS)
  if $HAS_BREW; then
    echo "$MSG_TRYING_BREW"
    if brew install semgrep 2>&1 | tail -3; then
      hash -r 2>/dev/null || true
      if check_tool "$name" semgrep --version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  echo "    NOTE: On Windows, semgrep may require WSL or Docker."
  echo "    See: https://semgrep.dev/docs/getting-started/"
  mark_failed "$name"
}

# 3. lizard — pip install
install_lizard() {
  local name="lizard"
  if check_tool "$name" lizard --version 2>/dev/null; then
    already=$((already + 1)); return 0
  fi
  if $VERIFY_ONLY; then mark_failed "$name"; return 0; fi

  echo "[$name] Installing..."
  local pipcmd
  pipcmd=$(pip_cmd)

  if [[ -n "$pipcmd" ]]; then
    echo "    Trying $pipcmd install..."
    if $pipcmd install lizard 2>&1 | tail -3; then
      hash -r 2>/dev/null || true
      if check_tool "$name" lizard --version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  mark_failed "$name"
}

# 4. jscpd — npm global
install_jscpd() {
  local name="jscpd"
  if check_tool "$name" jscpd --version 2>/dev/null; then
    already=$((already + 1)); return 0
  fi
  if $VERIFY_ONLY; then mark_failed "$name"; return 0; fi

  echo "[$name] Installing..."

  if $HAS_NPM; then
    echo "    Trying npm install -g..."
    # Scorecard PinnedDependenciesID dismissed (alert 5468) — `pkg@X.Y.Z` is
    # the canonical pinning form for npm global installs; SHA pinning has no
    # `install -g` syntax.
    if npm install -g jscpd@4.0.8 2>&1 | tail -3; then
      hash -r 2>/dev/null || true
      if check_tool "$name" jscpd --version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  mark_failed "$name"
}

# 5. gitleaks — GitHub release binary, brew, or go install
install_gitleaks() {
  local name="gitleaks"
  local gh_repo="gitleaks/gitleaks"
  if check_tool "$name" "$name" version 2>/dev/null; then
    already=$((already + 1)); return 0
  fi
  if $VERIFY_ONLY; then mark_failed "$name"; return 0; fi

  echo "[$name] Installing..."

  # Try brew
  if $HAS_BREW; then
    echo "$MSG_TRYING_BREW"
    if brew install "$name" 2>&1 | tail -3; then
      hash -r 2>/dev/null || true
      if check_tool "$name" "$name" version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  # Try GitHub release (Windows)
  if [[ "$PLATFORM" == "windows" ]]; then
    if download_github_release "$gh_repo" "$name" "windows_x64\\.zip"; then
      hash -r 2>/dev/null || true
      if check_tool "$name" "$name" version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  elif [[ "$PLATFORM" == "linux" ]]; then
    if download_github_release "$gh_repo" "$name" "linux_x64\\.tar\\.gz"; then
      hash -r 2>/dev/null || true
      if check_tool "$name" "$name" version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  elif [[ "$PLATFORM" == "macos" ]]; then
    if download_github_release "$gh_repo" "$name" "darwin_x64\\.tar\\.gz"; then
      hash -r 2>/dev/null || true
      if check_tool "$name" "$name" version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  # Try go install (pinned version per OpenSSF Scorecard)
  if $HAS_GO; then
    echo "    Trying go install..."
    if go install "github.com/$gh_repo/v8@v8.30.1" 2>&1 | tail -3; then
      hash -r 2>/dev/null || true
      if check_tool "$name" "$name" version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  mark_failed "$name"
}

# 6. git-quick-stats — bash script, npm, or brew
install_git_quick_stats() {
  local name="git-quick-stats"
  if check_tool "$name" git-quick-stats --version 2>/dev/null; then
    already=$((already + 1)); return 0
  fi
  # Also check without the dashes (some installs use 'git-quick-stats')
  if command -v git-quick-stats &>/dev/null; then
    already=$((already + 1)); return 0
  fi
  if $VERIFY_ONLY; then mark_failed "$name"; return 0; fi

  echo "[$name] Installing..."

  # git-quick-stats is not on npm registry — skip npm path (OpenSSF Scorecard compliance)

  # Try brew
  if $HAS_BREW; then
    echo "$MSG_TRYING_BREW"
    if brew install git-quick-stats 2>&1 | tail -3; then
      hash -r 2>/dev/null || true
      if check_tool "$name" git-quick-stats --version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  # Manual install — download script to BIN_DIR
  echo "    Trying direct download..."
  if curl --proto '=https' --tlsv1.2 -fsSL "https://raw.githubusercontent.com/arzzen/git-quick-stats/master/git-quick-stats" -o "$BIN_DIR/git-quick-stats"; then
    chmod +x "$BIN_DIR/git-quick-stats"
    hash -r 2>/dev/null || true
    if check_tool "$name" git-quick-stats --version 2>/dev/null; then mark_installed "$name"; return 0; fi
  fi

  mark_failed "$name"
}

# 7. repomix — npm global
install_repomix() {
  local name="repomix"
  if check_tool "$name" repomix --version 2>/dev/null; then
    already=$((already + 1)); return 0
  fi
  if $VERIFY_ONLY; then mark_failed "$name"; return 0; fi

  echo "[$name] Installing..."

  if $HAS_NPM; then
    echo "    Trying npm install -g..."
    # Scorecard PinnedDependenciesID dismissed (alert 5469) — `pkg@X.Y.Z` is
    # the canonical pinning form for npm global installs; SHA pinning has no
    # `install -g` syntax.
    if npm install -g repomix@1.13.1 2>&1 | tail -3; then
      hash -r 2>/dev/null || true
      if check_tool "$name" repomix --version 2>/dev/null; then mark_installed "$name"; return 0; fi
    fi
  fi

  mark_failed "$name"
}

# ── Run all installs ────────────────────────────────────────────────

install_scc
install_semgrep
install_lizard
install_jscpd
install_gitleaks
install_git_quick_stats
install_repomix

# ── Summary ─────────────────────────────────────────────────────────

echo ""
echo "=== Results ==="
echo "Already installed: $already"
echo "Newly installed:   $installed"
echo "Failed/missing:    $failed"
if [[ -n "$missing_list" ]]; then
  echo "Missing:$missing_list"
  echo ""
  echo "NOTE: Missing tools are non-fatal. The /repo-analysis skill will"
  echo "      gracefully degrade and skip dimensions that require them."
  echo "      Run 'node scripts/repo-analysis/check-tools.js' for a JSON manifest."
fi

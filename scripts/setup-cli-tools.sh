#!/usr/bin/env bash
# scripts/setup-cli-tools.sh — Deploy CLI tool configs to user directories
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="$REPO_DIR/tool-configs"

echo "=== SoNash CLI Tools Setup ==="
echo ""

# Delta git config
if command -v delta &>/dev/null; then
  if ! git config --global core.pager | grep -q delta 2>/dev/null; then
    echo "[delta] Configuring as git pager..."
    git config --global core.pager delta
    git config --global interactive.diffFilter "delta --color-only"
    git config --global delta.navigate true
    git config --global delta.side-by-side true
    git config --global delta.line-numbers true
    git config --global delta.syntax-theme Dracula
    echo "[delta] Done"
  else
    echo "[delta] Already configured"
  fi
else
  echo "[delta] Not installed — skipping"
fi

# Starship prompt
if command -v starship &>/dev/null; then
  STARSHIP_DIR="$HOME/.config"
  mkdir -p "$STARSHIP_DIR"
  if [[ ! -f "$STARSHIP_DIR/starship.toml" ]] || [[ "$CONFIG_DIR/starship.toml" -nt "$STARSHIP_DIR/starship.toml" ]]; then
    echo "[starship] Deploying config..."
    cp "$CONFIG_DIR/starship.toml" "$STARSHIP_DIR/starship.toml"
    echo "[starship] Done"
  else
    echo "[starship] Config up to date"
  fi

  # Add init to bashrc if not present
  BASHRC="$HOME/.bashrc"
  touch "$BASHRC"
  if ! grep -q 'starship init bash' "$BASHRC" 2>/dev/null; then
    echo "" >> "$BASHRC"
    echo '# Starship prompt' >> "$BASHRC"
    echo 'eval "$(starship init bash)"' >> "$BASHRC"
    echo "[starship] Added init to .bashrc"
  fi
else
  echo "[starship] Not installed — skipping"
fi

# Zoxide shell init
if command -v zoxide &>/dev/null; then
  BASHRC="$HOME/.bashrc"
  touch "$BASHRC"
  if ! grep -q 'zoxide init bash' "$BASHRC" 2>/dev/null; then
    echo "" >> "$BASHRC"
    echo '# Zoxide smart cd' >> "$BASHRC"
    echo 'eval "$(zoxide init bash)"' >> "$BASHRC"
    echo "[zoxide] Added init to .bashrc"
  else
    echo "[zoxide] Already in .bashrc"
  fi
else
  echo "[zoxide] Not installed — skipping"
fi

echo ""
echo "=== Setup Complete ==="

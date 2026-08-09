#!/usr/bin/env sh
# Install the repo's local git hooks from .githooks/
set -e
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo .)
HOOKDIR="$ROOT/.githooks"
GITHOOKS_DIR="$ROOT/.git/hooks"

if [ ! -d "$HOOKDIR" ]; then
  echo "No .githooks directory found; nothing to install"
  exit 0
fi

echo "Installing git hooks from $HOOKDIR to $GITHOOKS_DIR"
mkdir -p "$GITHOOKS_DIR"
for f in "$HOOKDIR"/*; do
  name=$(basename "$f")
  cp "$f" "$GITHOOKS_DIR/$name"
  chmod +x "$GITHOOKS_DIR/$name"
  echo "installed $name"
done

echo "Done. Run 'git status' to verify hooks are active."
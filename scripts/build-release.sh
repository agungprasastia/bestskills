#!/usr/bin/env bash
set -euo pipefail

# Build the release binary for the current platform and package it in the
# same format as CI (.github/workflows/release.yml).
# Cross-platform builds happen in CI.

APP="bestskills"
OUT_DIR="dist"
mkdir -p "$OUT_DIR"

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  linux)  PLATFORM="linux" ;;
  darwin) PLATFORM="darwin" ;;
  mingw*|msys*|cygwin) PLATFORM="windows" ;;
  *)      echo "Unsupported OS: $OS"; exit 1 ;;
esac

case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *)             echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

TARGET="${PLATFORM}-${ARCH}"
EXT=""
[ "$PLATFORM" = "windows" ] && EXT=".exe"

echo "Building $APP ($TARGET)..."
bun build "./bin/$APP.js" --compile "--target=bun-${TARGET}" "--outfile=$OUT_DIR/$APP$EXT"

echo "Packaging..."
if [[ "$PLATFORM" == "windows" ]]; then
  if command -v 7z >/dev/null 2>&1; then
    7z a "$OUT_DIR/$APP-${TARGET}.zip" "$OUT_DIR/$APP$EXT" >/dev/null
  else
    echo "  7z not available; leaving binary unpackaged: $OUT_DIR/$APP$EXT"
  fi
else
  tar czf "$OUT_DIR/$APP-${TARGET}.tar.gz" -C "$OUT_DIR" "$APP"
fi

echo ""
echo "Packaged in $OUT_DIR/"
ls -lh "$OUT_DIR/"
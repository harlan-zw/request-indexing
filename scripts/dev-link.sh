#!/usr/bin/env bash
# Dev-only overlay for the coordinated gscdump v1 release train. This changes
# node_modules only; a normal pnpm install restores the published packages.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

overlay() { # <package-name> <source-dir>
  local name="$1" source="$2"
  if [ ! -d "$source" ]; then
    echo "skip (missing checkout): $source"
    return
  fi
  local escaped="${name//\//+}"
  local hits=0
  shopt -s nullglob
  for target in node_modules/.pnpm/"${escaped}"@*/node_modules/"${name}"; do
    if [ -L "$target" ] && [ "$(readlink "$target")" = "$source" ]; then
      echo "= $name already linked"
      hits=$((hits + 1))
      continue
    fi
    rm -rf "$target"
    ln -s "$source" "$target"
    echo "✓ $name → $source"
    hits=$((hits + 1))
  done
  shopt -u nullglob
  [ "$hits" -gt 0 ] || echo "! $name: no installed pnpm entry"
}

GSCDUMP_CHECKOUT="${GSCDUMP_CHECKOUT:-$ROOT/../../pkg/gscdump}"
overlay "@gscdump/contracts" "$GSCDUMP_CHECKOUT/packages/contracts"
overlay "@gscdump/engine" "$GSCDUMP_CHECKOUT/packages/engine"
overlay "@gscdump/sdk" "$GSCDUMP_CHECKOUT/packages/sdk"
overlay "gscdump" "$GSCDUMP_CHECKOUT/packages/gscdump"

echo "✓ gscdump dev overlay applied; re-run after pnpm install"

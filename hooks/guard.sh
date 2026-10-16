#!/bin/sh
# Manifest hook launcher: runs a guard only inside Manifest projects, otherwise exits 0 silently.
# Usage: guard.sh ui-guard|git-guard

framework() {
  [ -f "$1/manifest.theme.css" ] && return 0
  [ -f "$1/manifest.json" ] || return 1
  grep -q '"manifest_version"' "$1/manifest.json" 2>/dev/null && return 1
  grep -qE 'manifestx\.dev|"preloadedComponents"|"components"|"prerender"' "$1/manifest.json" 2>/dev/null
}

hosted() {
  [ -f "$1/.mcp.json" ] && grep -qE 'mcp\.manifestx\.dev|manifest-mcp' "$1/.mcp.json" 2>/dev/null
}

in_scope() {
  for d in "$CLAUDE_PROJECT_DIR" "$PWD"; do
    [ -n "$d" ] || continue
    case "$1" in
      ui-guard) framework "$d" && return 0 ;;
      git-guard) { framework "$d" || hosted "$d"; } && return 0 ;;
    esac
  done
  return 1
}

case "$1" in
  ui-guard|git-guard) ;;
  *) exit 0 ;;
esac

in_scope "$1" || exit 0
command -v node >/dev/null 2>&1 || exit 0
exec node "$(dirname "$0")/$1.mjs"

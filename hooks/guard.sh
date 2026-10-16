#!/bin/sh
# Manifest hook launcher: runs a guard only in its scope, otherwise exits 0 silently.
# Usage: guard.sh ui-guard|git-guard

framework() {
  [ -f "$1/manifest.theme.css" ] && return 0
  [ -f "$1/manifest.json" ] || return 1
  grep -q '"manifest_version"' "$1/manifest.json" 2>/dev/null && return 1
  grep -qE 'manifestx\.dev|"preloadedComponents"|"components"|"prerender"|"data"' "$1/manifest.json" 2>/dev/null
}

shared_branch() {
  [ -f "$1/CLAUDE.md" ] && grep -qE '\*\*Hosting:\*\* *Own host via GitHub' "$1/CLAUDE.md" 2>/dev/null
}

in_scope() {
  for d in "$CLAUDE_PROJECT_DIR" "$PWD"; do
    [ -n "$d" ] || continue
    case "$1" in
      ui-guard) framework "$d" && return 0 ;;
      git-guard) shared_branch "$d" && return 0 ;;
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

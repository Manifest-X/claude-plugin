#!/usr/bin/env node
/**
 * Manifest git guard — Claude Code PreToolUse(Bash) hook.
 *
 * Manifest projects collaborate on ONE shared branch (usually `staging`):
 * teammates and multiple Claude sessions edit the same files there, and the
 * live preview serves the working tree. Creating or switching branches on a
 * whim diverges sessions, breeds merge conflicts, and makes the preview
 * suddenly lose other sessions' work (the working tree flips out from under it).
 *
 * This nudges away from unsolicited branch creation/switching. It NEVER blocks
 * (permissionDecision: allow) and FAILS OPEN — any error exits 0 silently.
 * Single source of truth; the scaffold and MCP bundle only wire it in settings.
 */

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('error', () => {});
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}') || {};
    if (String(data.hook_event_name || '') !== 'PreToolUse') return;
    if (String(data.tool_name || '') !== 'Bash') return;
    const cmd = String((data.tool_input || {}).command || '');
    if (!cmd) return;

    // Branch CREATION: `git checkout -b X`, `git switch -c/--create X`,
    // `git branch X` (a name, not a flag like -d/-a/--list/--show-current).
    const creates =
      /\bgit\s+checkout\s+-b\b/.test(cmd) ||
      /\bgit\s+switch\s+(-c|--create)\b/.test(cmd) ||
      /\bgit\s+branch\s+[^\s-]\S*/.test(cmd);

    // Branch SWITCH: `git switch X` (switch only changes branches — unlike
    // `git checkout`, which is ambiguous with file restore, so we don't flag it).
    const switches =
      /\bgit\s+switch\s+(?!-c\b)(?!--create\b)(?!-)[^\s]/.test(cmd);

    if (!creates && !switches) return;

    const action = creates ? 'creating a new git branch' : 'switching git branches';
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        additionalContext:
          `[Manifest git guard] This command is ${action}. Manifest projects collaborate on a SINGLE ` +
          'shared branch (usually `staging`) — teammates and other Claude sessions edit the same files ' +
          'there, and the live preview serves the working tree. Working on your own branch diverges from ' +
          "staging, causes merge conflicts, and makes the preview suddenly drop other sessions' work. " +
          'Unless the user EXPLICITLY asked for a branch: stay on the current branch, pull/sync first to ' +
          'absorb others\' changes (`/sync`), commit small, and push immediately so everyone and the ' +
          'preview stay in sync. If a separate branch is genuinely needed, ask the user before creating it. ' +
          'This is allowed to proceed, but reconsider before continuing.',
      },
    }));
  } catch {
    // fail open
  }
});

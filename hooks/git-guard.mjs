#!/usr/bin/env node
// Manifest git guard: PreToolUse(Bash) nudge against unrequested branch changes. Never blocks; fails open.

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

    // Branch creation
    const creates =
      /\bgit\s+checkout\s+-b\b/.test(cmd) ||
      /\bgit\s+switch\s+(-c|--create)\b/.test(cmd) ||
      /\bgit\s+branch\s+[^\s-]\S*/.test(cmd);

    // Branch switch
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
          'absorb others\' changes (`/manifest:sync`), commit small, and push immediately so everyone and the ' +
          'preview stay in sync. If a separate branch is genuinely needed, ask the user before creating it. ' +
          'This is allowed to proceed, but reconsider before continuing.',
      },
    }));
  } catch {
    // fail open
  }
});

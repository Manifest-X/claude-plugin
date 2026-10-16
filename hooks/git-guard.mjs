#!/usr/bin/env node
// Manifest git guard: PreToolUse(Bash) context against unrequested branch changes. Adds context only; fails open.

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
      /\bgit\s+branch\s+(?![-|&;<>()])[^\s|&;<>()]/.test(cmd);

    // Branch switch
    const switches =
      /\bgit\s+switch\s+(?![-|&;<>()])[^\s|&;<>()]/.test(cmd);

    if (!creates && !switches) return;

    const action = creates ? 'creating a new git branch' : 'switching git branches';
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext:
          `[Manifest git guard] This command is ${action}. This project records Own host via GitHub, ` +
          'which collaborates on one shared branch (usually `staging`) that teammates and other sessions ' +
          'also edit. Unless the user explicitly asked for a branch, stay on the shared branch, sync first ' +
          '(`/manifest:sync`), commit small, and push promptly. If a separate branch is genuinely needed, ' +
          'ask the user first.',
      },
    }));
  } catch {
    // fail open
  }
});

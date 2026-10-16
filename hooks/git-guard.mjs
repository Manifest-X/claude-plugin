#!/usr/bin/env node
// Manifest git guard: PreToolUse(Bash) context against unrequested branch changes. Adds context only; fails open.

import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const SHARED = new Set(['staging', 'production']);
const GIT_OPTS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);
const BRANCH_NO_CREATE = new Set([
  '-d', '-D', '--delete', '-m', '-M', '--move', '-l', '--list', '-a', '--all', '-r', '--remotes',
  '--show-current', '--contains', '--no-contains', '--merged', '--no-merged', '--points-at',
  '-u', '--set-upstream-to', '--unset-upstream', '--edit-description', '-v', '-vv', '--verbose',
]);

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
    const cwd = String(data.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
    addBlockBranches([cwd, process.env.CLAUDE_PROJECT_DIR]);

    let action = null;
    for (const segment of splitSegments(cmd)) {
      const found = classify(tokenize(segment), cwd);
      if (found === 'create') { action = found; break; }
      if (found) action = found;
    }
    if (!action) return;

    const what = action === 'create' ? 'creating a new git branch' : 'switching git branches';
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext:
          `[Manifest git guard] This command is ${what}. This project records Own host via GitHub, ` +
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

// Default and Live branch from the CLAUDE.md project block
function addBlockBranches(dirs) {
  for (const dir of dirs) {
    if (!dir) continue;
    try {
      const md = readFileSync(resolve(dir, 'CLAUDE.md'), 'utf8');
      for (const m of md.matchAll(/\*\*(?:Default|Live) branch:\*\*\s*`?([\w./-]+)`?/g)) SHARED.add(m[1]);
    } catch {}
  }
}

// Split on unquoted && || ; | and newlines
function splitSegments(cmd) {
  const out = [];
  let cur = '';
  let q = null;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (q) {
      if (c === '\\' && q === '"') { cur += c + (cmd[++i] ?? ''); continue; }
      if (c === q) q = null;
      cur += c;
    } else if (c === '"' || c === "'") {
      q = c;
      cur += c;
    } else if (c === ';' || c === '|' || c === '&' || c === '\n') {
      out.push(cur);
      cur = '';
      if ((c === '|' || c === '&') && cmd[i + 1] === c) i++;
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function tokenize(s) {
  return (s.match(/"[^"]*"|'[^']*'|\S+/g) || []).map((t) => t.replace(/^(["'])(.*)\1$/, '$2'));
}

// 'create' | 'switch' | null
function classify(tokens, cwd) {
  let g = 0;
  while (g < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[g])) g++;
  if (!tokens[g] || basename(tokens[g].replace(/^[({]+/, '')) !== 'git') return null;
  let i = g + 1;
  let dir = cwd;
  while (i < tokens.length && tokens[i].startsWith('-')) {
    const opt = tokens[i];
    if (GIT_OPTS_WITH_VALUE.has(opt)) {
      if (opt === '-C' && tokens[i + 1]) dir = resolve(dir, tokens[i + 1]);
      i += 2;
    } else i += 1;
  }
  const sub = tokens[i];
  const args = tokens.slice(i + 1);
  const flags = args.filter((a) => a.startsWith('-'));
  const plain = args.filter((a) => !a.startsWith('-'));
  const has = (...f) => flags.some((x) => f.includes(x.split('=')[0]));

  if (sub === 'checkout') {
    if (has('-b', '-B', '--orphan')) return 'create';
    if (args.includes('--')) return null;
    if (args[0] === '-') return 'switch';
    if (plain.length !== 1) return null;
    const target = plain[0];
    if (SHARED.has(target) || existsSync(resolve(dir, target))) return null;
    return 'switch';
  }
  if (sub === 'switch') {
    if (has('-c', '-C', '--create', '--force-create', '--orphan')) return 'create';
    if (args[0] === '-') return 'switch';
    if (!plain.length || SHARED.has(plain[0])) return null;
    return 'switch';
  }
  if (sub === 'branch') {
    if (!plain.length || has(...BRANCH_NO_CREATE)) return null;
    return 'create';
  }
  if (sub === 'worktree' && plain[0] === 'add' && has('-b', '-B')) return 'create';
  if (sub === 'stash' && plain[0] === 'branch') return 'create';
  return null;
}

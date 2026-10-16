#!/usr/bin/env node
/**
 * Manifest design guard — Claude Code hook, registered for two events.
 * UserPromptSubmit: nudge design-first when a prompt looks visual.
 * PreToolUse (Write/Edit): flag a <style> block / static inline style in markup.
 * Must FAIL OPEN — any error exits 0 with no output, never blocking the user.
 * Single source of truth; the scaffold and MCP bundle only wire it in settings.
 */

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('error', () => {});
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(raw || '{}') || {};
    if (String(data.hook_event_name || '') === 'PreToolUse') handlePreToolUse(data);
    else handleUserPromptSubmit(data);
  } catch {
    // fail open
  }
});

function handleUserPromptSubmit(data) {
  const prompt = String(data.prompt || '');
  if (!prompt.trim()) return;

  // Visual nouns + styling verbs only; generic add/make/create excluded so
  // backend prompts stay silent.
  const UI = new RegExp(
    '\\b(' +
      'redesign|restyl\\w*|styl(e|es|ed|ing)|stylesheet|css|theme|colou?rs?|fonts?|' +
      'typograph\\w*|spacing|padding|margins?|align|alignment|centre|center|' +
      'responsive|breakpoints?|layout|lay ?out|grids?|columns?|rows?|flex(box)?|' +
      'heros?|banners?|sidebars?|side ?rails?|nav(bar|igation)?|headers?|footers?|' +
      'menus?|cards?|tiles?|buttons?|cta|badges?|chips?|modals?|dialogs?|popovers?|' +
      'drawers?|tabs?|tables?|forms?|inputs?|sections?|panels?|dashboards?|shells?|' +
      'components?|widgets?|icons?|logos?|avatars?|ui|ux|' +
      'appearance|look (and feel|better|nicer|cleaner|modern|good|polished)|polish' +
    ')\\b',
    'i',
  );
  if (!UI.test(prompt)) return;

  process.stdout.write([
    '[Manifest design guard] This request looks like UI / layout / styling / component work.',
    'Before writing ANY markup or CSS:',
    '  1. Load the manifest-layout and manifest-styling skills (and manifest-component if you',
    '     are extracting something reusable). Do NOT improvise Manifest idioms from memory — the',
    '     condensed rules in CLAUDE.md are a pointer, not a substitute for the skills.',
    '  2. Design the structure FIRST, in Manifest terms (semantic layout: page / content / row /',
    '     col / center; pre-styled HTML elements; theme tokens). Design precedes code.',
    '  3. Hard rules, enforced NOW at authoring time (not deferrable to QA or publish):',
    '       - No <style> blocks and no static inline style="..." attributes.',
    '       - No hardcoded colors / fonts / sizes — use manifest.theme.css tokens or the',
    '         theme-derived utilities (bg-brand-surface, text-content-stark, ...).',
    '       - Prefer Manifest pre-styled elements + semantic classes (row / col / center /',
    '         content, ghost / brand / outlined / hug) over bespoke .classes that duplicate them.',
    '       - Minimal markup — no wrapper-div soup. Hoist a lone class onto its child and delete',
    '         the wrapper; reach for a semantic class before nesting divs.',
    'If this is only a copy / text / content edit with no layout or styling change, ignore this note.',
  ].join('\n'));
}

function handlePreToolUse(data) {
  const tool = String(data.tool_name || '');
  if (!/^(Write|Edit|MultiEdit)$/.test(tool)) return;

  const input = data.tool_input || {};
  const file = String(input.file_path || '');
  if (!/\.html?$/i.test(file)) return; // markup only; CSS files are meant to hold CSS

  let text = '';
  if (tool === 'Write') text = String(input.content || '');
  else if (tool === 'Edit') text = String(input.new_string || '');
  else if (tool === 'MultiEdit' && Array.isArray(input.edits))
    text = input.edits.map((e) => (e && e.new_string) || '').join('\n');
  if (!text) return;

  const hits = [];
  if (/<style[\s>]/i.test(text)) hits.push('a <style> block');
  // Static inline style only; lookbehind spares :style / x-bind:style.
  if (/(?<![:\-\w])style\s*=\s*["']/i.test(text)) hits.push('a static inline style="..." attribute');
  if (!hits.length) return;

  const msg =
    '[Manifest design guard] The markup about to be written to ' + file + ' contains ' +
    hits.join(' and ') + ' — an outdated approach in Manifest. Move styling into manifest.theme.css ' +
    'tokens, Manifest semantic classes (row/col/center, ghost/brand/outlined), or theme-derived ' +
    'utilities; load manifest-styling if you have not. (Dynamic :style / x-bind:style bindings are ' +
    'fine and are not flagged.) This is allowed to proceed, but prefer to revise it before the user reviews.';

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      additionalContext: msg,
    },
  }));
}

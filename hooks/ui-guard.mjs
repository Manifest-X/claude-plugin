#!/usr/bin/env node
// Manifest design guard: UserPromptSubmit design-first context; PreToolUse(Write/Edit) inline-style flag. Adds context only; fails open.

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

  // Unambiguous visual words
  const VISUAL = new RegExp(
    '\\b(' +
      'redesign|restyl\\w*|styl(e|es|ed|ing)|stylesheet|css|colou?rs?|fonts?|' +
      'typograph\\w*|spacing|padding|margins?|centre|center|responsive|breakpoints?|' +
      'layout|lay ?out|heros?|banners?|sidebars?|navbar|footers?|modals?|popovers?|' +
      'drawers?|buttons?|icons?|logos?|avatars?|ui|ux|appearance|polish|' +
      'look (and feel|better|nicer|cleaner|modern|good|polished)' +
    ')\\b',
    'i',
  );
  // Ambiguous nouns (HTTP header, SQL table, form data): need page context
  const NOUN = /\b(headers?|tables?|grids?|columns?|rows?|forms?|inputs?|sections?|panels?|cards?|tiles?|tabs?|menus?|nav(igation)?|dialogs?|badges?|chips?|cta|dashboards?|components?|widgets?|theme)\b/i;
  const CONTEXT = /\b(page|screen|homepage|landing|site|website|mobile|desktop|look|visual|design|display|show|shows|showing)\b/i;
  const nouns = prompt.match(new RegExp(NOUN.source, 'gi')) || [];
  if (!VISUAL.test(prompt) && !(nouns.length && CONTEXT.test(prompt))) return;

  process.stdout.write(
    '[Manifest design guard] If this request changes UI, layout, or styling: load manifest-layout and ' +
      'manifest-styling first and design the structure before writing markup. No <style> blocks or ' +
      'static style="..."; use manifest.theme.css tokens, pre-styled elements, and semantic classes ' +
      '(row / col / center / content); no wrapper-div soup. Ignore this for non-visual work.',
  );
}

function handlePreToolUse(data) {
  const tool = String(data.tool_name || '');
  if (!/^(Write|Edit|MultiEdit)$/.test(tool)) return;

  const input = data.tool_input || {};
  const file = String(input.file_path || '');
  if (!/\.html?$/i.test(file)) return; // markup only

  let text = '';
  if (tool === 'Write') text = String(input.content || '');
  else if (tool === 'Edit') text = String(input.new_string || '');
  else if (tool === 'MultiEdit' && Array.isArray(input.edits))
    text = input.edits.map((e) => (e && e.new_string) || '').join('\n');
  if (!text) return;

  const hits = [];
  if (/<style[\s>]/i.test(text)) hits.push('a <style> block');
  // Static inline style; spares :style / x-bind:style
  if (/(?<![:\-\w])style\s*=\s*["']/i.test(text)) hits.push('a static inline style="..." attribute');
  if (!hits.length) return;

  const msg =
    '[Manifest design guard] The markup about to be written to ' + file + ' contains ' +
    hits.join(' and ') + ' — an outdated approach in Manifest. Move styling into manifest.theme.css ' +
    'tokens, Manifest semantic classes (row/col/center, ghost/brand/outlined), or theme-derived ' +
    'utilities; load manifest-styling if you have not. (Dynamic :style / x-bind:style bindings are ' +
    'fine and are not flagged.) Prefer to revise it before the user reviews.';

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: msg,
    },
  }));
}

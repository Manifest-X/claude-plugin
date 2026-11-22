#!/usr/bin/env node
// Builds dist/manifestx-<version>.zip for OpenAI's plugin directory.
// Pass --final to also require the demo recording URL.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => JSON.parse(readFileSync(root + p, 'utf8'));
const errors = [];
const check = (ok, msg) => ok || errors.push(msg);

const portable = read('plugin.json');
const claude = read('.claude-plugin/plugin.json');
const mcp = read('mcp.json');
const claudeMcp = read('.mcp.json');
const oai = portable.extensions?.['com.openai'] ?? {};
const ui = oai.interface ?? {};

// One plugin, two manifests: shared fields must agree.
for (const key of ['version', 'homepage', 'repository', 'license']) {
  check(portable[key] === claude[key], `${key} differs between plugin.json and .claude-plugin/plugin.json`);
}
check(ui.supportURL === claude.supportUrl, 'supportURL differs');
check(ui.privacyPolicyURL === claude.privacyPolicyUrl, 'privacyPolicyURL differs');
check(ui.termsOfServiceURL === claude.termsOfServiceUrl, 'termsOfServiceURL differs');
const servers = Object.values(mcp.mcpServers ?? {});
check(servers.length === 1, 'mcp.json must declare exactly one server');
check(servers[0]?.url === Object.values(claudeMcp.mcpServers)[0]?.url, 'MCP URL differs between mcp.json and .mcp.json');
check(servers[0]?.type === 'streamable-http', 'mcp.json server type must be streamable-http');

// OpenAI submission limits.
check(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(portable.name) && portable.name.length <= 64, 'name format');
check(/^\d+\.\d+\.\d+$/.test(portable.version), 'version must be semver');
check(portable.description?.length <= 4000, 'description too long');
check(ui.displayName?.length > 0 && ui.displayName.length <= 30, 'displayName must be 1-30 chars');
check(ui.shortDescription?.length > 0 && ui.shortDescription.length <= 30, 'shortDescription must be 1-30 chars');
check(ui.longDescription?.length > 0 && ui.longDescription.length <= 4000, 'longDescription must be 1-4000 chars');
check(Array.isArray(ui.capabilities) && ui.capabilities.length <= 20 && ui.capabilities.every((c) => c.length <= 120), 'capabilities');
check((ui.defaultPrompt ?? []).length <= 3 && (ui.defaultPrompt ?? []).every((p) => p.length <= 128), 'defaultPrompt');
for (const key of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
  check(/^https:\/\//.test(ui[key] ?? ''), `${key} must be https`);
}
for (const key of ['logo', 'composerIcon']) {
  check(ui[key]?.startsWith('./') && existsSync(root + ui[key].slice(2)), `${key} file missing`);
}
check(!/\b(free|pricing|price|trial|discount)\b/i.test([portable.description, ui.shortDescription, ui.longDescription].join(' ')), 'listing text must not mention pricing or free');
check(!oai.hooks && !oai.apps, 'hooks and apps cannot be submitted');
const cases = oai.review?.test_cases ?? {};
check(cases.positive?.length === 5, 'need exactly 5 positive test cases');
check(cases.negative?.length === 3, 'need exactly 3 negative test cases');
check((cases.positive ?? []).every((c) => c.description && c.prompt && c.tools_triggered && c.expected_behavior), 'positive case fields');
check((cases.negative ?? []).every((c) => c.description && c.prompt), 'negative case fields');
if (process.argv.includes('--final')) {
  check(/^https:\/\//.test(oai.review?.demo_recording_url ?? ''), 'review.demo_recording_url is required for submission');
}
for (const dir of readdirSync(root + 'skills').filter((d) => !d.startsWith('.'))) {
  check(existsSync(`${root}skills/${dir}/SKILL.md`), `skills/${dir}/SKILL.md missing`);
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}

mkdirSync(root + 'dist', { recursive: true });
const out = `dist/${portable.name}-${portable.version}.zip`;
rmSync(root + out, { force: true });
execFileSync('zip', ['-rqX', out, 'plugin.json', 'mcp.json', 'skills', 'icon.png', 'LICENSE', '-x', '*.DS_Store'], { cwd: root });
console.log(`✓ ${out}`);

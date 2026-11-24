---
name: manifest-setup
description: "Getting started with Manifest. Use when the user wants to connect or sign in to Manifest, put a site online with Manifest for the first time, build a new site or app \"with Manifest\", or when a Manifest tool reports that sign-in is needed. Covers connecting the Manifest connector, the first publish of an existing project, the first build from scratch, and publishing from a chat with no shell. SKIP when Manifest is already connected and the project has published before (use manifest-workflow), and in projects unrelated to Manifest."
---

# Getting started with Manifest

Manifest publishes and hosts sites and apps that run in the browser, from the
conversation: staging and production URLs, promotion, and custom domains
(rollback, export, and teams are part of Manifest Pro). It doesn't run server code (SSR, API routes, backends). Native
apps are packaged from the same project. New projects can be built on the
open-source Manifest framework (HTML-first, no build step).

## 1. Connect

Check first: call `manifest_status` (or `manifest_list_projects`). If it
answers, the connection works. If Manifest tools are missing or a result says
`auth_required`:

- **In Claude chat and Cowork**: open **Customize > Plugins**, select **Manifest**,
  and connect the Manifest connector on its **Connectors** tab. A browser
  sign-in follows; it creates a Manifest account if the user has none. On Team
  and Enterprise plans an Owner may need to add the connector for the
  organization first.
- **In Claude Code**: run `/mcp`, choose the Manifest server, and authenticate.
  The browser sign-in opens.

If Manifest answers but a skill names a Manifest tool you don't have, the app's
tool list is stale; the feature isn't missing or gated. Ask the user to refresh
the Manifest connector (Claude: Settings → Connectors → Manifest, or
**Customize > Plugins > Manifest > Connectors**; Claude Code: `/mcp`), then
start a new session.

There are no sign-in tools and no API key to paste for interactive use. Tell the
user plainly: "You'll need to sign in to Manifest. Connect it, then tell me to
continue." A signed-in user with no projects is the normal start.

## 2. First publish of an existing project

1. **Identify the project kind** (see **manifest-workflow** → "What kind of
   project is it?"): a Manifest framework project, another framework with a
   build step, or something that needs a server (explain the limit before going
   further).
2. **Tie the folder to a Manifest project.** If the Manifest project block in
   the project's instructions file (CLAUDE.md or AGENTS.md) has a
   **Project id**, or the folder's `.mcp.json` pins one
   (`X-Manifest-Project`), use it. Otherwise, with the user's go-ahead, create
   one with `manifest_init` `mode: 'attach'` and the project's name, and record
   the returned `project_id` as **Project id** in the block (see
   **manifest-workflow**). Then target it explicitly: pass `project_id` to the
   publish tools and call `manifest_select_project` before other project tools.
   Ignore the result's `files` and `instructions`; write no file from it. The
   plugin already provides the Manifest server (a project-level one would load
   the same tools twice), and publishing through it needs nothing else. Headless
   or CI publishing (no assistant in the loop) is set up by the user outside the
   plugin, with a project key kept in their CI's secret settings; point them to
   https://manifestx.dev/docs/api/reference/authentication.
3. **Build and publish to staging first** unless the user asked to go straight
   live, following **manifest-workflow** → "The managed flow". Record the result
   in the Manifest project block in the instructions file (see manifest-workflow).
4. **Report the URL** in one line, and offer the next step: review, then "take
   it live".

## 3. First build from scratch

- **"With Manifest", or no framework named**: build on the Manifest framework.
  In a session with a shell, the project needs an **empty
  folder**: the starter stops if same-named files exist (`index.html`,
  `README.md`, `LICENSE.md`, `privacy.md`, `components/`, `assets/`). If the
  chosen folder isn't empty, list the files that would be replaced and ask, or
  offer a new subfolder instead; if the user agrees to replace them, add
  `--force`. Then:
  - Create the project with `manifest_init` `mode: 'attach'`, record its
    **Project id** in the block, and write none of the returned files (as in
    section 2). Scaffold the starter template with
    `npx mnfst-starter --here --name "<project name>"`, using the name you
    passed to `manifest_init` (letters, digits, spaces, `.`, `_`, `-` only).
    This runs the `mnfst-starter` package from npm and writes only the template
    files and `.gitignore`.
  Then build the first pass with **manifest-framework**, **manifest-layout**,
  and **manifest-styling**, preview it (`/manifest:preview`), and publish to
  staging.
- **Another framework named** ("a React app", "with Astro"): use it. Manifest
  doesn't change how it's authored. Scaffold it with that framework's own tools,
  build, and publish its build output (`source='spa'`, `output_dir` = the build
  folder) after tying the folder to a project with `manifest_init`
  `mode: 'attach'`.

If the Manifest skills are already available in this session (for example from
the Manifest plugin), don't also install them into the project with
`manifest_install_skills`: each skill would load twice.

## 4. No shell: a chat app

Without a shell on the user's computer, build in the chat's code sandbox and
publish with `manifest_publish_files`, which takes the files in the call.

1. **Create the project** with `manifest_init` `mode: 'attach'`. Use only the
   returned `project_id` and ignore the rest of the result; there's no folder
   to write files into.
2. **Build in the sandbox.** For a Manifest framework site, write the files
   directly: `index.html` loading Manifest from the CDN, `manifest.json`,
   `manifest.theme.css`, and `components/` as needed (see
   **manifest-framework**). For another framework, run its build in the
   sandbox if it can, and use the output folder.
3. **Publish** the final files with `manifest_publish_files`, passing
   `project_id`, `env: 'staging'` first, text as `utf8` and images or fonts as
   `base64`, and no secrets.
4. **Report the URL.** Keep the files and the project in the conversation for
   later updates; each publish replaces the whole site.

Larger projects (more files or bytes than `manifest_publish_files` accepts)
need an agent with a shell and the project folder, where
`manifest_publish` uploads the whole build from the user's computer.

## Help

Docs: https://manifestx.dev/docs/ai. If the user wants a person to build or
finish the project, use **manifest-help**. Support: team@manifestx.dev.

---
name: manifest-setup
description: "Getting started with Manifest. Use when the user wants to connect or sign in to Manifest, put a site online with Manifest for the first time, build a new site or app \"with Manifest\", or when a Manifest tool reports that sign-in is needed. Covers connecting the Manifest connector (Claude chat, Cowork, Claude Code), the first publish of an existing project, the first build from scratch, and publishing from a chat with no shell (including Claude's Free plan). SKIP when Manifest is already connected and the project has published before (use manifest-workflow), and in projects unrelated to Manifest."
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

- **Claude chat and Cowork**: open **Customize > Plugins**, select **Manifest**,
  and connect the Manifest connector on its **Connectors** tab. A browser
  sign-in follows; it creates a Manifest account if the user has none. On Team
  and Enterprise plans an Owner may need to add the connector for the
  organization first.
- **Claude Code**: run `/mcp`, choose the Manifest server, and authenticate.
  The browser sign-in opens.

There are no sign-in tools and no API key to paste for interactive use. Tell the
user plainly: "You'll need to sign in to Manifest. Connect it, then tell me to
continue." A signed-in user with no projects is the normal start.

## 2. First publish of an existing project

1. **Identify the project kind** (see **manifest-workflow** → "What kind of
   project is it?"): a Manifest framework project, another framework with a
   build step, or something that needs a server (explain the limit before going
   further).
2. **Tie the folder to a Manifest project.** If the Manifest project block in
   `CLAUDE.md` has a **Project id**, or the folder's `.mcp.json` pins one
   (`X-Manifest-Project`), use it. Otherwise, with the user's go-ahead, create
   one with `manifest_init` `mode: 'attach'` and the project's name, and record
   the returned `project_id` as **Project id** in the block (see
   **manifest-workflow**). Then target it explicitly: pass `project_id` to the
   publish tools and call `manifest_select_project` before other project tools.
   The result also contains files to write; with the Manifest plugin installed,
   write neither:
   - `.mcp.json`: the plugin already provides the Manifest server; a
     project-level `manifest` server would load the same tools twice. (Without
     the plugin, merge it: add or replace only `mcpServers.manifest`, keep every
     other server.)
   - `.env`: holds an API key needed only for headless or CI publishing;
     interactive publishing through the connector needs no key. Write it only
     if the user asks for headless publishing, and then append or replace just
     the `MANIFEST_API_KEY=` line, keep `.env` in `.gitignore`, never commit it,
     and never print the key. A key can be replaced later with
     `manifest_rotate_key`.
3. **Build and publish to staging first** unless the user asked to go straight
   live, following **manifest-workflow** → "The managed flow". Record the result
   in the Manifest project block in `CLAUDE.md` (see manifest-workflow).
4. **Report the URL** in one line, and offer the next step: review, then "take
   it live".

## 3. First build from scratch

- **"With Manifest", or no framework named**: build on the Manifest framework.
  In Claude Code (or any session with a shell), the project needs an **empty
  folder**: the starter overwrites same-named files (`index.html`, `README.md`,
  `LICENSE.md`, `privacy.md`, `components/`, `assets/`). If the chosen folder
  isn't empty, list the files that would be replaced and ask, or offer a new
  subfolder instead. Then:
  - **With the Manifest plugin installed**: create the project with
    `manifest_init` `mode: 'attach'`, record its **Project id** in the block,
    and write no `.mcp.json` or `.env` (as in section 2). Scaffold the starter
    template with `MANIFEST_API_KEY= npx mnfst-starter --here --name "<project name>"`,
    using the name you passed to `manifest_init` (letters, digits, spaces, `.`,
    `_`, `-` only). This runs the `mnfst-starter` package from npm; clearing
    `MANIFEST_API_KEY` stops it from picking up a key from the environment and
    writing `.env`, `.mcp.json`, and `.claude/settings.json`.
  - **Without the plugin**: `manifest_init` `mode: 'new'` returns a
    `mnfst-starter` command that also writes `.mcp.json`, `.env`, and
    `.claude/settings.json` (replacing existing ones). Check it
    against **manifest-workflow** → "Check server-returned commands" before
    running it; it carries the project's API key, so never print it.
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

## 4. No shell: Claude chat, including Claude's Free plan

Without a shell on the user's computer, Claude builds in the chat's code
sandbox and publishes with `manifest_publish_files`, which takes the files in
the call.

1. **Create the project** with `manifest_init` `mode: 'attach'`. Use only the
   returned `project_id`; there's no folder to write files into. Don't show
   the returned key.
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
need the Code tab in the Claude desktop app, or Claude Code, where
`manifest_publish` uploads the whole build from the user's computer.

## Help

Docs: https://manifestx.dev/docs/ai. If the user wants a person to build or
finish the project, use **manifest-help**. Support: team@manifestx.dev.

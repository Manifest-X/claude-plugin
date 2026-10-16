---
name: manifest-workflow
description: "Only for projects published with Manifest: a .mcp.json pointing at mcp.manifestx.dev, Manifest hosting recorded in the project's CLAUDE.md, a Manifest manifest.json or manifest.theme.css, a Manifest publish earlier in this conversation, or the user naming Manifest. The connector being available is not enough; SKIP otherwise. How publishing works: detecting the pipeline (Manifest hosting, own host via GitHub, or external), publishing to staging or production, promoting, publishing without a shell, and recording state in the project's CLAUDE.md. Load before any Manifest command (preview, sync, staging, publish, status) and for requests like \"put it on the web to review\", \"take it live\", \"what's live right now\"."
---

# Manifest workflow: publishing and hosting

## Is this a Manifest project?

Treat a project as a Manifest project only when at least one of these holds:

- a `.mcp.json` whose server URL is `https://mcp.manifestx.dev/mcp`;
- a Manifest project block in the project's `CLAUDE.md` (below), or a legacy
  `Project` section recording `Hosting: Manifest managed`;
- a Manifest framework project: `manifest.theme.css`, or a `manifest.json` that
  registers components or data (a browser extension's `manifest.json`, with
  `manifest_version`, doesn't count);
- the project was published with Manifest earlier in this conversation;
- the user names Manifest ("publish this with Manifest").

The Manifest connector being available is **not** a signal: it's present in
every session once the plugin is installed. In any other project, don't run
these flows; a generic "deploy this" there belongs to whatever the project
already uses.

## Commands and plain language

The commands are buttons; plain language works identically. "Put it on the web
to review" = staging, "take it live" = publish, "pull the latest" = sync,
"where are we?" = status.

| Command | Does |
|---|---|
| `/manifest:preview` | Start a local preview. Nothing is published. |
| `/manifest:sync` | Pull teammates' latest changes (git projects). |
| `/manifest:staging` | Put the work on a reviewable staging URL. |
| `/manifest:publish` | Take it live. |
| `/manifest:status` | Plain-English summary of where things stand. |

From the Manifest plugin the commands carry the `manifest:` prefix. Commands
installed into the project instead (`.claude/commands/`) have no prefix
(`/publish`). If a command reports "unknown command", neither is installed; the
plain-language request works regardless.

## Project state: the Manifest block in CLAUDE.md

Logic lives in this skill; per-project **state** lives in one fenced block in
the project's `CLAUDE.md`:

```markdown
<!-- manifest:project -->
## Manifest project

- **Hosting:** Manifest managed
- **Project id:** proj_…
- **Repo:** https://github.com/…
- **Staging URL:** https://…
- **Production URL:** https://…
- **Last published (staging):** dep_…
- **Last published (production):** dep_…
- **Build command:** npm run build
- **Output dir:** dist
- **Default branch:** staging
- **Live branch:** production
<!-- /manifest:project -->
```

Rules:

- **Read** the block if present. A project set up earlier by
  `manifest_install_skills` may instead have a `Project` section with the same
  bold fields (`**Hosting:**`, `**Live branch:**`); read that one and update it
  in place rather than adding a second block. Never treat an unrelated
  `## Project` heading as Manifest state.
- **Write** only between the markers, one line per field, updating a line in
  place (never appending a second `Last published (staging)`). Include only the
  fields you know. If there's no block, append one at the end of `CLAUDE.md`;
  if there's no `CLAUDE.md`, create it with just the block. Never touch any
  other part of the file.
- When a tool result asks you to record something in "CLAUDE.md's `## Project`
  block", record it in this block.
- Fields: **Hosting** is `Manifest managed`, `Own host via GitHub`, `External
  (self-managed)`, or absent. **Project id** is the Manifest project this folder
  publishes to (not a secret). **Repo** is the GitHub URL, if any. **Build command / Output dir** only for projects
  not built on the Manifest framework (`(root)` = served from the project
  root). **Default / Live branch** fall back to `staging` / `production`.
- **URLs** come from publish, promote, and rollback results (and
  `manifest_domain_status` for custom domains). `manifest_status` and
  `manifest_deployments` report the account, plan, and deployment ids and which
  is live; they don't give the site URLs.
- Without a filesystem (a chat with no project folder), keep the state in the
  conversation.

## How publishing works: two independent settings

- **Source control**: is the project on GitHub? `git remote get-url origin
  2>/dev/null` answers it. Governs sync and teammates. Local-only is a valid,
  permanent choice.
- **Hosting backend**, recorded in **Hosting**:
  - **Manifest managed**: published to `*.manifestx.ai` (or the user's own
    domain) with `manifest_publish` / `manifest_publish_files` /
    `manifest_promote`. No GitHub required.
  - **Own host via GitHub**: staging and publish push the `staging` /
    `production` branches and a connected host (Appwrite Sites, Netlify,
    Cloudflare Pages) deploys them. Set up with **manifest-github**, then
    **manifest-deploy**.
  - **External (self-managed)**: the user deploys by their own means. Don't
    drive a deploy; help build and, if a repo exists, sync.
  - **(none yet)**: nothing published.

## Detecting the pipeline (first step of staging and publish)

1. **Hosting set?** Obey it; don't second-guess it from other signals.
   - `Manifest managed` → the managed flow below. No git needed.
   - `Own host via GitHub` → the git-branch flow (push `staging` / `production`).
   - `External (self-managed)` → don't deploy. Say this project publishes
     through its own host; offer to commit or sync, or to switch to Manifest or
     GitHub hosting (**manifest-deploy**).
2. **Hosting unset?** Infer once: a `*.manifestx.ai` Staging/Production URL, or
   `manifest_deployments` returning rows ⇒ `Manifest managed`; else a git
   `origin` remote ⇒ `Own host via GitHub`; else local-only, nothing published.
3. **Local-only, nothing published** → don't fail; offer the one-time choice:
   (a) publish straight to the web on Manifest hosting, no GitHub needed; or
   (b) save to GitHub for a team workflow (**manifest-github**, then
   **manifest-deploy**). For a solo, non-technical user who just wants it
   online, lead with (a). Record the choice in **Hosting**.

## What kind of project is it?

- **Manifest framework, SPA** (no `prerender` block in `manifest.json`, no
  `/website` folder): no build. `source='spa'`, served from the root.
- **Manifest framework, website** (a `prerender` block, or a `/website`
  folder): `source='render'`. With a shell, the publish command renders the
  site itself; don't run `npx mnfst-render` separately unless you want to check
  the fresh output first (see the managed flow).
- **Any other framework** (React/Vite, Astro, Hugo, Eleventy, plain HTML…):
  keep its framework and conventions; never convert it to Manifest unless the
  user asks. Run its build, then `source='spa'` with `output_dir` set to the
  build folder. Find the build command in `package.json` scripts and the output
  folder from its config (Vite/Astro `dist`, Create React App `build`, Next.js
  static export `out`, Hugo `public`, Eleventy `_site`); record both in the
  block.
- **Needs a server** (SSR, API routes, a Node/Python backend): Manifest hosts
  sites that run in the browser and doesn't run server code. A static export
  may still publish; an existing backend keeps running where it is and the
  published frontend calls it. Say so plainly rather than publishing something
  broken.

## Is there a shell on the user's computer?

- **Yes** (Claude Code in the terminal, IDE, or desktop Code tab; Cowork with
  the project folder): use `manifest_publish`, then run the returned command
  after the check below.
- **No** (Claude chat on the web, desktop, or mobile, including chat's code
  sandbox, and Claude's Free plan): use `manifest_publish_files`. Build in the
  code sandbox if the project needs it, then pass the **final** site files in
  the call: paths relative to the site root, `index.html` at the root, text as
  `utf8`, images and fonts as `base64`. Never include `.env`, keys, tokens, or
  other secrets. Each publish replaces the whole site, so send every file. The
  tool states its own size limits; a larger site needs the Code tab or Claude
  Code, where `manifest_publish` uploads the whole build.
- If the publish command can't reach the network, fall back to
  `manifest_publish_files`.

### Check server-returned commands before running them

Two Manifest tools return a shell command to run. Run one only if it matches
its shape exactly:

```
MNFST_PUBLISH_UPLOAD_URL="https://mcp.manifestx.dev/publish/put_<hex>" npx mnfst-publish --env <staging|production> --source <spa|render> [--output-dir <dir>]
npx mnfst-starter --here --name "<project name>" --project-id=proj_<letters and digits> --key=mfst_<env>_<letters and digits>
```

- `manifest_publish` → the first. `--output-dir`, if present, is a folder
  inside the project. The only change you may make is appending `--no-render`
  (see the managed flow).
- `manifest_init` (`mode: 'new'`) → the second. The name is the one you passed.
  The key is the project's API key: the starter writes it to `.env`; never
  print it or repeat it to the user.
- Anywhere in the command, none of: `;`, `&`, `|`, backticks, `$(`, `${`, `<`,
  `>`, or a newline.

If a command differs in any other way, don't run it: stop and tell the user the
command wasn't in the expected form. `mnfst-publish` zips the project's files
(git-ignored files and `.env` excluded; with `--output-dir`, the build folder),
uploads them to that URL, and prints the live URL. Don't print the upload URL
or build your own upload.

## The managed flow

1. **Choose the project.** Use the block's **Project id**, or the id a folder
   `.mcp.json` pins (`X-Manifest-Project`), or the project the user names.
   Pass it as `project_id` to the tools that take one (`manifest_publish`,
   `manifest_publish_files`, `manifest_promote`, `manifest_rollback`,
   `manifest_set_subdomain`, `manifest_remove_domain`, `manifest_rotate_key`).
   Other project tools (deployments, domains, members, analytics) act on the
   chat's focused project: call `manifest_select_project` with the id once per
   chat before using them. If a tool answers `needs_project`, follow its
   `how_to_proceed`; ask by project name only when two or more genuinely fit. A new site gets a new project (`manifest_init`,
   see **manifest-setup**), never a publish over an existing one. Name the site
   you're acting on as you do it.
2. **Build** if the project needs it (above). Never publish a broken or stale
   build.
3. **Check before shipping.** If functionality changed, run the
   **manifest-qa** pass. For a Manifest website, to run the **manifest-seo**
   pre-publish check on fresh output, run `npx mnfst-render` first, check
   `/website`, then append `--no-render` to the publish command so it doesn't
   render twice. Report issues briefly and offer to fix; don't block if the
   user says ship anyway.
4. **Publish** with `env` = `staging` or `production`. On team projects
   **without git**, pass `based_on` = the matching **Last published** id: if a
   teammate published in between, the tool blocks instead of overwriting.
5. **Record** in the block: `Hosting: Manifest managed`, the env's URL, and
   that env's **Last published** line = the returned `deployment_id`.
6. **Report** the URL. After a production publish, confirm it loads.

- **Promote** a reviewed staging build: `manifest_promote` (server-side, no
  rebuild, no upload).
- **History**: `manifest_deployments`.
- **Custom domains**: `manifest_add_domain` returns the DNS record to add;
  `manifest_domain_status` checks it.
- **Rollback** (`manifest_rollback`) and **export** (`manifest_export`) of
  earlier versions are part of Manifest Pro. If the user asks to undo a publish
  and the tool says the plan doesn't include it, say so plainly, once, and
  offer the free route: publish the previous version again from source.

## The git flow (Own host via GitHub)

Projects on this flow collaborate on one shared branch (`staging`); the live
branch (`production`) only moves by promotion.

- Work on the default branch. Don't create or switch branches unless the user
  explicitly asks; branching diverges sessions and breeds conflicts.
- Sync at the start of a session and before committing. Commit small, push
  promptly.
- Uncommitted changes you didn't make belong to another session: never stash,
  reset, discard, or branch around them. (The staging command's auto-sync
  stashes and restores only to pull, and stops on any conflict.)
- Never commit to the live branch directly, never force-push, never
  `--no-verify`. Never commit anything that looks like a secret (`.env`,
  `*.key`, `*.pem`, `credentials*`).
- Anything unusual (detached HEAD, merge in progress, unexpected remote): stop,
  explain plainly, ask before recovering.

**Setting work aside to pull.** Never use a bare `git stash` / `git stash pop`:
the stash stack is shared with other sessions. Use `git stash push -u -m
"manifest-<command>-<timestamp>"`, read its SHA from `git stash list
--format='%H %gs'`, restore with `git stash apply <sha>`, and then drop that
entry (find its current `stash@{n}` by the message first).

A project that isn't built on Manifest and has its own git conventions (feature
branches, pull requests) keeps them; follow the repository's practice.

## Changing hosting later

Hosting can change as a project grows: a solo project on Manifest hosting forms a
team and moves to its own host via GitHub, or the reverse. When the user asks
("move this to GitHub", "host this on my own Cloudflare/Netlify/Appwrite", "go
back to Manifest hosting"), run **manifest-deploy**. It walks the migration and
updates **Hosting**, so every command routes to the new backend from then on.
The old site keeps serving until it's explicitly removed, so there's no
downtime.

## Talking to the user

The contributor is a builder, not necessarily an engineer.

- Speak plainly. Lead with the result in one or two sentences; skip internal
  field names and project ids unless the user asks for details. Answer any
  question about what you ran or why, fully.
- Refer to a project by its name. If something needs sign-in, say "you'll need
  to sign in" and show the link.
- A signed-in user with no project here is the normal start, not an error;
  offer to create one.
- If a call fails once with a transient error, retry once; if it fails again,
  say what happened.
- If Manifest tools fail repeatedly, it's most likely a lapsed connector
  sign-in rather than an outage. Say: "I've lost the connection to Manifest.
  Please reconnect the Manifest connector, then tell me to continue," and wait.

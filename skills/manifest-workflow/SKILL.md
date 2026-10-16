---
name: manifest-workflow
description: "For projects published or hosted with Manifest (the Manifest connector, a Manifest manifest.json, a .mcp.json for mcp.manifestx.dev, or Manifest hosting recorded in CLAUDE.md), or when the user asks for Manifest. SKIP in other projects. How publishing works: detecting the pipeline (Manifest managed hosting, own host via GitHub, or external), publishing to staging or production, promoting, rolling back, publishing without a shell, recording state in the project's CLAUDE.md, and changing hosting later. Load before running any Manifest command (preview, sync, staging, publish, status) and for plain-language requests like \"put it on the web to review\", \"take it live\", \"roll it back\", \"what's live right now\"."
---

# Manifest workflow: publishing and hosting

The Manifest commands are buttons; plain language works identically. "Put it on
the web to review" = staging, "take it live" / "publish the site" = publish,
"roll it back" = rollback, "pull the latest" = sync, "where are we?" = status.
Pick whichever the user used; both reach the same pipeline.

| Command | Does |
|---|---|
| `/manifest:preview` | Start a local preview. Nothing is published. |
| `/manifest:sync` | Pull teammates' latest changes (git projects). |
| `/manifest:staging` | Put the work on a reviewable staging URL. |
| `/manifest:publish` | Take it live. |
| `/manifest:status` | Plain-English summary of where things stand. |

Command names: from the Manifest plugin they carry the `manifest:` prefix. When
the commands were installed into the project instead (`.claude/commands/`), they
have no prefix (`/publish`). If a command reports "unknown command", neither is
installed; the plain-language request works regardless.

## Project state lives in the project's CLAUDE.md

Logic lives in this skill; per-project **state** lives in a `## Project` block in
the project's `CLAUDE.md`. Read it first if it exists. Fields (all optional; use
the fallback when missing):

```markdown
## Project

- **Hosting:** Manifest managed
- **Staging URL:** https://…
- **Production URL:** https://…
- **Last published:** staging: <deployment_id>, production: <deployment_id>
- **Build command:** npm run build
- **Output dir:** dist
- **Default branch:** staging
- **Live branch:** production
```

- **Hosting**: `Manifest managed`, `Own host via GitHub`, `External (self-managed)`,
  or unset. The source of truth for routing (see below).
- **Build command / Output dir**: only for projects not built on the Manifest
  framework (Manifest projects need no build). `(root)` means the site is served
  from the project root.
- **Default branch / Live branch**: fallbacks `staging` / `production`.

**Create or update it, minimally.** When a publish, hosting change, or build
discovery produces a fact worth keeping and there is no `## Project` block,
append one with only the fields you know. If `CLAUDE.md` doesn't exist, create
it containing just that block. Never rewrite the rest of a user's CLAUDE.md.
Without a filesystem (a chat with no project folder), keep the state in the
conversation and recover it with `manifest_status` and `manifest_deployments`.

## How publishing works: two independent settings

- **Source control**: is the project on GitHub? `git remote get-url origin
  2>/dev/null` answers it. Governs sync and teammates. Local-only is a valid,
  permanent choice.
- **Hosting backend**, recorded in **Hosting**:
  - **Manifest managed**: published to `*.manifestx.ai` (or the user's own
    domain) with `manifest_publish` / `manifest_publish_files` /
    `manifest_promote` / `manifest_rollback`. Zero setup, no GitHub required.
    The default for anyone who just wants their site online.
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
   (a) publish straight to the web on Manifest hosting, instant and no GitHub;
   or (b) save to GitHub for a team workflow (**manifest-github**, then
   **manifest-deploy**). For a solo, non-technical user who just wants it
   online, lead with (a). Record the choice in **Hosting**.

## What kind of project is it?

- **Manifest framework, SPA** (a Manifest `manifest.json`, no `prerender`
  block, no `/website` folder): no build. `source='spa'`, served from the root.
- **Manifest framework, website** (a `prerender` block in `manifest.json`, or a
  `/website` folder): render first with `npx mnfst-render`, then
  `source='render'` (output in `website/`).
- **Any other framework** (React/Vite, Astro, Hugo, Eleventy, plain HTML…):
  keep its framework and conventions; never convert it to Manifest unless the
  user asks. Run its build, then `source='spa'` with `output_dir` set to the
  build folder. Find the build command in `package.json` scripts and the output
  folder from its config (Vite/Astro `dist`, Create React App `build`, Next.js
  static export `out`, Hugo `public`, Eleventy `_site`); record both in
  `## Project`.
- **Needs a server** (SSR, API routes, a Node/Python backend): Manifest hosts
  sites that run in the browser and doesn't run server code. A static export
  may still publish; an existing backend keeps running where it is and the
  published frontend calls it. Say so plainly rather than publishing something
  broken.

## Is there a shell on the user's computer?

- **Yes** (Claude Code in the terminal, IDE, or desktop Code tab; Cowork with
  the project folder): use `manifest_publish`. It returns a one-time `command`;
  run it verbatim from the project root. No API key is needed.
- **No** (Claude chat on the web, desktop, or mobile, including chat's code
  sandbox, and Claude's Free plan): use `manifest_publish_files`. Build in the
  code sandbox if the project needs it, then pass the **final** site files in
  the call: paths relative to the site root, `index.html` at the root, text as
  `utf8`, images and fonts as `base64`. Never include `.env`, keys, tokens, or
  other secrets. Each publish replaces the whole site, so send every file. The
  tool states its own size limits; a site larger than that needs the Code tab
  or Claude Code, where `manifest_publish` uploads the whole build.
- If the `manifest_publish` command can't reach the network or can't be run,
  fall back to `manifest_publish_files`.

## The managed flow

1. **Choose the project.** Use the project this folder pins (its `.mcp.json`),
   or pass `project_id` for the project the user means. If the tool answers
   `needs_project`, follow its `how_to_proceed`; ask by project name only when
   two or more genuinely fit. A new site gets a new project: `manifest_init`
   (see **manifest-setup**), never a publish over an existing one. Name the site
   you're acting on as you do it.
2. **Build** if the project needs it (above). Never publish a broken or stale
   build.
3. **Check before shipping.** If functionality changed, run the
   **manifest-qa** pass. For a Manifest website, run the **manifest-seo**
   pre-publish check on the rendered output. Report issues briefly and offer to
   fix; don't block if the user says ship anyway.
4. **Publish** with `env` = `staging` or `production`. On team projects
   **without git**, pass `based_on` = the matching **Last published** id: if a
   teammate published in between, the tool blocks instead of overwriting.
5. **Record** in `## Project`: `Hosting: Manifest managed`, the env's URL, and
   **Last published** = the returned `deployment_id`.
6. **Report** the URL. After a production publish, confirm it loads.

- **Promote** a reviewed staging build: `manifest_promote` (server-side, no
  rebuild, no upload).
- **Undo** a live publish: `manifest_rollback`.
- **History**: `manifest_deployments`.
- **Custom domains**: `manifest_add_domain` returns the DNS record to add;
  `manifest_domain_status` checks it.

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

- Don't surface internals: no tool names, raw field names, project ids, or
  connector jargon. Translate results into one or two plain sentences.
- Don't narrate tool calls. Lead with the result.
- Refer to a project by its name. If something needs sign-in, say "you'll need
  to sign in" and show the link.
- A signed-in user with no project here is the normal start, not an error;
  offer to create one.
- Retry a single transient failure once, silently.
- If Manifest tools fail repeatedly, it's almost always a lapsed connector
  sign-in, not an outage. Say: "I've lost the connection to Manifest. Please
  reconnect the Manifest connector, then tell me to continue," and wait.

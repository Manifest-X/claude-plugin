# Manifest for Claude

Build, publish, and run websites and apps from a conversation with Claude. This
plugin connects Claude to [Manifest](https://manifestx.dev) and adds skills and
commands for the whole loop: build, publish to a staging link, take it live,
and connect your own domain. Rolling back to earlier versions, exporting them,
and working as a team are part of Manifest Pro.

It works with any project that builds to files a browser can run, such as
React, Vite, Astro, Hugo, or plain HTML. Starting fresh, Claude can build on
the open-source Manifest framework, which is HTML-first with no build step.

## Try it

- "Make me a one-page website for a neighborhood bakery and put it online with Manifest."
- "Build this Vite app and publish it to staging with Manifest." Then `/manifest:publish` to take it live.
- "Connect www.example-bakery.com to my Manifest site."
- `/manifest:status` for a plain-English summary of what's live and what's staged.

## What it installs

- **The Manifest connector**, a remote MCP server at
  `https://mcp.manifestx.dev/mcp`. It provides the publishing, hosting, domain,
  and team tools.
- **Skills** that tell Claude when and how to use those tools, plus authoring
  skills for projects built on the Manifest framework.
- **Commands**: `/manifest:preview`, `/manifest:sync`, `/manifest:staging`,
  `/manifest:publish`, `/manifest:status`. In Claude chat they load as skills,
  so plain language works the same ("put it on the web to review", "take it
  live").
- **Two hooks** (Claude Code and Cowork only) that add guidance in Manifest
  projects. See [Hooks](#hooks).

The skills and commands act only in Manifest projects: a project with a
Manifest `.mcp.json`, Manifest hosting recorded in its `CLAUDE.md`, a Manifest
framework `manifest.json` or `manifest.theme.css`, or when you ask for Manifest
by name. Having the connector installed isn't enough to trigger them.

## Install

- **Claude (web and desktop):** open **Customize > Plugins > Discover**, find
  **Manifest**, and add it. If Discover doesn't show it, open
  **Customize > Plugins > Add > Add marketplace**, enter
  `Manifest-X/claude-plugin`, then add the **Manifest** plugin.
- **Claude Code (terminal):** run `/plugin` and find Manifest in the directory,
  or add this repository as a marketplace:

  ```
  /plugin marketplace add Manifest-X/claude-plugin
  /plugin install manifest@manifest
  ```

## Connect and sign in

- **Claude chat and Cowork:** in **Customize > Plugins > Manifest**, open the
  **Connectors** tab and connect Manifest. A browser sign-in follows; if you
  don't have a Manifest account yet, you can create one there. On Team and
  Enterprise plans, an Owner may need to add the connector for the
  organization first.
- **Claude Code:** run `/mcp`, choose the Manifest server, and authenticate.

Interactive use needs no API key. Ask Claude to "get started with Manifest" and
the `manifest-setup` skill walks through the first publish or first build.

## What Manifest hosts

Manifest hosts projects that run in the browser: static sites and single-page
apps. It does not run server code such as server-side rendering, API routes, or
backends; an existing backend keeps running where it is, and the published site
calls it as before. Native apps are packaged from the same project.

In Claude Code, publishing uploads the project's build from your computer. In
Claude chat, where there is no shell, Claude builds in its code sandbox and
sends the files in the publish call; larger projects need the Code tab in the
Claude desktop app, or Claude Code.

## Skills

Setup and publishing (projects published with Manifest):

- `manifest-setup`: connect, sign in, and make a first publish or first build.
- `manifest-workflow`: how staging, publishing, promotion, and hosting detection work.
- `manifest-deploy`: choose or change hosting, custom domains, and build settings.
- `manifest-github`: put a project on GitHub and bring teammates in.
- `manifest-qa`: drive the site like a user and check it before publishing.
- `manifest-help`: ask the Manifest team to build or finish a project for you.
- `manifest-workspace`: previews for a folder holding several Manifest projects (Claude Code).

Authoring (projects built on the Manifest framework):

- `manifest-framework`: framework primer and authoring rules.
- `manifest-page`: add, rename, or remove pages, including data-driven pages.
- `manifest-layout`: page structure and responsive layouts.
- `manifest-styling`: style individual elements with the framework's classes.
- `manifest-theme`: project-wide colors, fonts, spacing, and dark mode.
- `manifest-component`: reusable components.
- `manifest-data`: CSV, JSON, YAML, and API data sources.
- `manifest-form`: forms, validation, and submission.
- `manifest-assets`: images, icons, favicons, and fonts.
- `manifest-localize`: translations and language switching.
- `manifest-seo`: page titles, share previews, and metadata.
- `manifest-appwrite`: sign-in, cloud data, file storage, and presence with Appwrite.
- `manifest-performance`: fix slow lists, menus, and re-renders.
- `manifest-clone`: rebuild an existing site or section with Manifest.
- `manifest-verify`: compare a build with a reference design and close the gaps.

## Commands

- `/manifest:preview`: start a local preview (in chat, offers a staging link instead).
- `/manifest:sync`: pull teammates' latest changes from GitHub.
- `/manifest:staging`: put your work on a reviewable staging link.
- `/manifest:publish`: take it live.
- `/manifest:status`: a short summary of what's live, staged, and unsaved.

## Hooks

Claude Code and Cowork run two small hooks from `hooks/`. They run locally and
send nothing anywhere. They only add guidance to Claude's context; they never
approve or block anything, so your normal permission prompts still apply.
Outside their scope they exit immediately with no output.

- `ui-guard`, in Manifest framework projects: when a request is clearly about
  UI or styling, reminds Claude to load the design skills first, and notes
  inline `<style>` blocks or `style="..."` attributes written into HTML.
- `git-guard`, in projects whose `CLAUDE.md` records Manifest's shared-branch
  GitHub workflow: when a command creates a git branch or switches to one other
  than the shared ones (`staging`, `production`, or the default and live
  branches recorded in `CLAUDE.md`), reminds Claude to stay on the shared branch
  unless you asked for one.

## What it runs and sends

**Destinations.**

- **The Manifest connector** (`mcp.manifestx.dev`) receives what each Manifest
  action needs: your Manifest account sign-in, project details, and, when you
  publish, the site files. Published sites are served from `*.manifestx.ai` or
  your own domain.
- **The Manifest team** receives a request only when you ask for a person to
  build or finish your project (`manifest-help`): the project summary, what you
  want done, budget and timeline if you give them, and your name and contact
  email. Claude shows you what will be sent and waits for your go-ahead.
- **A teammate's email address** goes to Manifest when you invite them to a
  Manifest project (`manifest_invite`, part of Manifest Pro), so Manifest can
  email them a link to join.
- **npm** serves the Manifest command-line packages below when Claude runs them
  with `npx`.
- **GitHub** is used only if you choose a GitHub workflow (`git`, `gh`).
- **A website you name** is fetched only when you ask Claude to rebuild or take
  inspiration from it (`manifest-clone`).
- **Your own host or Appwrite project**, only if you set one up.

**Commands Claude may run** (in Claude Code or Cowork, subject to your
permission settings):

- `npx mnfst-publish`: the publish command returned by `manifest_publish`.
  Claude runs it only if it has the expected form (an upload address on
  `mcp.manifestx.dev`, then `npx mnfst-publish` with `--env`, `--source`, and
  optionally `--output-dir`). It zips the project's files, leaving out
  git-ignored files and any `.env` file, and uploads them.
- `npx mnfst-starter`: creates a new Manifest project from the starter
  template, in an empty folder (it overwrites same-named files, so Claude asks
  first if the folder isn't empty). With the plugin, Claude runs it as
  `MANIFEST_API_KEY= npx mnfst-starter --here --name "<name>"`, which writes the
  template files and `.gitignore` but no `.env`, `.mcp.json`, or Claude
  settings. Without the plugin, `manifest_init` returns the command, which also
  carries the project's API key and writes `.env`, `.mcp.json`, and
  `.claude/settings.json`; Claude checks it has the expected form before
  running it, as with `mnfst-publish`, and never prints the key.
- `npx mnfst-run`: local preview server.
- `npx mnfst-render`: pre-renders a Manifest website.
- Your project's own build and dev commands (for example `npm run build`).
- `git`, and `gh` (the GitHub CLI) for the GitHub workflow. Claude asks before
  installing `gh`.
- `curl` to fetch a page you asked to rebuild.
- `node`, to run the two hooks.

**Files Claude may write in your project**:

- the site's own files, including the Manifest starter template for a new project;
- a short Manifest project block in `CLAUDE.md` (project id, hosting choice,
  site URLs, last published versions) so later sessions pick up where you left
  off;
- `.gitignore` entries that keep `.env` and other secrets out of git;
- `.claude/launch.json` preview settings in a folder holding several Manifest
  projects, and in each child project's own `.claude/launch.json`
  (`manifest-workspace`);
- `.env` entries: a Manifest API key only if you ask for headless or CI
  publishing (interactive publishing needs no key), and Appwrite settings such
  as a development key if you set up Appwrite (`manifest-appwrite`);
- `.mcp.json`: never with the plugin installed (it already provides the
  connector). When tying an existing folder to a project without the plugin,
  Claude merges in the Manifest entry and keeps your other servers. On a new
  project without the plugin, the starter command writes `.mcp.json`, `.env`,
  and `.claude/settings.json` itself.

The plugin itself stores nothing elsewhere.

- Privacy policy: https://manifestx.dev/legal/privacy
- Terms: https://manifestx.dev/legal/terms

## Links

- Docs: https://manifestx.dev/docs/ai
- Support: team@manifestx.dev
- License: MIT (see `LICENSE`)

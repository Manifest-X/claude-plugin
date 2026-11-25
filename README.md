# Manifest X

Build and publish websites and apps live with your AI assistant, just by asking.

Includes free hosting with your custom domains, preview links to share before
going live, and visitor analytics. Works with frameworks like React, plain
HTML, or the open-source Manifest framework that's optimized for SEO/AEO,
localization, and performance.

What you can ask your assistant to do:

- Build a new site or app and share a preview link
- Publish live to the web or prepare it for app stores
- Connect your own domain, with HTTPS set up automatically
- See how many people visited, which pages they read, and where they came from
- Roll back to an earlier version and invite teammates (Manifest Pro)
- Publish any project that builds to static files: Manifest, React, Vite,
  Astro, plain HTML, and more
- Works in a chat app or a coding agent. Your free Manifest account is
  created the first time you connect.

Manifest Pro also adds all-time analytics and removes the Manifest badge.

## Try it

- "Build a landing page for my product and put it online with Manifest."
- "Build this Vite app and give me a Manifest preview link to share." Then `/manifestx:publish` to take it live.
- "Connect www.example.com to my Manifest site."
- `/manifestx:status` for a plain-English summary of what's live and what's in preview.

## What it installs

- **The Manifest connector**, a remote MCP server at
  `https://mcp.manifestx.dev/mcp`. It provides the publishing, hosting, domain,
  and team tools.
- **Skills** that tell the assistant when and how to use those tools, plus authoring
  skills for projects built on the Manifest framework.
- **Commands**: `/manifestx:preview`, `/manifestx:sync`, `/manifestx:staging`,
  `/manifestx:publish`, `/manifestx:status`. Plain language works the same ("put
  it on the web to review", "take it live").

The skills and commands act only in Manifest projects: a project with a
Manifest `.mcp.json`, Manifest hosting recorded in its instructions file (`CLAUDE.md` or
`AGENTS.md`), a Manifest
framework `manifest.json` or `manifest.theme.css`, or when you ask for Manifest
by name. Having the connector installed isn't enough to trigger them.

## Get started

Interactive use needs no API key. Once the plugin is installed and connected,
ask your assistant to "get started with Manifest" and the `manifest-setup`
skill walks through the first publish or first build.

## In Claude

### Install

- **Claude (web and desktop):** open **Customize > Plugins > Discover**, find
  **Manifest**, and add it. If Discover doesn't show it, open
  **Customize > Plugins > Add > Add marketplace > Add from a repository**,
  paste `https://github.com/Manifest-X/claude-plugin`, then add the
  **Manifest** plugin.
- **Claude Code (terminal):** run `/plugin` and find Manifest in the directory,
  or add this repository as a marketplace:

  ```
  /plugin marketplace add Manifest-X/claude-plugin
  /plugin install manifestx@manifestx
  ```

### Connect and sign in

- **Claude chat and Cowork:** in **Customize > Plugins > Manifest**, open the
  **Connectors** tab and connect Manifest. A browser sign-in follows; if you
  don't have a Manifest account yet, you can create one there. On Team and
  Enterprise plans, an Owner may need to add the connector for the
  organization first.
- **Claude Code:** run `/mcp`, choose the Manifest server, and authenticate.

### Commands and publishing

In Claude chat the commands load as skills. In Claude Code, publishing uploads
the project's build from your computer. In Claude chat, where there is no
shell, Claude builds in its code sandbox and sends the files in the publish
call; larger projects need the Code tab in the Claude desktop app, or Claude
Code.

## What Manifest hosts

Manifest hosts projects that run in the browser: static sites and single-page
apps. It does not run server code such as server-side rendering, API routes, or
backends; an existing backend keeps running where it is, and the published site
calls it as before. Native apps are packaged from the same project.

With a shell on your computer, publishing uploads the project's build from it.
In a chat app with no shell, the assistant builds in its code sandbox and
sends the files in the publish call; larger projects need an agent with a shell
and the project folder.

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
- `manifest-native`: package a project as an iOS or Android app, or a Microsoft Store app via PWABuilder.
- `manifest-appwrite`: sign-in, cloud data, file storage, and presence with Appwrite.
- `manifest-performance`: fix slow lists, menus, and re-renders.
- `manifest-clone`: rebuild an existing site or section with Manifest.
- `manifest-verify`: compare a build with a reference design and close the gaps.

## Commands

- `/manifestx:preview`: start a local preview (in chat, offers a staging link instead).
- `/manifestx:sync`: pull teammates' latest changes from GitHub.
- `/manifestx:staging`: put your work on a reviewable staging link.
- `/manifestx:publish`: take it live.
- `/manifestx:status`: a short summary of what's live, staged, and unsaved.

## What it runs and sends

**Destinations.**

- **The Manifest connector** (`mcp.manifestx.dev`) receives what each Manifest
  action needs: your Manifest account sign-in, project details, and, when you
  publish, the site files. Published sites are served from `*.manifestx.ai` or
  your own domain.
- **The Manifest team** receives a request only when you ask for a person to
  build or finish your project (`manifest-help`): the project summary, what you
  want done, budget and timeline if you give them, and your name and contact
  email. The assistant shows you what will be sent and waits for your go-ahead.
- **A teammate's email address** goes to Manifest when you invite them to a
  Manifest project (`manifest_invite`, part of Manifest Pro), so Manifest can
  email them a link to join.
- **npm** serves the Manifest command-line packages below when the assistant runs them
  with `npx`, and the Capacitor packages if you package a native app.
- **CocoaPods or Swift Package Manager, GitHub, and Gradle repositories** serve
  the iOS and Android dependencies that `cap add` and `cap sync` download when
  you package a native app (`manifest-native`).
- **GitHub** is used only if you choose a GitHub workflow (`git`, `gh`).
- **A website you name** is fetched only when you ask the assistant to rebuild or take
  inspiration from it (`manifest-clone`).
- **Your own host or Appwrite project**, only if you set one up.

**Commands the assistant may run** (where it has a shell on your computer,
subject to your permission settings):

- `npx mnfst-publish`: the publish command returned by `manifest_publish`.
  The assistant runs it only if it has the expected form (an upload address on
  `mcp.manifestx.dev`, then `npx mnfst-publish` with `--env`, `--source`, and
  optionally `--output-dir`). It zips the project's files, leaving out
  git-ignored files, and uploads them.
- `npx mnfst-starter`: creates a new Manifest project from the starter
  template, in an empty folder (it stops if same-named files exist; the assistant
  asks before adding `--force` to replace them). It runs as
  `npx mnfst-starter --here --name "<name>"`, which writes only the template
  files and `.gitignore`.
- `npx mnfst-run`: local preview server.
- `npx mnfst-render`: pre-renders a Manifest website.
- `npm install`, `npx --no-install cap`, and `npx --no-install
  @capacitor/assets` when you package a project as a native app
  (`manifest-native`). The assistant lists the packages and asks before installing
  them, and asks before the assets step replaces existing icons and splash
  screens.
- Your project's own build and dev commands (for example `npm run build`).
- `git`, and `gh` (the GitHub CLI) for the GitHub workflow. The assistant asks before
  installing `gh`.
- `curl` to fetch a page you asked to rebuild, and `curl -sI
  https://<domain>/.well-known/<file>` to check a native app's deep-link files
  on your live domain (`manifest-native`).

**Files the assistant may write in your project**:

- the site's own files, including the Manifest starter template for a new project;
- a short Manifest project block in the instructions file (project id, hosting choice,
  site URLs, last published versions) so later sessions pick up where you left
  off;
- `.gitignore` entries that keep secrets out of git;
- for a native app (`manifest-native`): `capacitor.config.json` (merged into an
  existing one, never overwritten); `package.json` scripts (merged, keeping
  yours), with `package-lock.json` and `node_modules/` from the installs; the
  `ios/` and `android/` projects, including usage-string edits to `Info.plist`
  and permission edits to `AndroidManifest.xml`; generated icons and splash
  screens; `.gitignore` lines (`node_modules/`, `.app-www*`); and
  `.manifestignore` lines that keep the native files off the published site;
- in Claude Code, `.claude/launch.json` preview settings in a folder holding several Manifest
  projects, and in each child project's own `.claude/launch.json`
  (`manifest-workspace`);
- never `.env` or `.mcp.json`: the plugin provides the connector, and
  publishing through it needs no key. Headless or CI publishing is set up by
  you, outside the plugin, with a project key kept in your CI's secret settings:
  https://manifestx.dev/docs/api/reference/authentication.

The plugin itself stores nothing elsewhere.

- Privacy policy: https://manifestx.dev/legal/privacy
- Terms: https://manifestx.dev/legal/terms

## Links

- Docs: https://manifestx.dev/docs/ai
- Support: team@manifestx.dev
- License: MIT (see `LICENSE`)

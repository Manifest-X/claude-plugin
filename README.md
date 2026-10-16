# Manifest for Claude

Build, publish, and run websites and apps from a conversation with Claude. This
plugin connects Claude to [Manifest](https://manifestx.dev) and adds skills and
commands for the whole loop: build, publish to a staging link, take it live,
roll back, and connect your own domain.

It works with any project that builds to files a browser can run, such as
React, Vite, Astro, Hugo, or plain HTML. Starting fresh, Claude can build on
the open-source Manifest framework, which is HTML-first with no build step.

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
- **Two hooks** (Claude Code and Cowork only), active only inside Manifest
  projects. See [Hooks](#hooks).

## Install

- **Claude (web and desktop), Pro, Max, Team, and Enterprise plans:** open
  **Customize > Plugins > Discover**, find **Manifest**, and add it.
- **Claude's Free plan:** open **Customize > Plugins > Add > Add marketplace**,
  enter `Manifest-X/claude-plugin`, then add the **Manifest** plugin.
- **Claude Code (terminal):** run `/plugin` and find Manifest in the directory,
  or add this repository as a marketplace:

  ```
  /plugin marketplace add Manifest-X/claude-plugin
  /plugin install manifest@manifest
  ```

## Connect and sign in

- **Claude chat and Cowork:** in **Customize > Plugins > Manifest**, open the
  **Connectors** tab and connect Manifest. A browser sign-in follows, and it
  creates a Manifest account if you don't have one. On Team and Enterprise
  plans, an Owner may need to add the connector for the organization first.
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

Setup and publishing (any project published with Manifest):

- `manifest-setup`: connect, sign in, and make a first publish or first build.
- `manifest-workflow`: how staging, publishing, promotion, rollback, and hosting detection work.
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

Each skill's description says when it applies, so the authoring skills stay out
of projects that don't use the Manifest framework.

## Commands

- `/manifest:preview`: start a local preview (in chat, offers a staging link instead).
- `/manifest:sync`: pull teammates' latest changes from GitHub.
- `/manifest:staging`: put your work on a reviewable staging link.
- `/manifest:publish`: take it live.
- `/manifest:status`: a short summary of what's live, staged, and unsaved.

## Hooks

Claude Code and Cowork run two small hooks from `hooks/`. Both run locally,
send nothing anywhere, never block an action, and exit silently unless the
current project is a Manifest project:

- `ui-guard`: in Manifest framework projects, reminds Claude to load the design
  skills before UI work and flags inline `<style>` blocks in markup.
- `git-guard`: in Manifest projects, reminds Claude not to create or switch git
  branches unless you asked.

## Data

The plugin itself stores nothing and contacts no service other than the Manifest
connector. When you use Manifest tools, the connector receives what each action
needs: your Manifest account sign-in, project details, and, when you publish,
the site files being published. Claude may also save a short `## Project` block
in your project's `CLAUDE.md` (hosting choice, site URLs, last published
version) so later sessions pick up where you left off.

- Privacy policy: https://manifestx.dev/legal/privacy
- Terms: https://manifestx.dev/legal/terms

## Links

- Docs: https://manifestx.dev/docs/ai
- Support: team@manifestx.dev
- License: MIT (see `LICENSE`)

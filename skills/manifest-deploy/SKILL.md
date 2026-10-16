---
name: manifest-deploy
description: "Only for projects published with Manifest: a .mcp.json pointing at mcp.manifestx.dev, Manifest hosting recorded in the project's CLAUDE.md, a Manifest manifest.json or manifest.theme.css, a Manifest publish earlier in this conversation, or the user naming Manifest. The connector being available is not enough; SKIP otherwise. Use to set up or CHANGE production hosting: Manifest hosting or the user's own host (Appwrite Sites, Netlify, Cloudflare Pages), switching between them, build/output settings, production environment variables, custom domains, or whether a Manifest site is installable as a PWA. Triggers on \"host this on my own Cloudflare/Netlify\", \"move this to GitHub\", \"switch hosting\", \"go back to Manifest hosting\", \"add a custom domain\", \"make this installable as an app\". For everyday publishing use manifest-workflow. SKIP for routine commits and content edits."
---

# Choosing & wiring up production hosting

A project's **Hosting** (recorded in the Manifest project block in `CLAUDE.md`) decides where `/manifest:staging` and `/manifest:publish` send things. This skill covers picking it, *changing* it later, and the one-time host setup — plus related project-shape decisions (PWA install behaviour, custom domains).

**Always set the Hosting field when you finish.** The workflow commands trust it as the source of truth (see the **manifest-workflow** skill → "Detecting the pipeline"). If the project's CLAUDE.md has no Manifest project block yet, create the minimal one that skill describes. The values are `Manifest managed`, `Own host via GitHub`, and `External (self-managed)` (the user deploys by their own means — Manifest builds but doesn't publish; set this when someone explicitly brings their own host/CI that we don't drive).

## Pick a host

The build settings below are for Manifest framework projects. A project built with another framework keeps its own build command and output folder (for example `npm run build` → `dist`); use those wherever a step mentions `mnfst-render` or `website`.

### Manifest managed (the zero-setup default)

For anyone who "just wants it online" — especially solo, non-technical users. No GitHub, no host account, no build config. Publishing is the `manifest_publish` tool (it's what `/manifest:staging` and `/manifest:publish` call in this mode), the site is served at `*.manifestx.ai`, and custom domains are handled in chat via `manifest_add_domain`.
- **To select it:** just publish — say "put it online" or run `/manifest:publish`. After the first publish, record `Hosting: Manifest managed` and the live URL in the Manifest project block (see **manifest-workflow**).
- **Best for:** solo creators, quick launches, demos, anyone without a GitHub/CI workflow.

The own-host options below connect a Git repo so a team can collaborate through branches and the host rebuilds on push. Use them when the project has outgrown solo managed hosting.

> **Own-host options need a GitHub repo.** Set that up first with the **manifest-github** skill (it creates the private repo, the `staging`/`production` branches, and pushes). Come back here once the repo exists. When you finish wiring any own-host provider below, **set `Hosting: Own host via GitHub` in CLAUDE.md** (step 1 of "After wiring up").

### Appwrite Sites (Manifest's default suggestion)

In the Appwrite console:
1. **Sites → Create site → Connect the GitHub repo**
2. Set the production branch to `production`; create a second site connected to the `staging` branch for the staging URL
3. **Important:** Appwrite Sites can't run `npx mnfst-render` itself (Puppeteer dependencies aren't available in the build environment). For website projects, **render locally** with `npx mnfst-render` and commit `/website/` to the deploy branch. Set the site's output directory to `website`. For SPAs, leave build/output blank — Appwrite serves the repo root.
4. Add `.env` variables in **Site Settings → Environment variables**

### Netlify

1. **New site → Import from Git → choose the repo**
2. **Build command:** `npx mnfst-render` (website projects) or blank (SPA)
3. **Publish directory:** `website` (website) or `.` (SPA)
4. Create a second site connected to the `staging` branch for the staging URL
5. Add env vars in **Site settings → Environment variables**

### Cloudflare Pages

1. **Workers & Pages → Create → Connect to Git**
2. Build command and output directory same as Netlify
3. **Production branch:** `production`. Preview deployments are auto-created for non-production branches, so `staging` gets its own URL automatically — no second site needed.
4. Env vars in **Settings → Environment variables**

### Other (GitHub Pages, Vercel)

Work but less natural fit. GitHub Pages can't easily do a separate staging-branch deploy without custom Actions YAML. Vercel is React-oriented though static deploys work fine. Suggest only if the contributor specifically wants them; Cloudflare Pages or Netlify are usually the smoother path for a multi-branch Manifest setup.

## After wiring up

1. **Record hosting in CLAUDE.md.** In the Manifest project block, set `Hosting: Own host via GitHub`, and fill in the Staging URL and Production URL so `/manifest:status`, `/manifest:staging`, and `/manifest:publish` route correctly and can show them. This field is authoritative — the commands obey it over any other signal.
2. **If the host can't run `npx mnfst-render`** (e.g. Appwrite Sites): render locally with `npx mnfst-render`, commit `/website/`, then push. Add a note to the project README so the next contributor knows.
3. **Production env vars.** Anything in your local `.env` that the production deploy needs (Appwrite project IDs for prod, third-party API keys, etc.) must be entered in the host's UI. The repo's `.env` is gitignored and never reaches the host.
4. **Dev keys do not belong in production.** `APPWRITE_DEV_KEY` exists to bypass rate limits in development — production should run without it (or with a properly scoped production key, not the dev key).
5. **Custom domains** are configured at the host (Site Settings → Domains on most providers). Manifest itself doesn't care about the domain. After connecting one, update `manifest.json`'s `live_url` and CLAUDE.md's Production URL.

## Switching hosting later

Hosting isn't permanent — a project can move as it grows. The two common migrations:

### Manifest managed → Own host via GitHub
A solo project on `*.manifestx.ai` matured into a team and wants Git-based collaboration.
1. If not on GitHub yet, run the **manifest-github** skill (private repo + `staging`/`production` branches).
2. Connect a host above (Cloudflare Pages / Netlify / Appwrite Sites) to that repo.
3. **Set `Hosting: Own host via GitHub`** in the Manifest project block and fill in the new Staging/Production URLs. From now on `/manifest:staging` and `/manifest:publish` use the Git flow.
4. **Move the domain, no downtime.** If a custom domain was attached via `manifest_add_domain` (Manifest managed), it points at Manifest's infrastructure. Leave the managed site live, point the domain's DNS at the new host, confirm the new host serves it, then run `manifest_remove_domain` to release it from Manifest. The `*.manifestx.ai` address keeps working until you stop using it — no rush.

### Own host via GitHub → Manifest managed
A team wants the simpler managed flow (or to retire their host account).
1. Just publish: run `/manifest:publish` (or "put it online"). `manifest_publish` uploads the current build and serves it at `*.manifestx.ai`; then record `Hosting: Manifest managed` in the Manifest project block.
2. Re-point any custom domain at Manifest (`manifest_add_domain` returns the exact DNS record) and remove it from the old host.
3. The GitHub repo stays as-is — it's still the source of truth and teammates keep using `/manifest:sync`. Only the *hosting backend* changed.

Either way: **the Hosting field is the switch.** Once you update it, every command and plain-language request follows the new route. Keep the old site serving until the new one is confirmed, so the live URL never breaks mid-migration.

## PWA installability

`manifest.json` is also a [standard Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) — that's where the file's name comes from. By default, Manifest projects are installable as PWAs (browsers will offer "Add to Home Screen" or "Install App") because the starter `manifest.json` contains the standard fields:

- `name`, `short_name`, `description`
- `start_url`, `scope`, `display` (`standalone` makes the installed app launch without browser chrome)
- `background_color`, `theme_color`
- `orientation`
- `icons` array (192×192 and 512×512 minimum for installability)

This is desirable for most projects. But for a marketing site or simple landing page where you don't want install prompts, you can strip these fields from `manifest.json`.

**Two checks before stripping:**

1. **Are any of the fields referenced as data?** Grep for `$x.manifest.` in HTML and components:
   ```
   rg '\$x\.manifest\.' --type=html
   ```
   Starter projects commonly reference `$x.manifest.name` (OG title), `$x.manifest.live_url` (canonical URL, OG URL), and `$x.manifest.author` (meta author). Don't strip a field that's still referenced — either replace those references with hardcoded values or move them to a different data source first.
2. **Are there PWA-related tags in `<head>`?** Look for `<meta name="theme-color">` and the `<link rel="manifest">` line. The `<link rel="manifest">` should stay (Manifest's data plugin needs it to load `manifest.json` as a config file too); the `<meta name="theme-color">` can go if you don't care about the address-bar color.

Even for non-PWA projects, keep `name`, `description`, `start_url`, and `live_url` — they're often referenced by SEO tags, sitemap generation, and Manifest's own auto-detection logic.

## What not to do

- **Don't commit a dev key to git or paste one into the host's production env vars.** Production should use real production credentials — typically a server-scoped key with the actual permissions the production environment needs, not a rate-limit-bypass key.
- **Don't try to make `npx mnfst-render` run on Appwrite Sites.** Render locally, commit `/website/`, deploy.
- **Don't push directly to the live branch to deploy.** Use `/manifest:publish`. Direct pushes bypass the eyeball-staging step and any branch protection.
- **Don't strip PWA fields without grepping for `$x.manifest.` first.** Hidden breakage waiting to happen — the page renders fine in dev, then OG previews go blank in production.
- **Don't manually maintain `sitemap.xml` or `robots.txt`** — `mnfst-render` generates them from routes and `prerender.liveUrl`. Manual edits are overwritten on next render.

## Further reading

If the recipe above doesn't cover the situation, consult:
- Websites publishing (full prerender, sitemap, robots, deployment): https://manifestx.dev/docs/publishing/websites
- Web App Manifest spec (PWA fields): https://developer.mozilla.org/en-US/docs/Web/Manifest

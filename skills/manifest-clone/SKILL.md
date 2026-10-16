---
name: manifest-clone
description: Use when the contributor wants to recreate, clone, rebuild, import, or take inspiration from an existing website, page, section, layout, content, or visual style — and turn it into a Manifest project. Triggers on "rebuild this site in Manifest", "clone example.com", "make something like <url>", "recreate this page/section", "copy this layout", "import my existing site", "grab the styling/theme from this site", "use this as inspiration", "scrape this page and rebuild it", "just the content from", "just the colors/fonts from". Works at any scope (whole site, page, section, content-only, theme-only) and any fidelity (faithful recreation or inspired alternative). SKIP for building from a written brief with no reference site (use manifest-page / the normal build flow).
---

# Recreating an existing site/page in Manifest

This skill turns a reference (a URL, a page, a section, a screenshot, or pasted
HTML) into a Manifest project. It is an **orchestrator**: it figures out *what*
the user wants, *acquires* the source, then *rebuilds* it using the normal
Manifest building blocks (routes, components, data, theme, plugins) — leaning on
the other `manifest-*` skills for the actual construction.

The output is always **Manifest-native** — semantic HTML, components, theme
variables, data sources — never a verbatim dump of someone else's markup. Even a
"faithful" recreation is a clean reinterpretation.

## Step 1 — Read the intent (don't assume one mode)

A clone request varies along three independent axes. Infer them from the
request and the reference; **ask only when genuinely ambiguous** (scope and
fidelity are the two that most change the result — a one-line question is worth
it if unclear). Default to the most common choice in each.

| Axis | Options | Default if unstated |
|---|---|---|
| **Scope** | whole site (every page) · specific page(s) · specific section(s) · content only · styles/theme only | the page they linked; if they linked a root domain and said "the site," whole site |
| **Fidelity** | faithful recreation · inspired alternative | faithful for *their own* site; inspired for a third-party site |
| **Output emphasis** | full build · just structure · just content · just theme | full build |

Also detect, without asking:
- **Is it the user's own site?** (migrating into Manifest) → faithful, keep content, full IP latitude. **Or a third party's?** (inspiration) → default to inspired, replace proprietary content, see IP & ethics below.
- **Repeated page *types*** (many blog posts / products / team members that share a layout) → these become **one template page + a data source**, not N hand-built pages (see mapping).
- **Mobile + desktop** — capture both; rebuild with shared, responsive markup, not two layouts.

State the plan back in one line before building ("I'll faithfully recreate all 6 pages of your site, turning the 12 blog posts into one template driven by a posts data source — sound right?").

## Step 2 — Acquire the source

- **Static / server-rendered pages:** fetch the HTML directly (`curl -sL <url>`, or your web fetch). Grab linked CSS too for the theme pass.
- **JS-rendered SPAs (React/Vue/etc.):** a plain fetch returns an near-empty shell (body is mostly `<script>`). Detect this (little visible text, content injected by JS). To get the real DOM, render it headlessly if a browser tool is available; otherwise **ask the user to paste the rendered HTML (DevTools → Copy outerHTML) or share a screenshot** — you can rebuild faithfully from an image of the layout.
- **Whole site:** discover pages from `/sitemap.xml` first, then `/robots.txt`, then by following on-page nav links. Confirm the page list with the user before mass-building. Note (don't silently cap) if the site is large — offer to do the top N + templates first.
- **Assets (images, fonts, icons):** prefer re-creating with Manifest equivalents (icons → `x-icon` Iconify; fonts → theme font variables; decorative images → the user's own/placeholder). Only download/reuse assets the user owns or that are clearly licensed. Never hotlink someone else's images into production.

## Step 3 — Map the source onto Manifest constructs

This is the core. Translate, don't transcribe. Reach for these in order, and
defer to the named skill for specifics:

- **Pages → routes.** Each page becomes a routed element (`x-route="about"`). The site's nav/IA becomes the route map. → **manifest-page**, router docs.
- **Repeated page *types* → ONE template page + data.** 30 product pages with the same layout = a single `x-route="products/*"` element that renders `$x.products.$route('slug')`, plus a `products` data source. This is the highest-value move — recreate the *pattern*, not every instance. → **manifest-data**, manifest-page (routes/templating).
- **Repeated UI → components.** Cards, nav bars, footers, feature tiles → `components/*.html` used as `<x-name>`, with `$modify('attr')` for per-instance content. Register in `manifest.json`. → **manifest-component**.
- **Dynamic / listed content → data sources with `$x`.** Tabular/repeating content (team, pricing tiers, FAQs, posts) → a local `/data/*.csv|json` (static) or **Appwrite** (cloud, editable, dynamic/auth'd) referenced via `$x.source`. Decide local vs cloud by whether the content needs to change at runtime or per-user. → **manifest-data**, **manifest-appwrite**.
- **Use Manifest's built-ins before bespoke.** Map raw markup to: pre-styled elements (`<button>`, `<input>`, `<dialog popover>`, `<table>`), semantic layout/color classes (`row`, `col`, `content`, `brand`, `ghost`…), `x-icon`, `x-markdown`, `x-tooltip`, `x-tab`, dropdowns/toasts. Don't reproduce a bespoke button when a styled `<button class="brand">` matches. → **manifest-styling**, **manifest-layout**, **manifest-form**.
- **Styles/theme → `manifest.theme.css` variables.** Extract the reference's palette, type scale, spacing, and radii into the semantic theme variables (`--color-brand-*`, `--radius`, fonts). Then everything else inherits — change the variable, not each element. → **manifest-theme**.
- **Per-page metadata → `<template data-head>`.** Carry over (or improve) titles, descriptions, OG/social tags per route. → **manifest-seo**.
- **Forms → Manifest form patterns**; **multi-language → `locales.csv`** (**manifest-localize**); **auth/backed content → Appwrite** (**manifest-appwrite**).

## Scope recipes

- **Whole site, page-for-page:** enumerate pages (Step 2 crawl) → build the route map → collapse repeated page types into templates+data → extract shared chrome (header/footer) into preloaded components → one theme pass. Confirm the page list first.
- **Specific page(s):** rebuild only the named routes; still factor shared UI into components and obvious repetition into data.
- **Specific section(s):** rebuild just the header / hero / pricing table / footer as a component or a block in the right routed element; leave the rest untouched.
- **Content only:** extract the copy/data (ignore their design); drop it into the user's existing Manifest theme/components, or into simple data sources. Good for "I like their words/structure, not their look."
- **Styles/theme only:** do *only* the theme pass — pull colors/fonts/spacing/radii into `manifest.theme.css`; don't touch structure or content. Good for "make my site feel like theirs."

## Fidelity modes

- **Faithful recreation:** match layout, hierarchy, spacing, and palette as closely as Manifest's semantic system allows. Reinterpret into clean Manifest markup, but the result should read as "the same site, rebuilt." Default for the user's *own* site.
- **Inspired alternative:** take the structure/approach/feel and produce something distinct — improved layout, the user's own content, the project's own brand. Default for third-party references. Say what you changed and why.

## IP & ethics (be matter-of-fact, not preachy)

- **Their own site → anything goes.** Migrating/recreating a site the user owns is fully fine, content and all.
- **A third party's site → inspiration, not appropriation.** Reproduce *structure, patterns, and layout ideas* freely; do **not** ship their **copy, images, logos, or brand** as the user's own. Default to replacing proprietary content with the user's, and flag it: "I rebuilt the layout; the text and images are placeholders for yours."
- If a request is clearly "pixel-clone this competitor including their content," surface the concern once, briefly, and offer the inspired-alternative path.

## Verify

- After each meaningful chunk, **preview** and compare to the reference; iterate section by section rather than one big bang.
- For whole-site jobs, confirm the route map and the templates-vs-pages decisions early — that's where the biggest time savings (or mistakes) live.
- Run the **manifest-seo** pre-publish check before going live (carried-over metadata is easy to get wrong).

## What not to do

- **Don't paste the source's raw HTML/CSS into the project.** Always reinterpret into Manifest semantic markup, components, and theme variables.
- **Don't hand-build N near-identical pages** when one template + a data source captures them. Spot the repetition first.
- **Don't reproduce a bespoke widget** when a Manifest pre-styled element or plugin matches — check the styling/layout/form skills first.
- **Don't hotlink or re-publish third-party images, fonts, copy, or branding** as the user's own.
- **Don't silently cap a whole-site crawl** — if it's large, say so and agree on scope.
- **Don't guess intent when it materially changes the output** — one short question on scope/fidelity beats rebuilding the wrong thing.

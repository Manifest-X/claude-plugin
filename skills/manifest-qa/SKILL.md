---
name: manifest-qa
description: "For projects published or hosted with Manifest (the Manifest connector, a Manifest manifest.json, a .mcp.json for mcp.manifestx.dev, or Manifest hosting recorded in CLAUDE.md), or when the user asks for Manifest. SKIP in other projects. Use to verify the project actually works before calling a feature done or publishing it with Manifest: drive the app like a user and check it end to end. Triggers on \"test this\", \"QA it\", \"does it work\", \"verify it\", \"check it before publishing\", \"is it done\", \"make sure nothing's broken\", or proactively after building a feature and before publishing to staging or production. Covers functionality, console/network health, responsive layout, accessibility, and content; hands SEO off to manifest-seo. SKIP for a one-line copy or color tweak with nothing to drive."
---

# Verifying a Manifest project works (QA)

Your users are often non-technical and **can't QA themselves** — so "done" must
mean "I drove it and it works," not "I wrote the code." Use the preview/browser
automation (open the preview, click, fill, screenshot, read console + network)
to exercise the project like a real user, catch problems, fix them, and re-test
— surfacing only working builds, with evidence.

In a project not built on Manifest, run the same pass with that framework's own
routes and dev server, and skip the Manifest-specific checks (`x-route`,
`x-cloak`, `$x` bindings, `/website` output).

This is the **functional/quality** gate. It pairs with two others (don't
duplicate them): **manifest-seo** owns crawlability/metadata, and rendering
(`npx mnfst-render`) owns the prerendered output. Run QA on the running app
(and, for website projects, also spot-check the rendered `/website`).

**Manifest-idiom adherence is NOT enforced here — it's enforced at authoring.**
Whether the markup is idiomatic (no `<style>` blocks, semantic classes over
bespoke CSS, theme tokens, minimal markup) is decided when the UI is written —
`manifest-layout`/`manifest-styling` loaded up front, per the authoring
precondition in **manifest-framework** and the `ui-guard` hook. By QA time the user has likely already
reviewed and approved the look, so treating QA as the place to catch non-idiomatic
code is backwards: you'd be unwinding approved work. If you *do* spot a flagrant
idiom violation here (e.g. a hand-rolled `<style>` block), flag it as a backstop —
but the fix belongs at the start of the funnel, not this end of it.

## When to run

- **During a feature:** build → self-drive → catch → fix → re-test, before you
  report it done. Loop until it's clean.
- **Before publishing:** as part of `/manifest:staging` and `/manifest:publish` (alongside the
  manifest-seo pre-publish check), do a verify pass so nothing broken ships.

## The pass (drive it, don't just read it)

Open the preview (start it with `/manifest:preview` if it isn't running; in a
chat with no shell, publish to staging and check the staging URL instead), then check:

1. **Routes load.** Visit every `x-route` (the main pages). Each renders real
   content — no blank screens, no unstyled flashes that persist, no `x-cloak`
   left visible.
2. **Console + network are clean.** Read the console: **no errors** (warnings,
   judge). Read network: **no failed requests** (404/500 for assets, data
   sources, components). A broken `manifest.json` data path or unregistered
   component shows up here.
3. **Interactions work.** Click the primary actions, submit forms, open
   dropdowns/dialogs/tabs, follow nav links — they do what they should and route
   correctly. Forms validate and show feedback (see manifest-form).
4. **Responsive.** Screenshot mobile and desktop widths. Layout holds — no
   overflow, overlap, cut-off text, or broken grids. Shared markup should reflow,
   not break.
5. **Accessibility (baseline).** Semantic elements (`<button>`, `<nav>`,
   labelled inputs), one `<h1>`, `alt` on images, sufficient contrast, focus
   visible, keyboard-reachable controls.
6. **Content is real.** No leftover lorem/placeholder, no “TODO”, no dead links,
   no broken images, no mismatched data bindings (`$x.…` rendering blank).
7. **Data & state.** Registered data sources actually load and render; persisted
   or dynamic state behaves on reload (and, if Appwrite-backed, when signed in).

For **website (render) projects**, after `npx mnfst-render` also open a couple
of `/website/<route>/index.html` to confirm the static output matches the live
app, then hand metadata to the **manifest-seo** pre-publish check.

## Report like a tester

- Lead with the verdict: **working** or **issues found**.
- For issues: a short, prioritized list — what's broken, where, and the fix —
  then **fix and re-test** rather than handing the user a bug list.
- Attach **screenshots** (mobile + desktop of the key pages) as evidence.
- Describe what you verified in user terms ("signup form submits and shows the
  success toast; pricing page links all resolve"), not as a diff.

## What stays the user's call

You own the **functional/bug loop**. The user owns **experiential judgment** —
does it feel right, is it complete, is the copy on-brand. Surface a working,
screenshotted build and let them judge that part; don't claim taste decisions
are "verified."

## Guardrails

- **Don't report "done" without driving it** — at minimum, routes load + console
  clean + the primary action works.
- **Don't duplicate SEO** — defer titles/descriptions/OG/canonical to
  manifest-seo's pre-publish check.
- **Don't fix by disabling** — if a console error is noisy, find the cause; don't
  silence it.
- **Re-test after fixing.** A fix isn't done until the same drive passes.

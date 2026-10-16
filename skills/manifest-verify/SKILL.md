---
name: manifest-verify
description: "Manifest framework projects only: SKIP unless the project has a Manifest manifest.json (registering components or data) or a manifest.theme.css, or the user asked to build with Manifest. Check a Manifest build against a REFERENCE the user already has, and close the gaps (layout, styling, content), iterating until they match. Runs ONLY when a reference exists: a supplied design (mockup, screenshot, Figma/PDF, or a site to reproduce), a named prior deployment, or an explicit regression check. Triggers on \"does this match the design\", \"compare to the screenshot\", \"make it match <design>\", \"check for regressions\", \"did my change break the layout\", \"compare against the live version\". SKIP for new projects, first builds, and intentional redesigns: with no reference, the USER decides what's correct."
---

# Verifying a build against a reference

This is the **fidelity** check: does the current build match a **reference the
user already has**? It is not a general "is it good?" review — that judgment
belongs to the user. Run it ONLY when a concrete reference exists.

## Scope — when this applies, and when it does NOT

Run this skill only when there is a real reference to match against:

- **A supplied design** — a mockup, screenshot, Figma/PDF export, or an existing
  page or site the build is meant to reproduce.
- **A named prior deployment** — "compare it to what was live before," a specific
  deployment id, or a change that was supposed to leave things looking the same.
- **An explicit regression check** — the user asks whether a change altered
  layout, styling, or content that was already correct.

**Skip it entirely otherwise** — a new project, a first build, or an
**intentional redesign** has no reference. In those cases **the user is the
arbiter of correctness, not you.** Don't invent a standard to grade against,
don't nudge the build toward your own idea of "right," and don't gate delivery on
a fidelity check that has nothing to compare to. Build what they asked for and let
them judge it.

## Method — side by side, then iterate

Don't grade from memory, and don't report back after a single pass. Put the two
in front of you and close the gap:

1. **Get both on screen.** Open the current build in a preview; open the reference
   beside it (the design file, or a prior deployment — see below). Match the same
   route and viewport, and check the breakpoints the design actually cares about
   (mobile and desktop at least).
2. **Diff in three layers, in order:**
   - **Layout** — structure, spacing, alignment, columns/grid, section order,
     what's present vs. missing.
   - **Styling** — colour, type (family/size/weight), radii, borders, shadows,
     interactive states, light and dark.
   - **Content** — copy, headings, labels, images, links, data.
3. **Fix the gaps, then re-check against the reference** — the same side-by-side,
   not from memory. Repeat until the differences that matter are gone.

Report only the real remaining differences (and anything you left on purpose, with
why). "I made a pass" is not the deliverable — matching the reference is.

## Comparing against a prior deployment (regression)

Manifest managed hosting keeps **superseded deployments** — a previous version is
retained and stays available as a reference even after newer publishes. Use it to
answer "did this change break something":

1. `manifest_deployments` — list the versions, each with its `deployment_id`, when
   it was published, and which is currently live. Pick the last-known-good one.
2. `manifest_export` with that `deployment_id` — download that exact version's
   files (it works on the retained superseded deployments, not just the live one).
   Unzip it and open it in its own preview.
3. Put that old build **side by side** with the current one and run the three-layer
   diff above. Fix what regressed, then re-check against it.
4. If the current build is worse and the good version needs to be live again now,
   `manifest_rollback` reverts to a specific `deployment_id`.

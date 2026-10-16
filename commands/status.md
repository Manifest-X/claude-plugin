---
description: "Manifest: plain-English summary of where a project published with Manifest stands: hosting, staging and live URLs, unsaved edits, and what's ready to publish or promote."
---

Give the contributor a quick "where am I?" view. It applies only to Manifest projects (manifest-workflow → "Is this a Manifest project?"; the connector being available is not enough); in any other project, say this command is for Manifest projects and stop. Load the **manifest-workflow** skill for how hosting and source control are detected. Keep it short: no raw git output.

## Steps

1. **Project info** from the Manifest project block in the project's CLAUDE.md, if present: Default branch (fallback `staging`), Live branch (fallback `production`), Staging URL, Production URL, **Hosting**.

2. **Two independent axes** (manifest-workflow → "How publishing works"):
   - **Source control**: `git remote get-url origin 2>/dev/null` → GitHub or local-only. With no shell (Claude chat), skip the git checks.
   - **Hosting**: Manifest managed (Hosting field, a `*.manifestx.ai` URL, or `manifest_deployments` returns rows), own host via GitHub, external, or not published yet. For Manifest hosting, `manifest_deployments` shows which version is live in each environment and when it was published; the staging and live URLs come from the project block (recorded from publish results), and `manifest_domain_status` lists custom domains.

3. **On GitHub**, run in parallel where possible: `git branch --show-current`; `git status --porcelain` (count changed files); `git fetch origin <default> <live>`; `git rev-list --left-right --count <default>...origin/<default>`; `git rev-list --left-right --count origin/<live>...origin/<default>`.

4. **Report** in this shape, with real values, omitting lines that don't apply, under about 12 lines:

```
Storage:           <GitHub (<owner>/<repo>)  |  On your computer only>
Hosting:           <Manifest hosting  |  Own host via GitHub  |  External (self-managed)  |  Not published yet>
Branch:            <current-branch>                ← only on GitHub
Local edits:       <N files unsaved>               ← omit if zero
Your <default>:    <N commits not yet published>   ← only on GitHub, omit if zero
<default> → live:  <N changes ready to promote>    ← only on GitHub, omit if zero

Staging preview:   <staging URL>                   ← omit if none
Live site:         <production URL>                ← omit if none
```

5. **One plain-English next step:**
   - Manifest hosting with unsaved edits: "Run `/manifest:staging` (or say 'put it on the web to review') to update the preview, or `/manifest:publish` to take it live."
   - GitHub with unsaved edits: "Run `/manifest:staging` when you're ready to see these changes on the staging site."
   - GitHub, default ahead of live: "Run `/manifest:publish` when you're ready to take the staging changes live."
   - Behind origin: "Run `/manifest:sync` to pull in the latest from teammates."
   - Not published yet: "Run `/manifest:publish` (or just say 'put it online') whenever you want it live. I can host it right away, or back it up to GitHub first for a team workflow."
   - Everything in sync: "All caught up."

## Guardrails

- If not on the default or live branch, say so prominently; it usually means something went wrong.
- Keep the whole report under about 12 lines.

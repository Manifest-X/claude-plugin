---
description: "Manifest: put the current work on a reviewable staging URL for a project published with Manifest. Publishes to Manifest hosting, or commits and pushes the staging branch when the project uses its own host. Runs end to end once asked."
argument-hint: "[commit message]"
---

You are the "Publish to Staging" button. The contributor wants their work on the staging site. It applies only to Manifest projects (manifest-workflow → "Is this a Manifest project?"; the connector being available is not enough); in any other project, say this command is for Manifest projects and stop. Load the **manifest-workflow** skill: it holds the pipeline logic and the project-state rules this command relies on. Run end to end and report when done. The user's request is the confirmation: don't ask between steps. Staging never changes the live site; if the user actually asked to go live, use `/manifest:publish`. Stop only on errors or the guardrails below.

Optional commit message from the user: $ARGUMENTS (if present, use it verbatim instead of generating one).

## Run

0. **Read state and detect the pipeline** (manifest-workflow → "Detecting the pipeline"). Read the Manifest project block in the project's CLAUDE.md if there is one. Then:
   - **Manifest managed**: a managed publish, not a git push.
     - Build if the project needs it (manifest-workflow → "What kind of project is it?"): nothing for a Manifest SPA (`source='spa'`); for a Manifest website, `source='render'` (the publish command renders it); the project's own **Build command** for another framework (`source='spa'`, `output_dir` = **Output dir**).
     - Run the pre-publish checks (step 4a below). For a Manifest website, render only if you're running the SEO check on fresh output, then append `--no-render` to the publish command.
     - **With a shell**: call `manifest_publish` with `env='staging'`, the `source`, `output_dir` when set, the project, and `based_on` on team projects without git. Check the returned `command` against the expected shape (manifest-workflow → "Check server-returned commands before running them"), then run it from the project root; if it doesn't match, stop and tell the user.
     - **No shell** (Claude chat, Claude's Free plan), or the command can't reach the network: call `manifest_publish_files` with `env='staging'` and the final site files (manifest-workflow → "Is there a shell on the user's computer?").
     - Record `Hosting`, `Staging URL`, and `Last published (staging)` in the Manifest project block (create it if absent, per manifest-workflow). Report the staging URL. **Skip every git step below.** Done.
   - **External (self-managed)**: don't deploy. Say: "This project publishes through your own host, so staging doesn't apply here. I can commit your changes (and sync if you have a repo), or set up Manifest or GitHub hosting if you'd like me to handle publishing." Stop after the user chooses.
   - **Own host via GitHub** (or a git `origin` remote and nothing managed): continue with steps 1–8.
   - **Local-only, nothing published**: offer the choice: "(a) publish it to the web on Manifest hosting, instant with no setup, or (b) save it to GitHub first for a team workflow. For most people (a) is the quick path." If (a): the managed path above. If (b): **manifest-github**, then continue from step 1. If neither, stop politely.

1. **Project info** from the Manifest project block: Default branch (fallback `staging`), Staging URL (may be absent; omit it from the report), project type (Manifest website if `manifest.json` has a `prerender` block or a `/website` folder exists).

2. **Branch check.** `git branch --show-current`. If not on the default branch, stop: "You're on `<branch>`, not `<default>`. Switch to `<default>` first." Switching is for `/manifest:sync`.

3. **Sync if behind.** `git fetch origin <default>`, then `git rev-list --count <default>..origin/<default>`. If > 0: set uncommitted work aside safely (manifest-workflow → "Setting work aside to pull"; never a bare `git stash`), `git pull --rebase origin <default>`, restore it by SHA, and report briefly ("Synced N new commits first."). On any conflict, stop and hand off to `/manifest:sync`.

4. **Pre-render (Manifest website projects only).** Collect changed files (`git diff --name-only HEAD` plus `git ls-files --others --exclude-standard`). Render only if a changed file outside `/website/` is `.html`, `.css`, `.json`, `.yaml`, `.yml`, `.csv`, or `.md`; otherwise skip and say why. To render, run `npx mnfst-render` in the background and stream short progress updates. On error, stop and explain; don't commit.

4a. **Pre-publish checks.** If functionality changed, run the **manifest-qa** pass. For a Manifest website, after rendering, run the **manifest-seo** pre-publish check on `/website`. Report issues as a short list and offer to fix before pushing. Non-blocking: if clean, or the user says ship anyway, continue.

5. **Anything to publish?** `git status --porcelain`. If empty: "Nothing to publish; your local copy matches `<default>`." Stop.

6. **Commit message** (unless $ARGUMENTS given): one concise imperative line about the source change, not the render side effect. Don't ask for approval.

7. **Commit and push.** Stage the changes (never anything that looks like a secret), `git commit -m "<message>"`, `git push origin <default>`.

8. **Report** in one block: "Published to staging." With a staging URL: "Deploying to <url> shortly." Otherwise: "Your host should pick this up shortly." Then the commit message and a brief count of files changed (and, for a website, `/website/` files regenerated).

## Guardrails (these stop the command)

- Not on the default branch.
- `mnfst-render` or the project's build fails: don't commit or publish.
- Staged files that look like secrets (`.env`, `*.key`, `*.pem`, `credentials*`): stop and warn.
- Merge conflict during auto-sync: hand off to `/manifest:sync`.
- Unexpected git state (detached HEAD, merge or rebase in progress, wrong remote): stop and explain.

Everything else is fire-and-forget. The contributor pressed a button; respect that.

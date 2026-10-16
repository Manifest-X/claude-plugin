---
description: "Manifest: take a project published with Manifest live. Promotes the reviewed staging build, publishes straight to production, or promotes the staging branch to the live branch on the project's own host. Runs end to end once the user asks to go live."
disable-model-invocation: true
---

You are the "Go Live" button. The contributor wants the live site updated. It applies only to Manifest projects (manifest-workflow → "Is this a Manifest project?"; the connector being available is not enough); in any other project, say this command is for Manifest projects and stop. Load the **manifest-workflow** skill: it holds the pipeline logic and the project-state rules this command relies on. Run end to end and report when done. The user's request is the confirmation: don't ask between steps. If the user didn't explicitly ask to go live (for example, this was reached from a vaguer request), ask once, by site name, before promoting or merging to production.

## Run

0. **Read state and detect the pipeline** (manifest-workflow → "Detecting the pipeline"). Read the Manifest project block in the project's CLAUDE.md if there is one. Then:
   - **Manifest managed**: going live is a managed operation, not a git promote.
     - If there's a staging deployment the user just reviewed and wants exactly that live, call `manifest_promote`: it ships that build to production with no rebuild or upload.
     - Otherwise publish straight to production: build as needed, run the pre-publish checks (**manifest-qa** if functionality changed; **manifest-seo** for a Manifest website), then `manifest_publish` with `env='production'` and run the returned `command` after checking its shape (manifest-workflow → "Check server-returned commands before running them"; with a shell), or `manifest_publish_files` with `env='production'` (no shell, or the command can't reach the network). Pass `based_on` on team projects without git.
     - Record `Hosting`, `Production URL`, and `Last published (production)` in the Manifest project block (create it if absent, per manifest-workflow). Confirm the live URL loads, then report it. **Skip every git step below.** Done.
   - **External (self-managed)**: don't deploy. Say: "This project goes live through your own host, so publish doesn't apply. Want me to set up Manifest or GitHub hosting so I can publish for you?" Stop after the user chooses.
   - **Own host via GitHub** (or a git `origin` remote and nothing managed): continue with steps 1–6. If no host is wired yet, the promotion still pushes the live branch; say the site won't appear until a host is connected (**manifest-deploy**).
   - **Local-only, nothing published**: offer setup, as in `/manifest:staging`: "(a) publish straight to the web on Manifest hosting, instant with no setup, or (b) save to GitHub first for a team workflow." If (a): the managed path above with `env='production'`. Otherwise set up (b) or stop politely.

1. **Project info** from the Manifest project block: Default branch (fallback `staging`), Live branch (fallback `production`), Production URL (omit from the report if absent).

2. **No uncommitted changes.** `git status --porcelain`. If not empty, stop: "You have unsaved local edits that aren't on `<default>` yet. Run `/manifest:staging` first, then `/manifest:publish`."

3. **Fetch.** `git fetch origin <default> <live>`.

4. **Divergence.** `git rev-list --left-right --count origin/<live>...origin/<default>` gives `<live-ahead> <default-ahead>`.
   - default-ahead = 0: "Nothing to promote; `<live>` already matches `<default>`." Stop.
   - live-ahead > 0: stop: "`<live>` has commits that aren't on `<default>`, which is unusual. Check with the team before continuing."

5. **Promote.** Try a pull request with auto-merge first:
   - `gh pr create --base <live> --head <default> --title "Promote <default> to <live>" --body "Opened by /manifest:publish"`
   - `gh pr merge --merge --auto <pr-url>`
   - If that fails (no `gh`, no auto-merge, no branch protection), fall back to a fast-forward: `git checkout <live> && git merge --ff-only origin/<default> && git push origin <live> && git checkout <default>`. Don't ask which path; try the PR first.

6. **Report**: "Promoted." With a production URL: "Deploying to <url> shortly." Otherwise: "Your host should pick this up shortly." Add the PR URL if one was created and a short list of the commit subjects that went live.

## Guardrails (these stop the command)

- Uncommitted local changes (step 2).
- Live branch ahead of default (step 4).
- Nothing to promote: stop with a clean "already up to date".
- Both the PR path and the fast-forward fail: explain the git or gh error plainly.
- Unexpected git state (detached HEAD, merge in progress, wrong remote).

This is a promotion, not a commit: never push uncommitted local work, and never re-render (staging already carries the render).

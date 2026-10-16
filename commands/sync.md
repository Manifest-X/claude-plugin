---
description: "Manifest: pull the latest changes from teammates on GitHub into a project published with Manifest, safely handling in-progress local work."
---

You are helping a (possibly non-technical) contributor sync their local copy with the latest on the shared branch. It applies only to Manifest projects (manifest-workflow → "Is this a Manifest project?"; the connector being available is not enough); in any other project, say this command is for Manifest projects and stop. Load the **manifest-workflow** skill for the rules. Speak plainly; don't dump raw git output unless something goes wrong.

## No shell (Claude chat)

There's no local copy to sync from a chat. Say so in one sentence. If the user wants to know what's live, `manifest_deployments` shows the published versions.

## Steps

0. **Is the project on GitHub?** `git remote get-url origin 2>/dev/null`. Sync pulls teammates' changes from GitHub; it's independent of where the site is hosted. If there's no repo or no `origin`: "You're working solo on this copy, so there's nothing to sync. Syncing pulls in a teammate's changes, which needs GitHub. Want me to set that up?" If yes, follow **manifest-github**. If no, stop politely; publishing still works without it.

1. **Default branch.** Read **Default branch** from the Manifest project block in the project's CLAUDE.md; fall back to `staging`. A project with its own git conventions (feature branches, pull requests) syncs its current branch instead.

2. **Current branch.** `git branch --show-current`. If it isn't the default branch on a Manifest shared-branch project, say which branch they're on and offer to switch: "You're on `<branch>`, not `<default>`. The team works from `<default>`. Switch now?" If yes, `git checkout <default>` (git refuses on conflict; see step 7).

3. **Uncommitted work.** `git status --porcelain`. If there are changes, say: "You have unsaved edits in N files. I'll set them aside while I pull the latest, then put them back." Then set them aside safely (manifest-workflow → "Setting work aside to pull"): `git stash push -u -m "manifest-sync-<timestamp>"` and note the entry's SHA from `git stash list --format='%H %gs'`. If it reports "No local changes to save", nothing was stashed: skip step 6. Never use a bare `git stash`.

4. **Fetch.** `git fetch origin <default>`.

5. **Compare.** `git rev-list --left-right --count <default>...origin/<default>`:
   - `0 0`: "Already up to date."
   - `N 0` (local ahead): "You have N commits not yet published. Run `/manifest:staging` when ready."
   - `0 N` (remote ahead): `git merge --ff-only origin/<default>`, then summarize: "Pulled N new commits. Files updated: …" (short, from `git diff --stat <default>@{1} <default>`).
   - `M N` (diverged): `git pull --rebase origin <default>`. On success summarize as above; on conflict see step 7.

6. **Restore** your entry with `git stash apply <sha>`; once it applies cleanly, look up its current index by SHA right before dropping (`git stash list --format='%gd %H'`) and `git stash drop stash@{n}`. Clean: "Your edits are back." Conflicts: step 7, and keep the entry until they're resolved.

7. **Conflicts, in plain English.** List the conflicted files. For each, read the `<<<<<<<` / `=======` / `>>>>>>>` markers and explain what changed on each side. Offer: keep yours, take theirs, or combine, and apply the choice. For a clearly trivial combine (additions in different places), propose the merged version and ask to confirm. Never run `git rebase --abort` or `git checkout --theirs/--ours` without first explaining what it means.

8. **Report**: current branch, whether edits were restored, and one line on what was pulled.

## Guardrails

- Never force-push; never discard local edits without an explicit OK.
- Anything unexpected (detached HEAD, wrong remote, merge in progress): stop and explain. No clever recovery.

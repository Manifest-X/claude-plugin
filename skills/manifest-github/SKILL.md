---
name: manifest-github
description: Use for the one-time GitHub bootstrap of a Manifest project, or to bring a teammate onto one — when there is no git remote yet, or the contributor wants to back up, collaborate, or hand the project to someone else. Triggers on "set up GitHub", "back this up", "put this on GitHub", "create a repo", "add a teammate/collaborator", "let X work on this with me", "join/clone the project", "I don't have GitHub / don't know git". This is the source-control bootstrap; once a remote exists, use /sync, /staging, /publish for the everyday flow. SKIP if a GitHub remote already exists and the user only wants to commit or sync.
---

# Setting up GitHub for a Manifest project

Most contributors here are not engineers. GitHub is just where the project's files live so they're backed up and a teammate can work on the same project. Drive the whole thing yourself through the terminal — never make the user type git commands, and keep your messages plain (no raw git/gh output unless something breaks).

Two things are separate and BOTH are needed for a teammate:
- **GitHub** = the project *files* (this skill).
- **Manifest** = the project's *tools, tier, and team* (the `manifest_invite` tool / the dashboard).
When adding someone to a project, do both: add them on GitHub here, and add them to the Manifest project so the build tools work for them.

## Prerequisites (check once, fix silently)

1. **Is `gh` installed?** Run `gh --version`. If not found, install it (`brew install gh` on macOS; otherwise point them to https://cli.github.com). 
2. **Is `gh` signed in?** Run `gh auth status`. If not, run `gh auth login` and tell the user plainly: "A GitHub sign-in will open in your browser — follow it and come back." This is also how someone with **no GitHub account** gets one: the browser flow lets them sign up in about a minute. Wait for it to finish, then continue.

Never print or store tokens. `gh` manages its own credentials.

## Path A — create a repo for this project (no remote yet)

Use when `git remote -v` shows no `origin`.

1. **Make sure work is committed.** If there's no git repo, `git init`. Stage and commit (respect `.gitignore` — never commit `.env`). 
2. **Create a PRIVATE repo and push.** Manifest projects use two branches: `staging` (where work happens) and `production` (what's live).
   - `git branch -M staging`
   - `gh repo create <project-name> --private --source=. --remote=origin --push` (creates the repo, pushes `staging`, sets it as default)
   - `git push origin staging:production` (create the `production` branch from the same commit)
3. **Record it in CLAUDE.md.** In the `## Project` block, set: the repo URL, `Default branch: staging`, `Live branch: production`. This is what `/sync`, `/staging`, and `/publish` read.
4. **Report plainly:** "Your project is now backed up on GitHub (private). You're working on the `staging` branch; `production` is what goes live when you publish."

## Path B — add a teammate to this project (owner side)

1. **You need their GitHub username.** If they don't have a GitHub account, tell the user: "Your teammate needs a free GitHub account — they can sign up at github.com in about a minute, then send you their username." (GitHub adds repo collaborators by username, not email.)
2. **Add them as a collaborator** (push access):
   - `gh api -X PUT "repos/<owner>/<repo>/collaborators/<username>" -f permission=push`
   - This sends them a GitHub invite to accept.
3. **Also add them to the Manifest project** so their build tools/tier work — use the `manifest_invite` tool with their email (that's the Manifest side; the GitHub step above is the files side). Mention both are done.
4. **Tell the teammate what to do next:** accept the GitHub invite, then open Claude in a new folder and say "join my Manifest project" (Path C).

## Path C — join an existing project (teammate side, their machine)

Use when someone was added to a repo and wants to start working.

1. Make sure `gh` is signed in (Prerequisites above).
2. Accept the GitHub invite if not already (`gh api user/repository_invitations` lists pending ones; `gh api -X PATCH user/repository_invitations/<id>` accepts — or just accept it from the GitHub email).
3. **Clone into a fresh folder and open it:** `gh repo clone <owner>/<repo> <folder>`. The committed `.mcp.json` connects the Manifest project automatically; signing in to the Manifest connector (a one-time browser prompt) gives access via team membership — no key needed.
4. **Install the workflow commands.** A fresh clone may not include the slash commands (`/sync`, `/staging`, `/publish`, `/status`, `/preview`) — they live under `.claude/` which often isn't committed. Run `manifest_install_skills` (or just say "install the Manifest commands") so they're available in this folder. Without this, `/publish` & co. report "unknown command."
5. From then on, `/sync` pulls teammates' latest and `/staging` shares your work.

## Guardrails

- **Private by default.** Only make a repo public if the user explicitly asks.
- **Never commit `.env`** or any secret. Confirm it's in `.gitignore` before the first commit.
- **Never force-push** and never discard the user's local edits without an explicit OK.
- **Don't expose tokens** or raw credentials in chat.
- If git/gh hits an unexpected state (wrong remote, detached HEAD, auth failure), stop and explain in plain terms — don't attempt clever recovery.

## After this

- Everyday flow: `/sync` (pull latest), `/staging` (share your work), `/publish` (go live).
- To connect a hosting provider for the live site, use the `manifest-deploy` skill.

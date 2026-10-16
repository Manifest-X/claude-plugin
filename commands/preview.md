---
description: "Manifest: start a local preview of a project built or published with Manifest so the user can see changes live. Nothing is published."
---

You are starting a local preview of the user's project so they can see it while they edit. It applies only to Manifest projects (manifest-workflow → "Is this a Manifest project?"; the connector being available is not enough); in any other project, say this command is for Manifest projects and stop. Run end to end and report when ready. **Do not ask for confirmation.**

## No shell (Claude chat, mobile, Claude's Free plan)

There is no local preview here: nothing can run on the user's computer from this conversation. Say so in one sentence and offer the reviewable alternative: "I can publish it to a private staging link instead, so you can open it in your browser." If they agree, follow `/manifest:staging` (it publishes with `manifest_publish_files`).

## With a shell (Claude Code, Cowork)

1. **Already running?** If the preview panel shows an active server for this folder, report its URL and stop.
2. **Start the server** in the background, from the project root:
   - **Manifest framework project** (a Manifest `manifest.json`): `npx mnfst-run --no-open`. It picks a free port, reuses an existing server for the same folder, and prints the URL. The first run may take a few seconds while `npx` fetches the package.
   - **Another framework**: its own dev command, usually from `package.json` scripts (`npm run dev`, `npm start`, `hugo server`). Don't change its configuration.
3. **Confirm it's up.** Wait briefly for the URL in the output. If the server fails, explain what it printed in plain terms (for example, "the port is taken by another app").
4. **Tell the user** in one sentence: "Open <url> in your browser, or use the preview panel. Edits refresh the page."

## Guardrails

- Leave other running servers and ports alone; never kill a process to free a port.
- If the start command errors, surface the error plainly. Don't retry silently.

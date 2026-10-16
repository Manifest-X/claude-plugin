---
name: manifest-workspace
description: Use when a Claude session is opened at a PARENT folder that contains multiple Manifest project subfolders (e.g. a "Repos" folder holding several sites/apps), and the preview targets the wrong project, refuses to start, or sits on "Awaiting server". Sets up per-project preview so any child can be previewed without port collisions. Triggers on "previewing the wrong project", "it's serving the sibling site", "Awaiting server", "I opened a folder with several Manifest projects", "set up previews for my repos folder", "let me pick which project to preview". SKIP for a single-project session (the project's own .claude/launch.json already works).
---

# Parent-workspace previews (multiple Manifest projects in one folder)

Claude Code's preview is **scoped to the folder the session was opened in**, and
it does NOT auto-discover Manifest projects in child subfolders. So when someone
opens a session at a parent folder holding several Manifest repos, the preview
either guesses one child or stalls. The fix is a **parent `.claude/launch.json`
with one config per child project**, each pointed at its own folder and using a
**dynamic port** so siblings never collide.

Two facts that make this clean:
- Claude Code's launch.json supports **`autoPort: true`** — it finds a free port
  and passes it to the server via the `PORT` env var, then watches that port.
- `mnfst-run` honors `process.env.PORT`. So with `autoPort: true`, the chosen
  free port is bound and watched automatically. **Never hardcode ports.**

## Set it up

1. **Find the child Manifest projects.** List the immediate subfolders of the
   session root; a folder is a Manifest project if it contains a `manifest.json`
   (usually with an `index.html`). Skip `node_modules`, dot-folders, and any
   subfolder without a `manifest.json`.

2. **Write (or merge into) `.claude/launch.json` at the session root** with one
   configuration per child. Use `cwd` to scope each to its folder and
   `autoPort` for the port:

   ```json
   {
     "version": "0.0.1",
     "configurations": [
       { "name": "<child-folder>", "runtimeExecutable": "npx",
         "runtimeArgs": ["mnfst-run", "--no-open"], "cwd": "<child-folder>", "autoPort": true }
     ]
   }
   ```

   - One entry per child, `name` and `cwd` both set to the child folder name.
   - **Include `--no-open`.** Inside Claude Code the preview panel *is* the
     browser; without this flag `mnfst-run` also pops a separate OS browser tab
     on every start. (`mnfst-run` auto-detects Claude Code and suppresses it
     anyway, but the explicit flag guarantees it regardless of env.)
   - **Merge, don't clobber:** if a parent `launch.json` already exists, add the
     missing project configs and leave any non-Manifest entries alone.

3. **Make each child's own config dynamic too.** For every child that has its own
   `.claude/launch.json`, ensure its configuration has `"autoPort": true`. A
   fixed `"port"` is fine as a *preferred* port (autoPort resolves conflicts),
   but if several children share the same hardcoded port, prefer removing it (so
   it defaults) or giving distinct ones — autoPort handles either.
   - **Critical:** if the command passes the port as a CLI flag in `runtimeArgs`
     (e.g. `["serve.mjs", "--port", "5001"]`), **remove that flag** when enabling
     autoPort. Claude provides the chosen free port via the `PORT` env var, and a
     CLI `--port` flag overrides it — so the server binds one port while the panel
     watches another. Keep the port only in the config's `"port"` field (as the
     preferred), not as a runtimeArgs flag.

4. **Tell the user how to pick.** In the preview panel they choose which config
   (project) to run. If the panel won't let them choose among configs, the
   simplest path is to **open the Claude session directly in the child repo** —
   its own `.claude/launch.json` is then unambiguous.

## What not to do

- **Don't hardcode/assign fixed ports to dodge collisions** — that just moves the
  conflict to the next session. Use `autoPort: true` everywhere.
- **Don't kill sibling `mnfst-run` processes** to "free a port" — `mnfst-run`
  runs one server *per directory* on its own auto-picked port; siblings coexist
  fine. A stuck preview is a config/targeting problem, not a process conflict.
- **Don't overwrite an existing parent `launch.json`** — merge.
- **Don't edit a child's project files** to fix the preview — the fix lives in
  launch.json (parent and/or child), not the project.

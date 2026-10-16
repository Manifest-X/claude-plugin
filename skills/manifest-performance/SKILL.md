---
name: manifest-performance
description: "Manifest framework projects only: SKIP unless the project has a Manifest manifest.json (registering components or data) or a manifest.theme.css, or the user asked to build with Manifest. Use when a Manifest project feels slow, laggy, or janky: a menu that takes a second to open, a list that stutters while scrolling, too many re-renders. Triggers on \"it's slow\", \"laggy\", \"janky\", \"the list stutters\", \"optimize\", \"make it faster\", \"big list\", \"hundreds of rows\". Also use proactively before writing an x-for over data of unknown size, or a getter that filters/sorts/maps on every render: reach for x-virtual or x-computed up front. SKIP for server/CDN/hosting speed questions (deploy latency, edge caching, TTFB)."
---

# Performance in Manifest

Most performance work is automatic. Diagnose before you optimize — most "slow" reports are one of the three automatic behaviors below already working correctly, or one missing `x-virtual`/`x-computed`.

## What's automatic — don't fight it

- **Closed containers cost nothing.** A closed `[popover]`, `<dialog>`, `<details>`, `[hidden]` element, or unselected tab panel runs nothing inside it until shown. Its markup is still in the prerendered HTML for SEO.
- **Data updates are per-source, batched, identity-preserving, stale-first.** Only the parts of the page reading a source refresh when it changes. Rows update in place (no flicker, no lost in-progress edits). Cached rows show immediately on reload while fresh data loads (`$x.team.$stale`), and many network updates arriving together apply once per frame.
- **Text bindings only write when the value changes.**

Consequences — do NOT add any of this, it's already handled:
- No `x-if`/`x-show` gate to "avoid rendering" a closed menu, dialog, or details — closed already means inert.
- No manual "loading" flag around a reload — stale-first + `$stale`/`$fresh` already cover it (see `manifest-data`).
- No `x-defer.off` "to be safe" — it forces eager rendering and is almost always wrong. Only use it when a closed container's contents must exist while closed (e.g. something else reads its DOM).

## What to reach for, in order

**1. `x-virtual` — any list that can exceed ~100 rows.** Renders only the visible window regardless of collection size.

```html
<div x-virtual class="h-[400px] overflow-auto">
    <template x-for="row in $x.orders" :key="row.id">
        <div x-text="row.customer"></div>
    </template>
</div>
```

Inside a menu, do NOT put `x-virtual` directly on the `<menu popover>` — it's a flex column with no bounded scroll height and is a known trap. Put an inner scrolling element inside it instead:

```html
<menu popover id="country-menu">
    <div x-virtual class="h-64">
        <template x-for="country in countries" :key="country.id">
            <li x-text="country.name"></li>
        </template>
    </div>
</menu>
```

**2. `x-computed:name="expression"` — any derived list/value that filters, sorts, or maps data.** Recalculates only when its inputs change; without it the expression reruns on every render.

```html
<div x-data="{ q: '' }" x-computed:hits="$x.people.filter(p => p.name.includes(q))">
    <input x-model="q">
    <p x-text="hits.length + ' people'"></p>
</div>
```

In an `Alpine.data` factory, use `$computed`:

```js
Alpine.data('inbox', () => ({
    rows: $computed(s => s.$x.chats.filter(c => c.open)),
}))
```

**3. `x-defer.priority="1"` — the one or two menus people open most.** Moves them to the front of the idle-time warming queue so they open instantly. The modifier is part of the attribute *name*; the number is the value.

```html
<menu popover id="account-menu" x-defer.priority="1">
```

`x-defer="priority:1"` does nothing — that's not how the modifier works.

## When it's still slow

- [ ] A closed menu with `x-defer.off`? Remove it unless its contents must exist while closed.
- [ ] A big `x-for` without `x-virtual`? Wrap it.
- [ ] A getter that filters/sorts on every render? Make it `x-computed`.
- [ ] A ticker rewriting text every second? Tick at the granularity you display.
- [ ] Popover open paying page-wide layout? Add `contain: layout` to large scrollers.
- [ ] Many classic `<script>` tags loading serially? They block the parser one at a time — concatenate at publish.

## Diagnostics

- Console: `window.ManifestDefer.stats()` → `{ pending, warm, cap, ready, armed, head, routes }`.
- CI gate: the framework repo's `scripts/perf/probe.mjs` implements Manifest's blocked-time/settle/mutation-count definitions — one line to wire into a pipeline.

## Never

- Inline `style="..."` as a perf fix — it isn't one, and it's also a styling anti-pattern (see `manifest-styling`).
- `data-defer="off"` globally without a specific reason it's needed — it disables closed-container deferral for the whole page.
- `x-if`/`x-show` wrapped around an already-closed menu/dialog/details "to save render cost" — redundant, the automatic deferral already does this.
- `x-computed` for a trivial expression (`a + b`) — plain inline is fine; save it for work that grows with the data.

## Further reading

- Performance overview, warming, measuring: https://manifestx.dev/docs/getting-started/performance
- Computed values: https://manifestx.dev/docs/core-plugins/computed
- Virtual lists (tables, grids, galleries, masonry): https://manifestx.dev/docs/core-plugins/virtual
- Dropdowns — closed menus, `x-defer.priority`: https://manifestx.dev/docs/elements/dropdowns#closed-menus-cost-nothing

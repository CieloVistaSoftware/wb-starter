# wb-starter compared to Solid.js

Written 2026-08-30, from reading the source rather than from impressions. Every
claim below was checked against the code; the checks are named so they can be
re-run when this drifts.

---

## They are not the same kind of thing

**Solid.js** is a reactive UI framework. You author components, it owns
rendering, and fine-grained signals update precise DOM nodes when state changes.

**wb-starter** is **semantic-elements-first**. The HTML element is the thing:
`<article>` IS a card, `<figure>` IS a figure. Behaviors enhance elements that already
mean something; they never create widgets and never own the tree.

That is the architecture, not a styling preference — and it is the axis Solid does not
have one of. Solid's unit is a component you define; wb-starter's unit is an element the
platform already defines.

**The reason is the learning curve, and it is the sharpest difference between the two.**
John: *"we did this because users will know html5 by default."*

- **Solid** asks an author to learn JSX, `createSignal`, `createEffect`, `createMemo`,
  `createResource`, and an ownership/disposal model. All of it is Solid-specific and none
  of it transfers.
- **wb-starter** asks them to know `<article>`, `<figure>`, `<nav>`, `<details>` — which
  they already do, learned once from the platform, and which does not change between
  projects.

Every other trade-off below follows from that choice. wb-starter gives up **reactive
state** — attributes are read once at init and updates are imperative, so changing a value
in JS re-renders nothing — along with compile-time checking and a single registration path.
What it buys is that the authoring surface is a language its users did not have to learn.

Almost every other difference follows from that one.

---

## Side by side

| | Solid.js | wb-starter |
|---|---|---|
| Authoring unit | JSX component | semantic HTML — `<article>` **is** a card |
| Build step | required (compiles JSX to DOM ops) | **none** |
| Reactivity | fine-grained signals | **none** (see below) |
| Ownership | component owns its subtree | behavior decorates an element it does not own |
| Cleanup | `onCleanup`, ownership graph | behavior returns a teardown closure |
| Client runtime deps | ~7 KB core | 0 — `package.json` deps are all server-side |
| Types | TypeScript-first | JSDoc + JSON Schema |
| Registration | one canonical `import` | six maps (#831) |

---

## The substantive difference: there is no reactivity

`MutationObserver` in `src/core/wb.js` and `src/core/wb-lazy.js` watches for
**new elements**, with `attributeFilter: ['x-behavior']`. So a behavior runs when
an element appears — and that is all.

Change `variant="pills"` to `variant="bordered"` after mount and **nothing
re-runs**. Behaviors expose imperative methods instead — `sticky` publishes
`stick()` / `unstick()`, and that is the shape throughout.

One behavior opts out by hand: `src/wb-viewmodels/navigation.js:333` observes
`data-collapsed` / `data-items` / `data-active` and re-renders itself. It is the
exception that shows the rule — there is no shared machinery to reach for, so a
behavior that wants value reactivity writes its own `MutationObserver`.

This is a deliberate stance, not an oversight, and it is load-bearing.
`a8a7362e` moved card styling from JS-injected classes to CSS attribute
selectors specifically so that state changes are handled by the browser's own
cascade instead of a reactive graph:

```css
[x-tabs][variant="pills"] .x-tabs__tab { … }
```

That updates on attribute change for free. Solid solves the same problem with
signals; wb-starter offloads it to CSS.

**Where the stance stops working** is anything CSS cannot express. Those are the
seams, and they are visible in the source:

- `tabs.js` still writes `display` inline to switch panels — which panel is
  showing is state, and CSS cannot select on it.
- `fix-card.js` needs a `set data(fix)` property and a manual `render()`, because
  a JSON record cannot be passed through an attribute.

Both are the same admission: when state is richer than a string on an element,
the no-reactivity model needs an escape hatch.

---

## What each is better at

**wb-starter**

- **Zero build.** No toolchain, no compile step, no bundler config.
- **Works before JS runs.** The HTML is the content; behaviors enhance it. A
  failed script degrades rather than blanks the page.
- **Schema-first pipeline.** One `*.schema.json` drives docs, VS Code
  IntelliSense, and tests together. Neither Solid nor its ecosystem has an
  equivalent — this is the genuinely unusual idea in the project.

**Solid.js**

- **State management.** wb-starter's answer is "put it in an attribute", which
  runs out at objects, lists, and anything asynchronous.
- **Compile-time errors.** A typo in a Solid component fails the build. Here it
  fails silently at runtime — `variant="pills"` with no matching CSS rule renders
  nothing and reports nothing, which is exactly how #902 and #903 stayed hidden.
- **One canonical registration.** The six registries in #831 produce a class of
  bug Solid's model cannot have: while writing this, `x-pagination` looked
  unregistered because it is bound in `wb-lazy.js` rather than `tag-map.js`.

---

## The closer comparison

Solid is the wrong yardstick. wb-starter is much nearer to **Alpine.js** or
**HTMX** — enhance-existing-HTML libraries with no build step and no VDOM — with
a schema/docs/IntelliSense pipeline neither of those has.

Comparing it to Solid mostly measures the absence of a reactivity system that
the project deliberately chose not to build.

---

## How this was checked

| Claim | Check |
|---|---|
| No reactive primitives | grep for `createSignal`/`createEffect`/`observable` in `src/core` — no reactivity layer |
| Attributes do not re-trigger | `attributeFilter: ['x-behavior']` (`wb-lazy.js:781`, `wb.js:1008`) |
| No client runtime deps | `package.json` deps are express/compression/ws/marked/highlight.js — all server-side |
| CSS carries variant state | `[x-tabs][variant="pills"]` in `src/styles/behaviors/tabs.css` |
| Inline style is the escape hatch | `tabs.js` `panelWrapper.style.display`; `fix-card.js` `set data()` |
| Six registries | #831 |

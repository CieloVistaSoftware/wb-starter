# wb-starter v3 — Complete Guide

wb-starter is a **zero-build, light-DOM behavior framework**. You write plain
HTML, include one script, and elements upgrade themselves into rich behaviors.
No bundler, no JSX, no Shadow DOM — the browser does the work.

This guide covers **how to use it** and **how it works internally**.

## Contents

1. [Mental model](#1-mental-model)
2. [Quick start](#2-quick-start)
3. [Using behaviors (semantic elements)](#3-using-behaviors-semantic-elements)
4. [Using behaviors (x-prefixed attributes)](#4-using-behaviors-x-prefixed-attributes)
5. [Auto-enhanced plain elements](#5-auto-enhanced-plain-elements)
6. [Theming](#6-theming)
7. [How it works internally](#7-how-it-works-internally)
8. [Render from JSON](#8-render-from-json)
9. [Writing your own behavior (recipe)](#9-writing-your-own-behavior-recipe)

---

## 1. Mental model

There are three ways UI gets enhanced, all by the same runtime:

| You write | What happens |
|---|---|
| **Semantic element** — `<article title="Hi">` | A native element is mapped to its *behavior* (`<article>` → card, `<nav>` → navbar, `<progress>`, `<table>`, …) |
| **Behavior attribute** — `<button x-toast toast-variant="success">` | Any element gains a behavior via an `x-*` attribute |
| **Plain form control** — `<input type="text">` | Native controls are enhanced too, with no attribute at all |

There are no custom tags. The old component tags were removed; every one
became either the semantic element that already maps to it or a host carrying
the `x-*` attribute (`src/core/tag-map.js`, `elementMap` is empty on purpose).

A **behavior** is just a function that receives an element and decorates it.
A **schema** (optional) describes a behavior's attributes and, for some
behaviors, its structure. The **runtime** (`WB`) scans the DOM, maps
elements/attributes to behaviors, and applies them.

Key principles:
- **No build step.** Ship HTML + JS; browsers are fast.
- **Light DOM only.** No Shadow DOM — styles and scripts compose normally.
- **Plain attributes.** v3 reads `title`, `variant`, `size` directly (not `data-*`).
  Many behaviors still accept `data-*` for back-compat, but **plain is canonical**.

---

## 2. Quick start

A standalone page needs the theme + base styles and one module script:

<div x-demo>
<article
  title="Build resilient interfaces"
  subtitle="Separate structure from behavior"
  variant="elevated"
  size="md"
  footer="Start with semantic HTML, then compose focused behaviors.">
  <p>Keep content readable and focused by giving each card one clear job.</p>
  <p>WB-Starter applies behavior directly to the element, so the markup stays easy to inspect and reuse.</p>
</article>
</div>

<div x-demo>
<button
  x-toast
  message="Saved!"
  toast-variant="success">
  Save
</button>
</div>

The full page this comes from — everything outside `<body>` is boilerplate
`<div x-demo>` can't represent (a `<!DOCTYPE>`/`<head>`/module script aren't
renderable fragments), so it's shown separately below rather than folded
into the live example above:

```html-static
<!DOCTYPE html>
<html
  lang="en"
  data-theme="dark">

  <head>
    <meta charset="UTF-8">
    <link
      rel="stylesheet"
      href="src/styles/themes.css">
    <link
      rel="stylesheet"
      href="src/styles/site.css">
  </head>

  <body>
    <article
      title="Build resilient interfaces"
      subtitle="Separate structure from behavior"
      variant="elevated">
      <p> Keep content readable and focused by giving each card one clear
      job.</p>
      <p> WB-Starter applies behavior directly to the element, so the markup
      stays easy to inspect and reuse.</p>
      <p>Start with semantic HTML, then compose focused behaviors.</p>
    </article>
    <button
      x-toast
      message="Saved!"
      toast-variant="success">
      Save
    </button>
    <script type="module">
      import WB from '/src/core/wb-lazy.js';
      window.WB = WB;
      await WB.init();
    </script>
  </body>

</html>
```

The toast's colour comes from `toast-variant` (or `variant`), not `type`: on a
`<button>`, `type` is the button's own attribute.

`WB.init(options)`:
- `scan` (default `true`) — process existing elements on load.
- `observe` (default `true`) — watch for elements added later (MutationObserver).
- `autoInject` (default **`true`**) — enhance semantic and native elements (`<article>`, `<input>`, `<table>`, `<nav>`, …) with no attribute. Pass `false` to opt a page out.
- `preload: ['ripple','tooltip']` — eagerly load critical behaviors.
- `theme: 'dark'` — set the starting theme.
- `debug: true` — verbose logging.
- `onSettled: () => …` — called once the first build has finished.

To wait for building to finish, use the readiness API both runtimes share
instead of guessing with a timeout: `await WB.settled()` (every unit of work has
called back; also fires a `wb:settled` event), `await WB.whenIdle({ timeout })`
(nothing in flight for a quiet period; rejects on timeout), or
`WB.isReady(element)` for one element. "Ready" means *settled*, not
*succeeded*: a behavior that failed is finished too, and is marked `x-error`.

(Inside the full SPA the runtime is wired by `src/main.js` + `src/core/site-engine.js`, so pages loaded via `?page=…` don't need their own init.)

---

## 3. Using behaviors (semantic elements)

A semantic element maps to its behavior, and any other element takes the `x-*` attribute. Pass **plain attributes**; children stay as content.

**Card** — `<article>`:

<div x-demo>
<article
  title="Pro"
  variant="glass">
  <p>Card body.</p>
</article>
</div>

**Spinner** — `<div x-spinner>`:

<div x-demo>
<div x-spinner
  size="lg"
  variant="success">
</div>
</div>

**Progress bar** — `<progress>`:

<div x-demo>
<progress
  value="75"
  striped>
</progress>
</div>

**Badge** — `<span x-badge>`:

<div x-demo>
<span x-badge
  variant="success"
  pill>
  New
</span>
</div>

**Tabs** — `<nav x-tabs>`:

<div x-demo>
<nav x-tabs>
  <div tab-title="Overview">
    <p>…</p>
  </div>
  <div tab-title="Install">
    <p>…</p>
  </div>
</nav>
</div>

**Accordion** — `<div x-accordion>`:

<div x-demo>
<div x-accordion title="What is wb-starter?">
  <p>A zero-build behavior library.</p>
</div>
</div>

Card variants come from the schema (`default`, `glass`, `elevated`, `float`, …).
Each behavior's exact attributes live in its schema at `src/wb-models/<name>.schema.json`.

---

## 4. Using behaviors (x-prefixed attributes)

Attach a behavior to **any** element with an `x-<name>` attribute. These don't
need a custom tag:

<div x-demo>
<!-- feedback -->
<button
  x-toast
  message="Done"
  toast-variant="success">
  Notify
</button>
<!-- navigation -->
<nav
  x-breadcrumb
  items="Home,Products,Phones">
</nav>
<div
  x-steps
  items="Cart,Shipping,Pay"
  current="2">
</div>
<!-- effects (entrance / attention) -->
<button
  x-slidein
  direction="left">
  Slide
</button>
<button x-bounce>Bounce</button>
<!-- forms -->
<input
  type="password"
  placeholder="Password with toggle">
</div>

**Every registered behavior is reachable as `x-<name>`** (#1642). Names live in
`src/wb-viewmodels/index.js`, which maps each one to its module file; the extra
aliases (`x-progress`, `x-details`, …) are in `src/core/tag-map.js`
(`extensionMap`). The old generic form `x-behavior="name"` is deprecated: it
still runs, and warns once with the `x-<name>` attribute to write instead.

On `wb-lazy.js`, an `x-*` attribute that names no behavior is reported in the
error log and the element is marked `x-unknown-behavior="<name>"`, so a typo
like `x-carfile` does not fail silently.

---

## 5. Auto-enhanced plain elements

Semantic and native elements are upgraded without any attribute — `autoInject`
is **on by default** (since 2026-08-15: "semantic HTML at all times"). The map is
`nativeMap` in `src/core/tag-map.js`, including:

| Element | Behavior |
|---|---|
| `<article>` | card |
| `<nav>` | navbar (a plain `<nav>` gets the link look; `brand`/`items`/`sticky` make it a site header) |
| `<input>`, `<select>`, `<textarea>`, `<button>`, `<form>`, `<fieldset>`, `<label>` | form controls |
| `<table>`, `<details>`, `<dialog>`, `<progress>`, `<header>`, `<footer>` | structure |
| `<img>`, `<video>`, `<audio>`, `<figure>` | media |
| `<code>`, `<pre>`, `<kbd>`, `<mark>` | text |

To keep a page or a subtree untouched, call `WB.init({ autoInject: false })`, or
put `x-ignore` on an element.

---

## 6. Theming

Themes are pure CSS variables in `src/styles/themes.css`, selected by the
`data-theme` attribute on `<html>`:

```html
<html data-theme="dark"> <!-- or "light", "golden", "neon-dreams", … -->
```

Switch at runtime with the `Theme` API (`src/core/theme.js`) or drop in a
`<div x-themecontrol>` for a ready-made selector. **Never hardcode colors** — only
`themes.css` holds literals; everything else references `var(--…)` tokens.

---

## 7. How it works internally

### Two runtimes — `WB`

There are two implementations of the same contract:

| File | Used by | How it applies behaviors |
|---|---|---|
| `src/core/wb.js` | the main site (`src/main.js`, `site-engine.js`) | **eagerly**, with schema support |
| `src/core/wb-lazy.js` | standalone pages, the doc viewer, the test harness | **lazily**, as elements near the viewport |

A change to injection logic belongs in both, or in the module they share
(`src/core/runtime-shared.js`). Both expose:

```js
WB.init(options)              // boot: scan + observe + preload
WB.inject(el, name, opts)     // apply a behavior now (async; loads it on demand)
WB.remove(el, name?)          // run a behavior's cleanup and take it off
WB.scan(root = document.body) // find & apply behaviors under root
WB.observe(root)              // MutationObserver for dynamically-added elements
WB.has(name) / WB.list()      // registry introspection
WB.settled() / WB.whenIdle()  // wait for building to finish
WB.isReady(el)                // has this element finished building?
```

`wb-lazy.js` adds `WB.lazyInject(el, name)` (apply when the element nears the
viewport), `WB.preload(names)` and `WB.render(json, container)` (§8).

### The lifecycle of one element

1. **Map.** `scan()` matches each element against the mappings built from
   `src/core/tag-map.js` (`<article>` → `card`, `[x-toast]` → `toast`, …), the
   native map (`autoInject` is on by default), and every registered behavior's
   `x-<name>` attribute.
2. **Schedule.** `wb.js` applies matches straight away. `wb-lazy.js` hands them
   to `lazyInject()`, which observes the element with an `IntersectionObserver`
   (1200px root margin, so it is built before it scrolls into view, #491).
3. **Resolve.** `inject()` calls `getBehavior(name)`, which looks up the module
   in `src/wb-viewmodels/index.js` and dynamically imports it (cached after
   first load).
4. **Apply.** The behavior function runs: `behaviorFn(element, options)`. It
   mutates the element (adds classes, builds children, wires events) and returns
   a **cleanup** function. Failures mark the element `x-error` instead of throwing.
5. **Observe.** A MutationObserver repeats steps 1–4 for elements added later.

### Behaviors — `src/wb-viewmodels/`

A behavior is a plain function. The contract, shown with a shortened version of
the real `toast` in `src/wb-viewmodels/feedback.js`:

```js
export function toast(element, options = {}) {
  // Read at click time, not bind time, so a framework that re-renders the
  // attributes is always seen with its current values (#458).
  const show = () => {
    const message = options.message || element.getAttribute('message') || 'Notification';
    const variant = options.variant || element.getAttribute('toast-variant')
      || element.getAttribute('variant') || 'info';
    createToast(message, variant);
  };
  element.addEventListener('click', show);
  return () => element.removeEventListener('click', show); // cleanup
}
```

Attributes are read with plain names. Shared helpers in `src/core/read-attr.js`
also accept the camelCase and `data-*` spellings (`showClose`, `show-close`,
`data-show-close`), so older markup keeps working.

`src/wb-viewmodels/index.js` maps every **behavior name → module file**
(e.g. `card`, `cardhero`, `cardimage` all resolve to `card.js`). Registering the
name there is all it takes for `x-<name>` to work.

### Schemas — `src/wb-models/*.schema.json`

Most behaviors have a `*.schema.json` declaring their attributes, variants and
`test.setup` examples; the Behaviors page, the API panel and the compliance
tests all read them. A schema may also declare a `$view` (DOM structure), which
the **schema builder** (`src/core/mvvm/schema-builder.js`, schemas listed in
`src/wb-models/index.json`) builds before the behavior runs. Processed elements
are marked `x-schema="<name>"`.

A behavior's DOM is built by **either** its schema **or** its behavior, never
both — running both is a race in which the last one wipes the other's work. The
card is behavior-built: `card.schema.json` has an empty `$view` on purpose
(#202), and `card.js` builds the header/body/footer. A behavior that builds its
own structure is listed in `SCHEMA_EXCLUDED_TAGS` so the schema pass leaves it
alone. The generic `x-behavior=`
form is deprecated (#1642): it still runs, and warns once per spelling with the
`x-{name}` attribute to write instead.

### File map

```
src/
  main.js               ← the site's entry point (wb.js + site-engine.js)
  core/
    wb.js               ← eager runtime, used by the site
    wb-lazy.js          ← lazy runtime, used by standalone pages
    runtime-shared.js   ← logic both runtimes share
    tag-map.js          ← native element / x- attribute → behavior maps
    config.js           ← runtime config (autoInject defaults to true)
    read-attr.js        ← plain / camelCase / data-* attribute reading
    theme.js            ← theme switching
    mvvm/schema-builder.js  ← schema → DOM
  wb-viewmodels/        ← behaviors (one concern per file)
    index.js            ← behavior name → module registry
    feedback.js, card.js, navigation.js, effects.js, …
  wb-models/            ← *.schema.json behavior definitions (+ index.json)
  styles/
    themes.css          ← theme tokens (the ONLY place with color literals)
    site.css, behaviors/<name>.css
```

---

## 8. Render from JSON

For dynamic UIs, build elements from a definition instead of HTML. This is
`wb-lazy.js` only; the site's eager runtime has no `render()`.

```js
WB.render({
  b: 'card',
  d: { title: 'Generated' },
  children: [{ t: 'p', content: 'Built from JSON.' }],
}, document.body);
```

That builds a `<div x-card>` holding the paragraph, and the card behavior turns
it into a card titled "Generated". The fields:

| Field | Meaning |
|---|---|
| `t` | tag name (default `div`); `t: 'article'` builds a card with no `b` at all |
| `b` | behavior name → an `x-<b>` attribute |
| `behaviors` | more behavior names, each its own `x-<name>` |
| `d` | the behavior's attributes, e.g. `{ title: 'Generated' }` |
| `id`, `classes` | the element's id and class |
| `content` / `html` | text content, or HTML |
| `children` | nested definitions |

An array renders each item in order.

---

## 9. Writing your own behavior (recipe)

1. **Create** `src/wb-viewmodels/my-thing.js`:
   ```js
   export function mything(element, options = {}) {
     element.classList.add('x-mything');
     // build children / wire events using plain attributes
     return () => element.classList.remove('x-mything'); // cleanup
   }
   ```
2. **Register** the name in `src/wb-viewmodels/index.js`:
   `mything: 'my-thing',`
   `<div x-mything>` now works in both runtimes (#1642); no selector to add.
3. **(Only if a semantic element should get it automatically)** map that element
   in `nativeMap` in `src/core/tag-map.js`, e.g. `'meter': 'mything'`.
4. **Style** it in `src/styles/behaviors/mything.css` using theme tokens only.
5. **Describe** it in `src/wb-models/mything.schema.json` (attributes,
   variants, `test.setup`), so the Behaviors page and the compliance tests know
   it. Leave `$view` empty if the behavior builds its own DOM.

That's the whole loop — no build, no registration boilerplate beyond those maps.

---

## See also

- Per-behavior reference: `docs/behaviors/…` and each `src/wb-models/*.schema.json`.
- Behaviors reference: `docs/behaviors-reference.md`.
- The `?page=behaviors` showcase exercises every behavior with copy-ready markup.

> Note: `docs/NOTES-V3-GUIDE.md` is **release notes for the Notes drawer behavior's
> TODO feature** — not this framework guide. (It's mislabeled.)

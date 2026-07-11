# wb-starter v3 — Complete Guide

wb-starter is a **zero-build, light-DOM web component framework**. You write plain
HTML, include one script, and elements upgrade themselves into rich components.
No bundler, no JSX, no Shadow DOM — the browser does the work.

This guide covers **how to use it** and **how it works internally**.

---

## 1. Mental model

There are three ways UI gets enhanced, all by the same runtime:

| You write | What happens |
|---|---|
| **Custom tag** — `<wb-card title="Hi">` | The tag is mapped to a *behavior* that builds the card |
| **Behavior attribute** — `<button x-toast type="success">` | Any element gains a behavior via an `x-*` attribute |
| **Plain element** — `<input type="text">` (with `autoInject`) | Native elements are auto-enhanced |

A **behavior** is just a function that receives an element and decorates it.
A **schema** (optional) describes a component's structure declaratively. The
**runtime** (`WB`) scans the DOM, maps tags/attributes to behaviors, and injects
them lazily as they scroll into view.

Key principles:
- **No build step.** Ship HTML + JS; browsers are fast.
- **Light DOM only.** No Shadow DOM — styles and scripts compose normally.
- **Plain attributes.** v3 reads `title`, `variant`, `size` directly (not `data-*`).
  Many behaviors still accept `data-*` for back-compat, but **plain is canonical**.

---

## 2. Quick start

A standalone page needs the theme + base styles and one module script:

```html
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
    <wb-card
      title="Hello"
      variant="elevated">
      <p>It just works.</p>
    </wb-card>
    <button
      x-toast
      message="Saved!"
      type="success">
      Save
    </button>
    <script type="module">
      import WB from '/src/core/wb-lazy.js';
      window.WB = WB;
      await WB.init({
        autoInject: true
      });
    </script>
  </body>

</html>
```

`WB.init(options)`:
- `scan` (default `true`) — process existing elements on load.
- `observe` (default `true`) — watch for elements added later (MutationObserver).
- `autoInject` (default `false`) — also enhance plain native elements (`<input>`, `<button>`, `<article>`, …).
- `preload: ['ripple','tooltip']` — eagerly load critical behaviors.
- `theme: 'dark'` — set the starting theme.

(Inside the full SPA the runtime is wired by `src/main.js` + `src/core/site-engine.js`, so pages loaded via `?page=…` don't need their own init.)

---

## 3. Using components (custom tags)

Custom `wb-*` tags map to behaviors. Pass **plain attributes**; children are slotted as content.

<wb-demo>
<wb-card
  title="Pro"
  variant="glass">
  <p>Card body.</p>
</wb-card>
<wb-spinner
  size="lg"
  color="success">
</wb-spinner>
<wb-progress
  value="75"
  striped>
</wb-progress>
<wb-badge
  variant="success"
  pill>
  New
</wb-badge>
<wb-tabs>
  <div tab-title="Overview">
    <p>…</p>
  </div>
  <div tab-title="Install">
    <p>…</p>
  </div>
</wb-tabs>
<wb-accordion title="What is wb-starter?">
  <p>A zero-build component library.</p>
</wb-accordion>
</wb-demo>

Card variants come from the schema (`default`, `glass`, `elevated`, `float`, …).
Each component's exact attributes live in its schema at `src/wb-models/<name>.schema.json`.

---

## 4. Using behaviors (x-* attributes)

Attach a behavior to **any** element with an `x-<name>` attribute. These don't
need a custom tag:

<wb-demo>
<!-- feedback -->
<button
  x-toast
  message="Done"
  type="success">
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
  x-password
  placeholder="Password with toggle">
</wb-demo>

The full attribute → behavior map is in `src/core/wb-lazy.js`
(`customElementMappings`). Every behavior name resolves to a module via
`src/wb-viewmodels/index.js`.

---

## 5. Auto-enhanced plain elements

With `autoInject: true`, native elements are upgraded without any attribute —
e.g. `<input>`, `<select>`, `<textarea>`, `<button>`, `<table>`, `<details>`, and
`<article>` (→ card). The map lives in `wb-lazy.js` (`autoInjectMappings`) /
`src/core/tag-map.js` (`nativeMap`). Auto-inject is **off by default** so it never
surprises an existing page; opt in per page.

---

## 6. Theming

Themes are pure CSS variables in `src/styles/themes.css`, selected by the
`data-theme` attribute on `<html>`:

```html
<html data-theme="dark"> <!-- or "light", "golden", "neon-dreams", … -->
```

Switch at runtime with the `Theme` API (`src/core/theme.js`) or drop in a
`<wb-themecontrol>` for a ready-made selector. **Never hardcode colors** — only
`themes.css` holds literals; everything else references `var(--…)` tokens.

---

## 7. How it works internally

### The runtime — `WB` (`src/core/wb-lazy.js`)

A single object exposes:

```js
WB.init(options)              // boot: scan + observe + preload
WB.inject(el, name, opts)     // apply a behavior now (async; loads it on demand)
WB.lazyInject(el, name)       // apply when the element scrolls into view
WB.scan(root = document.body) // find & schedule behaviors under root
WB.observe(root)              // MutationObserver for dynamically-added elements
WB.has(name) / WB.list()      // registry introspection
WB.render(json, container)    // build DOM from a JSON component definition
```

### The lifecycle of one element

1. **Map.** `scan()` matches each element against `customElementMappings`
   (`wb-card` → `card`, `[x-toast]` → `toast`, …) and, if `autoInject`, against
   the native map.
2. **Schedule.** Matches are handed to `lazyInject()`, which observes the element
   with an `IntersectionObserver` (200px root margin) — behaviors load only when
   needed.
3. **Resolve.** On first view, `inject()` calls `getBehavior(name)`, which looks
   up the module in `src/wb-viewmodels/index.js` and dynamically imports it
   (cached after first load).
4. **Apply.** The behavior function runs: `behaviorFn(element, options)`. It
   mutates the element (adds classes, builds children, wires events) and returns
   a **cleanup** function. Failures mark the element `x-error` instead of throwing.
5. **Observe.** A MutationObserver repeats steps 1–4 for elements added later.

### Behaviors — `src/wb-viewmodels/`

A behavior is a plain function. The contract:

```js
// src/wb-viewmodels/feedback.js
export function toast(element, options = {}) {
  const message = options.message
    || element.getAttribute('message')
    || element.getAttribute('message') || 'Notification';
  const variant = options.variant
    || element.getAttribute('type') || 'info';

  const show = () => createToast(message, variant);
  element.addEventListener('click', show);
  return () => element.removeEventListener('click', show); // cleanup
}
```

`src/wb-viewmodels/index.js` maps every **behavior name → module file**
(e.g. `card`, `cardhero`, `cardimage` all resolve to `card.js`). Adding a behavior =
write the function, register the name in `index.js`, and map a selector in
`wb-lazy.js`.

### Schemas — `src/wb-models/*.schema.json`

Components can be **schema-driven**: a `*.schema.json` declares the component's
`$view` (DOM structure), attributes, variants, and `test.setup` examples. The
**schema builder** (`src/core/mvvm/schema-builder.js`) loads them (listed in
`src/wb-models/index.json`) and builds the component's DOM before behaviors run.
This is how a `<wb-card>` knows its header/body/footer structure declaratively.
Processed elements are marked `x-schema="<name>"`; legacy `x-behavior=` usage is
rejected with a console error in strict mode.

### File map

```
src/
  core/
    wb-lazy.js          ← the WB runtime (map → lazy-inject → apply)
    tag-map.js          ← native + custom tag → behavior maps
    theme.js            ← theme switching
    mvvm/schema-builder.js  ← schema → DOM
  wb-viewmodels/        ← behaviors (one concern per file)
    index.js            ← behavior name → module registry
    feedback.js, card.js, navigation.js, effects.js, …
  wb-models/            ← *.schema.json component definitions (+ index.json)
  styles/
    themes.css          ← theme tokens (the ONLY place with color literals)
    site.css, behaviors/<name>.css
```

---

## 8. Render from JSON

For dynamic UIs, build elements from a definition instead of HTML:

```js
WB.render({
  t: 'wb-card',
  d: { title: 'Generated' },
  children: [{ t: 'p', content: 'Built from JSON.' }],
}, document.body);
```

`render()` maps the behavior back to its tag, applies attributes/behaviors, and
appends to the container.

---

## 9. Writing your own behavior (recipe)

1. **Create** `src/wb-viewmodels/my-thing.js`:
   ```js
   export function mything(element, options = {}) {
     element.classList.add('wb-mything');
     // build children / wire events using plain attributes
     return () => element.classList.remove('wb-mything'); // cleanup
   }
   ```
2. **Register** the name in `src/wb-viewmodels/index.js`:
   `mything: 'my-thing',`
3. **Map** a selector in `src/core/wb-lazy.js`:
   `{ selector: 'wb-mything', behavior: 'mything' }` (tag) or
   `{ selector: '[x-mything]', behavior: 'mything' }` (attribute).
4. **Style** it in `src/styles/behaviors/mything.css` using theme tokens only.
5. **(Optional)** add `src/wb-models/mything.schema.json` for declarative DOM.

That's the whole loop — no build, no registration boilerplate beyond those maps.

---

## See also

- Per-component reference: `docs/components/…` and each `src/wb-models/*.schema.json`.
- Behaviors reference: `docs/behaviors-reference.md`.
- The `?page=behaviors` showcase exercises every behavior with copy-ready markup.

> Note: `docs/NOTES-V3-GUIDE.md` is **release notes for the Notes drawer component's
> TODO feature** — not this framework guide. (It's mislabeled.)

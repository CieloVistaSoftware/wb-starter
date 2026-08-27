# Web Behaviors (WB) Starter

A zero-build website starter. Write HTML, the browser does the work.

**Semantic first. Composition only. Light DOM only. No Shadow DOM.**

No bundler, no JSX, no build step.

## Try it out

https://cielovistasoftware.github.io/wb-starter/

---

## The design point: semantic first

Most behavior libraries ask you to give up your markup. You stop writing
`<article>` and start writing `<Card>`, `<x-card>` or `<div class="card">`.
The framework's vocabulary replaces the browser's.

WB inverts that. **You write real HTML, and behaviors are injected into it.**

```html
<article>
  <h3>Hello</h3>
  <p>Body</p>
</article>
```

That is a card. Not "card-like" — it renders with card layout, spacing, theme
surface and hover treatment, because the `article` → `card` mapping upgraded it
in place. And it is still an `<article>` afterwards. Inspect it and you see an
`<article>` with classes on it, not a custom element wrapping a shadow root.

This sounds like a styling detail. It is not, and it is worth being precise
about why:

- **Assistive technology reads the real element.** An `<article>` announces as
  an article, `<dialog>` traps focus and exposes a modal role, `<progress>`
  reports its value — because they *are* those elements. None of that is
  reimplemented with ARIA, so none of it can be reimplemented wrongly.
- **The browser's own behaviour still works.** `<details>` opens without JS.
  `<form>` validates. `<dialog>` has `showModal()`. `<video>` has native
  controls and picture-in-picture. You inherit the platform instead of
  shimming it.
- **Search engines and share cards see content, not scaffolding.** The document
  is meaningful before a single line of JS runs.
- **Your CSS reaches everything.** Light DOM only — no shadow boundary, so a
  selector you write applies, DevTools shows the real tree, and
  `document.querySelector` finds the node.
- **It degrades to plain HTML.** With JS disabled or broken, the page is still a
  readable, navigable document.

The framework's job is to add capability to your markup, never to replace it.

---

## Injection: how behaviour gets attached

One idea sits underneath everything: **a behavior is a plain function applied to
an element.** Not a base class, not a wrapper behavior. There are three ways to
attach one, and all three resolve through `src/core/tag-map.js` to the same
function:

```html
<!-- 1. auto-injected — the element's own tag implies the behavior -->
<article>…</article>

<!-- 2. an attribute, on any element you like -->
<article x-card>…</article>
<button x-ripple>Click me</button>

```

Both produce the same card behaviour. Neither "is a" the other.

> **`<wb-*>` behavior tags are deprecated.** 104 of them are still registered
> and still work, but they are not the way to write new markup — the direction
> is x-attributes on real elements. They are listed in `elementMap` for
> back-compat and runtime parity, not as a third authoring surface.

### Auto-injection

`nativeMap` in `tag-map.js` maps **26 native selectors** to behaviors —
`article` → card, `dialog` → dialog, `table` → table, `input[type="range"]` →
range, and so on. On init, matching elements are upgraded where they stand.

This is the mechanism that makes semantic-first practical. Without it, "just
write `<article>`" would mean styling everything yourself.

### Modifying, overriding and opting out

Injection is not all-or-nothing, and the rules are deliberate:

| You write | What happens |
|---|---|
| `<input type="range">` | auto-injects the `range` behavior |
| `<input type="range" x-range>` | same behavior — naming it explicitly is not a conflict |
| `<input type="range" x-colorpicker>` | a *different* explicit behavior wins; auto-injection stands down |
| `<article x-card size="lg" variant="glass">` | behavior applied, then configured by attributes |
| `<button variant="primary">` | injects **even when auto-injection is off** — `variant` is unambiguous intent |
| `<div>` | nothing. Non-semantic elements are left alone |

Two details worth knowing, because they bite otherwise:

**Reserved attributes never trigger behaviors.** `src`, `href`, `type`, `name`,
`value`, `disabled`, `width` — 74 standard HTML attribute names are held
back, so `<img src="…">` does not go looking for a `src` behavior.

**Writing `x-{behavior}` for the behavior that would auto-inject anyway is
safe.** It used to switch the behavior *off*, so writing exactly what the docs
taught disabled the thing you were asking for (#745). Duplicate application is
already impossible — `inject()` dedupes.

### Layering

Behaviors compose on a single element, because they are just functions:

```html
<button x-ripple x-tooltip tooltip="Save" variant="primary">Save</button>
```

Nothing is subclassed to get that combination, and no `RippleTooltipButton` type
exists anywhere.

---

## What's in the box

| | Count | Where |
|---|---:|---|
| Behavior modules | **73** | `src/wb-viewmodels/` |
| `x-*` behavior attributes | **106** | `extensionMap` in `src/core/tag-map.js` |
| `wb-*` behavior tags *(deprecated)* | 104 | `elementMap` — back-compat only |
| Native elements auto-upgraded | **26** | `nativeMap` |
| Behavior schemas | **162** | `src/wb-models/*.schema.json` |
| Themes | **50** | `src/styles/themes.css` |
| Per-behavior stylesheets | **57** | `src/styles/behaviors/` |

The 50 themes are real palettes, light and dark — `dark`, `light`, `cyberpunk`,
`ocean`, `sunset`, `forest`, `midnight`, `sakura`, `noir`, `aurora`,
`sapphire-dark`, `celadon-light`, and 38 more. Switching is one attribute:
`<html data-theme="ocean">`.

---

## 🚀 Quick Start

1. Clone this repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000` in your browser

> **Note**: While the site can run as static files, the development server is
> required for the Visual Builder to save changes and for error logging to work.

## Architecture

Schema-first MVVM, in plain files the browser loads directly:

| Layer | Directory | What it holds |
|---|---|---|
| **Model** | `src/wb-models/` | 162 `*.schema.json` files — each behavior's declared attributes, defaults and `$view` |
| **ViewModel** | `src/wb-viewmodels/` | 73 behavior modules — the runtime logic that upgrades an element |
| **View** | `src/wb-views/` | Registered view templates |
| **Engine** | `src/core/` | `wb.js` / `wb-lazy.js` runtime, `tag-map.js`, and `core/mvvm/` (the schema builder) |

### Composition, concretely

Behaviour is shared by applying it, never by subclassing it:

```html
<!-- these get identical card behaviour; neither "is a" the other -->
<article title="Hello">Body</article>
<div x-card title="Hello">Body</div>
```

Most classes in `src/` that use `extends` write `extends HTMLElement`, which the
Custom Elements spec **requires** in order to register a tag. That is a platform
obligation, not a hierarchy.

Two holdovers from the earlier OOP design are still being retired, and both are
tracked:

| Holdover | Extent | Issue |
|---|---|---|
| `WBFixCard extends WBCard` | 1 class — the only behavior that inherits from another | #660 |
| `$extends` / `$inheritance` schema metadata, `card.base.schema.json` | 1 schema of 162 | #465, #462, #418 |

### Who builds the DOM

A behavior is built by **either** its schema **or** its behavior — never both.
Where a behavior constructs its own complete DOM, its tag is listed in
`SCHEMA_EXCLUDED_TAGS` (`src/core/mvvm/schema-builder.js`) so the schema pass
leaves it alone. Running both is a race: `processSchema()` clears an element's
content before rebuilding `$view`, so whichever finishes last silently wipes the
other's work — and destroys the author's own child content on the way.

If you add a behavior that builds its own structure, add its tag to that list.

## Testing & CI

```bash
npm test
```

Runs the ordered pipeline: static checks → compliance → regression → integration
→ base → behaviors.

- `npm run test:compliance` — the compliance project on its own
- `npm run test:async` — launch a run in the background and poll
  `data/test-status.json` (this is the path agents must use)
- `npm run audit:page-fragments` — checks that every page fragment survives being
  opened directly. Takes `--dir <path>`, so a site built from this starter can
  gate on it from its own `node_modules`
- Full runbook, Playwright trace examples and CI guidance:
  `docs/testing-runbook.md`
- Copy-paste commands and PowerShell troubleshooting: `NPXCOMMANDS.md`
- Local MCP helper used by tools/agents: `docs/mcp.md`

## 📁 Project Structure

```
wb-starter/
├── index.html            # Main entry point
├── server.js             # Dev server (error logging, Visual Builder saves)
├── config/
│   └── site.json         # Site configuration (nav, branding, footer)
├── pages/                # Page content (home, behaviors, behaviors, docs, …)
├── demos/                # Standalone demos, incl. playground.html
├── public/               # Tools (doc-viewer.html, schema-viewer.html, fix-viewer.html)
├── docs/                 # Guides, standards, behavior reference
├── scripts/              # Generators, test runner, audits
├── tests/                # Playwright: compliance / regression / integration / base / behaviors
└── src/
    ├── core/             # Runtime engine — wb.js, wb-lazy.js, tag-map.js
    │   └── mvvm/         # Schema builder
    ├── wb-models/        # *.schema.json — behavior definitions
    ├── wb-viewmodels/    # Behavior modules
    ├── wb-views/         # View templates
    └── styles/           # themes.css (50 themes), site.css, per-behavior CSS
```

## Where to read next

- `docs/V3-GUIDE.md` — the authoring guide
- `docs/architecture/standards/SCHEMA-SPECIFICATION.md` — how schemas are written
- `docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md` — attribute conventions
- `docs/claude/TIER1-LAWS.md` — the rules agents working in this repo must follow

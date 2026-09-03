# Web Behaviors (WB) Starter

A zero-build website starter. **You write HTML5. That is the whole API.**

**Semantic elements first. Composition only. Light DOM only. No custom elements.**

No bundler, no JSX, no build step, no component vocabulary to learn.

## Try it out

https://cielovistasoftware.github.io/wb-starter/

---

## The design point: you already know the vocabulary

Most behavior libraries ask you to give up your markup. You stop writing
`<article>` and start writing `<Card>`, `<x-card>` or `<div class="card">`. The
framework's vocabulary replaces the browser's, and you learn it again for every
framework.

WB inverts that. **The HTML element IS the thing.**

```html
<article>
  <h3>Hello</h3>
  <p>Body</p>
</article>
```

That is a card. Not "card-like" — it renders with card layout, spacing, theme
surface and hover treatment, and it is still an `<article>` afterwards. Inspect
it and you see an `<article>` with classes on it, not a custom element wrapping
a shadow root.

**Why it is built this way:** authors already know `<article>`, `<figure>`,
`<nav>`, `<details>`, `<table>`. They learned it once, from the platform, and it
does not change between projects. Every custom tag or invented class name a
framework ships is vocabulary you have to learn *instead of* what you already
know — and forget again on the next project.

So the measure for anything added here is one question:

> **Does this make someone learn something new to express something HTML already
> expresses?**

If yes, it is the wrong shape. That single test is behind every rule below: no
custom elements, no injected classes restating the element, attributes instead
of wrappers.

### What the platform gives you for free

- **Assistive technology reads the real element.** An `<article>` announces as
  an article, `<dialog>` traps focus and exposes a modal role, `<progress>`
  reports its value — because they *are* those elements. None of it is
  reimplemented with ARIA, so none of it can be reimplemented wrongly.
- **Native behaviour still works.** `<details>` opens without JS. `<form>`
  validates. `<dialog>` has `showModal()`. `<video>` has picture-in-picture.
- **Search engines and share cards see content, not scaffolding.** The document
  is meaningful before a line of JS runs.
- **Your CSS reaches everything.** Light DOM only — no shadow boundary, so your
  selectors apply, DevTools shows the real tree, and `querySelector` finds it.
- **It degrades to plain HTML.** With JS off, the page is still a readable,
  navigable document.

The framework's job is to add capability to your markup, never to replace it.

---

## Injection: how behaviour gets attached

**A behavior is a plain function applied to an element.** Not a base class, not
a wrapper component. Two ways to attach one, both resolving through
`src/core/tag-map.js` to the same function:

```html
<!-- 1. the element's own tag implies it -->
<article>...</article>

<!-- 2. an attribute, on whatever host you like -->
<div x-card>...</div>
<button x-ripple>Click me</button>
```

There is no third way. `<wb-*>` tags are **gone** — 4.0.0 removed custom
elements entirely, and a compliance gate now holds the count at zero.

### Auto-injection is ON by default

`nativeMap` maps **22 native selectors** to behaviors — `article` to card,
`dialog` to dialog, `table` to table, `input[type="range"]` to range, and so on.
Matching elements are upgraded where they stand.

This is the half that makes semantic-first practical: it is what makes knowing
HTML5 *sufficient*. Plain `<article>` gets styling, keyboard handling,
responsive behaviour and a11y wiring with no opt-in, no import and no
registration call.

Two consequences follow, and they bind:

- **Defaults are opt-out, never opt-in.** Anything you must *add* to receive a
  default is backwards — it turns a free extra into a thing to learn.
- **A bare semantic tag is a shipping surface.** Every `<article>` gets the card
  treatment whether its author asked or not, so a regression in a semantic
  default reaches pages nobody edited.

### Saying it twice

Semantic injection runs first; an explicit `x-*` attribute then applies to the
already-upgraded element. Where the attribute names the *same* behavior the tag
already implies, that is redundant and the runtime says so:

```text
<article x-card> says the same thing twice: <article> already IS the card
behavior, so the x-card attribute adds nothing. Drop it and keep <article>.
```

`<article x-cardimage>` is **not** redundant — the tag gives you a card and the
attribute selects a variant. Neither is `<article x-ripple>`: a modifier
decorates a card, it does not replace one.

### Modifying, overriding and opting out

| You write | What happens |
|---|---|
| `<input type="range">` | auto-injects the `range` behavior |
| `<input type="range" x-range>` | same behavior — naming it explicitly is not a conflict |
| `<input type="range" x-colorpicker>` | a *different* explicit behavior wins; auto-injection stands down |
| `<article x-cardhero size="lg" variant="glass">` | behavior applied, then configured by attributes |
| `<button variant="primary">` | injects **even when auto-injection is off** — `variant` is unambiguous intent |
| `<div>` | nothing. Non-semantic elements are left alone |
| `<article x-ignore>` | opt out entirely |

**Reserved attributes never trigger behaviors.** 74 standard HTML attribute
names — `src`, `href`, `type`, `name`, `value`, `disabled`, `width` — are held
back, so `<img src="...">` does not go looking for a `src` behavior.

### Layering

Behaviors compose on one element, because they are just functions:

```html
<button x-ripple tooltip="Save" variant="primary">Save</button>
```

Nothing is subclassed to get that, and no `RippleTooltipButton` type exists.

---

## Authoring rules

The rules this codebase holds itself to, each enforced by a gate in `tests/`:

| Rule | Why |
|---|---|
| **Semantic element first; `<div>` is a last resort** | including in examples — a `<div>` teaches nothing |
| **The attribute is the behavior; the host tag is yours** | never pin a behavior to one tag in a selector |
| **No custom elements** | a tag you must learn is vocabulary competing with HTML |
| **No injected class restating the element** | `<article>` is already a card; a `.card` class is a second name for it |
| **Plain attributes, not `data-*`, for configuration** | `data-*` is for your data, not the framework's |
| **No inline styles** | an inline style makes its stylesheet rule unreachable *and un-editable* |
| **No hardcoded colours outside the theme system** | 50 themes only work if nothing opts out |
| **`rem`, not `px`, for text sizing** | `px` ignores the reader's font-size setting |

---

## What's in the box

| | Count | Where |
|---|---:|---|
| Behaviors registered | **118** | `behaviorModules` in `src/wb-viewmodels/index.js` |
| Behavior modules | **106** | `src/wb-viewmodels/` |
| `x-*` behavior attributes | **120** | `extensionMap` in `src/core/tag-map.js` |
| Native elements auto-upgraded | **22** | `nativeMap` |
| Custom element tags | **0** | removed in 4.0.0, gated at zero |
| Behavior schemas | **156** | `src/wb-models/*.schema.json` |
| Themes | **50** | `src/styles/themes.css` |
| Per-behavior stylesheets | **58** | `src/styles/behaviors/` |
| Editor attribute completions | **417** | `.vscode/html-custom-data.json` |

The 50 themes are real palettes, light and dark — `dark`, `light`, `cyberpunk`,
`ocean`, `sunset`, `forest`, `midnight`, `sakura`, `noir`, `aurora`,
`sapphire-dark`, `celadon-light`, and 38 more. Switching is one attribute:
`<html data-theme="ocean">`.

---

## Quick Start

```bash
git clone https://github.com/CieloVistaSoftware/wb-starter.git
cd wb-starter
npm install
npm start          # http://localhost:3000
```

> The site runs as static files, but the dev server is required for the Visual
> Builder to save changes and for error logging.

Then write HTML:

```html
<article title="Welcome" subtitle="Standard card">
  This is a card. It is also still an article.
</article>
```

---

## Architecture

Schema-first MVVM, in plain files the browser loads directly:

| Layer | Directory | What it holds |
|---|---|---|
| **Model** | `src/wb-models/` | 156 `*.schema.json` — each behavior's declared attributes, defaults and `$view` |
| **ViewModel** | `src/wb-viewmodels/` | 106 behavior modules — the runtime logic that upgrades an element |
| **View** | `src/wb-views/` | Registered view templates |
| **Engine** | `src/core/` | `wb.js` / `wb-lazy.js` runtimes, `tag-map.js`, `replacement-guard.js`, `core/mvvm/` |

### Composition, concretely

Behaviour is shared by applying it, never by subclassing it:

```html
<!-- identical card behaviour; neither "is a" the other -->
<article title="Hello">Body</article>
<div x-card title="Hello">Body</div>
```

One holdover from the earlier OOP design is still being retired:

| Holdover | Extent | Issue |
|---|---|---|
| `WBFixCard extends WBCard` | 1 of 118 behaviors | #660, #789 |
| `$extends` schema metadata (`card.base.schema.json`) | 1 schema of 156 | #465, #462, #418 |

### Who builds the DOM

A behavior is built by **either** its schema **or** its behavior — never both.
Where a behavior constructs its own complete DOM, it is listed in
`SCHEMA_EXCLUDED_TAGS` (`src/core/mvvm/schema-builder.js`) so the schema pass
leaves it alone. Running both is a race: `processSchema()` clears an element
before rebuilding `$view`, so whichever finishes last wipes the other's work —
and the author's own child content with it.

If you add a behavior that builds its own structure, add it to that list.

### Two runtimes

`wb.js` is the eager runtime the main site uses. `wb-lazy.js` defers injection
to an `IntersectionObserver` and is what standalone demo pages, the doc-viewer
and the test harness load. **They are separate implementations of the same
contract** — a change to injection logic belongs in both, or in the shared
module they both import.

---

## Testing & CI

```bash
npm test
```

Runs the ordered pipeline: static checks, compliance, regression, integration,
base, behaviors.

- `npm run test:compliance` — the compliance project on its own
- `npm run test:async` — launch a run in the background and poll
  `data/test-status.json` (**agents must use this path**, never a synchronous run)
- `npm run audit:page-fragments` — checks every page fragment survives being
  opened directly; takes `--dir <path>` so a downstream site can gate on it
- Runbook and Playwright traces: `docs/testing-runbook.md`
- Copy-paste commands and PowerShell notes: `NPXCOMMANDS.md`

---

## Project Structure

```text
wb-starter/
  index.html            # Main entry point
  server.js             # Dev server (error logging, Visual Builder saves)
  config/site.json      # Site configuration (nav, branding, footer)
  pages/                # Page content
  demos/                # Standalone demos, incl. playground.html
  public/               # Tools (doc-viewer, schema-viewer, fix-viewer)
  docs/                 # Guides, standards, behavior reference
  images/               # Local assets and placeholders — no remote CDNs
  scripts/              # Generators, test runner, audits
  tests/                # Playwright: compliance / regression / integration / base / behaviors
  src/
    core/               # wb.js, wb-lazy.js, tag-map.js, replacement-guard.js
      mvvm/             # Schema builder
    wb-models/          # *.schema.json — behavior definitions
    wb-viewmodels/      # Behavior modules
    wb-views/           # View templates
    styles/             # themes.css (50 themes), site.css, per-behavior CSS
```

---

## Where to read next

- `docs/V3-GUIDE.md` — the authoring guide
- `docs/architecture/solidjscomparison.md` — how this differs from a component framework, and what it trades away
- `docs/architecture/standards/SCHEMA-SPECIFICATION.md` — how schemas are written
- `docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md` — attribute conventions
- `docs/claude/TIER1-LAWS.md` — the rules agents working in this repo must follow

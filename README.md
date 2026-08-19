# Web Behaviors (WB) Starter

A zero-build website starter. Write HTML, the browser does the work.

**Composition only. Light DOM only. No Shadow DOM.**

Components compose; they do not inherit. There is no base class to extend and
no IS-A hierarchy to reason about — a component is assembled from behaviors, and
a behavior is a plain function applied to an element. Want card behaviour on your
`<article>`? Apply it. You are never asked to subclass anything.

And because everything renders into the light DOM, your CSS reaches every
element, your scripts see every node, and DevTools shows you the real thing —
no shadow boundary to fight.

No bundler, no JSX, no build step. 50 themes included.

## Try it out

https://cielovistasoftware.github.io/wb-starter/

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
| **Model** | `src/wb-models/` | 110 `*.schema.json` files — each component's declared attributes, defaults and `$view` |
| **ViewModel** | `src/wb-viewmodels/` | 72 behavior modules — the runtime logic that upgrades an element |
| **View** | `src/wb-views/` | Registered view templates |
| **Engine** | `src/core/` | `wb.js` / `wb-lazy.js` runtime, `tag-map.js`, and `core/mvvm/` (the schema builder) |

Two authoring surfaces, both first-class and neither deprecated:

```html
<!-- a component tag (106 registered) -->
<wb-card title="Hello">Body</wb-card>

<!-- a behavior on any element (111 registered) -->
<button x-ripple>Click me</button>
```

Both resolve through `src/core/tag-map.js` to the same behavior.

### Composition, concretely

Behaviour is shared by applying it, never by subclassing it:

```html
<!-- these get identical card behaviour; neither "is a" the other -->
<wb-card title="Hello">Body</wb-card>
<article x-card title="Hello">Body</article>
```

Most classes in `src/` that use `extends` write `extends HTMLElement`, which the
Custom Elements spec **requires** in order to register a tag. That is a platform
obligation, not a hierarchy.

Two holdovers from the earlier OOP design are still being retired, and both are
tracked:

| Holdover | Extent | Issue |
|---|---|---|
| `WBFixCard extends WBCard` | 1 class — the only component that inherits from another | #660 |
| `$extends` / `$inheritance` schema metadata, `card.base.schema.json` | 1 schema of 110 | #465, #462, #418 |

### Who builds the DOM

A component is built by **either** its schema **or** its behavior — never both.
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
├── pages/                # Page content (home, components, behaviors, docs, …)
├── demos/                # Standalone demos, incl. playground.html
├── public/               # Tools (doc-viewer.html, schema-viewer.html, fix-viewer.html)
├── docs/                 # Guides, standards, behavior reference
├── scripts/              # Generators, test runner, audits
├── tests/                # Playwright: compliance / regression / integration / base / behaviors
└── src/
    ├── core/             # Runtime engine — wb.js, wb-lazy.js, tag-map.js
    │   └── mvvm/         # Schema builder
    ├── wb-models/        # *.schema.json — component definitions
    ├── wb-viewmodels/    # Behavior modules
    ├── wb-views/         # View templates
    └── styles/           # themes.css (50 themes), site.css, per-behavior CSS
```

## Where to read next

- `docs/V3-GUIDE.md` — the authoring guide
- `docs/architecture/standards/SCHEMA-SPECIFICATION.md` — how schemas are written
- `docs/architecture/standards/ATTRIBUTE-NAMING-STANDARD.md` — attribute conventions
- `docs/claude/TIER1-LAWS.md` — the rules agents working in this repo must follow

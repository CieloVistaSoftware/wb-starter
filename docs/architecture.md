# WB-Starter Architecture Overview

WB-Starter uses a **Light DOM, zero-build, schema-first** architecture based on native browser APIs.

## Core Principles

- **Light DOM only** — custom elements render into the document DOM; no Shadow DOM
- **ES Modules** — all JS is native ESM, loaded directly by the browser
- **WBServices pattern** — components registered via `WBServices.register()`; behaviors receive `(element, options)` and do not use `this`
- **No build step** — the browser runs source files directly
- **Schema-first** — every component is described by a `.schema.json` file in `src/wb-models/`

## Directory Layout

```
src/
  core/              # Core engine: wb.js, site-engine.js, WBServices
  wb-models/         # *.schema.json — component schemas
  wb-viewmodels/     # *.js — behavior / ViewModel logic
  styles/
    behaviors/       # Per-component CSS files
    pages/           # Page-specific layout CSS only
config/
  site.json          # Site-wide config (nav, branding, footer)
pages/               # HTML fragments (no <html>/<body>)
data/                # Generated JSON output from scripts
docs/                # Project documentation
tests/               # Playwright test suites
```

## Key Concepts

- **`<wb-*>` elements** — custom element tags, registered as WBServices
- **`x-*` attributes** — behavior directives applied to existing elements
- **Themes** — 23 built-in themes via CSS custom properties in `src/styles/behaviors/themes.css`
- **Pages as fragments** — files in `pages/` are HTML fragments; the server wraps them with the site shell

## Further Reading

- [Schema Reference](schema.md)
- [Behaviors Reference](behaviors-reference.md)
- [WBServices Pattern](wbservices.md)
- [Styles Guide](styles.md)
- [Attribute Naming Standard](architecture/standards/ATTRIBUTE-NAMING-STANDARD.md)

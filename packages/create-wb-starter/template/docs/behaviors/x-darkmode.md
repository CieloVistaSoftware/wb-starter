# x-darkmode

Forces a theme on an element (or the whole page), independent of the global theme setting. See [src/wb-viewmodels/darkmode.js](../../src/wb-viewmodels/darkmode.js).

- **Type:** Attribute
- **Usage:** `[x-darkmode]`

## Description
Distinct from `wb-themecontrol` (the global theme-picker dropdown, persisted to localStorage) — `x-darkmode` scopes a *forced* theme to one element, ignoring whatever the global theme currently is. Useful for demoing "this card is always dark" regardless of the page's own theme.

## Attributes
| Attribute | Default | Description |
|---|---|---|
| `target` | `html` | What to theme: `html` (the whole page), `self` (this element only), or a CSS selector |
| `theme` | `dark` | Theme name to force (any value `data-theme` accepts, e.g. `dark`, `light`, `cyberpunk`) |

## Nested themes without any behavior
Themes cascade through any container via the plain `data-theme="…"` HTML attribute alone — no `x-darkmode` needed for that case. `x-darkmode` is specifically for *forcing* a theme via a behavior attribute rather than authoring `data-theme` directly.

## Demo
See [Interactive & Utility demos](../../demos/site/interactive.html#theme-dark-mode).

## Schema/Test
[darkmode.schema.json](../../src/wb-models/darkmode.schema.json)

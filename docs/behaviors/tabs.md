# Tabs

Tab navigation for switching between content panels

Applies to `<div>`, and to any element carrying `x-tabs`.

## Usage

```html
<div x-tabs>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `active-tab` | `number` | `0` | Initially active tab index |
| `variant` | `default` · `pills` · `underline` · `bordered` | `default` |  |
| `size` | `sm` · `md` · `lg` | `md` |  |
| `full-width` | `boolean` | `false` | Tabs fill container width |
| `vertical` | `boolean` | `false` | Vertical tab layout |

## Events

- `wb:tabs:change` — Tab changed

## Methods

- `setActiveTab()` — Activates a tab by index
- `getActiveTab()` — Returns active tab index
- `next()` — Activates next tab
- `prev()` — Activates previous tab
- `first()` — Activates first tab
- `last()` — Activates last tab

## Accessibility

- **tablist** — {"role":"tablist"}
- **tab** — {"role":"tab","ariaSelected":"dynamic","ariaControls":"panel id"}
- **panel** — {"role":"tabpanel","ariaLabelledBy":"tab id"}

## Live example

See `x-tabs` on the [Behaviors showcase](/?page=behaviors) — search for `x-tabs` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/tabs.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

# Minimizable Card

Card with minimize/expand toggle button in header

Applies to `<article>`, and to any element carrying `x-cardminimizable`.

## Usage

```html
<article x-cardminimizable>
  …
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title (always visible) |
| `content` | `string` | — | Minimizable content |
| `minimized` | `boolean` | `false` | Initial minimized state |
| `variant` | `default` · `elevated` · `bordered` | `default` |  |

## Events

- `wb:minimizable:toggle` — Fired on minimize/expand

## Methods

- `minimize()` — Minimizes the card
- `expand()` — Expands the card
- `toggle()` — Toggles minimized state
- `isMinimized()` — Returns minimized state

## Live example

See `x-cardminimizable` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardminimizable` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardminimizable.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

# Minimizable Card

Card with minimize/expand toggle button in header

## Type — decorates a semantic element

`x-cardminimizable` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardminimizable
  title="Build log"
  content="tsc --noEmit clean. 141 regression tests passed. Packaged in 4.2s."></article>
```

### On a different element

Use `x-cardminimizable` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardminimizable>
  …
</div>
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

# Expandable Card

Card with collapsible/expandable content section

Applies to `<article>`, and to any element carrying `x-cardexpandable`.

## Usage

```html
<article x-cardexpandable>
  …
</article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title |
| `content` | `string` | — | Expandable content |
| `expanded` | `boolean` | `false` | Initial expanded state |
| `max-height` | `string` | `100px` | Max height when collapsed (pixel/unit string). Ignored when `lines` is set -- use maxHeight for non-text/mixed content where line-clamp doesn't apply. |
| `lines` | `number` | `null` | Clamp collapsed text to exactly N full lines via CSS line-clamp, instead of an arbitrary pixel maxHeight. Takes priority over maxHeight when set. |
| `variant` | `default` · `elevated` · `bordered` | `default` |  |

## Events

- `wb:expandable:toggle` — Fired on expand/collapse

## Methods

- `expand()` — Expands the card
- `collapse()` — Collapses the card
- `toggle()` — Toggles expanded state
- `isExpanded()` — Returns expanded state

## Live example

See `x-cardexpandable` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardexpandable` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardexpandable.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

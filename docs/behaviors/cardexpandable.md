# Expandable Card

Card with collapsible/expandable content section

## Type — decorates a semantic element

`x-cardexpandable` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardexpandable
  title="What changed in 3.0"
  content="Composition replaced inheritance: a tag maps to a behavior function that decorates the element in place, in light DOM. There is no behavior base class any more, and no shadow boundary to reach through."
  lines="2"></article>
```

### On a different element

Use `x-cardexpandable` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardexpandable>
  …
</div>
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

# Draggable Card

Card that can be dragged around the page

## Type — decorates a semantic element

`x-carddraggable` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-carddraggable title="Drag me" content="Pick this card up and move it — the position sticks." constrain axis="both"></article>
```

### On a different element

Use `x-carddraggable` when the host is not a `<article>` and you want the same behavior:

```html
<div x-carddraggable>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Card title |
| `content` | `string` | — | Card content |
| `constrain` | `none` · `parent` · `viewport` | `none` | Constrain to area |
| `axis` | `both` · `x` · `y` | `both` | Drag axis |
| `snap-to-grid` | `number` | `0` | Snap grid size (0=disabled) |
| `variant` | `default` · `elevated` | `default` |  |

## Events

- `wb:drag:start` — Drag started
- `wb:drag:move` — During drag
- `wb:drag:end` — Drag ended

## Methods

- `setPosition()` — Sets card position
- `getPosition()` — Gets current position
- `reset()` — Resets to original position

## Live example

See `x-carddraggable` on the [Behaviors showcase](/?page=behaviors) — search for `x-carddraggable` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/carddraggable.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

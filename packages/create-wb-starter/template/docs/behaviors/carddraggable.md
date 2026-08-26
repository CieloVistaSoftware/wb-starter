# Draggable Card

Card that can be dragged around the page

Applies to `<article>`, and to any element carrying `x-carddraggable`.

## Usage

```html
<article x-carddraggable>
  …
</article>
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

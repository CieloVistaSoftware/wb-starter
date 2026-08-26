# Sticky

Makes element stick to viewport on scroll

## Type — new capability

`x-sticky` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-sticky offset="0" stuck-class="is-stuck">
  Sticks to the top of its scroll container once you pass it.
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `offset` | `string` | `0` | Offset from top when stuck |
| `z-index` | `number` | `100` | Z-index when stuck |
| `threshold` | `number` | `0` | Scroll position to trigger sticky |
| `stuck-class` | `string` | `is-stuck` | Class added when stuck |
| `animated` | `boolean` | `true` | Animate stick/unstick |

## Events

- `wb:sticky:stuck` — Element became stuck
- `wb:sticky:unstuck` — Element unstuck

## Methods

- `stick()` — Forces sticky state
- `unstick()` — Forces unsticky state
- `isStuck()` — Returns stuck state

## Live example

See `x-sticky` on the [Behaviors showcase](/?page=behaviors) — search for `x-sticky` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/sticky.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

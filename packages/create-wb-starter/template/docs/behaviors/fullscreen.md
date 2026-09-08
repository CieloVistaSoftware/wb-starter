# Fullscreen

Behavior applied with x-fullscreen.

## Type — new capability

`x-fullscreen` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button variant="secondary" x-fullscreen>
  x-fullscreen · variant: secondary
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `target` | `string` | — | Read by fullscreen(). |
| `label` | `string` | `⛶ Fullscreen` | Read by fullscreen(). |

## Live example

See `x-fullscreen` on the [Behaviors showcase](/?page=behaviors) — search for `x-fullscreen` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/fullscreen.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

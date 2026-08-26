# Collapse

Collapsible content area.

## Type — new capability

`x-collapse` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-collapse heading="Environment" expanded>
  <p>Node 24.13, Chrome 139, Windows 11.</p>
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `heading` | `string` | `Toggle` | Text displayed on the clickable trigger button |
| `expanded` | `boolean` | `false` | Whether the content is initially visible |
| `target` | `string` | — | CSS selector of a remote element to toggle instead of wrapping content |

## Live example

See `x-collapse` on the [Behaviors showcase](/?page=behaviors) — search for `x-collapse` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/collapse.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

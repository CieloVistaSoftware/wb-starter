# Cluster

Behavior applied with x-cluster.

## Type — new capability

`x-cluster` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-cluster gap="0.5rem">
  <span>typescript</span><span>playwright</span><span>light-dom</span><span>no-build</span>
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `gap` | `string` | `1rem` | Read by cluster(). |
| `justify` | `string` | `flex-start` | Read by cluster(). |
| `align` | `string` | `center` | Read by cluster(). |

## Live example

See `x-cluster` on the [Behaviors showcase](/?page=behaviors) — search for `x-cluster` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cluster.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

# Span

A generic inline container for applying utility classes and variants. Useful for traffic lights (window controls), badges, and status indicators.

## Type — new capability

`x-span` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<span x-span variant="muted">Last run 4 minutes ago</span>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `default` · `red` · `yellow` · `green` · `dot` · `primary` · `secondary` · `success` · `error` · `warning` · `info` | `default` | Visual style variant |

## Live example

See `x-span` on the [Behaviors showcase](/?page=behaviors) — search for `x-span` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/span.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

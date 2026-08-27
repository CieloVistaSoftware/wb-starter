# Typewriter

Behavior applied with x-typewriter.

## Type — new capability

`x-typewriter` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<p x-typewriter speed="45">Zero build. Real behaviors. Light DOM only.</p>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `speed` | `string` | `50` | Read by typewriter(). |
| `text` | `string` | — | Read by typewriter(). |
| `cursor` | `string` | — | Read by typewriter(). |

## Live example

See `x-typewriter` on the [Behaviors showcase](/?page=behaviors) — search for `x-typewriter` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/typewriter.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

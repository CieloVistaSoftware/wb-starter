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
| `speed` | `string` | `50` | Milliseconds between characters. Defaults to `50` — lower is faster. |
| `text` | `string` | `this is the text` | Text to type out. Falls back to the element's existing `textContent`, so it can be left off when the content is already in the markup. |
| `cursor` | `string` | `this is the cursor` | Show the blinking cursor. On unless set to `"false"`. |

## Live example

See `x-typewriter` on the [Behaviors showcase](/?page=behaviors) — search for `x-typewriter` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/typewriter.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

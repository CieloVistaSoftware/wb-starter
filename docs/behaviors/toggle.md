# Toggle

Toggle visibility or state of another element.

## Type — new capability

`x-toggle` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button x-toggle target="#x-ex-toggle-panel">
  x-toggle · target: #x-ex-toggle-panel
</button>
<div id="x-ex-toggle-panel">The panel this button toggles.</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `target` | `string` | — | Selector of target element |

## Live example

See `x-toggle` on the [Behaviors showcase](/?page=behaviors) — search for `x-toggle` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/toggle.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

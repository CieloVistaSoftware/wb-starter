# Copybutton

Behavior applied with x-copybutton.

## Type — new capability

`x-copybutton` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button x-copybutton copy-target="#x-ex-copy-source">
  x-copybutton · copy-target: #x-ex-copy-source
</button>
<code id="x-ex-copy-source">npm run test:compliance</code>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `x-copybutton` | `string` | `this is the x copybutton` | The attribute value doubles as the CSS selector for what to copy — `x-copybutton="#snippet"`. Leave it empty to copy the host element's own text. |
| `label` | `string` | `Copy` | Accessible name for the button (`aria-label`/`title`). Defaults to `Copy`. |
| `position` | `string` | `top-right` | Corner the button is placed in, e.g. `top-right` (default). |
| `copy-feedback` | `string` | `Copied ✓` | Message shown after a successful copy. Defaults to `Copied!`. |
| `copy-duration` | `string` | `2000` | How long the feedback stays visible, in milliseconds. Defaults to `2000`. |
| `copy-target` | `string` | `this is the copy target` | CSS selector for the element whose text is copied. Same as passing the selector to `x-copybutton` directly; `target` is read first. |

## Events

- `wb:copy:success` — Fired by copybutton().
- `wb:copy:error` — Fired by copybutton().

## Live example

See `x-copybutton` on the [Behaviors showcase](/?page=behaviors) — search for `x-copybutton` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/copybutton.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

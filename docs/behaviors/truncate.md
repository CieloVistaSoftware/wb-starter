# Truncate

Behavior applied with x-truncate.

## Type — new capability

`x-truncate` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<p x-truncate lines="2" class="truncate-box">
        This is a very long text that will be truncated after two lines. Lorem ipsum dolor sit amet, consectetur
        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `lines` | `string` | `1` | Number of lines to clamp to before truncating. Defaults to `1`. |
| `data-expandable` | `boolean` | `false` | The `data-` spelling of `expandable`, read as a fallback when the plain form is absent (#752). Identical effect; prefer `expandable`. |
| `expandable` | `boolean` | `false` | Add a control that reveals the full text. Bare attribute — the plain spelling only began working in #752; before that `data-expandable` was the only form read. |

## Live example

See `x-truncate` on the [Behaviors showcase](/?page=behaviors) — search for `x-truncate` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/truncate.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

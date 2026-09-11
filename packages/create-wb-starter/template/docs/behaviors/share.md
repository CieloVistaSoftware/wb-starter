# Share

Behavior applied with x-share.

## Type — new capability

`x-share` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button variant="secondary" x-share share-title="wb-starter" share-url="https://example.com">
  x-share · variant: secondary · share-title: wb-starter · share-url: https://example.com
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | `this is the text` | Body text. Only used when `share-text` is absent. |
| `label` | `string` | `📤 Share` | Button label. Defaults to `📤 Share`. |
| `share-title` | `string` | `this is the share title` | Title passed to the share sheet. Read BEFORE `title`; falls back to `document.title`. |
| `share-text` | `string` | `this is the share text` | Body text passed to the share sheet. Read BEFORE `text`. |
| `share-url` | `string` | `#` | URL to share. Read BEFORE `url`; falls back to the current page address. |
| `url` | `string` | `#` | URL to share. Only used when `share-url` is absent. |

## Live example

See `x-share` on the [Behaviors showcase](/?page=behaviors) — search for `x-share` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/share.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

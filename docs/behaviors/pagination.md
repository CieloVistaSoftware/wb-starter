# Pagination

Behavior applied with x-pagination.

## Type — new capability

`x-pagination` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<nav x-pagination total="100" per-page="10" current="5"></nav>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `total` | `string` | `0` | Total number of items. With `per-page` this derives the page count. |
| `per-page` | `string` | `10` | Items per page. Defaults to `10`. |
| `pages` | `string` | `0` | Explicit page count. Overrides the count derived from `total`/`per-page`. |
| `current` | `string` | `1` | Active page, counting from **1**. Defaults to `1`. |
| `aria-disabled` | `string` | — | Set to `"true"` by the behavior on the Previous/Next control when there is no page in that direction; those controls also leave the tab order. Rendered output, not something you author. |
| `action` | `string` | — | Set by the behavior on each control to say what it does (previous/next). Read on click; not authored by hand. |
| `page` | `string` | — | Set by the behavior on each numbered control to carry its page number. The active one also gets `aria-current="page"`. |

## Events

- `wb:pagination:change` — Fired by pagination().

## Live example

See `x-pagination` on the [Behaviors showcase](/?page=behaviors) — search for `x-pagination` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/pagination.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

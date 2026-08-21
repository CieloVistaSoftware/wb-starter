# Footer

Page footer with copyright, links, and social icons

Applies to `<footer>`, and to any element carrying `x-footer`.

## Usage

```html
<footer>
  …
</footer>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `copyright` | `string` | — | Copyright text |
| `brand` | `string` | — | Brand name |
| `links` | `string` | — | Navigation links as JSON [{label, href}] |
| `social` | `string` | — | Social links as JSON [{platform, href}] |
| `sticky` | `boolean` | `false` | Sticky at bottom |

## Methods

- `setCopyright()` — Updates copyright
- `setBrand()` — Updates brand

## Accessibility

- **role** — contentinfo

## Live example

See `x-footer` on the [Behaviors showcase](/?page=behaviors) — search for `x-footer` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/footer.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

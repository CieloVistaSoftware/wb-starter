# Footer

Page footer with copyright, links, and social icons

## Type — decorates a semantic element

`x-footer` is the **footer behavior**. It attaches to `<footer>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<!-- Plain semantic HTML. The behavior is injected automatically -->
<!-- because the element itself implies it. No attribute needed. -->
<footer brand="Cielo Vista Software" copyright="2026" links="Privacy,Terms,Status"></footer>
```

### On a different element

Use `x-footer` when the host is not a `<footer>` and you want the same behavior:

```html
<div x-footer>
  …
</div>
```

> Do not write `<footer x-footer>`. The element already injects it, and the redundant attribute can suppress the behavior (#746).

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

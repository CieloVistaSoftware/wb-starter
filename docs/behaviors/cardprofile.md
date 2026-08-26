# Card Profile

Simple profile card. INHERITS from card.base (IS-A card), CONTAINS profile elements (HAS-A avatar, name, role, bio, cover).

## Type — new capability

`x-cardprofile` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<article x-cardprofile
  name="Grace Hopper"
  role="Compiler pioneer"
  avatar="https://picsum.photos/seed/grace/96/96"
  bio="Wrote the first compiler, then spent a career arguing that people should not have to write machine code."></article>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | `John Doe` | Person's name |
| `role` | `string` | `Designer` | Job title or role |
| `avatar` | `string` | `https://i.pravatar.cc/80?img=1` | Avatar image URL |
| `bio` | `string` | — | Short biography |
| `cover` | `string` | — | Cover/banner image URL |
| `size` | `sm` · `md` · `lg` | `md` | Avatar size |
| `align` | `left` · `center` | `center` | Content alignment |
| `hover-text` | `string` | — | Alias for `tooltip` -- hover text shown as a themed WB tooltip (x-tooltip / tooltip.js), not the native browser title tooltip (#283). |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `update()` — Updates profile properties

## Accessibility

- **$inherits** — card.base.schema.json#accessibility
- **avatar** — {"alt":"Profile photo of {name}"}

## Live example

See `x-cardprofile` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardprofile` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardprofile.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

# Card Profile

`x-cardprofile` renders a short profile card: an avatar, the person's `name` and `role`, and an optional `bio` and cover image. Use `x-cardportfolio` when you need skills, experience and links as well.

## Usage

<div x-demo>
<article x-cardprofile
  name="Grace Hopper"
  role="Compiler pioneer"
  avatar="/images/placeholder.svg"
  bio="Wrote the first compiler, then spent a career arguing that people should not have to write machine code."></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | `John Doe` | Person's name |
| `role` | `string` | `Designer` | Job title or role |
| `avatar` | `string` | `/images/avatar.svg` | Avatar image URL |
| `bio` | `string` | — | Short biography |
| `cover` | `string` | — | Cover/banner image URL |
| `size` | `sm` · `md` · `lg` | `md` | Avatar size |
| `align` | `left` · `center` | `center` | Content alignment |
| `hoverText` | `string` | — | Alias for `tooltip` -- hover text shown as a themed WB tooltip (x-tooltip / tooltip.js), not the native browser title tooltip (#283). |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `update()` — Updates profile properties

## Accessibility

- **$inherits** — card.base.schema.json#accessibility
- **avatar** — {"alt":"Profile photo of {name}"}

<sub>Schema: [`cardprofile.schema.json`](../../src/wb-models/cardprofile.schema.json)</sub>

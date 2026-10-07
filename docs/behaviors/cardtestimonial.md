# Testimonial Card

`x-cardtestimonial` renders a quotation card with the `quote`, the author's name, role and avatar, and an optional star `rating`.

## Usage

<div x-demo>
<article x-cardtestimonial
  quote="We deleted the build step and shipped faster the same week."
  author="Katherine Johnson"
  role="Platform lead"
  avatar="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Katherine_Johnson_1983.jpg/330px-Katherine_Johnson_1983.jpg"
  rating="5"></article>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `quote` | text | — | Testimonial quote text |
| `author` | text | — | Author name |
| `role` | text | — | Author role/title/company |
| `avatar` | URL | — | Author avatar image URL |
| `rating` | `number` | `0` | Star rating (0-5) |
| `variant` | `default` · `elevated` · `bordered` · `minimal` · `centered` | `default` | Visual style variant |
| `size` | `sm` · `md` · `lg` | `md` | Card size |

## Methods

- `show()` — Shows the testimonial card
- `hide()` — Hides the testimonial card
- `toggle()` — Toggles visibility
- `setRating()` — Updates the star rating

## Accessibility

- **avatar** — {"alt":"Photo of {{author}}"}
- **rating** — {"ariaLabel":"{{rating}} out of 5 stars"}

<sub>Schema: [`cardtestimonial.schema.json`](../../src/wb-models/cardtestimonial.schema.json)</sub>

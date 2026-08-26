# Testimonial Card

Customer testimonial/review card with quote, author, avatar, and rating

## Type — decorates a semantic element

`x-cardtestimonial` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardtestimonial
  quote="We deleted the build step and shipped faster the same week."
  author="Katherine Johnson"
  role="Platform lead"
  avatar="https://picsum.photos/seed/katherine/96/96"
  rating="5"></article>
```

### On a different element

Use `x-cardtestimonial` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardtestimonial>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `quote` | `string` | — | Testimonial quote text |
| `author` | `string` | — | Author name |
| `role` | `string` | — | Author role/title/company |
| `avatar` | `string` | — | Author avatar image URL |
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

## Live example

See `x-cardtestimonial` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardtestimonial` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardtestimonial.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

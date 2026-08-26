# Portfolio Card

Full-featured professional portfolio card with skills, experience, projects, and more

## Type — decorates a semantic element

`x-cardportfolio` is the **article behavior**. It attaches to `<article>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<article x-cardportfolio
  name="Ada Lovelace"
  title="Principal engineer"
  company="Analytical Engines"
  location="London"
  cover="https://picsum.photos/seed/ada-cover/480/200"></article>
```

### On a different element

Use `x-cardportfolio` when the host is not a `<article>` and you want the same behavior:

```html
<div x-cardportfolio>
  …
</div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | Full name |
| `title` | `string` | — | Job title / role |
| `company` | `string` | — | Current company name |
| `location` | `string` | — | Location (city, country) |
| `cover` | `string` | — | Cover/banner image URL |
| `avatar` | `string` | — | Profile photo URL |
| `bio` | `string` | — | Short biography / summary |
| `tagline` | `string` | — | Professional tagline or motto |
| `availability` | `available` · `busy` · `not-available` · `open-to-opportunities` | `available` | Current availability status |
| `email` | `string` | — | Email address |
| `phone` | `string` | — | Phone number |
| `website` | `string` | — | Personal website URL |
| `linkedin` | `string` | — | LinkedIn profile URL |
| `twitter` | `string` | — | Twitter/X profile URL |
| `github` | `string` | — | GitHub profile URL |
| `dribbble` | `string` | — | Dribbble profile URL |
| `skills` | `string` | — | Comma-separated list of skills |
| `skill-levels` | `string` | — | JSON array of {name, level (0-100)} for skill bars |
| `experience` | `string` | — | JSON array of {company, role, period, description} |
| `education` | `string` | — | JSON array of {school, degree, year} |
| `projects` | `string` | — | JSON array of {name, description, url, image} |
| `certifications` | `string` | — | Comma-separated list of certifications |
| `languages` | `string` | — | Comma-separated list of languages (e.g. 'English (Native), Spanish (Fluent)') |
| `stats` | `string` | — | JSON array of {label, value} for stats display |
| `cta` | `string` | — | Call-to-action button text |
| `cta-href` | `string` | — | Call-to-action button link |
| `variant` | `default` · `compact` · `horizontal` · `full` | `default` |  |
| `size` | `sm` · `md` · `lg` · `xl` · `full` · `auto` | `auto` |  |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `setAvailability()` — Updates availability status

## Live example

See `x-cardportfolio` on the [Behaviors showcase](/?page=behaviors) — search for `x-cardportfolio` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/cardportfolio.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

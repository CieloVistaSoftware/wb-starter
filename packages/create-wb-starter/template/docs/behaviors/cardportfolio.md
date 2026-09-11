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
  cover="/images/placeholder.svg"></article>
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
| `name` | `string` | `this is the name` | Full name |
| `title` | `string` | `this is the title` | Job title / role |
| `company` | `string` | `this is the company` | Current company name |
| `location` | `string` | `this is the location` | Location (city, country) |
| `cover` | `string` | `this is the cover` | Cover/banner image URL |
| `avatar` | `string` | `this is the avatar` | Profile photo URL |
| `bio` | `string` | `this is the bio` | Short biography / summary |
| `tagline` | `string` | `this is the tagline` | Professional tagline or motto |
| `availability` | `available` · `busy` · `not-available` · `open-to-opportunities` | `available` | Current availability status |
| `email` | `string` | `this is the email` | Email address |
| `phone` | `string` | `this is the phone` | Phone number |
| `website` | `string` | `this is the website` | Personal website URL |
| `linkedin` | `string` | `this is the linkedin` | LinkedIn profile URL |
| `twitter` | `string` | `this is the twitter` | Twitter/X profile URL |
| `github` | `string` | `this is the github` | GitHub profile URL |
| `dribbble` | `string` | `this is the dribbble` | Dribbble profile URL |
| `skills` | `string` | `this is the skills` | Comma-separated list of skills |
| `skill-levels` | `string` | `this is the skill levels` | JSON array of {name, level (0-100)} for skill bars |
| `experience` | `string` | `this is the experience` | JSON array of {company, role, period, description} |
| `education` | `string` | `this is the education` | JSON array of {school, degree, year} |
| `projects` | `string` | `this is the projects` | JSON array of {name, description, url, image} |
| `certifications` | `string` | `this is the certifications` | Comma-separated list of certifications |
| `languages` | `string` | `this is the languages` | Comma-separated list of languages (e.g. 'English (Native), Spanish (Fluent)') |
| `stats` | `string` | `this is the stats` | JSON array of {label, value} for stats display |
| `cta` | `string` | `this is the cta` | Call-to-action button text |
| `cta-href` | `string` | `#` | Call-to-action button link |
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

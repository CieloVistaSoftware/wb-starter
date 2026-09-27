# Portfolio Card

`x-cardportfolio` renders a full profile card: cover image, avatar, name and role, then optional skills, experience, projects, contact links and a call to action, each from its own attribute. List attributes take comma-separated text or JSON arrays.

## Usage

<div x-demo>
<article x-cardportfolio
  name="Ada Lovelace"
  title="Principal engineer"
  company="Analytical Engines"
  location="London"
  cover="/images/placeholder.svg"></article>
</div>

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
| `cta-href` | `string` | `#` | Call-to-action button link |
| `variant` | `default` · `compact` · `horizontal` · `full` | `default` |  |
| `size` | `sm` · `md` · `lg` · `xl` · `full` · `auto` | `auto` |  |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `setAvailability()` — Updates availability status

<sub>Schema: [`cardportfolio.schema.json`](../../src/wb-models/cardportfolio.schema.json)</sub>

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
| `name` | text | — | Full name |
| `title` | text | — | Job title / role |
| `company` | text | — | Current company name |
| `location` | text | — | Location (city, country) |
| `cover` | URL | — | Cover/banner image URL |
| `avatar` | URL | — | Profile photo URL |
| `bio` | text | — | Short biography / summary |
| `tagline` | text | — | Professional tagline or motto |
| `availability` | `available` · `busy` · `not-available` · `open-to-opportunities` | `available` | Current availability status |
| `email` | email address | — | Email address |
| `phone` | phone number | — | Phone number |
| `website` | URL | — | Personal website URL |
| `linkedin` | URL | — | LinkedIn profile URL |
| `twitter` | URL | — | Twitter/X profile URL |
| `github` | URL | — | GitHub profile URL |
| `dribbble` | URL | — | Dribbble profile URL |
| `skills` | comma-separated list | — | Comma-separated list of skills |
| `skillLevels` | JSON array of {name, level} | — | JSON array of {name, level (0-100)} for skill bars |
| `experience` | JSON array of {company, role, period, description} | — | JSON array of {company, role, period, description} |
| `education` | JSON array of {school, degree, year} | — | JSON array of {school, degree, year} |
| `projects` | JSON array of {name, description, url, image} | — | JSON array of {name, description, url, image} |
| `certifications` | comma-separated list | — | Comma-separated list of certifications |
| `languages` | comma-separated list | — | Comma-separated list of languages (e.g. 'English (Native), Spanish (Fluent)') |
| `stats` | JSON array of {label, value} | — | JSON array of {label, value} for stats display |
| `cta` | text | — | Call-to-action button text |
| `ctaHref` | URL | `#` | Call-to-action button link |
| `variant` | `default` · `compact` · `horizontal` · `full` | `default` |  |
| `size` | `sm` · `md` · `lg` · `xl` · `full` · `auto` | `auto` |  |

## Methods

- `show()` — Shows the card
- `hide()` — Hides the card
- `toggle()` — Toggles visibility
- `setAvailability()` — Updates availability status

<sub>Schema: [`cardportfolio.schema.json`](../../src/wb-models/cardportfolio.schema.json)</sub>

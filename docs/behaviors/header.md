# Header

A plain `<header>` gets a page header built from its attributes: an `icon` and `title` linking to `logoHref`, a `subtitle` and a `badge` such as a version number. Add `sticky` to keep it at the top while scrolling.

## Usage

<div x-demo>
<header title="Field notes" subtitle="Everything that happened this week" badge="New"></header>
</div>

No attribute needed on `<header>`. Don't add `x-header` to it (#746).

On another element, write `x-header`:

<div x-demo>
<div x-header title="Field notes" subtitle="Everything that happened this week" badge="New"></div>
</div>

`<header x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `icon` | emoji or icon name | — | Logo icon (emoji or text) |
| `title` | text | — | Header title |
| `subtitle` | text | — | Subtitle text |
| `badge` | text | — | Badge text (e.g., version) |
| `logoHref` | URL | `/` | Logo link URL |
| `sticky` | `boolean` | `false` | Sticky at top |

## Methods

- `setTitle()` — Updates title
- `setIcon()` — Updates icon
- `setBadge()` — Updates badge

## Accessibility

- **role** — banner

<sub>Schema: [`header.schema.json`](../../src/wb-models/header.schema.json)</sub>

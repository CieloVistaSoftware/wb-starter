# Header

A plain `<header>` gets a page header built from its attributes: an `icon` and `title` linking to `logo-href`, a `subtitle` and a `badge` such as a version number. Add `sticky` to keep it at the top while scrolling.

## Usage

<div x-demo>
<header title="Field notes" subtitle="Everything that happened this week" badge="New"></header>
</div>

No attribute needed on `<header>`. Don't add `x-header` to it (#746).

On another element, write `x-header`:

```html
<div x-header title="Field notes" subtitle="Everything that happened this week" badge="New"></div>
```

`<header x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `icon` | `string` | — | Logo icon (emoji or text) |
| `title` | `string` | — | Header title |
| `subtitle` | `string` | — | Subtitle text |
| `badge` | `string` | — | Badge text (e.g., version) |
| `logo-href` | `string` | `/` | Logo link URL |
| `sticky` | `boolean` | `false` | Sticky at top |

## Methods

- `setTitle()` — Updates title
- `setIcon()` — Updates icon
- `setBadge()` — Updates badge

## Accessibility

- **role** — banner

<sub>Schema: [`header.schema.json`](../../src/wb-models/header.schema.json)</sub>

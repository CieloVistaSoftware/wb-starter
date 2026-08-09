# Card Link - wb-starter v3.0

Clickable navigation link card.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardlink>` |
| Behavior | `cardlink` |
| Semantic | `<article>` with `role="link"` |
| Root CSS Class | `wb-card wb-card-link` |
| Composes | card structure + CSS (no base class) |

## Properties

Supports every [card property](./card.md) — that shared structure and CSS are applied by the card behavior, not inherited from a base class — plus its own:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `href` | string | `"#"` | Link URL |
| `target` | string | `"_self"` | Link target: `_self`, `_blank` |
| `icon` | string | `""` | Icon/emoji |
| `description` | string | `""` | Description text |
| `badge` | string | `""` | Badge text |
| `badgeVariant` | string | `"glass"` | Badge style: `glass`, `gradient` |

Wrapped in `<wb-demo>`, so the live component renders below with its source shown underneath:

<wb-demo>
<wb-cardlink
  title="Documentation"
  href="/docs"
  icon="📚">
</wb-cardlink>
</wb-demo>

## Usage

### Basic Link Card

```html
<wb-cardlink
  title="Documentation"
  href="/docs"
  icon="📚">
</wb-cardlink>
```

### External Link

```html
<wb-cardlink
  title="GitHub"
  description="View source code"
  href="https://github.com/example"
  target="_blank"
  icon="🐙">
</wb-cardlink>
```

### With Badge

```html
<wb-cardlink
  title="New Feature"
  description="Check out our latest update"
  href="/features"
  badge="New"
  badgeVariant="gradient">
</wb-cardlink>
```

## External Link Indicator

When `target="_blank"`, an arrow indicator (↗) is displayed.

## Accessibility

- Uses `role="link"` and `tabindex="0"`
- Keyboard: `Enter` or `Space` triggers navigation

## Schema

Location: `src/wb-models/cardlink.schema.json`

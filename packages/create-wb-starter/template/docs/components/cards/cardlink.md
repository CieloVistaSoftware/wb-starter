# Card Link - wb-starter v3.0

Clickable navigation link card.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardlink>` |
| Behavior | `cardlink` |
| Semantic | `<article>` with `role="link"` |
| Root CSS Class | `x-card x-card-link` |
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

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<div x-cardlink
  title="Documentation"
  href="/docs"
  icon="📚">
</div>
</div>

## Usage

### Basic Link Card

```html
<div x-cardlink
  title="Documentation"
  href="/docs"
  icon="📚">
</div>
```

### External Link

```html
<div x-cardlink
  title="GitHub"
  description="View source code"
  href="https://github.com/example"
  target="_blank"
  icon="🐙">
</div>
```

### With Badge

```html
<div x-cardlink
  title="New Feature"
  description="Check out our latest update"
  href="/features"
  badge="New"
  badgeVariant="gradient">
</div>
```

## External Link Indicator

When `target="_blank"`, an arrow indicator (↗) is displayed.

## Accessibility

- Uses `role="link"` and `tabindex="0"`
- Keyboard: `Enter` or `Space` triggers navigation

## Schema

Location: `src/wb-models/cardlink.schema.json`

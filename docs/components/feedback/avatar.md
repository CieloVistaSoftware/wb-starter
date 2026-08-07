# Avatar - wb-starter v3.0

User avatar with image, initials fallback, and status indicator.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-avatar>` |
| Behavior | `avatar` |
| Semantic | `<div>` (implicit role `img`) |
| Root CSS Class | `wb-avatar` |
| Category | Feedback |
| Schema | `src/wb-models/avatar.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | `""` | Image source URL — renders an `<img>` instead of initials when set |
| `alt` | string | `""` | Alt text for the image (declared in the schema — see Known gaps below) |
| `initials` | string | `""` | Fallback initials text shown when no `src` is set |
| `name` | string | `""` | Full name — auto-generates initials (first letter of each word, uppercased) when `initials` is not set |
| `size` | string | `"md"` | Size: `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| `shape` | string | `"circle"` | Shape: `circle`, `square`, `rounded` |
| `status` | string | `""` | Status indicator: `online`, `offline`, `busy`, `away` (empty = no indicator) |
| `bordered` | boolean | `false` | Show a border around the avatar (declared in the schema — see Known gaps below) |

## Usage

### Image Avatar

<wb-demo>
  <wb-avatar src="https://i.pravatar.cc/150?u=avatar1" alt="Jane Doe"></wb-avatar>
</wb-demo>

### Initials Fallback

Without a `src`, `initials` renders as plain text instead:

<wb-demo>
  <wb-avatar initials="JD"></wb-avatar>
</wb-demo>

### Auto-Generated Initials from Name

When neither `src` nor `initials` is set, `name` is split into initials automatically:

<wb-demo>
  <wb-avatar name="Jane Doe"></wb-avatar>
</wb-demo>

### Sizes

<wb-demo columns="6">
  <wb-avatar initials="XS" size="xs"></wb-avatar>
  <wb-avatar initials="SM" size="sm"></wb-avatar>
  <wb-avatar initials="MD" size="md"></wb-avatar>
  <wb-avatar initials="LG" size="lg"></wb-avatar>
  <wb-avatar initials="XL" size="xl"></wb-avatar>
  <wb-avatar initials="2X" size="2xl"></wb-avatar>
</wb-demo>

### Shapes

<wb-demo columns="3">
  <wb-avatar initials="JD" shape="circle"></wb-avatar>
  <wb-avatar initials="JD" shape="square"></wb-avatar>
  <wb-avatar initials="JD" shape="rounded"></wb-avatar>
</wb-demo>

### Status Indicator

<wb-demo columns="4">
  <wb-avatar initials="JD" status="online"></wb-avatar>
  <wb-avatar initials="JD" status="offline"></wb-avatar>
  <wb-avatar initials="JD" status="busy"></wb-avatar>
  <wb-avatar initials="JD" status="away"></wb-avatar>
</wb-demo>

## Generated Structure

Image variant:

```html
<wb-avatar src="..." size="md" shape="circle">
  <img src="..." alt="...">
</wb-avatar>
```

Initials variant, with a status dot:

```html
<wb-avatar initials="JD" status="online">
  JD
  <span class="wb-avatar__status--online"></span>
</wb-avatar>
```

`size` and `shape` are read directly off the `size`/`shape` attributes by CSS attribute
selectors (`wb-avatar[size="lg"]`, `wb-avatar[shape="square"]`) in
`src/styles/behaviors/avatar.css`. The behavior (`avatar()` in
`src/wb-viewmodels/feedback.js`) only builds the `<img>`/initials text and the status
dot — it adds no classes.

## Known gaps — schema vs. implementation

`avatar.schema.json` declares more than `avatar()` (`src/wb-viewmodels/feedback.js`) and
`avatar.css` (`src/styles/behaviors/avatar.css`) currently implement:

- **`bordered`** has no matching CSS rule — setting it has no visible effect.
- **`alt`** is declared but ignored: the rendered `<img>`'s `alt` is always set from
  `name`, never from the `alt` attribute.
- **`setImage()` / `setInitials()` / `setStatus()` / `clearStatus()`** are listed under
  the schema's `$methods` but are not implemented anywhere — `<wb-avatar>` exposes no JS
  API. To change an avatar, update its attributes and let it re-render.
- The schema's `$cssAPI` (`--wb-avatar-bg`, `--wb-avatar-color`, etc.) is not read by
  `avatar.css` — see Theme Variables Used below for what's actually wired up.

## Theme Variables Used

| Variable | Used For |
|----------|----------|
| `--primary` | Initials/image background |
| `--success-color` | `online` status dot |
| `--text-muted` | `offline` status dot |
| `--danger-color` | `busy` status dot |
| `--warning-color` | `away` status dot |
| `--bg-primary` | Status dot border |

## Schema

Location: `src/wb-models/avatar.schema.json`

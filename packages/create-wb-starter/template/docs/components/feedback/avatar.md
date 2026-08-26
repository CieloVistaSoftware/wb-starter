# Avatar - wb-starter v3.0

User avatar with image, initials fallback, and status indicator.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<span x-avatar>` |
| Behavior | `avatar` |
| Semantic | `<div>` (implicit role `img`) |
| Root CSS Class | `x-avatar` |
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

<div x-demo>
  <span x-avatar src="https://i.pravatar.cc/150?u=avatar1" alt="Jane Doe"></span>
</div>

### Initials Fallback

Without a `src`, `initials` renders as plain text instead:

<div x-demo>
  <span x-avatar initials="JD"></span>
</div>

### Auto-Generated Initials from Name

When neither `src` nor `initials` is set, `name` is split into initials automatically:

<div x-demo>
  <span x-avatar name="Jane Doe"></span>
</div>

### Sizes

<div x-demo columns="6">
  <span x-avatar initials="XS" size="xs"></span>
  <span x-avatar initials="SM" size="sm"></span>
  <span x-avatar initials="MD" size="md"></span>
  <span x-avatar initials="LG" size="lg"></span>
  <span x-avatar initials="XL" size="xl"></span>
  <span x-avatar initials="2X" size="2xl"></span>
</div>

### Shapes

<div x-demo columns="3">
  <span x-avatar initials="JD" shape="circle"></span>
  <span x-avatar initials="JD" shape="square"></span>
  <span x-avatar initials="JD" shape="rounded"></span>
</div>

### Status Indicator

<div x-demo columns="4">
  <span x-avatar initials="JD" status="online"></span>
  <span x-avatar initials="JD" status="offline"></span>
  <span x-avatar initials="JD" status="busy"></span>
  <span x-avatar initials="JD" status="away"></span>
</div>

## Generated Structure

Image variant:

```html
<span x-avatar src="..." size="md" shape="circle">
  <img src="..." alt="...">
</span>
```

Initials variant, with a status dot:

```html
<span x-avatar initials="JD" status="online">
  JD
  <span class="x-avatar__status--online"></span>
</span>
```

`size` and `shape` are read directly off the `size`/`shape` attributes by CSS attribute
selectors (`x-avatar[size="lg"]`, `x-avatar[shape="square"]`) in
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
  the schema's `$methods` but are not implemented anywhere — `<span x-avatar>` exposes no JS
  API. To change an avatar, update its attributes and let it re-render.
- The schema's `$cssAPI` (`--x-avatar-bg`, `--x-avatar-color`, etc.) is not read by
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

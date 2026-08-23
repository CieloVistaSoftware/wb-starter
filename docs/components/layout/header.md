# Header - wb-starter v3.0

Site/page header with a logo (icon + title + subtitle), center slot, and a right-aligned badge/actions area. Optionally sticky.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<header>` |
| Behavior | `header` |
| Semantic | `<header role="banner">` |
| Root CSS Class | `<header>` |
| Category | Layout |
| Schema | `src/wb-models/header.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `icon` | string | `""` | Logo icon (emoji or text) |
| `title` | string | `""` | Header title |
| `subtitle` | string | `""` | Subtitle text |
| `badge` | string | `""` | Badge text (e.g. a version number), shown on the right |
| `logo-href` | string | `"/"` | Logo link URL |
| `sticky` | boolean | `false` | Sticks the header to the top of the viewport |

## Usage

### Custom Element

<wb-demo>
<wb-header
  icon="📂"
  title="Project Index"
  badge="v1.0">
</header>
</wb-demo>

### With Subtitle

```html
<wb-header
  icon="🚀"
  title="My App"
  subtitle="Dashboard">
</header>
```

### Sticky

```html
<wb-header
  icon="🌐"
  title="Docs Site"
  sticky>
</header>
```

### Title Only

```html
<wb-header title="Simple Header"></header>
```

### Native `<header>` (Enhanced)

```html
<!-- x-header is auto-injected onto native <header> tags when autoInject is on -->
<header>
  <div class="wb-header__left">
    <a
      class="wb-header__logo"
      href="/">
      <span class="wb-header__icon">📂</span>
      <span class="wb-header__title">Native Header</span>
    </a>
  </div>
</header>
```

## Generated Structure

```html
<wb-header class="wb-header--sticky">
  <div class="wb-header__left">
    <a
      class="wb-header__logo"
      href="/">
      <span class="wb-header__icon">📂</span>
      <span class="wb-header__title">Project Index</span>
    </a>
    <span class="wb-header__subtitle">Dashboard</span>
  </div>
  <div class="wb-header__center"></div>
  <div class="wb-header__right">
    <span class="wb-tag-glass">v1.0</span>
  </div>
</header>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|--------------|
| `<header>` (tag selector) / `.wb-header` | Always | Base flex layout (`.wb-header` still applies on an auto-injected native `<header>`) |
| `.wb-header--sticky` | `sticky` (or legacy `data-sticky`) | `position: sticky` at the top of the viewport |
| `.wb-header__left` / `.wb-header__right` | Structural | Left (logo) and right (badge/actions) sections |
| `.wb-header__center` | Structural | Center slot for custom content |
| `.wb-header__logo` | `icon` or `title` set | Logo link wrapper |
| `.wb-header__icon` | `icon` set | Icon glyph |
| `.wb-header__title` | `title` set | Title text |
| `.wb-header__subtitle` | `subtitle` set | Subtitle text |

## Methods

`header()` (`src/wb-viewmodels/header.js`) attaches a **real** `wbHeader` API object directly to the element:

| Method | Description |
|--------|-------------|
| `element.wbHeader.setTitle(text)` | Updates `.wb-header__title` text content |
| `element.wbHeader.setIcon(icon)` | Updates `.wb-header__icon` text content |
| `element.wbHeader.setBadge(text)` | Updates (or creates) the badge in `.wb-header__right` |

```javascript
const header = document.querySelector('wb-header');

header.wbHeader.setTitle('Updated Title');
header.wbHeader.setBadge('v2.0');
```

## Events

None. `header()` dispatches no custom events.

## CSS API

| Variable | Default | Description |
|----------|---------|--------------|
| `--wb-header-height` | `60px` | Header height |
| `--wb-header-padding` | `0 1rem` | Padding |
| `--wb-header-bg` | `var(--bg-surface, #ffffff)` | Background |
| `--wb-header-border` | `1px solid var(--border-color, #e0e0e0)` | Bottom border |
| `--wb-header-shadow` | `none` | Box shadow |
| `--wb-header-title-size` | `1.25rem` | Title font size |
| `--wb-header-title-weight` | `700` | Title font weight |
| `--wb-header-icon-size` | `1.5rem` | Icon font size |

Confirmed in `src/styles/behaviors/header.css`; the shipped rules primarily read `--bg-primary`, `--border-color`, `--primary`, and `--text-primary`/`--text-muted` directly rather than the dedicated `--wb-header-*` tokens above -- both are valid override points depending on whether you're theming the whole site or this component specifically.

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="banner"` | Landmark role for the page header |

Keyboard support:
- The logo is a real `<a>` link -- standard `Tab` focus and `Enter` activation, unmodified.

# Details - wb-starter v3.0

Enhanced accordion/disclosure component with smooth animations.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-details>` |
| Behavior | `details` |
| Semantic | `<details>` |
| Base Class | `wb-details` |
| Category | Content |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `summary` | string | `"Details"` | Summary text |
| `open` | boolean | `false` | Open by default |
| `animated` | boolean | `true` | Enable smooth transitions |

## Usage

### Custom Element

```html
<wb-details summary="More Information">
  <p>Hidden content revealed when expanded.</p>
</wb-details>
```

### Native Details (Enhanced)

```html
<details data-wb="details">
  <summary>Click to expand</summary>
  <p>Content here...</p>
</details>
```

### Open by Default

```html
<wb-details summary="Expanded Section" open>
  <p>This section starts open.</p>
</wb-details>
```

### Multiple Accordion Items

```html
<wb-details summary="Section 1">Content 1</wb-details>
<wb-details summary="Section 2">Content 2</wb-details>
<wb-details summary="Section 3">Content 3</wb-details>
```

### Without Animation

```html
<wb-details summary="Quick Toggle" animated="false">
  <p>No animation on open/close.</p>
</wb-details>
```

## Generated Structure

```html
<details class="wb-details">
  <summary class="wb-details__summary">
    <span class="wb-details__icon">▶</span>
    <span class="wb-details__text">Summary Text</span>
  </summary>
  <div class="wb-details__content">
    <p>Hidden content...</p>
  </div>
</details>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-details` | Always | Base styling |
| `.wb-details--open` | `open` | Open state |
| `.wb-details--animated` | `animated` | Animations enabled |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `open()` | Opens the details | - |
| `close()` | Closes the details | - |
| `toggle()` | Toggles open/close | - |
| `isOpen` | Property: open state | `boolean` |

```javascript
const details = document.querySelector('wb-details');

// Open/close
details.open();
details.close();
details.toggle();

// Check state
if (details.isOpen) {
  console.log('Details is open');
}
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:details:toggle` | State changed | `{ open: boolean }` |
| `toggle` | Native toggle event | - |

```javascript
details.addEventListener('wb:details:toggle', (e) => {
  console.log('Open:', e.detail.open);
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--wb-details-bg` | `var(--bg-secondary)` | Background |
| `--wb-details-radius` | `4px` | Border radius |
| `--wb-details-padding` | `1rem` | Content padding |
| `--wb-details-summary-padding` | `0.75rem 1rem` | Summary padding |
| `--wb-details-icon-size` | `0.75rem` | Icon size |
| `--wb-details-transition` | `all 0.2s ease` | Animation timing |

## Accessibility

| Attribute | Value |
|-----------|-------|
| `aria-expanded` | Dynamic from open state |

The native `<details>` element provides built-in accessibility:
- Keyboard accessible (Enter/Space to toggle)
- Screen reader announcements
- Focus management

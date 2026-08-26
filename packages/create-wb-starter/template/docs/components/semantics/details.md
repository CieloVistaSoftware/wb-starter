# Details - wb-starter v3.0

Enhanced accordion/disclosure component with smooth animations.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<details>` |
| Behavior | `details` |
| Semantic | `<details>` |
| Root CSS Class | `x-details` |
| Category | Content |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `summary` | string | `"Details"` | Summary text |
| `open` | boolean | `false` | Open by default |
| `animated` | boolean | `true` | Enable smooth transitions |

Wrapped in `<div x-demo>`, so the live component renders below with its source shown underneath:

<div x-demo>
<details summary="More Information">
  <p>Hidden content revealed when expanded.</p>
</details>
</div>

## Usage

### Custom Element

```html
<details summary="More Information">
  <p>Hidden content revealed when expanded.</p>
</details>
```

### Native Details (Enhanced)

`autoInjectComponents` is on by default — a plain `<details>` is enhanced
automatically, no `x-details` attribute needed.

```html
<details>
  <summary>Click to expand</summary>
  <p>Content here...</p>
</details>
```

### Open by Default

```html
<details
  summary="Expanded Section"
  open>
  <p>This section starts open.</p>
</details>
```

### Multiple Accordion Items

```html
<details summary="Section 1">Content 1</details>
<details summary="Section 2">Content 2</details>
<details summary="Section 3">Content 3</details>
```

### Without Animation

```html
<details
  summary="Quick Toggle"
  animated="false">
  <p>No animation on open/close.</p>
</details>
```

## Generated Structure

The behavior adds these classes automatically — don't hand-author them,
they're not part of the input markup shown above.

```html
<details class="x-details">
  <summary class="x-details__summary">
    <span class="x-details__icon">▶</span>
    <span class="x-details__text">Summary Text</span>
  </summary>
  <div class="x-details__content">
    <p>Hidden content...</p>
  </div>
</details>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-details` | Always | Base styling |
| `.x-details--open` | `open` | Open state |
| `.x-details--animated` | `animated` | Animations enabled |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `open()` | Opens the details | - |
| `close()` | Closes the details | - |
| `toggle()` | Toggles open/close | - |
| `isOpen` | Property: open state | `boolean` |

```javascript
const details = document.querySelector('x-details');

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
| `--x-details-bg` | `var(--bg-secondary)` | Background |
| `--x-details-radius` | `4px` | Border radius |
| `--x-details-padding` | `1rem` | Content padding |
| `--x-details-summary-padding` | `0.75rem 1rem` | Summary padding |
| `--x-details-icon-size` | `0.75rem` | Icon size |
| `--x-details-transition` | `all 0.2s ease` | Animation timing |

## Accessibility

| Attribute | Value |
|-----------|-------|
| `aria-expanded` | Dynamic from open state |

The native `<details>` element provides built-in accessibility:
- Keyboard accessible (Enter/Space to toggle)
- Screen reader announcements
- Focus management

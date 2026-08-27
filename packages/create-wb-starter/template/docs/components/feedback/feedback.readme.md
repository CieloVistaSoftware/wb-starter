# Feedback Behaviors Documentation
[Edit this file](./feedback.readme.md)

## Overview
WB-Starter provides behaviors for user feedback, notifications, and loading states. All feedback behaviors are accessible and follow semantic HTML standards.

---

## Alert Behavior

Static alert message for displaying important information to users.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | "info" | Alert type: info, success, warning, error |
| `title` | string | "" | Alert title |
| `dismissible` | boolean | false | Show close/dismiss button |
| `icon` | string | "" | Custom icon (emoji or icon name) |

### Usage Examples

```html
<!-- Basic info alert -->
<div x-alert
  type="info"
  title="Information">
  This is an informational message.
</div>
<!-- Success alert with dismiss -->
<div x-alert
  type="success"
  title="Success!"
  dismissible>
  Your changes have been saved successfully.
</div>
<!-- Warning alert -->
<div x-alert
  type="warning"
  title="Warning">
  Please review your input before continuing.
</div>
<!-- Error alert -->
<div x-alert
  type="error"
  title="Error">
  An error occurred while processing your request.
</div>
```

### Alert Types

| Type | Purpose | Default Icon |
|------|---------|--------------|
| `info` | General information | ℹ️ |
| `success` | Successful operation | ✅ |
| `warning` | Warning or caution | ⚠️ |
| `error` | Error or failure | ❌ |

---

## Toast Behavior

Temporary notification popup that appears and disappears automatically.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | "info" | Toast type: info, success, warning, error |
| `message` | string | "" | Toast message text |
| `duration` | number | 3000 | Duration in milliseconds (0 = permanent) |
| `position` | string | "bottom-right" | Screen position |
| `dismissible` | boolean | true | Show close button |

### Usage Examples

```html
<!-- Basic toast -->
<div x-toast
  message="Item saved successfully"
  type="success">
</div>
<!-- Toast with custom duration -->
<div x-toast
  message="Please check your email"
  type="info"
  duration="5000"
  position="top-center">
</div>
```

### Toast Positions

- `top-left`, `top-center`, `top-right`
- `bottom-left`, `bottom-center`, `bottom-right`

### Programmatic API

```javascript
// Show toast programmatically
const toast = document.createElement('x-toast');
toast.setAttribute('message', 'Operation completed!');
toast.setAttribute('type', 'success');
document.body.appendChild(toast);
```

---

## Progress Behavior

Native HTML progress bar for showing task completion.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | number | 0 | Current progress value |
| `max` | number | 100 | Maximum progress value |
| `label` | string | "" | Accessibility label |
| `show-value` | boolean | false | Display percentage text |

### Usage Examples

```html
<!-- Basic progress bar -->
<progress
  value="75"
  max="100"
  label="Upload progress">
</progress>
<!-- Progress with percentage display -->
<progress
  value="45"
  max="100"
  show-value
  label="Loading...">
</progress>
```

---

## Spinner Behavior

Loading indicator with multiple animation styles.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `size` | string | "medium" | Size: small, medium, large, extra-large |
| `variant` | string | "border" | Animation style: border, grow, dots |
| `color` | string | "primary" | Color theme |
| `label` | string | "" | Accessibility label |

### Usage Examples

```html
<!-- Basic spinner -->
<span x-spinner label="Loading..."></span>
<!-- Large border spinner -->
<span x-spinner
  size="large"
  variant="border"
  label="Processing...">
</span>
<!-- Dots spinner -->
<span x-spinner
  variant="dots"
  size="small">
</span>
```

### Spinner Variants

| Variant | Description |
|---------|-------------|
| `border` | Spinning border ring |
| `grow` | Growing/shrinking circle |
| `dots` | Three bouncing dots |

---

## Skeleton Behavior

Loading placeholder that mimics the structure of content being loaded.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | string | "text" | Shape: text, circle, rectangle, card |
| `width` | string | "100%" | Element width |
| `height` | string | "" | Element height (auto-calculated for most variants) |
| `lines` | number | 1 | Number of text lines (for text variant) |
| `animation` | string | "pulse" | Animation: pulse, wave, none |

### Usage Examples

```html
<!-- Text skeleton -->
<div x-skeleton
  variant="text"
  lines="3">
</div>
<!-- Circular avatar skeleton -->
<div x-skeleton
  variant="circle"
  width="48px"
  height="48px">
</div>
<!-- Image placeholder -->
<div x-skeleton
  variant="rectangle"
  height="200px">
</div>
<!-- Card skeleton -->
<div x-skeleton
  variant="card"
  animation="wave">
</div>
```

---

## Badge Behavior

Small status indicator for displaying counts, labels, or status.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | "" | Badge text content |
| `variant` | string | "default" | Style variant: default, primary, success, warning, error |
| `size` | string | "medium" | Size: small, medium, large |
| `pill` | boolean | false | Rounded pill shape |
| `dot` | boolean | false | Dot indicator (no text) |

### Usage Examples

```html
<!-- Text badge -->
<span x-badge
  text="New"
  variant="primary">
</span>
<!-- Pill badge -->
<span x-badge
  text="Beta"
  pill
  variant="warning">
</span>
<!-- Dot indicator -->
<span x-badge
  dot
  variant="success">
</span>
<!-- Count badge -->
<span x-badge
  text="5"
  size="small">
</span>
```

---

## Events

All feedback behaviors emit appropriate events:

| Event | Behavior | Description | Detail |
|-------|-----------|-------------|--------|
| `wb:alert:dismiss` | Alert | Alert dismissed by user | `{ alert }` |
| `wb:toast:show` | Toast | Toast displayed | `{ toast }` |
| `wb:toast:hide` | Toast | Toast hidden | `{ toast }` |
| `wb:progress:complete` | Progress | Progress reached 100% | `{ progress, value }` |

---

## Accessibility

Feedback behaviors include comprehensive accessibility features:

- **Semantic HTML**: Proper use of `<aside>`, `<output>`, `<progress>` elements
- **ARIA Support**: `aria-label`, `aria-live`, `aria-atomic` attributes
- **Screen Readers**: Appropriate announcements for dynamic content
- **Keyboard Support**: Dismissible alerts and toasts support Escape key
- **Focus Management**: Logical focus flow and visible focus indicators

---

## Styling

Feedback behaviors use CSS custom properties for theming:

```css
:root {
  /* Alert colors */
  --alert-info-bg: #eff6ff;
  --alert-info-border: #dbeafe;
  --alert-info-text: #1e40af;
  --alert-success-bg: #f0fdf4;
  --alert-success-border: #dcfce7;
  --alert-success-text: #166534;

  /* Toast positioning */
  --toast-z-index: 1000;
  --toast-spacing: 1rem;

  /* Spinner colors */
  --spinner-primary: var(--primary-color);

  /* Skeleton colors */
  --skeleton-bg: var(--bg-secondary);
  --skeleton-highlight: var(--bg-tertiary);

  /* Badge colors */
  --badge-primary-bg: var(--primary-color);
  --badge-primary-text: var(--text-on-primary);
}
```

---

## Implementation
- **Behaviors**: Located in `src/wb-viewmodels/` (alert.js, toast.js, spinner.js, etc.)
- **Styles**: [src/styles/behaviors/feedback.css](../../../src/styles/behaviors/alert.css)
- **Schemas**: Feedback behavior schemas in `src/wb-models/`
- **Tests**: Feedback tests in `tests/behaviors/ui/feedback.spec.ts`

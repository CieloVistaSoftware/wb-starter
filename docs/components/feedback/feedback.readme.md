# Feedback Components Documentation
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/components/feedback/feedback.readme.md)

## Overview
Web Behaviors (WB) provides components for user feedback, notifications, and loading states. All feedback components are accessible and follow semantic HTML standards.

---

## Alert Component

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
<wb-alert type="info" title="Information">
  This is an informational message.
</wb-alert>

<!-- Success alert with dismiss -->
<wb-alert type="success" title="Success!" dismissible>
  Your changes have been saved successfully.
</wb-alert>

<!-- Warning alert -->
<wb-alert type="warning" title="Warning">
  Please review your input before continuing.
</wb-alert>

<!-- Error alert -->
<wb-alert type="error" title="Error">
  An error occurred while processing your request.
</wb-alert>
```

### Alert Types

| Type | Purpose | Default Icon |
|------|---------|--------------|
| `info` | General information | ℹ️ |
| `success` | Successful operation | ✅ |
| `warning` | Warning or caution | ⚠️ |
| `error` | Error or failure | ❌ |

---

## Toast Component

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
<wb-toast message="Item saved successfully" type="success"></wb-toast>

<!-- Toast with custom duration -->
<wb-toast
  message="Please check your email"
  type="info"
  duration="5000"
  position="top-center">
</wb-toast>
```

### Toast Positions

- `top-left`, `top-center`, `top-right`
- `bottom-left`, `bottom-center`, `bottom-right`

### Programmatic API

```javascript
// Show toast programmatically
const toast = document.createElement('wb-toast');
toast.setAttribute('message', 'Operation completed!');
toast.setAttribute('type', 'success');
document.body.appendChild(toast);
```

---

## Progress Component

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
<wb-progress value="75" max="100" label="Upload progress"></wb-progress>

<!-- Progress with percentage display -->
<wb-progress value="45" max="100" show-value label="Loading..."></wb-progress>
```

---

## Spinner Component

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
<wb-spinner label="Loading..."></wb-spinner>

<!-- Large border spinner -->
<wb-spinner size="large" variant="border" label="Processing..."></wb-spinner>

<!-- Dots spinner -->
<wb-spinner variant="dots" size="small"></wb-spinner>
```

### Spinner Variants

| Variant | Description |
|---------|-------------|
| `border` | Spinning border ring |
| `grow` | Growing/shrinking circle |
| `dots` | Three bouncing dots |

---

## Skeleton Component

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
<wb-skeleton variant="text" lines="3"></wb-skeleton>

<!-- Circular avatar skeleton -->
<wb-skeleton variant="circle" width="48px" height="48px"></wb-skeleton>

<!-- Image placeholder -->
<wb-skeleton variant="rectangle" height="200px"></wb-skeleton>

<!-- Card skeleton -->
<wb-skeleton variant="card" animation="wave"></wb-skeleton>
```

---

## Badge Component

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
<wb-badge text="New" variant="primary"></wb-badge>

<!-- Pill badge -->
<wb-badge text="Beta" pill variant="warning"></wb-badge>

<!-- Dot indicator -->
<wb-badge dot variant="success"></wb-badge>

<!-- Count badge -->
<wb-badge text="5" size="small"></wb-badge>
```

---

## Events

All feedback components emit appropriate events:

| Event | Component | Description | Detail |
|-------|-----------|-------------|--------|
| `wb:alert:dismiss` | Alert | Alert dismissed by user | `{ alert }` |
| `wb:toast:show` | Toast | Toast displayed | `{ toast }` |
| `wb:toast:hide` | Toast | Toast hidden | `{ toast }` |
| `wb:progress:complete` | Progress | Progress reached 100% | `{ progress, value }` |

---

## Accessibility

Feedback components include comprehensive accessibility features:

- **Semantic HTML**: Proper use of `<aside>`, `<output>`, `<progress>` elements
- **ARIA Support**: `aria-label`, `aria-live`, `aria-atomic` attributes
- **Screen Readers**: Appropriate announcements for dynamic content
- **Keyboard Support**: Dismissible alerts and toasts support Escape key
- **Focus Management**: Logical focus flow and visible focus indicators

---

## Styling

Feedback components use CSS custom properties for theming:

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
- **Components**: Located in `src/wb-viewmodels/` (alert.js, toast.js, spinner.js, etc.)
- **Styles**: [src/styles/components/feedback.css](../../src/styles/components/feedback.css)
- **Schemas**: Feedback component schemas in `src/wb-models/`
- **Tests**: Feedback tests in `tests/behaviors/ui/feedback.spec.ts`

# Card Notification - wb-starter v3.0

Alert/notification card using semantic `<aside>` element.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-cardnotification>` |
| Behavior | `cardnotification` |
| Semantic | `<aside>` with `role="alert"` |
| Root CSS Class | `x-notification` |
| CSS File | `src/styles/behaviors/card.css` |
| Schema | `src/wb-models/cardnotification.schema.json` |

## MVVM Architecture

| Layer | Responsibility |
|-------|---------------|
| **Schema** (`$view`) | DOM structure: icon, content, title, message, dismiss button |
| **CSS** (card.css) | Variant colors via `.x-notification--{variant}` classes |
| **Behavior** (card.js) | Interactivity: dismiss handler, Escape key, aria, default icon text |

The behavior does **not** rebuild the DOM when the schema has already processed the element. It only wires up event handlers and fills in default icon letters.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | string | `"info"` | Severity: `info`, `success`, `warning`, `error` |
| `title` | string | `""` | Notification title |
| `message` | string | `""` | Notification message |
| `dismissible` | boolean | `true` | Show dismiss button |
| `icon` | string | auto | Custom icon (overrides variant-based letter) |
| `elevated` | boolean | `false` | Add shadow elevation |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<div x-cardnotification
  variant="info"
  title="Information"
  message="This is an informational message.">
</div>
</div>

## Usage

### Info Notification

```html
<div x-cardnotification
  variant="info"
  title="Information"
  message="This is an informational message.">
</div>
```

### Success Notification

```html
<div x-cardnotification
  variant="success"
  title="Success!"
  message="Your changes have been saved.">
</div>
```

### Warning Notification

```html
<div x-cardnotification
  variant="warning"
  title="Warning"
  message="Please review your input.">
</div>
```

### Error Notification

```html
<div x-cardnotification
  variant="error"
  title="Error"
  message="Something went wrong. Please try again.">
</div>
```

### Non-Dismissible

```html
<div x-cardnotification
  variant="info"
  message="This notification cannot be dismissed."
  dismissible="false">
</div>
```

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.x-notification` | Base layout (flex row, gap, padding, border-left) |
| `.x-notification--info` | Blue border + tinted background |
| `.x-notification--success` | Green border + tinted background |
| `.x-notification--warning` | Amber border + tinted background |
| `.x-notification--error` | Red border + tinted background |
| `.x-notification__icon` | Colored circle with variant letter |
| `.x-notification__content` | Flex-1 text container |
| `.x-notification__title` | Bold title text |
| `.x-notification__message` | Message paragraph |
| `.x-notification__dismiss` | Close button |

## Events

### wb:cardnotification:dismiss

Fired when notification is dismissed:

```javascript
document.querySelector('x-cardnotification').addEventListener('wb:cardnotification:dismiss', (e) => {
  console.log('Dismissed:', e.detail.variant, e.detail.title);
});
```

## Accessibility

- Uses `role="alert"` for screen readers
- Dismiss button has `aria-label="Dismiss notification"`
- Keyboard: `Escape` key dismisses the notification
- Element receives `tabindex="0"` when dismissible

## Icon Defaults

When no custom `icon` attribute is provided, the behavior fills in a letter based on variant:

| Variant | Icon Letter |
|---------|------------|
| info | i |
| success | s |
| warning | w |
| error | e |

The letter is displayed in a colored circle whose background matches the variant color via CSS.

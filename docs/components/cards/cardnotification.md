# Card Notification - wb-starter v3.0

Alert/notification card using semantic `<aside>` element.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardnotification>` |
| Behavior | `cardnotification` |
| Semantic | `<aside>` with `role="alert"` |
| Base Class | `wb-notification` |
| CSS File | `src/styles/behaviors/card.css` |
| Schema | `src/wb-models/cardnotification.schema.json` |

## MVVM Architecture

| Layer | Responsibility |
|-------|---------------|
| **Schema** (`$view`) | DOM structure: icon, content, title, message, dismiss button |
| **CSS** (card.css) | Variant colors via `.wb-notification--{variant}` classes |
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

## Usage

### Info Notification

```html
<wb-cardnotification 
  variant="info"
  title="Information"
  message="This is an informational message.">
</wb-cardnotification>
```

### Success Notification

```html
<wb-cardnotification 
  variant="success"
  title="Success!"
  message="Your changes have been saved.">
</wb-cardnotification>
```

### Warning Notification

```html
<wb-cardnotification 
  variant="warning"
  title="Warning"
  message="Please review your input.">
</wb-cardnotification>
```

### Error Notification

```html
<wb-cardnotification 
  variant="error"
  title="Error"
  message="Something went wrong. Please try again.">
</wb-cardnotification>
```

### Non-Dismissible

```html
<wb-cardnotification 
  variant="info"
  message="This notification cannot be dismissed."
  dismissible="false">
</wb-cardnotification>
```

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.wb-notification` | Base layout (flex row, gap, padding, border-left) |
| `.wb-notification--info` | Blue border + tinted background |
| `.wb-notification--success` | Green border + tinted background |
| `.wb-notification--warning` | Amber border + tinted background |
| `.wb-notification--error` | Red border + tinted background |
| `.wb-notification__icon` | Colored circle with variant letter |
| `.wb-notification__content` | Flex-1 text container |
| `.wb-notification__title` | Bold title text |
| `.wb-notification__message` | Message paragraph |
| `.wb-notification__dismiss` | Close button |

## Events

### wb:cardnotification:dismiss

Fired when notification is dismissed:

```javascript
document.querySelector('wb-cardnotification').addEventListener('wb:cardnotification:dismiss', (e) => {
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

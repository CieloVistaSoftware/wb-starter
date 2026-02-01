# Card Notification - wb-starter v3.0

Alert/notification card using semantic `<aside>` element.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-cardnotification>` |
| Behavior | `cardnotification` |
| Semantic | `<aside>` with `role="alert"` |
| Base Class | `wb-card wb-notification` |
| Inherits | card |

## Properties

Inherits all [card properties](./card.md) plus:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | `"info"` | Type: `info`, `success`, `warning`, `error` |
| `message` | string | `""` | Notification message |
| `dismissible` | boolean | `true` | Show dismiss button |
| `icon` | string | auto | Custom icon |

## Usage

### Info Notification

```html
<wb-cardnotification 
  type="info"
  title="Information"
  message="This is an informational message.">
</wb-cardnotification>
```

### Success Notification

```html
<wb-cardnotification 
  type="success"
  title="Success!"
  message="Your changes have been saved.">
</wb-cardnotification>
```

### Warning Notification

```html
<wb-cardnotification 
  type="warning"
  title="Warning"
  message="Please review your input.">
</wb-cardnotification>
```

### Error Notification

```html
<wb-cardnotification 
  type="error"
  title="Error"
  message="Something went wrong. Please try again.">
</wb-cardnotification>
```

### Non-Dismissible

```html
<wb-cardnotification 
  type="info"
  message="This notification cannot be dismissed."
  dismissible="false">
</wb-cardnotification>
```

## Events

### wb:cardnotification:dismiss

Fired when notification is dismissed:

```javascript
document.querySelector('wb-cardnotification').addEventListener('wb:cardnotification:dismiss', (e) => {
  console.log('Dismissed:', e.detail.type, e.detail.title);
});
```

## Accessibility

- Uses `role="alert"` for screen readers
- Dismiss button has `aria-label="Dismiss notification"`
- Keyboard: `Escape` key dismisses the notification

## Schema

Location: `src/wb-models/cardnotification.schema.json`

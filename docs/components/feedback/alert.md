# Alert - wb-starter v3.0

Alert message with severity variants, optional title/icon, and a dismiss button.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-alert>` |
| Behavior | `alert` |
| Semantic | `<div role="alert">` |
| Root CSS Class | `<div x-alert>` |
| Category | Feedback |
| Schema | `src/wb-models/alert.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | string | `"info"` | Severity/style: `info`, `success`, `warning`, `error`. Alias: `type` |
| `title` | string | `""` | Optional heading shown above the message |
| `message` | string | `""` | Alert message content (falls back to the element's own content) |
| `icon` | string | `""` | Custom icon (emoji/text) -- defaults to a per-variant icon when omitted |
| `dismissible` | boolean | `false` | Shows a close (×) button that removes the alert |

## Usage

### Custom Element

<wb-demo>
<wb-alert variant="info" message="A new update is available."></div>
</wb-demo>

### Severity Variants

```html
<wb-alert variant="info" title="Heads up" message="This is an informational alert."></div>
<wb-alert variant="success" title="Success" message="Your changes have been saved."></div>
<wb-alert variant="warning" title="Warning" message="Please double-check this value."></div>
<wb-alert variant="error" title="Error" message="Something went wrong."></div>
```

### Dismissible

```html
<wb-alert
  variant="warning"
  title="Session expiring"
  message="You will be signed out in 5 minutes."
  dismissible>
</div>
```

### Custom Icon

```html
<wb-alert
  variant="success"
  icon="🎉"
  title="All set"
  message="Your account is ready to go.">
</div>
```

`alert()` also accepts `type="…"` as a fallback for `variant` at the schema/property level (`alert.schema.json` declares `variant.aliases: ["type"]`) -- but `variant="…"` is the canonical, documented spelling; write new markup with `variant`, not `type`.

## Generated Structure

```html
<div class="wb-alert wb-alert--info" role="alert" variant="info">
  <span class="wb-alert__icon">ℹ️</span>
  <div class="wb-alert__content">
    <div class="wb-alert__title">Alert</div>
    <div class="wb-alert__message">A new update is available.</div>
  </div>
  <!-- only when dismissible -->
  <wb-button class="wb-alert__close">×</button>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-alert` | Always (also a tag selector: `<div x-alert>`) | Base layout -- flex row, left accent border |
| `.wb-alert--info` | `variant="info"` (default) | Blue background/border |
| `.wb-alert--success` | `variant="success"` | Green background/border |
| `.wb-alert--warning` | `variant="warning"` | Amber background/border |
| `.wb-alert--error` | `variant="error"` | Red background/border |
| `.wb-alert__icon` | Always | Leading icon |
| `.wb-alert__content` | Always | Wraps title + message |
| `.wb-alert__title` | `title` set | Bold heading line |
| `.wb-alert__message` | Always | Message text |
| `.wb-alert__close` | `dismissible` | Close button |

## Methods

`alert()` (`src/wb-viewmodels/feedback.js`) builds the DOM directly and wires the dismiss button itself. The methods below come from `alert.schema.json`'s `$methods` block, bound onto the element generically by the schema builder (`src/core/mvvm/schema-builder.js`). `show`/`hide`/`toggle` use the schema builder's real generic implementation (they toggle `element.hidden` and dispatch `wb:show`/`wb:hide`); `dismiss` has no matching generic implementation, so it falls back to a stub that dispatches a `wb:dismiss` event -- use the built-in close button, or `element.remove()`, to actually remove an alert from the DOM.

| Method | Description |
|--------|-------------|
| `show()` | Shows the alert (`element.hidden = false`) |
| `hide()` | Hides the alert (`element.hidden = true`) |
| `toggle()` | Toggles between `show()`/`hide()` |
| `dismiss()` | Declared dismiss action (generic stub -- dispatches `wb:dismiss`) |

```javascript
const alert = document.querySelector('wb-alert');

alert.hide();
alert.show();
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:show` | Fired by the generic `show()` method | -- |
| `wb:hide` | Fired by the generic `hide()` method | -- |

The dismiss (×) button built by `alert()` removes the element directly (`element.remove()`) and does not dispatch a custom event.

## CSS API

Alert colors and structure come from real theme tokens read directly in `src/styles/behaviors/alert.css` (there are no dedicated `--wb-alert-*` custom properties in the shipped CSS):

| Variable | Used For | Description |
|----------|----------|--------------|
| `--info-color` / `--info-dark` | `.wb-alert--info` | Info background / accent border |
| `--success-color` / `--success-dark` | `.wb-alert--success` | Success background / accent border |
| `--warning-color` / `--warning-dark` | `.wb-alert--warning` | Warning background / accent border |
| `--danger-color` / `--danger-dark` | `.wb-alert--error` | Error background / accent border |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="alert"` | Announces the message to assistive technology as it appears |
| `variant="…"` | Reflects the current severity as a plain attribute |

Keyboard support:
- The dismiss button is a `<button>` and is reachable/activatable via Tab + Enter/Space like any other button.

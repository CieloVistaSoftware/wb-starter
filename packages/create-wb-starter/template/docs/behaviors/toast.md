# toast

Turns any element into a click trigger that pops a real, auto-dismissing toast
notification in the corner of the screen. Implemented by `toast()` (and the
`createToast()` helper it calls) in
[src/wb-viewmodels/feedback.js](../../src/wb-viewmodels/feedback.js).

## Overview

| Property | Value |
|----------|-------|
| Attribute | `x-toast` |
| Custom Tag | `<div x-toast>` |
| Behavior function | `toast()` — `src/wb-viewmodels/feedback.js` |
| Semantic element | `<div role="alert">` (the toast itself, built by `createToast()`) |
| Root CSS Class | `x-toast` (on the popped notification, not the trigger) |
| Category | Feedback |
| Schema | [toast.schema.json](../../src/wb-models/toast.schema.json) — declares `title`/`icon`/`action`/`actionHref`/`position`/`dismissible` properties the real click-trigger implementation never reads or renders; only `message`/`variant`/`duration` below actually do anything |

**Important:** unlike most behaviors, `toast()` doesn't render anything into the
host element itself — the host is only ever a **click trigger**. The actual
toast notification is a separate element `createToast()` appends to a shared
`.x-toast-container` fixed to the corner of the viewport, and it auto-removes
itself after `duration` milliseconds.

## Properties

Read from the trigger element, at click time (not once at page load — an
attribute changed after the initial render is still picked up on the next
click):

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` (or `toast-message`) | string | `"Notification"` | The toast's text content |
| `toast-variant` (or `variant`) | string | `"info"` | `info`, `success`, `warning`, `error` (also accepts `primary`/`secondary`, styled in `toast.css`). Use `toast-variant` on an element (like `<button>`) that already has its own conflicting `variant` attribute |
| `duration` | number (ms) | `3000` | Auto-dismiss delay. `0` disables auto-dismiss (the toast stays until the page navigates away — there's no built-in close button) |

## Usage

### Basic trigger

<div x-demo>
<button x-toast message="Saved!">Show toast</button>
</div>

### Variant

<div x-demo>
<button x-toast message="Something went wrong." toast-variant="error">Trigger error toast</button>
</div>

### Custom duration

<div x-demo>
<button x-toast message="This one sticks around for 6 seconds." duration="6000">Show long toast</button>
</div>

### On a `<button>` (needs `toast-variant`, not `variant`)

<div x-demo>
<button x-toast message="Copied to clipboard" toast-variant="success" variant="primary">Copy</button>
</div>

## CSS Classes

| Class | Applied to | Description |
|-------|-----------|-------------|
| `.x-toast-container` | a shared `<div>` appended to `document.body` (created once, reused by every toast) | Fixed position below the site header, top-right, stacked with a gap |
| `.x-toast` | each popped toast | Base card styling |
| `.x-toast--{variant}` | each popped toast | `info`/`success`/`warning`/`error`/`primary`/`secondary` background color |
| `.x-toast--exiting` | a toast about to auto-remove | Plays the exit animation just before `remove()` |

## Events

| Event | Fires when | `detail` |
|-------|-----------|----------|
| `wb:toast:show` | the trigger is clicked and a toast is shown | `{ message, variant }` |

```javascript
document.querySelectorAll('[x-toast]').forEach((trigger) => {
  trigger.addEventListener('wb:toast:show', (e) => {
    console.log(`Toast shown: "${e.detail.message}" (${e.detail.variant})`);
  });
});
```

- [Demo](../../demos/site/feedback.html#toast-toast)
- [Schema](../../src/wb-models/toast.schema.json)

# chip

A small pill-shaped tag/label with optional icon, color variant, and dismiss
button. Implemented by `chip()` in
[src/wb-viewmodels/feedback.js](../../src/wb-viewmodels/feedback.js).

## Overview

| Property | Value |
|----------|-------|
| Attribute | `x-chip` |
| Custom Tag | `<div x-chip>` |
| Behavior function | `chip()` — `src/wb-viewmodels/feedback.js` |
| Semantic element | `<span role="status">` |
| Root CSS Class | `<div x-chip>` |
| Category | Feedback |
| Schema | [chip.schema.json](../../src/wb-models/chip.schema.json) |

## Properties

`chip()` clears the element's existing children and rebuilds them from these
attributes, so any hand-written inner content is discarded in favor of `label`.

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | `""` | Chip text |
| `icon` | string | `""` | Leading icon/emoji shown before the label |
| `dismissible` | boolean | `false` | Adds a × button that removes the chip. Bare `dismissible` or `data-dismissible` both work |
| `disabled` | boolean | `false` | Disabled/faded state; also suppresses the dismiss button even if `dismissible` is set. Bare `disabled` or `data-disabled` both work |
| `outlined` | boolean | `false` | Transparent background with a colored border instead of a filled background. Bare `outlined` or `data-outlined` both work |
| `variant` | string | `"default"` | `default`, `primary`, `success`, `warning`, `error`, `info` |
| `size` | string | `"md"` | `sm`, `md`, `lg` |

## Usage

### Basic chip

<wb-demo>
<span x-chip label="Tag"></span>
</wb-demo>

### Variant + size

<wb-demo>
<span x-chip label="Primary" variant="primary" size="lg"></span>
</wb-demo>

### Dismissible

<wb-demo>
<span x-chip label="Removable" variant="info" dismissible></span>
</wb-demo>

### Icon + outlined

<wb-demo>
<span x-chip label="Starred" icon="⭐" outlined variant="warning"></span>
</wb-demo>

## CSS Classes

| Class | Applied when | Description |
|-------|--------------|-------------|
| `<div x-chip>` | host isn't already a `<div x-chip>` tag | Base pill shape, padding, background |
| `.wb-chip--{variant}` | `variant` is not `default` | `primary`/`success`/`warning`/`error`/`info` background+text color |
| `.wb-chip--{sm,lg}` | `size` is not `md` | Padding/font-size/min-height scale |
| `.wb-chip--outlined` | `outlined` | Transparent background, colored border |
| `.wb-chip--disabled` | `disabled` | 50% opacity, `pointer-events: none`, and sets `aria-disabled="true"` |
| `.wb-chip__icon` | `icon` set | Leading icon wrapper |
| `.wb-chip__label` | Always | Wraps the label text |
| `.wb-chip__remove` | `dismissible` and not `disabled` | The × remove button (a `<button>`) |

## Events

| Event | Fires when | `detail` |
|-------|-----------|----------|
| `wb:chip:remove` | the × remove button is clicked, right before the chip removes itself from the DOM | — (no detail) |

```javascript
document.addEventListener('wb:chip:remove', (e) => {
  console.log('A chip was dismissed:', e.target);
});
```

- [Demo](../../demos/site/feedback.html#chip-chip)
- [Schema](../../src/wb-models/chip.schema.json)

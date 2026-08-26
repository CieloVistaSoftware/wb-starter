# Progress - wb-starter v3.0

Progress bar with determinate and indeterminate states.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<progress>` |
| Behavior | `progress` |
| Semantic | `<div>` (role="progressbar") |
| Root CSS Class | `x-progress` |
| Category | Feedback |
| Schema | `src/wb-models/progress.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | number | `0` | Current progress value (0-100) |
| `max` | number | `100` | Maximum value |
| `label` | string | `""` | Progress label text |
| `show-value` | boolean | `false` | Append the percentage alongside a custom `label` (dropped otherwise — a custom label alone hides the percent) |
| `variant` | string | `"primary"` | Color: `default`, `primary`, `success`, `warning`, `error`, `info` |
| `size` | string | `"md"` | Size: `xs`, `sm`, `md`, `lg`, `xl` |
| `animated` | boolean | `true` | Diagonal stripe animation on the fill |
| `striped` | boolean | `false` | Static (non-animated) striped pattern |
| `indeterminate` | boolean | `false` | Indeterminate loading state (sweeping bar, no percent) |

## Usage

### Custom Element

<div x-demo>
  <progress value="50"></progress>
</div>

### Native Progress (Enhanced)

`autoInjectComponents` is on by default — a plain `<progress>` is enhanced
automatically, no `x-progress` attribute needed.

<div x-demo>
  <progress value="50" max="100"></progress>
</div>

### With Label and Value

`show-value` appends the percentage after a custom `label` — without it, a custom label replaces the percent entirely.

<div x-demo>
  <progress value="75" label="Downloading..." show-value></progress>
</div>

### Variants

<div x-demo columns="3">
  <progress value="50" variant="primary"></progress>
  <progress value="50" variant="success"></progress>
  <progress value="50" variant="warning"></progress>
  <progress value="50" variant="error"></progress>
  <progress value="50" variant="info"></progress>
</div>

### Sizes

<div x-demo columns="3">
  <progress value="50" size="xs"></progress>
  <progress value="50" size="sm"></progress>
  <progress value="50" size="md"></progress>
  <progress value="50" size="lg"></progress>
  <progress value="50" size="xl"></progress>
</div>

### Animated (default)

`animated` defaults to `true` — the fill has a moving diagonal stripe. Set `animated="false"` for a plain static fill.

<div x-demo columns="2">
  <progress value="50" label="animated (default)"></progress>
  <progress value="50" animated="false" label="animated=&quot;false&quot;"></progress>
</div>

### Striped

<div x-demo>
  <progress value="60" striped></progress>
</div>

### Indeterminate

<div x-demo>
  <progress indeterminate label="Loading..."></progress>
</div>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-progress` | Always | Base styling, on the `<progress>` host |
| `.x-progress--primary` / `--success` / `--warning` / `--error` / `--info` / `--default` | matching `variant` | Fill color (via `.x-progress__bar`'s `background`) |
| `.x-progress--xs` / `--sm` / `--md` / `--lg` / `--xl` | matching `size` | Bar height |
| `.x-progress--labeled` | `show-label` not `"false"` (default on) | Adds height for the overlaid `.x-progress__label` |
| `.x-progress--animated` | `animated` not `"false"` and not `indeterminate` | Moving diagonal stripe on the fill |
| `.x-progress--indeterminate` | `indeterminate` | Sweeping-bar animation, no label |
| `.x-progress__bar--striped` | `striped` | Static (non-animated) stripe pattern, on the fill div itself |

## Generated Structure

```html
<progress
  class="x-progress x-progress--md x-progress--primary x-progress--labeled"
  role="progressbar"
  aria-valuenow="75"
  aria-valuemin="0"
  aria-valuemax="100">
  <div class="x-progress__bar" style="width: 75%;"></div>
  <span class="x-progress__label">75%</span>
</progress>
```

## Known gap — no JS API on `<progress>`

`progress.js` exposes a `wbProgress` object (`setValue`/`getValue`/`setMax`/`getPercent`/`setIndeterminate`) — but only for the **native `<progress>`** enhancement path. The `<progress>` custom tag (every example on this page) re-renders from its attributes on each scan and does not currently expose any JS API — there is no `increment()`/`decrement()`/`reset()`/`complete()` method, on either path. To change a `<progress>`'s value programmatically today, set the `value` attribute and re-scan the element.

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-progress-primary-bg` | `var(--primary)` | Primary fill color |
| `--x-progress-success-bg` | `var(--success-color)` | Success fill color |
| `--x-progress-warning-bg` | `var(--warning-color)` | Warning fill color |
| `--x-progress-error-bg` | `var(--danger-color)` | Error fill color |
| `--x-progress-info-bg` | `var(--info-color)` | Info fill color |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `progressbar` | Always |
| `aria-valuemin` | `0` | Always |
| `aria-valuemax` | Dynamic from `max` | Always |
| `aria-valuenow` | Dynamic from `value` | Always (including indeterminate — reflects the last known value) |

## Schema

Location: `src/wb-models/progress.schema.json`

# Progress - wb-starter v3.0

Progress bar with determinate and indeterminate states.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-progress>` |
| Behavior | `progress` |
| Semantic | `<div>` (role="progressbar") |
| Base Class | `wb-progress` |
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

<wb-demo>
  <wb-progress value="50"></wb-progress>
</wb-demo>

### Native Progress (Enhanced)

`autoInjectComponents` is on by default — a plain `<progress>` is enhanced
automatically, no `x-progress` attribute needed.

<wb-demo>
  <progress value="50" max="100"></progress>
</wb-demo>

### With Label and Value

`show-value` appends the percentage after a custom `label` — without it, a custom label replaces the percent entirely.

<wb-demo>
  <wb-progress value="75" label="Downloading..." show-value></wb-progress>
</wb-demo>

### Variants

<wb-demo columns="3">
  <wb-progress value="50" variant="primary"></wb-progress>
  <wb-progress value="50" variant="success"></wb-progress>
  <wb-progress value="50" variant="warning"></wb-progress>
  <wb-progress value="50" variant="error"></wb-progress>
  <wb-progress value="50" variant="info"></wb-progress>
</wb-demo>

### Sizes

<wb-demo columns="3">
  <wb-progress value="50" size="xs"></wb-progress>
  <wb-progress value="50" size="sm"></wb-progress>
  <wb-progress value="50" size="md"></wb-progress>
  <wb-progress value="50" size="lg"></wb-progress>
  <wb-progress value="50" size="xl"></wb-progress>
</wb-demo>

### Animated (default)

`animated` defaults to `true` — the fill has a moving diagonal stripe. Set `animated="false"` for a plain static fill.

<wb-demo columns="2">
  <wb-progress value="50" label="animated (default)"></wb-progress>
  <wb-progress value="50" animated="false" label="animated=&quot;false&quot;"></wb-progress>
</wb-demo>

### Striped

<wb-demo>
  <wb-progress value="60" striped></wb-progress>
</wb-demo>

### Indeterminate

<wb-demo>
  <wb-progress indeterminate label="Loading..."></wb-progress>
</wb-demo>

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-progress` | Always | Base styling, on the `<wb-progress>` host |
| `.wb-progress--primary` / `--success` / `--warning` / `--error` / `--info` / `--default` | matching `variant` | Fill color (via `.wb-progress__bar`'s `background`) |
| `.wb-progress--xs` / `--sm` / `--md` / `--lg` / `--xl` | matching `size` | Bar height |
| `.wb-progress--labeled` | `show-label` not `"false"` (default on) | Adds height for the overlaid `.wb-progress__label` |
| `.wb-progress--animated` | `animated` not `"false"` and not `indeterminate` | Moving diagonal stripe on the fill |
| `.wb-progress--indeterminate` | `indeterminate` | Sweeping-bar animation, no label |
| `.wb-progress__bar--striped` | `striped` | Static (non-animated) stripe pattern, on the fill div itself |

## Generated Structure

```html
<wb-progress
  class="wb-progress wb-progress--md wb-progress--primary wb-progress--labeled"
  role="progressbar"
  aria-valuenow="75"
  aria-valuemin="0"
  aria-valuemax="100">
  <div class="wb-progress__bar" style="width: 75%;"></div>
  <span class="wb-progress__label">75%</span>
</wb-progress>
```

## Known gap — no JS API on `<wb-progress>`

`progress.js` exposes a `wbProgress` object (`setValue`/`getValue`/`setMax`/`getPercent`/`setIndeterminate`) — but only for the **native `<progress x-progress>`** enhancement path. The `<wb-progress>` custom tag (every example on this page) re-renders from its attributes on each scan and does not currently expose any JS API — there is no `increment()`/`decrement()`/`reset()`/`complete()` method, on either path. To change a `<wb-progress>`'s value programmatically today, set the `value` attribute and re-scan the element.

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--wb-progress-primary-bg` | `var(--primary)` | Primary fill color |
| `--wb-progress-success-bg` | `var(--success-color)` | Success fill color |
| `--wb-progress-warning-bg` | `var(--warning-color)` | Warning fill color |
| `--wb-progress-error-bg` | `var(--danger-color)` | Error fill color |
| `--wb-progress-info-bg` | `var(--info-color)` | Info fill color |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `progressbar` | Always |
| `aria-valuemin` | `0` | Always |
| `aria-valuemax` | Dynamic from `max` | Always |
| `aria-valuenow` | Dynamic from `value` | Always (including indeterminate — reflects the last known value) |

## Schema

Location: `src/wb-models/progress.schema.json`

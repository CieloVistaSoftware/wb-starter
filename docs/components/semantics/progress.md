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
| `showValue` | boolean | `false` | Show percentage value |
| `variant` | string | `"primary"` | Color: `default`, `primary`, `success`, `warning`, `error`, `info` |
| `size` | string | `"md"` | Size: `xs`, `sm`, `md`, `lg`, `xl` |
| `animated` | boolean | `true` | Animate on load |
| `striped` | boolean | `false` | Show striped pattern |
| `indeterminate` | boolean | `false` | Indeterminate loading state |

## Usage

### Custom Element

```html
<wb-progress value="50"></wb-progress>
```

### Native Progress (Enhanced)

```html
<progress data-wb="progress" value="50" max="100"></progress>
```

### With Label and Value

```html
<wb-progress value="75" label="Downloading..." showValue></wb-progress>
```

### Variants

```html
<wb-progress value="50" variant="primary"></wb-progress>
<wb-progress value="50" variant="success"></wb-progress>
<wb-progress value="50" variant="warning"></wb-progress>
<wb-progress value="50" variant="error"></wb-progress>
<wb-progress value="50" variant="info"></wb-progress>
```

### Sizes

```html
<wb-progress value="50" size="xs"></wb-progress>
<wb-progress value="50" size="sm"></wb-progress>
<wb-progress value="50" size="md"></wb-progress>
<wb-progress value="50" size="lg"></wb-progress>
<wb-progress value="50" size="xl"></wb-progress>
```

### Striped

```html
<wb-progress value="60" striped></wb-progress>
```

### Indeterminate

```html
<wb-progress indeterminate label="Loading..."></wb-progress>
```

## Generated Structure

```html
<div class="wb-progress wb-progress--primary wb-progress--md">
  <div class="wb-progress__header">
    <span class="wb-progress__label">Loading...</span>
    <span class="wb-progress__value">75%</span>
  </div>
  <div class="wb-progress__track">
    <div class="wb-progress__bar" style="width: 75%"></div>
  </div>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-progress` | Always | Base styling |
| `.wb-progress--primary` | `variant="primary"` | Primary color |
| `.wb-progress--success` | `variant="success"` | Success color |
| `.wb-progress--warning` | `variant="warning"` | Warning color |
| `.wb-progress--error` | `variant="error"` | Error color |
| `.wb-progress--info` | `variant="info"` | Info color |
| `.wb-progress--xs` | `size="xs"` | Extra small |
| `.wb-progress--sm` | `size="sm"` | Small |
| `.wb-progress--md` | `size="md"` | Medium |
| `.wb-progress--lg` | `size="lg"` | Large |
| `.wb-progress--xl` | `size="xl"` | Extra large |
| `.wb-progress--striped` | `striped` | Striped pattern |
| `.wb-progress--indeterminate` | `indeterminate` | Indeterminate state |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getValue()` | Gets current value | `number` |
| `setValue(value)` | Sets progress value | - |
| `increment(amount)` | Increments value | - |
| `decrement(amount)` | Decrements value | - |
| `reset()` | Resets to 0 | - |
| `complete()` | Sets to 100% | - |
| `setIndeterminate(bool)` | Sets indeterminate state | - |

```javascript
const progress = document.querySelector('wb-progress');

// Get/set value
const value = progress.getValue();
progress.setValue(75);

// Increment/decrement
progress.increment(10);
progress.decrement(5);

// Reset/complete
progress.reset();
progress.complete();

// Indeterminate
progress.setIndeterminate(true);
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--wb-progress-height` | `8px` | Progress bar height |
| `--wb-progress-radius` | `9999px` | Border radius |
| `--wb-progress-track-bg` | `var(--bg-secondary, #e5e7eb)` | Track background |
| `--wb-progress-bar-bg` | `var(--primary, #6366f1)` | Bar background |
| `--wb-progress-transition` | `width 0.3s ease` | Value transition |
| `--wb-progress-primary-bg` | `var(--primary, #6366f1)` | Primary bar color |
| `--wb-progress-success-bg` | `var(--success, #22c55e)` | Success bar color |
| `--wb-progress-warning-bg` | `var(--warning, #f59e0b)` | Warning bar color |
| `--wb-progress-error-bg` | `var(--error, #ef4444)` | Error bar color |
| `--wb-progress-info-bg` | `var(--info, #3b82f6)` | Info bar color |
| `--wb-progress-stripe-color` | `rgba(255,255,255,0.2)` | Stripe color |
| `--wb-progress-stripe-width` | `1rem` | Stripe width |
| `--wb-progress-label-size` | `0.875rem` | Label font size |
| `--wb-progress-label-color` | `var(--text-primary)` | Label color |
| `--wb-progress-value-size` | `0.875rem` | Value font size |
| `--wb-progress-value-color` | `var(--text-secondary)` | Value color |
| `--wb-progress-gap` | `0.5rem` | Gap between label and bar |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `progressbar` | Always |
| `aria-valuemin` | `0` | Always |
| `aria-valuemax` | Dynamic from `max` | Always |
| `aria-valuenow` | Dynamic from `value` | When not indeterminate |
| `aria-label` | Dynamic from `label` | When label exists |

## Schema

Location: `src/wb-models/progress.schema.json`

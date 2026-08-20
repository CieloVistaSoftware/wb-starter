# Progress - wb-starter v3.0

Progress bar with determinate and indeterminate states, size/color variants, a built-in percentage label, and an optional striped fill.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-progress>` |
| Behavior | `progress` |
| Semantic | `<progress role="progressbar">` |
| Root CSS Class | `wb-progress` |
| Category | Feedback |
| Schema | `src/wb-models/progress.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | number | `0` | Current progress value (0-100) |
| `max` | number | `100` | Maximum value |
| `variant` | string | `"primary"` | Color: `default`, `primary`, `success`, `warning`, `error`, `info` |
| `size` | string | `"md"` | Bar height: `xs`, `sm`, `md`, `lg`, `xl` |
| `label` | string | `""` | Custom label text (overrides the default `NN%` text) |
| `show-label` | boolean | `true` | Shows the built-in percentage/label text (set `show-label="false"` to hide it) |
| `show-value` | boolean (attr: `show-value`) | `false` | Appends the percentage alongside a custom `label` |
| `striped` | boolean | `false` | Diagonal stripe texture on the fill |
| `animated` | boolean | `true` | Animates the fill in from 0% on render |
| `indeterminate` | boolean | `false` | Indeterminate/loading state (no fixed value) |

## Usage

### Custom Element

<wb-demo>
<wb-progress value="60" max="100"></wb-progress>
</wb-demo>

### Color Variants

```html
<wb-progress value="50" variant="primary"></wb-progress>
<wb-progress value="75" variant="success"></wb-progress>
<wb-progress value="40" variant="warning"></wb-progress>
<wb-progress value="20" variant="error"></wb-progress>
<wb-progress value="65" variant="info"></wb-progress>
```

### Sizes

```html
<wb-progress value="50" size="xs"></wb-progress>
<wb-progress value="50" size="sm"></wb-progress>
<wb-progress value="50" size="lg"></wb-progress>
<wb-progress value="50" size="xl"></wb-progress>
```

### Custom Label

```html
<wb-progress value="80" label="Uploading..."></wb-progress>
<wb-progress value="80" label="Uploading..." show-value></wb-progress>
```

### Striped

```html
<wb-progress value="55" variant="success" striped></wb-progress>
```

### Indeterminate

```html
<wb-progress indeterminate></wb-progress>
```

### Native `<progress>` (Enhanced)

```html
<!-- x-progress is auto-injected onto native <progress> tags when autoInject is
on -->
<progress value="50" max="100"></progress>
```

## Generated Structure

```html
<wb-progress
  class="wb-progress wb-progress--md wb-progress--primary wb-progress--labeled
  wb-progress--animated"
  role="progressbar"
  aria-valuenow="60"
  aria-valuemin="0"
  aria-valuemax="100">
  <div class="wb-progress__bar"></div>
  <span class="wb-progress__label">60%</span>
</wb-progress>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-progress` | Always (also a tag selector: `wb-progress`) | Track background + rounded clip |
| `.wb-progress--{xs,sm,md,lg,xl}` | `size` | Track/bar height |
| `.wb-progress--{default,primary,success,warning,error,info}` | `variant` | Fill color |
| `.wb-progress--labeled` | `show-label` (default true) | Extra height reserved for the label text |
| `.wb-progress--animated` | `animated` (default true, not `indeterminate`) | Fill transitions in on render |
| `.wb-progress--indeterminate` | `indeterminate` | Loading-state fill animation |
| `.wb-progress__bar` | Always | The fill element |
| `.wb-progress__bar--striped` | `striped` | Diagonal stripe texture |
| `.wb-progress__label` | `show-label` and not `indeterminate` | Centered percentage/label text |

## Methods

`progress()` (`src/wb-viewmodels/semantics/progress.js`) builds the fill/label directly. The methods below come from `progress.schema.json`'s `$methods`, bound generically by the schema builder. None of `getValue`/`setValue`/`increment`/`decrement`/`reset`/`complete`/`setIndeterminate` have a matching generic implementation in the schema builder's common viewModel, so each is bound as a stub that warns to the console and dispatches a `wb:{method}` event -- to actually read or change a progress bar's value from your own code, update the `value` attribute (or use the demo's `<wb-progress>` markup) rather than calling these directly.

| Method | Description |
|--------|-------------|
| `getValue()` | Declared accessor (generic stub -- dispatches `wb:getValue`) |
| `setValue(value)` | Declared setter (generic stub -- dispatches `wb:setValue`) |
| `increment(amount)` | Declared increment (generic stub -- dispatches `wb:increment`) |
| `decrement(amount)` | Declared decrement (generic stub -- dispatches `wb:decrement`) |
| `reset()` | Declared reset-to-0 (generic stub -- dispatches `wb:reset`) |
| `complete()` | Declared set-to-100% (generic stub -- dispatches `wb:complete`) |
| `setIndeterminate(isIndeterminate)` | Declared state setter (generic stub -- dispatches `wb:setIndeterminate`) |

## Events

Calling any of the stub methods above dispatches its matching `wb:{methodName}` event with `{ detail: { args } }`. There is no dedicated `wb:progress:change` event -- update the `value` attribute directly and re-scan, or set it before the element mounts.

## CSS API

| Variable | Used For | Description |
|----------|----------|--------------|
| `--bg-tertiary` | Track background | Unfilled track color |
| `--primary` | Default/primary fill | Fill color when no variant-specific token applies |
| `--wb-progress-primary-bg` | `variant="primary"`/`default` | Fill color (falls back to `--primary`) |
| `--wb-progress-success-bg` | `variant="success"` | Fill color (falls back to `--success-color`) |
| `--wb-progress-warning-bg` | `variant="warning"` | Fill color (falls back to `--warning-color`) |
| `--wb-progress-error-bg` | `variant="error"` | Fill color (falls back to `--danger-color`) |
| `--wb-progress-info-bg` | `variant="info"` | Fill color (falls back to `--info-color`) |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="progressbar"` | Progressbar semantics |
| `aria-valuenow` | Reflects the current `value` |
| `aria-valuemin` | Always `0` |
| `aria-valuemax` | Reflects `max` |

Indeterminate progress bars omit `aria-valuenow` while the class-driven animation runs, signalling an unknown duration to assistive technology.

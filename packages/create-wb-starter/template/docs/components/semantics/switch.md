# Switch - wb-starter v3.0

Toggle switch for boolean settings.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-switch>` |
| Behavior | `switch` |
| Semantic | `<div>` (role="switch") |
| Root CSS Class | `x-switch` |
| Category | Forms |
| Schema | `src/wb-models/switch.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Switch label |
| `checked` | boolean | `false` | On/off state |
| `disabled` | boolean | `false` | Disabled state |
| `name` | string | `""` | Form field name |
| `value` | string | `""` | Form field value when checked |
| `labelPosition` | string | `"end"` | Label position: `start`, `end` |
| `size` | string | `"md"` | Size: `sm`, `md`, `lg` |
| `variant` | string | `"default"` | Variant: `default`, `primary`, `success` |

Wrapped in `<div x-demo>`, so the live behavior renders below with its source shown underneath:

<div x-demo>
<div x-switch label="Dark mode"></div>
</div>

## Usage

### Custom Element

```html
<div x-switch label="Dark mode"></div>
```

### Native Checkbox (Enhanced)

```html
<input
  type="checkbox"
  x-switch
  label="Notifications">
```

### Pre-Checked

```html
<div x-switch
  label="Enable notifications"
  checked>
</div>
```

### Label Position

```html
<div x-switch
  label="Left label"
  labelPosition="start">
</div>
<div x-switch
  label="Right label"
  labelPosition="end">
</div>
```

### Sizes

```html
<div x-switch
  label="Small"
  size="sm">
</div>
<div x-switch
  label="Medium"
  size="md">
</div>
<div x-switch
  label="Large"
  size="lg">
</div>
```

### Variants

```html
<div x-switch
  label="Default"
  variant="default">
</div>
<div x-switch
  label="Primary"
  variant="primary">
</div>
<div x-switch
  label="Success"
  variant="success">
</div>
```

### Disabled

```html
<div x-switch
  label="Unavailable"
  disabled>
</div>
```

### In Forms

```html
<div x-switch
  label="Subscribe to newsletter"
  name="subscribe"
  value="yes">
</div>
```

## Generated Structure

```html
<div class="x-switch">
  <span class="x-switch__label">Dark mode</span>
  <input
    type="checkbox"
    class="x-switch__input">
  <span class="x-switch__track">
    <span class="x-switch__thumb"></span>
  </span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.x-switch` | Always | Base styling |
| `.x-switch--checked` | `checked` | Checked state |
| `.x-switch--disabled` | `disabled` | Disabled state |
| `.x-switch--sm` | `size="sm"` | Small size |
| `.x-switch--md` | `size="md"` | Medium size |
| `.x-switch--lg` | `size="lg"` | Large size |
| `.x-switch--primary` | `variant="primary"` | Primary variant |
| `.x-switch--success` | `variant="success"` | Success variant |

## Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `on()` | Turns switch on | - |
| `off()` | Turns switch off | - |
| `toggle()` | Toggles switch state | - |
| `isOn()` | Returns on/off state | `boolean` |
| `enable()` | Enables the switch | - |
| `disable()` | Disables the switch | - |

```javascript
const toggle = document.querySelector('x-switch');

// On/off
toggle.on();
toggle.off();
toggle.toggle();

// Query state
if (toggle.isOn()) {
  console.log('Switch is ON');
}

// Enable/disable
toggle.disable();
toggle.enable();
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:switch:change` | State changes | `{ checked: boolean }` |

```javascript
toggle.addEventListener('wb:switch:change', (e) => {
  console.log('Checked:', e.detail.checked);
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--x-switch-width` | `44px` | Track width |
| `--x-switch-height` | `24px` | Track height |
| `--x-switch-radius` | `9999px` | Track border radius |
| `--x-switch-track-bg` | `var(--bg-tertiary, #d1d5db)` | Track background (off) |
| `--x-switch-track-bg-on` | `var(--primary, #6366f1)` | Track background (on) |
| `--x-switch-thumb-size` | `20px` | Thumb size |
| `--x-switch-thumb-bg` | `#ffffff` | Thumb background |
| `--x-switch-thumb-shadow` | `0 1px 3px rgba(0,0,0,0.2)` | Thumb shadow |
| `--x-switch-transition` | `all 0.2s ease` | Toggle transition |
| `--x-switch-disabled-opacity` | `0.5` | Disabled opacity |
| `--x-switch-label-gap` | `0.5rem` | Gap between switch and label |
| `--x-switch-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.2)` | Focus ring |

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `switch` | Always |
| `aria-checked` | `true/false` | Dynamic |
| `aria-disabled` | `true` | When disabled |

Keyboard support:
- `Space` - Toggle switch
- `Enter` - Toggle switch

## Schema

Location: `src/wb-models/switch.schema.json`

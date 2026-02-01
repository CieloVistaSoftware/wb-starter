# Switch - wb-starter v3.0

Toggle switch for boolean settings.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-switch>` |
| Behavior | `switch` |
| Semantic | `<div>` (role="switch") |
| Base Class | `wb-switch` |
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

## Usage

### Custom Element

```html
<wb-switch label="Dark mode"></wb-switch>
```

### Native Checkbox (Enhanced)

```html
<input type="checkbox" data-wb="switch" data-wb-label="Notifications">
```

### Pre-Checked

```html
<wb-switch label="Enable notifications" checked></wb-switch>
```

### Label Position

```html
<wb-switch label="Left label" labelPosition="start"></wb-switch>
<wb-switch label="Right label" labelPosition="end"></wb-switch>
```

### Sizes

```html
<wb-switch label="Small" size="sm"></wb-switch>
<wb-switch label="Medium" size="md"></wb-switch>
<wb-switch label="Large" size="lg"></wb-switch>
```

### Variants

```html
<wb-switch label="Default" variant="default"></wb-switch>
<wb-switch label="Primary" variant="primary"></wb-switch>
<wb-switch label="Success" variant="success"></wb-switch>
```

### Disabled

```html
<wb-switch label="Unavailable" disabled></wb-switch>
```

### In Forms

```html
<wb-switch 
  label="Subscribe to newsletter" 
  name="subscribe" 
  value="yes">
</wb-switch>
```

## Generated Structure

```html
<div class="wb-switch">
  <span class="wb-switch__label">Dark mode</span>
  <input type="checkbox" class="wb-switch__input">
  <span class="wb-switch__track">
    <span class="wb-switch__thumb"></span>
  </span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-switch` | Always | Base styling |
| `.wb-switch--checked` | `checked` | Checked state |
| `.wb-switch--disabled` | `disabled` | Disabled state |
| `.wb-switch--sm` | `size="sm"` | Small size |
| `.wb-switch--md` | `size="md"` | Medium size |
| `.wb-switch--lg` | `size="lg"` | Large size |
| `.wb-switch--primary` | `variant="primary"` | Primary variant |
| `.wb-switch--success` | `variant="success"` | Success variant |

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
const toggle = document.querySelector('wb-switch');

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
| `--wb-switch-width` | `44px` | Track width |
| `--wb-switch-height` | `24px` | Track height |
| `--wb-switch-radius` | `9999px` | Track border radius |
| `--wb-switch-track-bg` | `var(--bg-tertiary, #d1d5db)` | Track background (off) |
| `--wb-switch-track-bg-on` | `var(--primary, #6366f1)` | Track background (on) |
| `--wb-switch-thumb-size` | `20px` | Thumb size |
| `--wb-switch-thumb-bg` | `#ffffff` | Thumb background |
| `--wb-switch-thumb-shadow` | `0 1px 3px rgba(0,0,0,0.2)` | Thumb shadow |
| `--wb-switch-transition` | `all 0.2s ease` | Toggle transition |
| `--wb-switch-disabled-opacity` | `0.5` | Disabled opacity |
| `--wb-switch-label-gap` | `0.5rem` | Gap between switch and label |
| `--wb-switch-focus-ring` | `0 0 0 3px rgba(99, 102, 241, 0.2)` | Focus ring |

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

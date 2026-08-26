# Switch - wb-starter v3.0

Toggle switch for boolean settings -- a real hidden checkbox driving a themed track/thumb, with size/variant styling and optional theme-control/notify-control wiring.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<div x-switch>` |
| Behavior | `switchInput` (registered as `switch`) |
| Semantic | `<input type="checkbox" role="switch">` |
| Root CSS Class | `x-switch` |
| Category | Forms |
| Schema | `src/wb-models/switch.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | `""` | Label text |
| `checked` | boolean | `false` | Initial on/off state |
| `disabled` | boolean | `false` | Disabled state |
| `name` | string | `""` | Form field name |
| `value` | string | `""` | Form field value when checked |
| `label-position` | string | `"end"` | `start` or `end` |
| `size` | string | `"md"` | `sm`, `md`, `lg` |
| `variant` | string | `"default"` | `primary`, `success` |
| `theme-control` | boolean | -- | When present, the switch drives the page theme (`data-theme`) -- ON = dark, OFF = light |
| `notify-control` | boolean | -- | When present, switching ON fires a real toast notification |

## Usage

### Custom Element

```html
<div x-switch label="Enable notifications"></div>
```

### Checked / Disabled

```html
<div x-switch label="Checked" checked></div>
<div x-switch label="Disabled" disabled></div>
```

### Label Position

```html
<div x-switch label="Label before" label-position="start"></div>
<div x-switch label="Label after" label-position="end"></div>
```

### Sizes and Variants

```html
<div x-switch label="Small" size="sm"></div>
<div x-switch label="Large" size="lg"></div>
<div x-switch label="Primary" variant="primary" checked></div>
<div x-switch label="Success" variant="success" checked></div>
```

### Theme Control

```html
<div x-switch label="Dark mode" theme-control></div>
```

### Notify Control (demonstrates a real effect on activation)

```html
<div x-switch label="Notifications" notify-control></div>
```

### Native Checkbox (Legacy Form)

```html
<input type="checkbox" x-switch>
```

## Generated Structure

```html
<div x-switch class="x-switch--lg x-switch--success" role="switch" aria-checked="true" tabindex="0">
  <input type="checkbox" class="x-switch__input" role="switch" checked>
  <span class="x-switch__track">
    <span class="x-switch__thumb"></span>
  </span>
  <span class="x-switch__label-end">Success</span>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `x-switch` (tag selector) / `.x-switch` | Always | Base layout |
| `.x-switch--{sm,lg}` | `size` (non-`md`) | Track/thumb size |
| `.x-switch--{primary,success}` | `variant` (non-`default`) | Track "on" color |
| `.x-switch__input` | Always | Visually-hidden real checkbox that drives state |
| `.x-switch__track` | Always | Rounded pill background |
| `.x-switch__thumb` | Always | Sliding knob |
| `.x-switch__label-start` / `.x-switch__label-end` | `label` + matching `label-position` | Label text |

## Methods

`switchInput()` (`src/wb-viewmodels/semantics/switch.js`) wires click/keyboard toggling and the real checkbox directly. The methods below come from `switch.schema.json`'s `$methods`, bound generically by the schema builder (`src/core/mvvm/schema-builder.js`). `toggle()` resolves to the schema builder's real generic implementation (toggles `element.hidden`, **not** the on/off state); `on`/`off`/`isOn`/`enable`/`disable` have no matching generic implementation and fall back to stubs that dispatch `wb:{method}`.

| Method | Description |
|--------|-------------|
| `on()` | Declared (generic stub -- click the switch, or set `input.checked = true` and dispatch `change`, instead) |
| `off()` | Declared (generic stub) |
| `toggle()` | Generic visibility toggle (`element.hidden`) -- not an on/off toggle |
| `isOn()` | Declared (generic stub -- read `input.checked` instead) |
| `enable()` | Declared (generic stub -- clear the `disabled` attribute instead) |
| `disable()` | Declared (generic stub -- set the `disabled` attribute instead) |

For real on/off control, click the switch or drive the underlying checkbox directly.

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:switch:change` | Fired whenever the switch is toggled (click, Enter/Space, or a direct click on the hidden input) | `{ checked: boolean }` |

```html
<div x-demo events="wb:switch:change">
<div x-switch label="Notify me"></div>
</div>
```

```javascript
document.querySelector('x-switch').addEventListener('wb:switch:change', (e) => {
  console.log('Switch is now:', e.detail.checked);
});
```

## CSS API

| Variable | Used For | Description |
|----------|----------|--------------|
| `--bg-tertiary` | Track background (off) | -- |
| `--primary` | `variant="primary"` track (on) | -- |
| `--success-color` | `variant="success"` track (on) | -- |
| `--border-color` | Focus ring base | -- |
| `--text-primary` / `--text-secondary` | Label text | -- |

There are no dedicated `--x-switch-*` custom properties in the shipped CSS (`src/styles/behaviors/switch.css`) -- size/variant come from modifier classes, not overridable custom properties.

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="switch"` | Set on both the host and the real checkbox |
| `aria-checked` | Reflects the current checked state on the host |
| `aria-disabled` | Set when `disabled` |
| `tabindex="0"` | Makes the host keyboard-focusable (unless disabled) |

Keyboard support:
- `Space` and `Enter` both toggle a focused switch.

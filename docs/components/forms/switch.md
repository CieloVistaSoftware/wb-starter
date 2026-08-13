# Switch - wb-starter v3.0

Toggle switch for boolean settings -- a real hidden checkbox driving a themed track/thumb, with size/variant styling and optional theme-control/notify-control wiring.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-switch>` |
| Behavior | `switchInput` (registered as `switch`) |
| Semantic | `<input type="checkbox" role="switch">` |
| Root CSS Class | `wb-switch` |
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
<wb-switch label="Enable notifications"></wb-switch>
```

### Checked / Disabled

```html
<wb-switch label="Checked" checked></wb-switch>
<wb-switch label="Disabled" disabled></wb-switch>
```

### Label Position

```html
<wb-switch label="Label before" label-position="start"></wb-switch>
<wb-switch label="Label after" label-position="end"></wb-switch>
```

### Sizes and Variants

```html
<wb-switch label="Small" size="sm"></wb-switch>
<wb-switch label="Large" size="lg"></wb-switch>
<wb-switch label="Primary" variant="primary" checked></wb-switch>
<wb-switch label="Success" variant="success" checked></wb-switch>
```

### Theme Control

```html
<wb-switch label="Dark mode" theme-control></wb-switch>
```

### Notify Control (demonstrates a real effect on activation)

```html
<wb-switch label="Notifications" notify-control></wb-switch>
```

### Native Checkbox (Legacy Form)

```html
<input type="checkbox" x-switch>
```

## Generated Structure

```html
<wb-switch class="wb-switch--lg wb-switch--success" role="switch" aria-checked="true" tabindex="0">
  <input type="checkbox" class="wb-switch__input" role="switch" checked>
  <span class="wb-switch__track">
    <span class="wb-switch__thumb"></span>
  </span>
  <span class="wb-switch__label-end">Success</span>
</wb-switch>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `wb-switch` (tag selector) / `.wb-switch` | Always | Base layout |
| `.wb-switch--{sm,lg}` | `size` (non-`md`) | Track/thumb size |
| `.wb-switch--{primary,success}` | `variant` (non-`default`) | Track "on" color |
| `.wb-switch__input` | Always | Visually-hidden real checkbox that drives state |
| `.wb-switch__track` | Always | Rounded pill background |
| `.wb-switch__thumb` | Always | Sliding knob |
| `.wb-switch__label-start` / `.wb-switch__label-end` | `label` + matching `label-position` | Label text |

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
<wb-demo events="wb:switch:change">
<wb-switch label="Notify me"></wb-switch>
</wb-demo>
```

```javascript
document.querySelector('wb-switch').addEventListener('wb:switch:change', (e) => {
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

There are no dedicated `--wb-switch-*` custom properties in the shipped CSS (`src/styles/behaviors/switch.css`) -- size/variant come from modifier classes, not overridable custom properties.

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="switch"` | Set on both the host and the real checkbox |
| `aria-checked` | Reflects the current checked state on the host |
| `aria-disabled` | Set when `disabled` |
| `tabindex="0"` | Makes the host keyboard-focusable (unless disabled) |

Keyboard support:
- `Space` and `Enter` both toggle a focused switch.

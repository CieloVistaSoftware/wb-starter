# Switch

Toggle switch for boolean settings

## Type — new capability

`x-switch` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<div x-switch label="Publish to staging on merge" name="auto-deploy" checked></div>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Switch label |
| `checked` | `boolean` | `false` | On/off state |
| `disabled` | `boolean` | `false` | Disabled state |
| `name` | `string` | — | Form field name |
| `value` | `string` | — | Form field value when checked |
| `label-position` | `start` · `end` | `end` |  |
| `size` | `sm` · `md` · `lg` | `md` |  |
| `variant` | `default` · `primary` · `success` | `default` |  |

## Events

- `wb:switch:change` — Fired when state changes

## Methods

- `on()` — Turns switch on
- `off()` — Turns switch off
- `toggle()` — Toggles switch state
- `isOn()` — Returns on/off state
- `enable()` — Enables the switch
- `disable()` — Disables the switch

## Live example

See `x-switch` on the [Behaviors showcase](/?page=behaviors) — search for `x-switch` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/switch.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

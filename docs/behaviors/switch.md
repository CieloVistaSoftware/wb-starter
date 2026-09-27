# Switch

`x-switch` builds an on/off switch with its `label`, backed by a real checkbox so it submits with a form under `name`. Changes fire `wb:switch:change`.

## Usage

<div x-demo>
<div x-switch label="Publish to staging on merge" name="auto-deploy" checked></div>
</div>

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

<sub>Schema: [`switch.schema.json`](../../src/wb-models/switch.schema.json)</sub>

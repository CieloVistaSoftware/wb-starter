# Stepper Behavior

`x-stepper` builds a number field with − and + buttons that change the value by `step`, never going below `min` or above `max`.

## Usage

<div x-demo>
<div x-stepper value="5" min="0" max="10"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `0` | Maximum value |
| `step` | `number` | `0` | Step increment |

<sub>Schema: [`stepper.schema.json`](../../src/wb-models/stepper.schema.json)</sub>

# Fireworks

`x-fireworks` launches a burst of firework particles from the element each time it is clicked; `count` sets particles per burst and `colors` their palette.

## Usage

<div x-demo>
<button x-fireworks>Launch</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | `30` | Particles per burst |
| `label` | `string` | `Fireworks!` | Trigger button label |
| `showButton` | `boolean` | `true` | Show trigger button |
| `repeat` | `boolean` | `false` | Loop animation |
| `delay` | `string` | `0s` | Start delay |
| `duration` | `string` | `1.5s` | Animation duration |
| `colors` | `string` | `["#ff0","#f00","#0ff","#f0f"]` | Particle colors as JSON array |

## Events

- `wb:fireworks:start` — Animation started
- `wb:fireworks:end` — Animation ended

## Methods

- `fire()` — Triggers fireworks
- `stop()` — Stops animation

<sub>Schema: [`fireworks.schema.json`](../../src/wb-models/fireworks.schema.json)</sub>

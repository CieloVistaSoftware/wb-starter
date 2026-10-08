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
| `label` | text | `Fireworks!` | Trigger button label |
| `showButton` | `boolean` | `true` | Show trigger button |
| `repeat` | `boolean` | `false` | Loop animation |
| `delay` | CSS duration, e.g. `0.5s` | `0s` | Start delay |
| `duration` | CSS duration, e.g. `3s` | `1.5s` | Animation duration |
| `colors` | JSON array of CSS colours | `["#ff0","#f00","#0ff","#f0f"]` | Particle colors as JSON array |

## Methods

- `fire()` — Triggers fireworks
- `stop()` — Stops animation

<sub>Schema: [`fireworks.schema.json`](../../src/wb-models/fireworks.schema.json)</sub>

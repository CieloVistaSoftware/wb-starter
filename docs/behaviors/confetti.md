# Confetti

`x-confetti` fires a burst of coloured confetti from the element each time it is clicked; `count` sets how many pieces and `colors` their palette. Use it on a button that completes something worth celebrating.

## Usage

<div x-demo>
<button x-confetti>Celebrate</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | `50` | Number of particles |
| `label` | text | `Fire Confetti!` | Trigger button label |
| `showButton` | `boolean` | `true` | Show trigger button |
| `delay` | CSS duration, e.g. `0.5s` | `0s` | Start delay |
| `duration` | CSS duration, e.g. `3s` | `3s` | Animation duration |
| `colors` | JSON array of CSS colours | `["#ff0","#f0f","#0ff","#0f0","#f00"]` | Particle colors as JSON array |

## Events

- `wb:confetti:start` — Animation started
- `wb:confetti:end` — Animation ended

## Methods

- `fire()` — Triggers confetti
- `stop()` — Stops animation

<sub>Schema: [`confetti.schema.json`](../../src/wb-models/confetti.schema.json)</sub>

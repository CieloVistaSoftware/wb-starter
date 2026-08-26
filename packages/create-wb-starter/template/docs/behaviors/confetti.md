# Confetti

Confetti particle animation effect

Applies to `<div>`, and to any element carrying `x-confetti`.

## Usage

```html
<button variant="primary" x-confetti>🎊 Confetti</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | `50` | Number of particles |
| `label` | `string` | `Fire Confetti!` | Trigger button label |
| `show-button` | `boolean` | `true` | Show trigger button |
| `repeat` | `boolean` | `false` | Loop animation |
| `delay` | `string` | `0s` | Start delay |
| `duration` | `string` | `3s` | Animation duration |
| `colors` | `string` | `["#ff0","#f0f","#0ff","#0f0","#f00"]` | Particle colors as JSON array |

## Events

- `wb:confetti:start` — Animation started
- `wb:confetti:end` — Animation ended

## Methods

- `fire()` — Triggers confetti
- `stop()` — Stops animation

## Live example

See `x-confetti` on the [Behaviors showcase](/?page=behaviors) — search for `x-confetti` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/confetti.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

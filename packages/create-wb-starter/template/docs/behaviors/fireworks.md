# Fireworks

Fireworks particle burst animation effect

## Type — new capability

`x-fireworks` adds behavior that no HTML element implies. Nothing about a tag says "ripple" or "tooltip", so this is always opted into by attribute, on whatever element you already chose.

### How to write it

```html
<button variant="primary" x-fireworks>
  x-fireworks · variant: primary
</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | `30` | Particles per burst |
| `label` | `string` | `Fireworks!` | Trigger button label |
| `show-button` | `boolean` | `true` | Show trigger button |
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

## Live example

See `x-fireworks` on the [Behaviors showcase](/?page=behaviors) — search for `x-fireworks` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/fireworks.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

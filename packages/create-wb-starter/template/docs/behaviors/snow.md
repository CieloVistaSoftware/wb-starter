# Snow

Falling snowflake animation effect

Applies to `<div>`, and to any element carrying `x-snow`.

## Usage

```html
<button variant="primary" x-snow>❄️ Snow</button>
```

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | `30` | Number of snowflakes |
| `label` | `string` | `Let it Snow!` | Trigger button label |
| `show-button` | `boolean` | `true` | Show trigger button |
| `repeat` | `boolean` | `true` | Loop animation |
| `delay` | `string` | `0s` | Start delay |
| `duration` | `string` | `8s` | Fall duration |

## Events

- `wb:snow:start` — Animation started
- `wb:snow:stop` — Animation stopped

## Methods

- `start()` — Starts snow
- `stop()` — Stops snow
- `toggle()` — Toggles snow

## Live example

See `x-snow` on the [Behaviors showcase](/?page=behaviors) — search for `x-snow` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/snow.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

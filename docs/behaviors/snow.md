# Snow

`x-snow` makes the element a button that starts or stops snowflakes falling over the page; `count` sets how many and `duration` how long each takes to fall.

## Usage

<div x-demo>
<button x-snow>Let it snow</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | `30` | Number of snowflakes |
| `label` | text | `Let it Snow!` | Trigger button label |
| `showButton` | `boolean` | `true` | Show trigger button |
| `repeat` | `boolean` | `true` | Loop animation |
| `delay` | CSS duration, e.g. `0.5s` | `0s` | Start delay |
| `duration` | CSS duration, e.g. `3s` | `8s` | Fall duration |

## Events

- `wb:snow:start` — Animation started
- `wb:snow:stop` — Animation stopped

## Methods

- `start()` — Starts snow
- `stop()` — Stops snow
- `toggle()` — Toggles snow

<sub>Schema: [`snow.schema.json`](../../src/wb-models/snow.schema.json)</sub>

# Clock

`x-clock` shows the current time in the element and updates it every second. `format="12"` switches to a 12-hour clock with AM/PM, `show-seconds="false"` drops the seconds, and `variant="led"` gives a green seven-segment look.

## Usage

<div x-demo>
<div x-clock></div>
<div x-clock format="12" variant="led"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `string` | `digital` | Clock face: `digital` (default) or the analogue rendering. |
| `format` | `string` | `24` | `24` (default) or `12` for a 12-hour clock with AM/PM. |
| `show-seconds` | `string` | — | Show the seconds field. On unless set to `"false"`. |

<sub>Schema: [`clock.schema.json`](../../src/wb-models/clock.schema.json)</sub>

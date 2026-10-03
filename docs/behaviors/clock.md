# Clock

`x-clock` shows the current time in the element and updates it every second. `format="12"` switches to a 12-hour clock with AM/PM, `show-seconds="false"` drops the seconds, and `variant="led"` gives a green seven-segment look.

## Usage

<div x-demo>
<div x-clock></div>
<div x-clock format="12" variant="led"></div>
<div x-clock variant="analog" show-seconds="false"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `variant` | `digital` · `led` · `analog` | `digital` | Clock face: `digital` (bold, default), `led` (green seven-segment) or `analog` (the same time text, not bold -- there is no dial; `analogue` is accepted). Any other value renders `digital` and logs a warning naming these three. |
| `format` | `24` · `12` | `24` | `24` (default) or `12` for a 12-hour clock with AM/PM. |
| `show-seconds` | `true` · `false` | `true` | Show the seconds field. On unless set to `"false"`. |

<sub>Schema: [`clock.schema.json`](../../src/wb-models/clock.schema.json)</sub>

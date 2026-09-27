# Control

`x-control` adds the `x-control` class to the element and does nothing else; no stylesheet targets that class yet. The former button treatment (`action="move-up"` and so on) never ran and is not supported — use the `x-move*` behaviors for that.

## Usage

<div x-demo>
<div x-control label="Threshold">
  <input type="range" min="0" max="100" value="60">
</div>
</div>

<sub>Schema: [`control.schema.json`](../../src/wb-models/control.schema.json)</sub>

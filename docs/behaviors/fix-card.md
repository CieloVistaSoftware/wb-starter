# Fix Card

`x-fix-card` displays one entry from the project's fix log — status, cause, file and code change — when a fix object is assigned to the element's `data` property from script. Written as a plain attribute it only adds the `x-fixcard` class (the function name `fixCard` lowercased, #1096; the attribute stays `x-fix-card`); there is no attribute-only form yet (#660).

## Usage

<div x-demo>
<div x-fix-card>Fix #365: fix-card never upgraded</div>
</div>

<sub>Schema: [`fix-card.schema.json`](../../src/wb-models/fix-card.schema.json)</sub>

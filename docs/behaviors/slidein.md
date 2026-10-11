# Slidein

`x-slidein` slides the element in from the `direction` edge (`left`, `right`, `up` or `down`) over 0.5 s each time it is clicked.

## Usage

<figure x-demo>
<button class="effect-demo" x-slidein direction="left">Click to slide in</button>
</figure>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `direction` | `left` · `right` · `up` · `down` | `left` | Edge the element slides in from: `left` (default), `right`, `up` (enters from below, moving up) or `down` (enters from above, moving down). |

<sub>Schema: [`slidein.schema.json`](../../src/wb-models/slidein.schema.json)</sub>

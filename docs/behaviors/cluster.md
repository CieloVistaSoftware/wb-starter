# Cluster

`x-cluster` lays its children out in a wrapping row with a fixed `gap`, centred on a shared line. Use it for groups of small items of different widths, such as tags or buttons, that should flow onto a new line when space runs out.

## Usage

<div x-demo>
<div x-cluster gap="0.5rem">
  <span x-badge label="typescript"></span>
  <span x-badge label="playwright"></span>
  <span x-badge label="light-dom"></span>
  <span x-badge label="no-build"></span>
  <span x-badge label="composition"></span>
</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `gap` | `string` | `1rem` | Space between clustered items, as a CSS length. Defaults to `1rem`. |
| `justify` | `string` | `flex-start` | How items are distributed along the row — CSS `justify-content`. Defaults to `flex-start`. |
| `align` | `string` | `center` | How items line up across the row — CSS `align-items`. Defaults to `center`, which is what keeps mixed-height chips and buttons on a shared centre line. |

<sub>Schema: [`cluster.schema.json`](../../src/wb-models/cluster.schema.json)</sub>

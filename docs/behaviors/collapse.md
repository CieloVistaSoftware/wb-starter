# Collapse

`x-collapse` hides the element's content behind a button labelled with `heading`; clicking it shows or hides the content. Add `expanded` to start open, or `target` to toggle some other element instead. For new pages prefer `<details>`, which needs no script.

## Usage

<div x-demo>
<div x-collapse heading="Environment" expanded>
  <p>Node 24.13, Chrome 139, Windows 11.</p>
</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `heading` | `string` | `Toggle` | Text displayed on the clickable trigger button |
| `expanded` | `boolean` | `false` | Whether the content is initially visible |
| `target` | `string` | — | CSS selector of a remote element to toggle instead of wrapping content |

<sub>Schema: [`collapse.schema.json`](../../src/wb-models/collapse.schema.json)</sub>

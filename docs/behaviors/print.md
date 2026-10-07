# Print

`x-print` makes the element a button that prints the page, or only the element matched by `target`. With no text of its own it shows the `label`, "🖨️ Print" by default.

## Usage

<div x-demo>
<button x-print></button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `target` | CSS selector | — | CSS selector for the region to print. Empty prints the whole page. |
| `label` | text | `🖨️ Print` | Button label. Defaults to `🖨️ Print`. |

<sub>Schema: [`print.schema.json`](../../src/wb-models/print.schema.json)</sub>

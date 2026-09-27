# Fullscreen

`x-fullscreen` makes the element a button that expands the page (or the element matched by `target`) to full screen and back. With no text of its own it shows the `label`, "⛶ Fullscreen" by default.

## Usage

<div x-demo>
<button x-fullscreen></button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `target` | `string` | — | CSS selector for the element to expand. Empty means the document element. |
| `label` | `string` | `⛶ Fullscreen` | Button label when not fullscreen. Defaults to `⛶ Fullscreen`. |

<sub>Schema: [`fullscreen.schema.json`](../../src/wb-models/fullscreen.schema.json)</sub>

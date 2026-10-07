# Toggle

`x-toggle` switches a CSS class (`toggle-class`, default `active`) on the element matched by `target` each time it is clicked, and on itself too unless `toggle-self="false"`. It changes nothing visible unless that class is styled.

## Usage

<div x-demo>
<button x-toggle target="#x-ex-toggle-panel" toggle-class="sr-only" toggle-self="false">Show / hide the note</button>
<p id="x-ex-toggle-panel">This note is hidden by the <code>sr-only</code> class on the first click and shown again on the next.</p>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `target` | CSS selector | — | Selector of target element |

<sub>Schema: [`toggle.schema.json`](../../src/wb-models/toggle.schema.json)</sub>

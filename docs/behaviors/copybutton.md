# Copybutton

`x-copybutton` makes the element copy the text of another element when clicked: the one matched by `copyTarget` (or the selector given as the attribute value), or its own text when there is none. The label changes to the `copyFeedback` message for `copyDuration` milliseconds.

## Usage

<div x-demo>
<button x-copybutton copyTarget="#x-ex-copy-source">Copy</button>
<code id="x-ex-copy-source">npm run test:compliance</code>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `x-copybutton` | CSS selector | — | The attribute value doubles as the CSS selector for what to copy — `x-copybutton="#snippet"`. Leave it empty to copy the host element's own text. |
| `label` | text | `Copy` | Accessible name for the button (`aria-label`/`title`). Defaults to `Copy`. |
| `position` | `top-left` · `top-right` · `bottom-left` · `bottom-right` | `top-right` | Corner the button is placed in, e.g. `top-right` (default). |
| `copyFeedback` | text | `Copied ✓` | Message shown after a successful copy. Defaults to `Copied!`. |
| `copyDuration` | milliseconds | `2000` | How long the feedback stays visible, in milliseconds. Defaults to `2000`. |
| `copyTarget` | CSS selector | — | CSS selector for the element whose text is copied. Same as passing the selector to `x-copybutton` directly; `target` is read first. |

## Events

- `wb:copy:success` — The text was written to the clipboard; `detail.text` holds it.
- `wb:copy:error` — The clipboard write was refused.

<sub>Schema: [`copybutton.schema.json`](../../src/wb-models/copybutton.schema.json)</sub>

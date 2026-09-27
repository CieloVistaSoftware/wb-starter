# Copybutton

`x-copybutton` makes the element copy the text of another element when clicked: the one matched by `copy-target` (or the selector given as the attribute value), or its own text when there is none. The label changes to the `copy-feedback` message for `copy-duration` milliseconds.

## Usage

<div x-demo>
<button x-copybutton copy-target="#x-ex-copy-source">Copy</button>
<code id="x-ex-copy-source">npm run test:compliance</code>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `x-copybutton` | `string` | — | The attribute value doubles as the CSS selector for what to copy — `x-copybutton="#snippet"`. Leave it empty to copy the host element's own text. |
| `label` | `string` | `Copy` | Accessible name for the button (`aria-label`/`title`). Defaults to `Copy`. |
| `position` | `string` | `top-right` | Corner the button is placed in, e.g. `top-right` (default). |
| `copy-feedback` | `string` | `Copied ✓` | Message shown after a successful copy. Defaults to `Copied!`. |
| `copy-duration` | `string` | `2000` | How long the feedback stays visible, in milliseconds. Defaults to `2000`. |
| `copy-target` | `string` | — | CSS selector for the element whose text is copied. Same as passing the selector to `x-copybutton` directly; `target` is read first. |

## Events

- `wb:copy:success` — The text was written to the clipboard; `detail.text` holds it.
- `wb:copy:error` — The clipboard write was refused.

<sub>Schema: [`copybutton.schema.json`](../../src/wb-models/copybutton.schema.json)</sub>

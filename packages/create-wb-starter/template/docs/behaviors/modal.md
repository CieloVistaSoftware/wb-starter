# Modal

`x-modal` on a button makes it open a modal dialog built from `modal-title` and `modal-content`, with OK and Cancel buttons, Escape and backdrop-click closing. It is the same behavior as `<dialog>`, for when you do not want to write the dialog markup yourself.

## Usage

<div x-demo>
<button x-modal modal-title="Keyboard shortcuts" modal-content="Press Ctrl+K to search and Esc to close panels.">Show shortcuts</button>
</div>

<sub>Schema: [`modal.schema.json`](../../src/wb-models/modal.schema.json)</sub>

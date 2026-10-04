# Notes

`x-notes` adds a notes drawer to the page: a panel with a text area that can sit on either side or open as a modal, resized by dragging, and saved to `localStorage` as you type.

## Usage

<div x-demo>
<aside x-notes position="right" default-width="280px">
  <p>Notes stay pinned beside the content while you scroll.</p>
</aside>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `position` | `left` · `right` · `modal` | `left` |  |
| `max-width` | `string` | `50vw` | Max width when resizing |
| `min-width` | `string` | `200px` | Min width when resizing |
| `default-width` | `string` | `320px` | Default width |
| `auto-save` | `boolean` | `true` | Auto-save to localStorage |
| `placeholder` | `string` | `Add your notes here...` | Textarea placeholder |

## Events

- `wb:notes:open` — Drawer opened
- `wb:notes:close` — Drawer closed
- `wb:notes:save` — Notes saved
- `wb:notes:copy` — Notes copied to clipboard
- `wb:notes:clear` — Notes cleared
- `wb:notes:position` — Position changed

## Methods

- `open()` — Opens the drawer
- `close()` — Closes the drawer
- `toggle()` — Toggles drawer
- `setPosition()` — Sets position
- `save()` — Saves notes to JSON
- `copy()` — Copies notes to clipboard
- `clear()` — Clears all notes
- `getContent()` — Gets notes content
- `setContent()` — Sets notes content

<sub>Schema: [`notes.schema.json`](../../src/wb-models/notes.schema.json)</sub>

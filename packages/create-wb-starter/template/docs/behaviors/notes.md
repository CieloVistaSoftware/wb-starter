# Notes

Slide-out notes drawer with multiple display modes

Applies to `<aside>`, and to any element carrying `x-notes`.

## Usage

```html
<aside x-notes>
  …
</aside>
```

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

## Live example

See `x-notes` on the [Behaviors showcase](/?page=behaviors) — search for `x-notes` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/notes.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

# Dialog

A plain `<dialog>` gets a styled header with its first heading as the title, a close button, and closing on Escape and on a backdrop click. Open it with `showModal()`; `size` sets the width.

## Usage

<div x-demo>
<button onclick="document.getElementById('delete-branch').showModal()">
  Open the dialog
</button>
<dialog id="delete-branch" size="md">
  <h2>Delete branch?</h2>
  <p>fix/706-dropdown will be removed. This cannot be undone.</p>
</dialog>
</div>

No attribute needed on `<dialog>`. Don't add `x-dialog` to it (#746).

On another element, write `x-dialog`:

```html
<button x-dialog modal-title="Delete branch?" modal-content="fix/706-dropdown will be removed. This cannot be undone.">Delete branch…</button>
```

`<dialog x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Dialog title |
| `content` | `string` | — | Dialog body content |
| `size` | `sm` · `md` · `lg` · `xl` · `full` | `md` |  |
| `close-on-backdrop` | `boolean` | `true` | Close on backdrop click |
| `close-on-escape` | `boolean` | `true` | Close on Escape key |
| `show-close` | `boolean` | `true` | Show close button |
| `variant` | `default` · `centered` · `fullscreen` | `default` |  |

## Events

- `wb:dialog:open` — Dialog opened
- `wb:dialog:close` — Dialog closed
- `wb:dialog:cancel` — Dialog cancelled (Escape/backdrop)

## Methods

- `open()` — Opens the dialog
- `close()` — Closes the dialog
- `toggle()` — Toggles the dialog
- `isOpen()` — Returns open state
- `setContent()` — Updates dialog content
- `setTitle()` — Updates dialog title

## Accessibility

- **role** — dialog
- **ariaModal** — true
- **ariaLabelledBy** — dialog title id

<sub>Schema: [`dialog.schema.json`](../../src/wb-models/dialog.schema.json)</sub>

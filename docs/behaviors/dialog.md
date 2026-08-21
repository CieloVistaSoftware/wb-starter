# Dialog

Modal dialog using native HTML5 dialog element

Applies to `<dialog>`, and to any element carrying `x-dialog`.

## Usage

```html
<dialog>
  …
</dialog>
```

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

## Live example

See `x-dialog` on the [Behaviors showcase](/?page=behaviors) — search for `x-dialog` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/dialog.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

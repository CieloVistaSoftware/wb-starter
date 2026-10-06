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
<button x-dialog modalTitle="Delete branch?" modalContent="fix/706-dropdown will be removed. This cannot be undone.">Delete branch…</button>
```

`<dialog x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | — | Dialog title |
| `content` | `string` | — | Dialog body content |
| `size` | `sm` · `md` · `lg` · `xl` · `full` | `md` |  |
| `closeOnBackdrop` | `boolean` | `true` | Close when the user clicks **outside** the dialog. The *backdrop* is the dimmed area the browser paints over the rest of the page while a modal is open (`::backdrop`). |
| `closeOnEscape` | `boolean` | `true` | Close when the user presses Escape |
| `showClose` | `boolean` | `true` | Show the × button in the header |
| `variant` | `default` · `centered` · `fullscreen` | `default` |  |

These three are on by default, so you only ever write them to turn something
**off**:

```html
<dialog showClose="false" closeOnBackdrop="false">
  <h2>Confirm the merge</h2>
  <p>Escape still gets you out.</p>
</dialog>
```

### What `"false"` means

`"false"` and `"0"` turn a boolean option off. The attribute being present is
not what switches it on — its value is read:

```html
<dialog showClose>              <!-- on  -->
<dialog showClose="true">       <!-- on  -->
<dialog showClose="false">      <!-- OFF -->
<dialog showClose="0">          <!-- OFF -->
```

This is worth spelling out because it used to be untrue: `showClose="false"`
showed the close button anyway (#747). The old dashed spellings
(`showClose`, `closeOnBackdrop`, `closeOnEscape`) are still read, so
pages already written keep working — but no attribute name carries a dash, so
the camelCase names above are the ones to write (#1125).

Leaving an authored `<dialog>` with every exit turned off is a trap: Escape and
the backdrop are not visible affordances, so with `showClose="false"` the only
way out must be a button you put in the markup yourself.

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

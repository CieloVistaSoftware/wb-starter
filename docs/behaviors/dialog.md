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

<div x-demo>
<button x-dialog modalTitle="Delete branch?" modalContent="fix/706-dropdown will be removed. This cannot be undone.">Delete branch…</button>
</div>

`<dialog x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `title` | text | — | Dialog title |
| `content` | text or HTML | — | Dialog body content |
| `size` | `sm` · `md` · `lg` · `xl` · `full` | `md` |  |
| `closeOnBackdrop` | `boolean` | `true` | Close when the user clicks **outside** the dialog. The *backdrop* is the dimmed area the browser paints over the rest of the page while a modal is open (`::backdrop`). |
| `closeOnEscape` | `boolean` | `true` | Close when the user presses Escape. Stays on while `showClose` is `false`: then Escape is the way out. |
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

### A dialog always has an exit

Hiding the close button is allowed; leaving no way out is not. With
`showClose="false"`, Escape is the dialog's exit, so it cannot be turned off
too (#794):

```html
<dialog showClose="false" closeOnEscape="false">  <!-- Escape still closes it -->
```

That combination is refused: Escape stays on, and the console says why.
`closeOnBackdrop="false"` is fine with either, because Escape is the
platform's own way out of a modal and the one a keyboard user reaches for. A
backdrop click is something a user finds by accident. `dialog.schema.json`
states the same rule as an `if`/`then`.

### Layout

Every dialog has the same three parts as a card, by tag:

| Part | Element | Class |
| --- | --- | --- |
| Header (title, ×) | `<header>` | `x-dialog__header` |
| Content | `<main>` | `x-dialog__main` |
| Cancel / OK (a dialog built from a trigger) | `<footer>` | `x-dialog__footer` |

The `<dialog>` frame has no padding; the parts carry it, so content sits at
least 1rem from the frame (DEMOS-AND-DOCS-STANDARDS.md §13). An authored
`<dialog>` gets the header and main built around its own markup: its first
heading moves into the header, and the rest moves into `<main>`.

## Events

- `wb:dialog:open` — Dialog opened
- `wb:dialog:close` — Dialog closed
- `wb:dialog:cancel` — Dialog cancelled (Escape/backdrop)
- `wb:dialog:ok` — The dialog's confirm button is clicked

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

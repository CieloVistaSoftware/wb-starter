# Confirm

`x-confirm` puts a confirmation dialog in front of a click: the dialog shows `confirmTitle` and `confirmMessage` with OK and Cancel buttons, and fires `wb:confirm:ok` or `wb:confirm:cancel`. Put it on the button whose action is hard to undo.

## Usage

<div x-demo>
<button x-confirm confirmTitle="Delete branch?" confirmMessage="fix/706-dropdown will be removed. This cannot be undone.">Delete branch</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `heading` | `string` | `Confirm` | Dialog heading. Only used when `confirmTitle` is absent. |
| `message` | `string` | `Are you sure?` | Body text. Only used when `confirmMessage` is absent. |
| `confirmText` | `string` | `OK` | Label on the confirming button. Defaults to `OK`. |
| `cancelText` | `string` | `Cancel` | Label on the dismissing button. Defaults to `Cancel`. |
| `confirmTitle` | `string` | — | Dialog heading. Read BEFORE `heading`; defaults to `Confirm`. |
| `confirmMessage` | `string` | — | Body text. Read BEFORE `message`; defaults to `Are you sure?`. |

## Events

- `wb:confirm:cancel` — The dialog was dismissed with Cancel.
- `wb:confirm:ok` — The user pressed OK.

<sub>Schema: [`confirm.schema.json`](../../src/wb-models/confirm.schema.json)</sub>

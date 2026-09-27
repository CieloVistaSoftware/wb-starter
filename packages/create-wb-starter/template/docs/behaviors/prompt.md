# Prompt

`x-prompt` makes a click open a dialog that asks for a line of text, with `prompt-title`, `prompt-message`, a `placeholder` and an optional `default-value`. OK fires `wb:prompt:ok` with the entered text.

## Usage

<div x-demo>
<button x-prompt prompt-title="Rename file" prompt-message="New name:" default-value="notes.md">Rename…</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `heading` | `string` | `Input` | Dialog heading. Only used when `prompt-title` is absent. |
| `message` | `string` | — | Body text. Only used when `prompt-message` is absent. |
| `placeholder` | `string` | — | Placeholder shown in the empty input. |
| `default-value` | `string` | — | Value the input starts with, already selected so typing replaces it. |
| `prompt-title` | `string` | — | Dialog heading. Read BEFORE `heading`; defaults to `Input`. |
| `prompt-message` | `string` | — | Body text above the field. Read BEFORE `message`. |

## Events

- `wb:prompt:cancel` — The dialog was dismissed with Cancel.
- `wb:prompt:ok` — The user pressed OK; `detail.value` is the entered text.

<sub>Schema: [`prompt.schema.json`](../../src/wb-models/prompt.schema.json)</sub>

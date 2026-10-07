# Prompt

`x-prompt` makes a click open a dialog that asks for a line of text, with `promptTitle`, `promptMessage`, a `placeholder` and an optional `defaultValue`. OK fires `wb:prompt:ok` with the entered text.

## Usage

<div x-demo>
<button x-prompt promptTitle="Rename file" promptMessage="New name:" defaultValue="notes.md">Rename…</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `heading` | text | `Input` | Dialog heading. Only used when `promptTitle` is absent. |
| `message` | text | — | Body text. Only used when `promptMessage` is absent. |
| `placeholder` | text | — | Placeholder shown in the empty input. |
| `defaultValue` | text | — | Value the input starts with, already selected so typing replaces it. |
| `promptTitle` | text | — | Dialog heading. Read BEFORE `heading`; defaults to `Input`. |
| `promptMessage` | text | — | Body text above the field. Read BEFORE `message`. |

## Events

- `wb:prompt:cancel` — The dialog was dismissed with Cancel.
- `wb:prompt:ok` — The user pressed OK; `detail.value` is the entered text.

<sub>Schema: [`prompt.schema.json`](../../src/wb-models/prompt.schema.json)</sub>

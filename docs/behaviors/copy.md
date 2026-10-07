# Copy

`x-copy` copies text to the clipboard when the element is clicked: the value of `copy-text`, or the text of the element matched by `copyTarget`. The element's label briefly changes to "Copied!" and `wb:copy:success` fires.

## Usage

<div x-demo>
<button x-copy copy-text="npm run test:compliance">Copy the test command</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `text` | text | — | Text to copy |
| `target` | CSS selector | — | Selector of element to copy from |

<sub>Schema: [`copy.schema.json`](../../src/wb-models/copy.schema.json)</sub>

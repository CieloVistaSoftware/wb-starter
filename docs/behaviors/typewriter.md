# Typewriter

`x-typewriter` types the element's text (or `text`) out one character at a time, `speed` milliseconds apart, with a blinking cursor unless `cursor="false"`.

## Usage

<div x-demo>
<p x-typewriter speed="45">Zero build. Real behaviors. Light DOM only.</p>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `speed` | `string` | `50` | Milliseconds between characters. Defaults to `50` — lower is faster. |
| `text` | `string` | — | Text to type out. Falls back to the element's existing `textContent`, so it can be left off when the content is already in the markup. |
| `cursor` | `boolean` | `true` | Show the blinking caret. `cursor="false"` turns it off; it is a caret, not a character. |

<sub>Schema: [`typewriter.schema.json`](../../src/wb-models/typewriter.schema.json)</sub>

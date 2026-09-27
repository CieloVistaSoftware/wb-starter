# Markdown to HTML

`x-mdhtml` fetches the Markdown file at `src` (or reads its own text) and renders it as HTML in place, including live `x-demo` examples. This documentation viewer uses it.

## Usage

<div x-demo>
<div x-mdhtml src="/docs/behaviors/x-copy.md"></div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | `#` | Path to external markdown file |
| `sanitize` | `boolean` | `true` |  |
| `gfm` | `boolean` | `true` |  |

<sub>Schema: [`mdhtml.schema.json`](../../src/wb-models/mdhtml.schema.json)</sub>

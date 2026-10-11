# Markdown to HTML

`x-mdhtml` fetches the Markdown file at `src` (or reads its own text) and renders it as HTML in place, including live `x-demo` examples. This documentation viewer uses it.

## Usage

<figure x-demo>
<div x-mdhtml src="/docs/behaviors/copy.md"></div>
</figure>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `src` | path or URL of a Markdown file | `#` | Path to external markdown file |
| `sanitize` | `boolean` | `true` |  |
| `gfm` | `boolean` | `true` |  |

<sub>Schema: [`mdhtml.schema.json`](../../src/wb-models/mdhtml.schema.json)</sub>

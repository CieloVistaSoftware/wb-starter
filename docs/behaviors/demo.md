# Demo Container

`x-demo` renders its children as a live example in a grid of `columns`, and underneath shows the exact markup that produced them as a numbered, copyable code sample. Every live example in these docs is one.

## Usage

<div x-demo columns="2">
  <button variant="primary">Save</button>
  <button variant="secondary">Cancel</button>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `columns` | `integer` | `1` | Number of grid columns for children (1-6) |

<sub>Schema: [`demo.schema.json`](../../src/wb-models/demo.schema.json)</sub>

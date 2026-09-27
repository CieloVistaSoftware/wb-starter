# Resizable

`x-resizable` adds drag handles to the element so the user can resize it; `handles` lists which edges and corners get one (`se`, the bottom-right corner, by default).

## Usage

<div x-demo>
<div x-resizable handles="se" style="width:240px;height:120px;padding:1rem;border:1px solid var(--border-color);background:var(--bg-secondary)">
  Drag the bottom-right corner.
</div>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `handles` | `string` | `se` |  |

<sub>Schema: [`resizable.schema.json`](../../src/wb-models/resizable.schema.json)</sub>

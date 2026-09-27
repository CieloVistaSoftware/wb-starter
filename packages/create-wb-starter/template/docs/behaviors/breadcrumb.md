# Breadcrumb

`x-breadcrumb` builds a breadcrumb trail inside a `<nav>` from the comma-separated `items`, drawing `separator` between them and marking the last item as the current page. Labels cannot contain commas.

## Usage

<div x-demo>
<nav x-breadcrumb items="Home,Products,Electronics,Smartphones"></nav>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `items` | `string` | — | Comma-separated trail labels, e.g. `Home,Docs,Behaviors`. Split on commas — a label containing a comma cannot be expressed. |
| `separator` | `string` | `/` | Character drawn between items. Defaults to `/`. |

<sub>Schema: [`breadcrumb.schema.json`](../../src/wb-models/breadcrumb.schema.json)</sub>

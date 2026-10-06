# Pagination

`x-pagination` builds Previous/Next and numbered page links inside a `<nav>` from `total` and `perPage` (or an explicit `pages`), marks `current` as active, and fires `wb:pagination:change` when another page is chosen.

## Usage

<div x-demo>
<nav x-pagination total="100" perPage="10" current="5"></nav>
</div>

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `total` | `string` | `0` | Total number of items. With `perPage` this derives the page count. |
| `perPage` | `string` | `10` | Items per page. Defaults to `10`. |
| `pages` | `string` | `0` | Explicit page count. Overrides the count derived from `total`/`perPage`. |
| `current` | `string` | `1` | Active page, counting from **1**. Defaults to `1`. |

## Rendered markup

These attributes are written BY the behavior onto the controls it builds, not
authored on the `<nav>` (they used to be listed as attributes above, which
advertised three options that do nothing when set by hand):

- `aria-disabled="true"` on Previous/Next when there is no page in that direction; those controls also leave the tab order.
- `action` on Previous/Next (`prev`/`next`), read on click.
- `page` on each numbered control, carrying its page number; the active one also gets `aria-current="page"`.

## Events

- `wb:pagination:change` — Another page was chosen; `detail.page` is its number, counting from 1.

<sub>Schema: [`pagination.schema.json`](../../src/wb-models/pagination.schema.json)</sub>

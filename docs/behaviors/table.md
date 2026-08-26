# Table

Data table with sorting, filtering, and pagination

## Type — decorates a semantic element

`x-table` is the **table behavior**. It attaches to `<table>`, the element you would have reached for anyway — there is no new tag to learn.

### How to write it

```html
<!-- Plain semantic HTML. The behavior is injected automatically -->
<!-- because the element itself implies it. No attribute needed. -->
<table
  headers="Component,Behavior,Variants"
  rows="[[&quot;alert&quot;,&quot;alert&quot;,&quot;4&quot;],[&quot;badge&quot;,&quot;badge&quot;,&quot;9&quot;],[&quot;button&quot;,&quot;button&quot;,&quot;8&quot;],[&quot;card&quot;,&quot;card&quot;,&quot;4&quot;],[&quot;code&quot;,&quot;code&quot;,&quot;12&quot;],[&quot;dialog&quot;,&quot;dialog&quot;,&quot;3&quot;],[&quot;details&quot;,&quot;details&quot;,&quot;2&quot;],[&quot;audio&quot;,&quot;audio&quot;,&quot;6&quot;],[&quot;table&quot;,&quot;table&quot;,&quot;5&quot;],[&quot;tabs&quot;,&quot;tabs&quot;,&quot;3&quot;],[&quot;toast&quot;,&quot;toast&quot;,&quot;4&quot;],[&quot;tooltip&quot;,&quot;tooltip&quot;,&quot;4&quot;]]">
</table>
```

### On a different element

Use `x-table` when the host is not a `<table>` and you want the same behavior:

```html
<div x-table>
  …
</div>
```

> Do not write `<table x-table>`. The element already injects it, and the redundant attribute can suppress the behavior (#746).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data` | `string` | — | Table data as JSON array |
| `columns` | `string` | — | Column config as JSON [{key, label, sortable}] |
| `sortable` | `boolean` | `true` | Enable column sorting |
| `filterable` | `boolean` | `false` | Enable filtering |
| `paginated` | `boolean` | `false` | Enable pagination |
| `page-size` | `number` | `10` | Rows per page |
| `striped` | `boolean` | `false` | Striped rows |
| `hoverable` | `boolean` | `true` | Hover effect on rows |
| `compact` | `boolean` | `false` | Compact row spacing |
| `bordered` | `boolean` | `false` | Cell borders |
| `headers` | `string` | — | Comma-separated column headings. |
| `rows` | `string` | — | JSON array-of-arrays of row data. |
| `searchable` | `boolean` | `false` | Show a filter input above the table. Alias of filterable. |
| `copyable` | `boolean` | `false` | Add a control that copies the table as text. |
| `selectable` | `boolean` | `false` | Let a row be clicked to become the active row. |

## Events

- `wb:table:sort` — Column sorted
- `wb:table:filter` — Data filtered
- `wb:table:page` — Page changed

## Methods

- `setData()` — Sets table data
- `getData()` — Gets current data
- `sort()` — Sorts by column
- `filter()` — Filters data
- `goToPage()` — Goes to page
- `refresh()` — Refreshes table

## Accessibility

- **role** — table
- **headers** — scope="col" on th elements

## Live example

See `x-table` on the [Behaviors showcase](/?page=behaviors) — search for `x-table` to run it and copy its markup.

---

<sub>Generated from `src/wb-models/table.schema.json` by `scripts/generate-behavior-docs.mjs` (#713). Attribute names, defaults and events are the declared ones. Expand this file by hand — the generator never overwrites an existing doc.</sub>

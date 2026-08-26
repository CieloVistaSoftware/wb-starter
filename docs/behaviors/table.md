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
  rows='[["alert","alert","4"],["badge","badge","9"],["button","button","8"],["card","card","4"],["code","code","12"],["dialog","dialog","3"],["details","details","2"],["audio","audio","6"],["table","table","5"],["tabs","tabs","3"],["toast","toast","4"],["tooltip","tooltip","4"]]'>
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

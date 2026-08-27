# Table

Data table with sorting, filtering, and pagination

Applies to `<table>`, and to any element carrying `x-table`.

## Usage

```html
<table
  headers="Behavior,Behavior,Variants"
  rows='[["x-alert","alert","4"],["x-badge","badge","9"],["x-button","button","8"],["x-card","card","4"],["x-code","code","12"],["x-dialog","dialog","3"],["x-details","details","2"],["x-audio","audio","6"],["x-table","table","5"],["x-tabs","tabs","3"],["x-toast","toast","4"],["x-tooltip","tooltip","4"]]'>
</table>
```

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

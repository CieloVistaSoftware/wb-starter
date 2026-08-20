# Table

Data table with sorting, filtering, and pagination

Applies to `<table>`, and to any element carrying `x-table`.

## Usage

```html
<wb-table
  headers="Component,Behavior,Variants"
  rows="[[&quot;wb-alert&quot;,&quot;alert&quot;,&quot;4&quot;],[&quot;wb-badge&quot;,&quot;badge&quot;,&quot;9&quot;],[&quot;wb-button&quot;,&quot;button&quot;,&quot;8&quot;],[&quot;wb-card&quot;,&quot;card&quot;,&quot;4&quot;],[&quot;wb-code&quot;,&quot;code&quot;,&quot;12&quot;],[&quot;wb-dialog&quot;,&quot;dialog&quot;,&quot;3&quot;],[&quot;wb-details&quot;,&quot;details&quot;,&quot;2&quot;],[&quot;wb-audio&quot;,&quot;audio&quot;,&quot;6&quot;],[&quot;wb-table&quot;,&quot;table&quot;,&quot;5&quot;],[&quot;wb-tabs&quot;,&quot;tabs&quot;,&quot;3&quot;],[&quot;wb-toast&quot;,&quot;toast&quot;,&quot;4&quot;],[&quot;wb-tooltip&quot;,&quot;tooltip&quot;,&quot;4&quot;]]">
</wb-table>
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

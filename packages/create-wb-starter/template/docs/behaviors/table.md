# Table

A plain `<table>` gets sortable column headers, and can be filled from attributes: `headers` for the column names and `rows` for the data as JSON. `searchable` adds a filter box, `paginated` splits long tables into pages.

## Usage

<div x-demo>
<table headers="Behavior,Kind,Variants" rows='[
  ["badge", "inline", "9"],
  ["button", "control", "8"],
  ["card", "container", "4"],
  ["tabs", "container", "3"]
]'></table>
</div>

No attribute needed on `<table>`. Don't add `x-table` to it (#746).

On another element, write `x-table`:

```html
<div x-table headers="Behavior,Kind,Variants" rows='[
  ["badge", "inline", "9"],
  ["button", "control", "8"],
  ["card", "container", "4"],
  ["tabs", "container", "3"]
]'></div>
```

`<table x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

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

<sub>Schema: [`table.schema.json`](../../src/wb-models/table.schema.json)</sub>

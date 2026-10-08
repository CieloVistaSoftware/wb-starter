# Table

A plain `<table>` gets sortable column headers, and can be filled from attributes: `headers` for the column names and `rows` for the data as JSON. `searchable` adds a filter box, `paginated` splits long tables into pages.

## Usage

<div x-demo>
<table headers="Behavior,Kind,Variants" rows='[
  ["badge", "inline", "9"],
  ["button", "control", "8"],
  ["card", "container", "4"],
  ["tabs", "container", "3"],
  ["alert", "feedback", "4"]
]'></table>
</div>

No attribute needed on `<table>`. Don't add `x-table` to it (#746).

On another element, write `x-table`:

<div x-demo>
<div x-table headers="Behavior,Kind,Variants" rows='[
  ["badge", "inline", "9"],
  ["button", "control", "8"],
  ["card", "container", "4"],
  ["tabs", "container", "3"],
  ["alert", "feedback", "4"]
]'></div>
</div>

`<table x-ignore>` opts out ([escape hatches](../escape-hatches.md)).

## Attributes

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data` | JSON array | — | Table data as JSON array |
| `columns` | JSON array of {key, label, sortable} | — | Column config as JSON [{key, label, sortable}] |
| `sortable` | `boolean` | `true` | Enable column sorting |
| `filterable` | `boolean` | `false` | Enable filtering |
| `paginated` | `boolean` | `false` | Enable pagination |
| `pageSize` | `number` | `10` | Rows per page |
| `striped` | `boolean` | `false` | Striped rows |
| `hoverable` | `boolean` | `true` | Hover effect on rows |
| `compact` | `boolean` | `false` | Compact row spacing |
| `bordered` | `boolean` | `false` | Cell borders |
| `headers` | comma-separated list | — | Comma-separated column headings. |
| `rows` | JSON array of arrays | — | JSON array-of-arrays of row data. |
| `searchable` | `boolean` | `false` | Show a filter input above the table. Alias of filterable. |
| `copyable` | `boolean` | `false` | Add a control that copies the table as text. |
| `selectable` | `boolean` | `false` | Let a row be clicked to become the active row. |
| `sortValue` | string, on a body cell | — | The value that cell's column sorts by instead of its text. See [Sorting by something other than the displayed text](#sorting-by-something-other-than-the-displayed-text) below. |

No attribute name carries a dash — only the `x-` behavior prefix does (#1125). This table said `pageSize` until #1344, while `table.schema.json` has always said `pageSize`; the dashed spelling is still read, so existing markup keeps working, but write the camelCase one.

`hover` is not an attribute. It was read by the behavior but declared nowhere, and was dropped in #1344 — the option is `hoverable`.

### Booleans are bare

Write the attribute to switch it on and leave it out to switch it off:

```html-static
<table striped headers="A,B" rows='[["1","2"]]'></table>   <!-- on  -->
<table headers="A,B" rows='[["1","2"]]'></table>           <!-- off -->
```

`striped="false"` and `striped="0"` also mean off. Until #1344 they meant **on** for `striped`, `bordered`, `compact`, `copyable`, `selectable` and `searchable`, because the behavior only asked whether the attribute was present — so markup that said "false" did the opposite of what it said.

`sortable` and `hoverable` are on by default. Switch them off with `sortable="false"` / `hoverable="false"`.

### Sorting by something other than the displayed text

A cell can declare its own sort key with `sortValue`, for a column whose display text does not order the way the data does — a date shown as "Sep 5, 2026", a size shown as "1.2 MB", a dash for an unrated row:

```html
<td sortValue="3">High</td>
<td sortValue="999">—</td>
```

Without it the displayed text is the only key available. The older `sort-value` spelling is still read (#1344).

## Events

- `wb:table:sort` — Column sorted
- `wb:table:filter` — Data filtered
- `wb:table:page` — Page changed
- `wb:table:select` — A row is clicked

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

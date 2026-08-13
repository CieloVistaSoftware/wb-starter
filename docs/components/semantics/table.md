# Table - wb-starter v3.0

Interactive data table with sorting and search.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-table>` |
| Behavior | `table` |
| Semantic | `<table>` |
| Root CSS Class | `wb-table` |
| Category | Data |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `striped` | boolean | `false` | Zebra-striping for rows |
| `hover` | boolean | `true` | Highlight row on hover |
| `bordered` | boolean | `false` | Add borders to cells |
| `compact` | boolean | `false` | Reduce padding |
| `sortable` | boolean | `true` | Enable column sorting (click a header to sort) |
| `searchable` | boolean | `false` | Add a search input above the table that filters rows as you type |
| `headers` | string | `""` | Column headers, comma-separated (paired with `rows`) |
| `rows` | string | `""` | Row data as a JSON array of arrays (paired with `headers`) |
| `data` | string | `""` | Row data as a JSON array of objects (paired with `columns`) |
| `columns` | string | `""` | Column config as JSON `[{key, label}]` (paired with `data`) |

**Authoring note:** `<wb-table>` no longer supports authoring rows as slotted
`<thead>`/`<tbody>` markup — that path is retired. Populate a `<wb-table>`
with either the `headers`/`rows` attribute pair or the `data`/`columns`
attribute pair, shown below. Both are read by `table.js` and build real
`<tr>`/`<th>`/`<td>` rows at render time.

## Usage

### Custom Element (headers/rows)

The most direct way to author a `<wb-table>`: a comma-separated `headers`
list paired with a `rows` JSON array of arrays. Default styling — `hover`
and `sortable` are both on by default, nothing else is.

<wb-demo>
<wb-table
  headers="ID,Name,Role,Department,Location"
  rows='[
    [1,"Alice Chen","Engineering Lead","Platform","Seattle"],
    [2,"Marcus Webb","Product Designer","Design","Austin"],
    [3,"Priya Patel","Data Scientist","Analytics","Remote"],
    [4,"Diego Ramirez","Support Specialist","Customer Success","Denver"],
    [5,"Aisha Osei","Marketing Manager","Growth","Chicago"]
  ]'>
</wb-table>
</wb-demo>

### From data/columns

The alternate JSON form: `data` is an array of row **objects**, `columns`
is an array of `{key, label}` pairs that both picks which object keys
appear and supplies their header text. Useful when the data already
exists as objects (e.g. an API response) instead of positional arrays.

<wb-demo>
<wb-table
  data='[
    {"sku":"SKU-1001","name":"Wireless Mouse","price":"$24.99","stock":142,"category":"Peripherals"},
    {"sku":"SKU-1002","name":"Mechanical Keyboard","price":"$89.99","stock":57,"category":"Peripherals"},
    {"sku":"SKU-1003","name":"27in Monitor","price":"$249.00","stock":12,"category":"Displays"},
    {"sku":"SKU-1004","name":"USB-C Hub","price":"$34.50","stock":203,"category":"Accessories"},
    {"sku":"SKU-1005","name":"Webcam 1080p","price":"$59.99","stock":8,"category":"Peripherals"}
  ]'
  columns='[
    {"key":"sku","label":"SKU"},
    {"key":"name","label":"Product"},
    {"key":"price","label":"Price"},
    {"key":"stock","label":"In Stock"},
    {"key":"category","label":"Category"}
  ]'>
</wb-table>
</wb-demo>

### Striped

`striped` alternates each row's background so a reader's eye can track a
single row across a wide table. Easiest to see with several rows on
screen at once, so this example uses six.

<wb-demo>
<wb-table
  striped
  headers="ID,Item,Warehouse,Qty,Status"
  rows='[
    [101,"Steel Bracket","WH-North","1,240","In Stock"],
    [102,"Rubber Gasket","WH-North","86","Low Stock"],
    [103,"Copper Wire (100ft)","WH-South","512","In Stock"],
    [104,"Ball Bearing 8mm","WH-South","0","Out of Stock"],
    [105,"Aluminum Sheet","WH-East","310","In Stock"],
    [106,"Nylon Strap","WH-East","2,005","In Stock"]
  ]'>
</wb-table>
</wb-demo>

### Bordered

`bordered` draws a visible line around every cell — useful for dense,
grid-like data (like an invoice) where the reader needs to see exactly
where one cell ends and the next begins.

<wb-demo>
<wb-table
  bordered
  headers="Line,Description,Qty,Unit Price,Total"
  rows='[
    [1,"Consulting Hours","12","$150.00","$1,800.00"],
    [2,"Software License (Annual)","1","$2,400.00","$2,400.00"],
    [3,"On-site Support Day","2","$600.00","$1,200.00"],
    [4,"Training Session","3","$400.00","$1,200.00"],
    [5,"Priority Support Add-on","1","$300.00","$300.00"]
  ]'>
</wb-table>
</wb-demo>

### Compact

`compact` reduces cell padding so more rows fit in the same vertical
space — this example packs seven short schedule rows to make that
density visible against the roomier tables above.

<wb-demo>
<wb-table
  compact
  headers="Time,Session,Room"
  rows='[
    ["9:00","Registration & Coffee","Lobby"],
    ["9:30","Opening Keynote","Hall A"],
    ["10:30","Workshop: MVVM Basics","Room 2"],
    ["11:15","Workshop: Theming","Room 3"],
    ["12:00","Lunch","Hall B"],
    ["13:00","Panel: Accessibility","Hall A"],
    ["14:00","Closing Remarks","Hall A"]
  ]'>
</wb-table>
</wb-demo>

### Hover disabled

`hover` defaults to `true` (see the default example above, where rows
highlight on mouseover). Setting `hover="false"` removes that highlight —
appropriate for a static reference table like this audit log, where
nothing happens on click and a hover highlight would falsely suggest the
rows are interactive.

<wb-demo>
<wb-table
  hover="false"
  headers="Timestamp,Actor,Action,Result"
  rows='[
    ["2026-08-10 09:14","system","Nightly backup","Success"],
    ["2026-08-10 09:20","a.chen","Login","Success"],
    ["2026-08-10 11:02","m.webb","Permission change","Success"],
    ["2026-08-10 14:47","system","Cert rotation","Success"],
    ["2026-08-10 22:00","system","Nightly backup","Success"]
  ]'>
</wb-table>
</wb-demo>

### Sortable disabled

`sortable` defaults to `true` (click a header to sort — try it on any
example above). Setting `sortable="false"` locks the column order, which
matters here: these are ordered deployment steps, and letting a reader
accidentally re-sort them by clicking "Step" would scramble the sequence
they're meant to run in.

<wb-demo>
<wb-table
  sortable="false"
  headers="Step,Action,Owner,Duration"
  rows='[
    [1,"Freeze main branch","Release manager","5 min"],
    [2,"Run full test suite","CI","12 min"],
    [3,"Build production bundle","CI","4 min"],
    [4,"Deploy to staging","Release manager","3 min"],
    [5,"Promote staging to production","Release manager","2 min"]
  ]'>
</wb-table>
</wb-demo>

### Searchable

`searchable` adds a search input directly above the table. Type in it to
filter rows live — rows whose text doesn't match are hidden, no page
reload. ([#433](https://github.com/CieloVistaSoftware/wb-starter/issues/433)
tracked this: the input previously never rendered at all — fixed in
`src/wb-viewmodels/semantics/table.js` alongside this audit.)

<wb-demo>
<wb-table
  searchable
  headers="ID,Name,Title,Team,Email"
  rows='[
    [1,"Alice Chen","Engineering Lead","Platform","alice@example.com"],
    [2,"Marcus Webb","Product Designer","Design","marcus@example.com"],
    [3,"Priya Patel","Data Scientist","Analytics","priya@example.com"],
    [4,"Diego Ramirez","Support Specialist","Customer Success","diego@example.com"],
    [5,"Aisha Osei","Marketing Manager","Growth","aisha@example.com"],
    [6,"Jordan Lee","Backend Engineer","Platform","jordan@example.com"]
  ]'>
</wb-table>
</wb-demo>

### Combined: striped + bordered + hover

Style attributes compose freely. This pricing comparison combines
`striped`, `bordered`, and the default `hover` together.

<wb-demo>
<wb-table
  striped
  bordered
  hover
  headers="Plan,Monthly,Users,Storage,Support"
  rows='[
    ["Starter","$9","1","10 GB","Community"],
    ["Team","$29","5","100 GB","Email"],
    ["Business","$79","20","500 GB","Priority"],
    ["Business Plus","$149","50","1 TB","Priority"],
    ["Enterprise","Custom","Unlimited","Custom","Dedicated"]
  ]'>
</wb-table>
</wb-demo>

### Combined: compact + striped + searchable

A denser, high-row-count combination — `compact` spacing, `striped` rows
to track across them, and a working `searchable` input to narrow down
the six tickets below by typing.

<wb-demo>
<wb-table
  compact
  striped
  searchable
  headers="Ticket,Subject,Priority,Status,Assignee"
  rows='[
    ["T-1042","Login fails on Safari","High","Open","D. Ramirez"],
    ["T-1043","Export button missing icon","Low","Open","A. Osei"],
    ["T-1044","Search returns stale results","Medium","In Progress","J. Lee"],
    ["T-1045","Dark mode contrast issue","Medium","Open","M. Webb"],
    ["T-1046","API timeout on large export","High","In Progress","P. Patel"],
    ["T-1047","Typo in confirmation email","Low","Closed","A. Chen"]
  ]'>
</wb-table>
</wb-demo>

### Row click

`selectable` marks each row clickable: clicking highlights it (an `active`
class) and dispatches the real `wb:table:select` event with
`{ row: <tr>, index }` in its detail — this is the table's only real, wired
event (see [Events](#events) below; the other three names once listed
there were never actually dispatched by `table.js` and have been removed).
Click any row below to see its data printed live, as JSON, in the log
panel `<wb-demo>` generates automatically from the `events` attribute.

<wb-demo events="wb:table:select">
<wb-table
  selectable
  headers="ID,Name,Role,Department,Location"
  rows='[
    [1,"Alice Chen","Engineering Lead","Platform","Seattle"],
    [2,"Marcus Webb","Product Designer","Design","Austin"],
    [3,"Priya Patel","Data Scientist","Analytics","Remote"],
    [4,"Diego Ramirez","Support Specialist","Customer Success","Denver"],
    [5,"Aisha Osei","Marketing Manager","Growth","Chicago"]
  ]'>
</wb-table>
</wb-demo>

### Native Table (Enhanced)

A plain semantic `<table>` gets the same `table` behavior as `<wb-table>`
when it carries an explicit `x-table` attribute. (`autoInjectComponents`
defaults to **off** — see `src/core/config.js` — so a bare `<table>` with
no `x-table` attribute and no `variant` attribute gets no behavior at
all; `x-table` opts it in explicitly regardless of that global setting.)

Unlike `<wb-table>`, a native `<table>` has no schema building an empty
row-container for it, so it needs an empty `<thead></thead><tbody></tbody>`
pair in the markup as a structural target — `table.js` fills real rows
into that shell from `headers`/`rows`, the same as it does for `<wb-table>`.

<wb-demo>
<table
  x-table
  striped
  headers="Host,Region,CPU,Memory,Status"
  rows='[
    ["api-01","us-west","42%","61%","Healthy"],
    ["api-02","us-west","38%","55%","Healthy"],
    ["api-03","us-east","91%","88%","Degraded"],
    ["worker-01","us-east","12%","30%","Healthy"],
    ["worker-02","eu-central","67%","72%","Healthy"]
  ]'>
<thead></thead>
<tbody></tbody>
</table>
</wb-demo>

## Generated Structure

`<wb-table>` renders its search input (when `searchable`) and its
`<thead>`/`<tbody>` as direct children of the `<wb-table>` element itself
— there is no extra wrapping container. Confirmed live from the examples
above (a `searchable striped` table). This is reference output only (not
a live demo — see the [Searchable](#searchable) example above for the
live, authorable version of this same markup):

```text
<wb-table
  striped
  searchable
  headers="A,B"
  rows="[[1,2],[3,4]]"
  class="wb-table--striped wb-table--hover"
  x-schema="table">
  <input
    type="search"
    class="wb-table__search"
    placeholder="Search..."
    aria-label="Search table">
  <thead class="wb-table__thead">
    <tr>
      <th title="Click to sort, right-click to copy">A</th>
      <th title="Click to sort, right-click to copy">B</th>
    </tr>
  </thead>
  <tbody class="wb-table__tbody">
    <tr>
      <td>1</td>
      <td>2</td>
    </tr>
    <tr>
      <td>3</td>
      <td>4</td>
    </tr>
  </tbody>
</wb-table>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|--------------|
| `.wb-table` | Always (native `<table>` host only — a `<wb-table>` host is targeted by its own tag) | Base styling |
| `.wb-table--striped` | `striped` | Zebra striping |
| `.wb-table--hover` | `hover` (default `true`) | Row hover effect |
| `.wb-table--bordered` | `bordered` | Cell borders |
| `.wb-table--compact` | `compact` | Reduced padding |

## Methods

**Accuracy note:** `<wb-table>` binds these names from `table.schema.json`'s
`$methods`, but only as generic stubs — calling one warns
`Method "…" called but not implemented for table` and dispatches a matching
`wb:{method}` event; it does **not** perform the named action. The only
real, working sort/search/filter interactions today are the ones wired
directly by `table.js`: clicking a sortable header (see
[Custom Element](#custom-element-headersrows)), and typing into the
`.wb-table__search` input (see [Searchable](#searchable)). `search(term)`
isn't in `$methods` at all — calling `table.search(...)` throws
`TypeError: table.search is not a function`.

| Method | Description | Status |
|--------|-------------|--------|
| `sort(column, direction)` | Intended to sort by column index | Stub only — use header click instead |
| `setData(data)` | Intended to replace table data | Stub only |
| `getData()` | Intended to get current data | Stub only |
| `refresh()` | Intended to re-render the table | Stub only |

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:table:select` | A row was clicked (`selectable` tables only — see [Row click](#row-click)) | `{ row: HTMLElement, index: number }` |

```javascript
const table = document.querySelector('wb-table[selectable]');

table.addEventListener('wb:table:select', (e) => {
  const cells = Array.from(e.detail.row.children).map((td) => td.textContent);
  console.log(`Row ${e.detail.index}:`, cells);
});
```

## CSS API

| Variable | Default | Description |
|----------|---------|-------------|
| `--wb-table-bg` | `var(--bg-surface)` | Background |
| `--wb-table-border` | `1px solid var(--border-color)` | Border style |
| `--wb-table-radius` | `4px` | Border radius |
| `--wb-table-cell-padding` | `0.75rem 1rem` | Cell padding |
| `--wb-table-header-bg` | `var(--bg-secondary)` | Header background |
| `--wb-table-header-color` | `var(--text-primary)` | Header text color |
| `--wb-table-stripe-bg` | `var(--bg-secondary)` | Stripe background |
| `--wb-table-hover-bg` | `var(--bg-tertiary)` | Hover background |
| `--wb-table-compact-padding` | `0.5rem 0.75rem` | Compact cell padding |

## Accessibility

| Attribute | Purpose |
|-----------|---------|
| `role="grid"` | Grid semantics |
| `aria-sort` | Sort direction on headers |
| `scope="col"` | Column headers |

Keyboard support:
- Arrow keys for navigation
- Enter to activate sorting
- Type to search (when searchable)

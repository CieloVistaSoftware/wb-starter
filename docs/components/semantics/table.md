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
| `sortable` | boolean | `true` | Enable column sorting |
| `searchable` | boolean | `false` | Add search bar |
| `headers` | string | `""` | Column headers (comma-separated) |
| `rows` | string | `""` | Row data as JSON array |

## Usage

### Custom Element

Author real rows with the `headers`/`rows` attributes -- not slotted
`<thead>`/`<tbody>` markup. table.js builds the actual `<tr>`/`<th>`/`<td>`
elements from these two attributes; a `<wb-table>` with no `headers`/`rows`
(or `data`/`columns`) attributes and no nested `<table>` renders empty.

```html
<wb-table
  striped
  hover
  headers="Name,Age,Role"
  rows='[
    ["Alice",30,"Developer"],
    ["Bob",25,"Designer"],
    ["Carol",28,"Product Manager"],
    ["Dave",35,"QA Engineer"],
    ["Eve",41,"Engineering Lead"]
  ]'>
</wb-table>
```

### Native Table (Enhanced)

```html
<!-- x-table is auto-injected onto native <table> tags when autoInject is
     on -- no attribute needed. -->
<table striped="true">
  <!-- content -->
</table>
```

### With Search

```html
<wb-table
  searchable
  striped
  headers="Product,Price,Stock"
  rows='[
    ["Wireless Mouse","$24.99",142],
    ["Mechanical Keyboard","$89.99",57],
    ["USB-C Hub","$34.99",203],
    ["27in Monitor","$249.99",18],
    ["Webcam 1080p","$44.99",76]
  ]'>
</wb-table>
```

### From JSON Data

```html
<wb-table
  headers="ID,Name,Role"
  rows='[
    [1,"John","Admin"],
    [2,"Jane","User"],
    [3,"Bob","Editor"],
    [4,"Priya","Editor"],
    [5,"Sam","Viewer"]
  ]'>
</wb-table>
```

### Styling Variants

```html
<!-- Striped -->
<wb-table
  striped
  headers="Feature,Status"
  rows='[
    ["Dark mode","Enabled"],
    ["Notifications","Enabled"],
    ["Auto-save","Disabled"],
    ["Two-factor auth","Enabled"],
    ["Beta features","Disabled"]
  ]'>
</wb-table>
<!-- Bordered -->
<wb-table
  bordered
  headers="Feature,Status"
  rows='[
    ["Dark mode","Enabled"],
    ["Notifications","Enabled"],
    ["Auto-save","Disabled"],
    ["Two-factor auth","Enabled"],
    ["Beta features","Disabled"]
  ]'>
</wb-table>
<!-- Compact -->
<wb-table
  compact
  headers="Feature,Status"
  rows='[
    ["Dark mode","Enabled"],
    ["Notifications","Enabled"],
    ["Auto-save","Disabled"],
    ["Two-factor auth","Enabled"],
    ["Beta features","Disabled"]
  ]'>
</wb-table>
<!-- Combined -->
<wb-table
  striped
  bordered
  hover
  headers="Feature,Status"
  rows='[
    ["Dark mode","Enabled"],
    ["Notifications","Enabled"],
    ["Auto-save","Disabled"],
    ["Two-factor auth","Enabled"],
    ["Beta features","Disabled"]
  ]'>
</wb-table>
```

## Generated Structure

```html
<div class="wb-table-container">
  <!-- Search (when searchable) -->
  <div class="wb-table__search">
    <input
      type="search"
      placeholder="Search...">
  </div>
  <table class="wb-table wb-table--striped wb-table--hover">
    <thead>
      <tr>
        <th
          class="wb-table__header"
          sort="asc">
          Name <span class="wb-table__sort-icon">▲
        </span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alice</td>
      </tr>
    </tbody>
  </table>
</div>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-table` | Always | Base styling |
| `.wb-table--striped` | `striped` | Zebra striping |
| `.wb-table--hover` | `hover` | Row hover effect |
| `.wb-table--bordered` | `bordered` | Cell borders |
| `.wb-table--compact` | `compact` | Reduced padding |

## Methods

| Method | Description |
|--------|-------------|
| `sort(column, direction)` | Sort by column index |
| `search(term)` | Filter rows by search term |
| `setData(data)` | Replace table data |
| `getData()` | Get current data |
| `refresh()` | Re-render table |

```javascript
const table = document.querySelector('wb-table');

// Sort by first column (ascending)
table.sort(0, 'asc');

// Search
table.search('alice');

// Update data
table.setData([
  ['New', 'Data', 'Here'],
  ['More', 'Rows', 'Added']
]);
```

## Events

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:table:sort` | Column sorted | `{ column: number, direction: string }` |
| `wb:table:search` | Search performed | `{ term: string, results: number }` |
| `wb:table:rowclick` | Row clicked | `{ row: HTMLElement, data: array }` |

```javascript
table.addEventListener('wb:table:sort', (e) => {
  console.log(`Sorted column ${e.detail.column} ${e.detail.direction}`);
});

table.addEventListener('wb:table:rowclick', (e) => {
  console.log('Clicked row:', e.detail.data);
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

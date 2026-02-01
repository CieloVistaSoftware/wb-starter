# Table - wb-starter v3.0

Interactive data table with sorting and search.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-table>` |
| Behavior | `table` |
| Semantic | `<table>` |
| Base Class | `wb-table` |
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

```html
<wb-table striped hover>
  <thead>
    <tr><th>Name</th><th>Age</th><th>Role</th></tr>
  </thead>
  <tbody>
    <tr><td>Alice</td><td>30</td><td>Developer</td></tr>
    <tr><td>Bob</td><td>25</td><td>Designer</td></tr>
  </tbody>
</wb-table>
```

### Native Table (Enhanced)

```html
<table data-wb="table" data-wb-striped="true">
  <!-- content -->
</table>
```

### With Search

```html
<wb-table searchable striped>
  <thead>
    <tr><th>Product</th><th>Price</th><th>Stock</th></tr>
  </thead>
  <tbody>
    <!-- rows -->
  </tbody>
</wb-table>
```

### From JSON Data

```html
<wb-table 
  headers="ID,Name,Role"
  rows='[[1,"John","Admin"],[2,"Jane","User"],[3,"Bob","Editor"]]'>
</wb-table>
```

### Styling Variants

```html
<!-- Striped -->
<wb-table striped>...</wb-table>

<!-- Bordered -->
<wb-table bordered>...</wb-table>

<!-- Compact -->
<wb-table compact>...</wb-table>

<!-- Combined -->
<wb-table striped bordered hover>...</wb-table>
```

## Generated Structure

```html
<div class="wb-table-container">
  <!-- Search (when searchable) -->
  <div class="wb-table__search">
    <input type="search" placeholder="Search...">
  </div>
  
  <table class="wb-table wb-table--striped wb-table--hover">
    <thead>
      <tr>
        <th class="wb-table__header" data-sort="asc">
          Name <span class="wb-table__sort-icon">▲</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Alice</td></tr>
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

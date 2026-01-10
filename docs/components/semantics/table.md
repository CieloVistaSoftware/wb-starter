# Table Component Design & User Guide

## 1. Design Philosophy

The `table` component transforms standard HTML tables into interactive data grids. It adds essential features like sorting and searching entirely on the client side, making it perfect for small to medium datasets without needing a complex backend API.

### Key Features
- **Client-Side Sorting**: Click headers to sort by column (numeric or string).
- **Live Search**: Filter rows instantly with a search input.
- **Visual Variants**: Striped, bordered, hoverable, and compact styles.
- **Data Injection**: Can render rows from JSON data attributes.

## 2. User Guide

### Basic Usage
The `table` behavior is automatically injected into `<table>` elements.

```html
<table data-striped="true" data-hover="true">
  <thead>
    <tr><th>Name</th><th>Age</th></tr>
  </thead>
  <tbody>
    <tr><td>Alice</td><td>30</td></tr>
    <tr><td>Bob</td><td>25</td></tr>
  </tbody>
</table>
```

### Configuration Options
| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-striped` | Boolean | `false` | Zebra-striping for rows. |
| `data-hover` | Boolean | `true` | Highlight row on hover. |
| `data-bordered` | Boolean | `false` | Add borders to cells. |
| `data-compact` | Boolean | `false` | Reduce padding for dense data. |
| `data-sortable` | Boolean | `true` | Enable column sorting. |
| `data-searchable` | Boolean | `false` | Add a search bar above the table. |

### API Methods
Access via `element.wbTable`:
- `sort(col, dir)`: Sort by column index.
- `search(term)`: Filter rows.
- `setData(data)`: Replace table data.

## 3. Examples

### Example 1: Interactive Data Grid
A fully featured table with search and sorting.

```html
<table 
  data-searchable="true" 
  data-striped="true" 
  data-bordered="true">
  <!-- content -->
</table>
```

### Example 2: JSON Data Source
Rendering a table from a JSON string (useful for dynamic data).

```html
<table 
  data-headers="ID,Name,Role" 
  data-rows='[[1,"John","Admin"],[2,"Jane","User"]]'>
</table>
```

## 4. Why It Works
The component parses the existing HTML table into an internal data array (or uses the `data-rows` attribute). When sorting or searching occurs, it manipulates this array and re-renders the `<tbody>` content. This separation of data and view allows for fast updates without touching the DOM unnecessarily.

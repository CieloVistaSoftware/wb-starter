# Card File Component

## Overview
The `cardfile` component represents a file attachment or download link. It automatically assigns an icon based on the file type and formats metadata like size and date.

## Internals & Lifecycle

### Initialization
1.  **Icon Mapping**: Maps the `data-type` attribute to a specific emoji icon.
    - `pdf` → 📄
    - `doc` → 📝
    - `image` → 🖼️
    - `video` → 🎬
    - `audio` → 🎵
    - `zip` → 📦
    - Default → 📁
2.  **Layout**: Uses a horizontal flex layout (`flex-direction: row`) to align the icon, details, and download action.
3.  **Meta Formatting**: Joins `data-size` and `data-date` with a bullet separator (`•`) if both are present.
4.  **Download Action**: If `data-downloadable` is true and a `data-href` is provided, it appends an anchor tag with the `download` attribute set to the filename.

### DOM Structure

<article class="wb-card wb-card--file">
  <!-- File Type Icon -->
  <span style="font-size:2.5rem;">📄</span>
  
  <!-- File Details -->
  <div style="flex:1;">
    <h3 class="wb-card__filename">report.pdf</h3>
    <p class="wb-card__file-meta">2.5MB • Dec 12, 2025</p>
  </div>
  
  <!-- Download Button -->
  <a href="..." download="report.pdf">⬇️</a>
</article>

```html
<article class="wb-card wb-card--file">
  <!-- File Type Icon -->
  <span style="font-size:2.5rem;">📄</span>
  
  <!-- File Details -->
  <div style="flex:1;">
    <h3 class="wb-card__filename">report.pdf</h3>
    <p class="wb-card__file-meta">2.5MB • Dec 12, 2025</p>
  </div>
  
  <!-- Download Button -->
  <a href="..." download="report.pdf">⬇️</a>
</article>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-filename` | string | required | The name of the file to display. |
| `data-type` | enum | `file` | File type for icon mapping (pdf, doc, image, etc.). |
| `data-size` | string | - | File size string (e.g., "2.5MB"). |
| `data-date` | string | - | Date string (e.g., "2025-12-01"). |
| `data-href` | string | - | URL to the file. |
| `data-downloadable` | boolean | `true` | Whether to show the download button. |

## Usage Example

<div data-wb="cardfile" 
     data-filename="Q4_Financial_Report.pdf" 
     data-type="pdf" 
     data-size="4.2 MB"
     data-date="Dec 20, 2025"
     data-href="/files/q4-report.pdf">
</div>

```html
<div data-wb="cardfile" 
     data-filename="Q4_Financial_Report.pdf" 
     data-type="pdf" 
     data-size="4.2 MB"
     data-date="Dec 20, 2025"
     data-href="/files/q4-report.pdf">
</div>
```

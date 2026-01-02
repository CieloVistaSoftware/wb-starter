# HTML5 Semantic Standard (Mandatory)

## The Rule

**Every Web Behaviors (WB) behavior MUST use HTML5 semantic elements. `<div>` is only permitted when no semantic element exists for that purpose.**

---

## Semantic Element Reference

### Document Structure

| Element | Purpose | Use For |
|---------|---------|---------|
| `<article>` | Self-contained composition | Cards, posts, comments, widgets |
| `<section>` | Thematic grouping | Page sections, tab panels |
| `<aside>` | Tangentially related | Sidebars, callouts, pull quotes |
| `<nav>` | Navigation | Menus, breadcrumbs, pagination |
| `<header>` | Introductory content | Card headers, page headers, section headers |
| `<main>` | Main content | Primary content area, card body |
| `<footer>` | Footer content | Card footers, page footers, actions |
| `<figure>` | Self-contained media | Images with captions, diagrams |
| `<figcaption>` | Figure caption | Caption for figure |
| `<address>` | Contact information | Author info, contact details |
| `<time>` | Date/time | Timestamps, dates |
| `<mark>` | Highlighted text | Search results, highlights |
| `<details>` | Disclosure widget | Expandable sections |
| `<summary>` | Details summary | Clickable header for details |
| `<dialog>` | Dialog box | Modals, popups, alerts |

### Text Structure

| Element | Purpose | Use For |
|---------|---------|---------|
| `<h1>-<h6>` | Headings | Titles (use correct hierarchy) |
| `<p>` | Paragraph | Text blocks |
| `<blockquote>` | Quotation | Testimonials, quotes |
| `<cite>` | Citation | Source attribution |
| `<code>` | Code | Inline code |
| `<pre>` | Preformatted | Code blocks |
| `<ul>`, `<ol>`, `<li>` | Lists | Feature lists, navigation items |
| `<dl>`, `<dt>`, `<dd>` | Description list | Key-value pairs, glossaries |

### Interactive

| Element | Purpose | Use For |
|---------|---------|---------|
| `<button>` | Clickable action | Buttons (not `<div onclick>`) |
| `<a>` | Hyperlink | Links, navigation |
| `<form>` | Form container | Input groups |
| `<input>` | Input field | Text, checkbox, radio, etc. |
| `<select>` | Dropdown | Select menus |
| `<textarea>` | Multi-line input | Text areas |
| `<label>` | Form label | Input labels |
| `<fieldset>` | Form group | Related inputs |
| `<legend>` | Fieldset title | Group title |
| `<output>` | Calculation result | Computed values |
| `<progress>` | Progress indicator | Progress bars |
| `<meter>` | Scalar measurement | Gauges, ratings |

### Media

| Element | Purpose | Use For |
|---------|---------|---------|
| `<img>` | Image | Images (with alt text) |
| `<picture>` | Responsive image | Art direction, formats |
| `<video>` | Video | Video players |
| `<audio>` | Audio | Audio players |
| `<source>` | Media source | Multiple formats |
| `<track>` | Text track | Captions, subtitles |
| `<canvas>` | Graphics | Drawing, charts |
| `<svg>` | Vector graphics | Icons, illustrations |

---

## Component Mapping

### Cards (ALL variants)

```html
<!-- CORRECT -->
<article data-wb="card">
  <header class="wb-card__header">
    <h3>Title</h3>
  </header>
  <main class="wb-card__main">
    Content goes here
  </main>
  <footer class="wb-card__footer">
    <button>Action</button>
  </footer>
</article>

<!-- WRONG - div soup -->
<div data-wb="card">
  <div class="header">Title</div>
  <div class="body">Content</div>
  <div class="footer">Action</div>
</div>
```

### Modals/Dialogs

```html
<!-- CORRECT -->
<dialog data-wb="modal">
  <header class="wb-modal__header">
    <h2>Modal Title</h2>
    <button aria-label="Close">×</button>
  </header>
  <main class="wb-modal__main">
    Modal content
  </main>
  <footer class="wb-modal__footer">
    <button>Cancel</button>
    <button>Confirm</button>
  </footer>
</dialog>

<!-- WRONG -->
<div data-wb="modal">
  <div class="modal-header">...</div>
  <div class="modal-body">...</div>
</div>
```

### Navigation

```html
<!-- CORRECT -->
<nav data-wb="navbar">
  <ul>
    <li><a href="#home">Home</a></li>
    <li><a href="#about">About</a></li>
  </ul>
</nav>

<!-- WRONG -->
<div data-wb="navbar">
  <div class="nav-item">Home</div>
  <div class="nav-item">About</div>
</div>
```

### Accordion/Expandable

```html
<!-- CORRECT - using native HTML5 -->
<details data-wb="accordion-item">
  <summary>Section Title</summary>
  <p>Section content</p>
</details>

<!-- CORRECT - custom (when native doesn't fit) -->
<section data-wb="accordion-item">
  <header>
    <button aria-expanded="false">Section Title</button>
  </header>
  <main hidden>Section content</main>
</section>
```

### Tabs

```html
<!-- CORRECT -->
<section data-wb="tabs">
  <nav role="tablist">
    <button role="tab" aria-selected="true">Tab 1</button>
    <button role="tab">Tab 2</button>
  </nav>
  <section role="tabpanel">Panel 1</section>
  <section role="tabpanel" hidden>Panel 2</section>
</section>
```

### Sidebar/Aside

```html
<!-- CORRECT -->
<aside data-wb="sidebar">
  <nav>
    <ul>...</ul>
  </nav>
</aside>
```

### Testimonials/Quotes

```html
<!-- CORRECT -->
<article data-wb="cardtestimonial">
  <blockquote>
    <p>This product changed my life!</p>
  </blockquote>
  <footer>
    <cite>John Doe</cite>
    <p>CEO, Company</p>
  </footer>
</article>
```

### Progress/Stats

```html
<!-- CORRECT -->
<article data-wb="cardstats">
  <header>
    <span class="icon">📈</span>
  </header>
  <main>
    <data value="1234">1,234</data>
    <p>Total Users</p>
  </main>
</article>

<!-- Progress bar -->
<progress data-wb="progressbar" value="75" max="100">75%</progress>
```

### Forms

```html
<!-- CORRECT -->
<form data-wb="form">
  <fieldset>
    <legend>Personal Info</legend>
    <label>
      Name
      <input type="text" data-wb="input" required>
    </label>
  </fieldset>
  <footer>
    <button type="submit">Submit</button>
  </footer>
</form>
```

---

## When `<div>` IS Acceptable

Only use `<div>` for:

1. **Pure layout wrappers** - grid/flex containers with no semantic meaning
2. **Styling hooks** - when you need a wrapper for CSS only
3. **No semantic equivalent** - truly generic grouping

**MANDATORY RULE: All elements, including `<div>`s, MUST have a unique `id` attribute.**

```html
<!-- OK - layout wrapper with ID -->
<div id="grid-layout-1" class="wb-grid" data-wb="grid" data-columns="3">
  <article id="card-1">...</article>
  <article id="card-2">...</article>
  <article id="card-3">...</article>
</div>

<!-- OK - styling wrapper with ID -->
<article id="card-4" data-wb="card">
  <header id="card-header-4">
    <div id="header-content-4" class="wb-card__header-content">
      <h3 id="card-title-4">Title</h3>
      <p id="card-subtitle-4">Subtitle</p>
    </div>
    <div id="header-actions-4" class="wb-card__header-actions">
      <button id="btn-action-4">...</button>
    </div>
  </header>
</article>
```

---

## Behavior Implementation Rules

### 1. createElement Calls

```javascript
// WRONG
const header = document.createElement('div');
header.className = 'wb-card__header';

// CORRECT
const header = document.createElement('header');
header.className = 'wb-card__header';
```

### 2. innerHTML Generation

```javascript
// WRONG
element.innerHTML = `
  <div class="header">${title}</div>
  <div class="body">${content}</div>
`;

// CORRECT
element.innerHTML = `
  <header class="wb-card__header"><h3>${title}</h3></header>
  <main class="wb-card__main">${content}</main>
`;
```

### 3. Wrapper Elements

When behavior needs to wrap content:

```javascript
// WRONG
const wrapper = document.createElement('div');

// CORRECT - choose semantic element based on purpose
const wrapper = document.createElement('section'); // for sections
const wrapper = document.createElement('article'); // for cards
const wrapper = document.createElement('figure');  // for media
```

---

## Schema Compliance

Schemas MUST enforce semantic elements:

```json
{
  "compliance": {
    "preferredTag": "article",
    "allowedTags": ["article", "section"],
    "requiredChildren": {
      ".wb-card__header": {
        "tagName": "HEADER",
        "required": false
      },
      ".wb-card__main": {
        "tagName": "MAIN",
        "required": true
      },
      ".wb-card__footer": {
        "tagName": "FOOTER",
        "required": false
      }
    }
  }
}
```

---

## Accessibility Benefits

Using semantic elements provides:

1. **Screen reader navigation** - users can jump between landmarks
2. **Document outline** - clear structure for assistive tech
3. **Default behaviors** - `<button>` is keyboard accessible, `<dialog>` traps focus
4. **SEO** - search engines understand content structure
5. **Future compatibility** - browsers may add new features to semantic elements

---

## Migration Checklist

For each behavior file:

- [ ] Find all `createElement('div')` calls
- [ ] Replace with appropriate semantic element
- [ ] Find all innerHTML with `<div>` 
- [ ] Replace with semantic elements
- [ ] Update tests to check `tagName`
- [ ] Update schema with `tagName` requirements

---

*This standard is mandatory. No exceptions without documented justification.*

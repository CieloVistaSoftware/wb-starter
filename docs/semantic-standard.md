# HTML5 Semantic Standard (Mandatory)

## The Rule

**Every WB-Starter behavior MUST use HTML5 semantic elements. `<div>` is only permitted when no semantic element exists for that purpose.**

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
| `<main>` | Main content | The page's one primary content area. Never inside a card: `<main>` is only valid under `html`, `body`, `div` or `form`, so a card body is `<div class="x-card__body">` (#945) |
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

## Behavior Mapping

### Cards (ALL variants)

```html-static
<!-- CORRECT -->
<article>
  <header class="x-card__header">
    <h3>Title</h3>
  </header>
  <div class="x-card__body"> Content goes here </div>
  <footer class="x-card__footer">
    <button>Action</button>
  </footer>
</article>
<!-- WRONG - div soup -->
<div x-card>
  <div class="header">Title</div>
  <div class="body">Content</div>
  <div class="footer">Action</div>
</div>
```

### Modals/Dialogs

```html-static
<!-- CORRECT -->
<dialog x-modal>
  <header class="x-modal__header">
    <h2>Modal Title</h2>
    <button aria-label="Close">×</button>
  </header>
  <main class="x-modal__main"> Modal content </main>
  <footer class="x-modal__footer">
    <button>Cancel</button>
    <button>Confirm</button>
  </footer>
</dialog>
<!-- WRONG -->
<div x-modal>
  <div class="modal-header">...</div>
  <div class="modal-body">...</div>
</div>
```

### Navigation

```html-static
<!-- CORRECT -->
<nav>
  <ul>
    <li>
      <a href="#home">Home</a>
    </li>
    <li>
      <a href="#about">About</a>
    </li>
  </ul>
</nav>
<!-- WRONG -->
<div x-navbar>
  <div class="nav-item">Home</div>
  <div class="nav-item">About</div>
</div>
```

### Accordion/Expandable

Use the native `<details>`: it is the expandable, and it gets the `details`
behavior from its tag. There is no item-level accordion attribute; a group of panels is
`x-accordion` (see [accordion](./behaviors/accordion.md)).

<div x-demo>
<details>
  <summary>Section Title</summary>
  <p>Section content</p>
</details>
</div>

### Tabs

Each child `<section>` is a panel and its `title` is the tab label. `x-tabs`
builds the `role="tablist"` nav, the tab buttons and the ARIA wiring itself, so
they are never hand-written:

<div x-demo>
<section x-tabs>
  <section title="Tab 1">Panel 1</section>
  <section title="Tab 2">Panel 2</section>
</section>
</div>

### Sidebar/Aside

`x-sidebar` builds its links from `items`; children are replaced, not kept:

<div x-demo>
<aside
  x-sidebar
  items="Dashboard,Projects,Settings"
  active="Projects">
</aside>
</div>

### Testimonials/Quotes

The quote and its author are attributes; the behavior builds the
`<blockquote>`, `<cite>` and footer from them:

<div x-demo>
<article
  x-cardtestimonial
  quote="This product changed my life!"
  author="John Doe"
  role="CEO, Company">
</article>
</div>

### Progress/Stats

<div x-demo>
<article
  x-cardstats
  value="1,234"
  label="Total Users"
  icon="📈">
</article>
<progress
  value="75"
  max="100">
  75%
</progress>
</div>

### Forms

`autoInjectComponents` is on by default — a plain `<form>` is enhanced
automatically, no `x-form` attribute needed.

```html
<!-- CORRECT -->
<form>
  <fieldset>
    <legend>Personal Info</legend>
    <label> Name
      <input
        type="text"
        required>
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

A layout wrapper with an ID:

<div x-demo>
<div
  id="grid-layout-1"
  x-grid
  columns="3">
  <article id="card-1" title="One">First card</article>
  <article id="card-2" title="Two">Second card</article>
  <article id="card-3" title="Three">Third card</article>
</div>
</div>

---

## Behavior Implementation Rules

### 1. createElement Calls

```javascript
// WRONG
const header = document.createElement('div');
header.className = 'x-card__header';

// CORRECT
const header = document.createElement('header');
header.className = 'x-card__header';
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
  <header class="x-card__header"><h3>${title}</h3></header>
  <div class="x-card__body">${content}</div>
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
      ".x-card__header": {
        "tagName": "HEADER",
        "required": false
      },
      ".x-card__body": {
        "tagName": "DIV",
        "required": true
      },
      ".x-card__footer": {
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

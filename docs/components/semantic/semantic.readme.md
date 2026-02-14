# Semantic HTML Components Documentation
[Edit this file](vscode://file/c:/Users/jwpmi/Downloads/AI/wb-starter/docs/components/semantic/semantic.readme.md)

## Overview
Web Behaviors (WB) components use proper semantic HTML elements to ensure accessibility, SEO, and meaningful document structure. All components follow semantic HTML standards and include appropriate ARIA attributes.

---

## Article Component

Self-contained, independently distributable content using the `<article>` element.

### Usage Examples

```html
<!-- Basic article -->
<wb-article>
  <header>
    <h2>Article Title</h2>
    <p>Article subtitle or excerpt</p>
  </header>
  <p>Article content goes here...</p>
  <footer>
    <time datetime="2024-12-15">December 15, 2024</time>
  </footer>
</wb-article>

<!-- Card as article -->
<wb-card variant="article">
  <wb-card-header>
    <wb-card-title>Blog Post Title</wb-card-title>
    <wb-card-subtitle>By Author Name</wb-card-subtitle>
  </wb-card-header>
  <wb-card-content>
    <p>Article content...</p>
  </wb-card-content>
</wb-card>
```

### Accessibility Features

- Announced as "article" landmark by screen readers
- Can have its own heading hierarchy
- Should make sense when taken out of context
- Supports proper document outlining

---

## Aside Component

Tangentially related content and supplementary information using the `<aside>` element.

### Usage Examples

```html
<!-- Sidebar content -->
<wb-aside>
  <h3>Related Links</h3>
  <ul>
    <li><a href="#link1">Related Article 1</a></li>
    <li><a href="#link2">Related Article 2</a></li>
  </ul>
</wb-aside>

<!-- Notification aside -->
<wb-aside role="alert">
  <wb-alert type="info" title="Important Notice">
    This information is supplementary to the main content.
  </wb-alert>
</wb-aside>
```

### Accessibility Features

- Announced as "complementary" landmark
- Use `role="alert"` for important notifications
- Reserve for truly supplementary content
- Don't overuse within main content flow

---

## Figure Component

Self-contained media with optional caption using `<figure>` and `<figcaption>` elements.

### Usage Examples

```html
<!-- Image with caption -->
<wb-figure>
  <img src="diagram.png" alt="Process flow diagram">
  <wb-figcaption>Figure 1: Overview of the process flow</wb-figcaption>
</wb-figure>

<!-- Code block figure -->
<wb-figure>
  <pre><code>// Example code
function hello() {
  console.log('Hello, World!');
}</code></pre>
  <wb-figcaption>Listing 1: Basic JavaScript function</wb-figcaption>
</wb-figure>
```

### Best Practices

- Always include descriptive `alt` text on images
- Caption should add context, not duplicate alt text
- Can contain multiple images as a gallery
- Use for charts, diagrams, code samples, etc.

---

## Address Component

Contact information for the author or organization using the `<address>` element.

### Usage Examples

```html
<!-- Author contact info -->
<wb-address>
  <strong>John Doe</strong><br>
  <a href="mailto:john@example.com">john@example.com</a><br>
  <a href="tel:+1234567890">(123) 456-7890</a><br>
  San Francisco, CA
</wb-address>

<!-- Organization contact -->
<wb-address>
  <strong>Acme Corporation</strong><br>
  123 Business St<br>
  Business City, ST 12345<br>
  <a href="mailto:info@acme.com">info@acme.com</a>
</wb-address>
```

### Accessibility Features

- Only use for contact info of article/page author or organization
- Not for general addresses (use regular paragraphs)
- Links within are appropriate (mailto:, tel:)
- Screen readers announce as contact information

---

## Blockquote Component

Extended quotations with attribution using `<blockquote>` and `<cite>` elements.

### Usage Examples

```html
<!-- Testimonial blockquote -->
<wb-blockquote cite="https://example.com/source">
  <p>"This product has completely transformed our workflow. The ease of use and powerful features make it indispensable for our team."</p>
  <footer>
    <wb-cite>— Sarah Johnson, CTO at TechCorp</wb-cite>
  </footer>
</wb-blockquote>

<!-- Quote with source -->
<wb-blockquote>
  <p>"The best way to predict the future is to create it."</p>
  <footer>
    <wb-cite>— Peter Drucker</wb-cite>
  </footer>
</wb-blockquote>
```

### Best Practices

- Use `cite` attribute for source URL when available
- Use `<cite>` element for work or author name
- Don't use for short inline quotes (use `<q>` instead)
- Include attribution when quoting someone

---

## Data Component

Machine-readable value linked to human-readable content using the `<data>` element.

### Usage Examples

```html
<!-- Statistics -->
<wb-data value="1234567">1.2M</wb-data> users

<!-- Metrics -->
<div class="stats">
  <wb-data value="95">95%</wb-data> uptime
  <wb-data value="1500000">$1.5M</wb-data> revenue
  <wb-data value="50000">50K</wb-data> downloads
</div>

<!-- Progress data -->
<wb-progress value="75" max="100">
  <wb-data value="75">75%</wb-data> complete
</wb-progress>
```

### Accessibility Features

- `value` attribute contains machine-readable data
- Element content is human-readable representation
- Useful for statistics, metrics, and formatted numbers
- Can be used by scripts and assistive technologies

---

## Time Component

Machine-readable date/time using the `<time>` element.

### Usage Examples

```html
<!-- Publication date -->
<wb-time datetime="2024-12-15T10:30:00Z">
  Published December 15, 2024
</wb-time>

<!-- Event date -->
<wb-time datetime="2024-06-15T19:00:00">
  June 15, 2024 at 7:00 PM
</wb-time>

<!-- Relative time -->
<wb-time datetime="2024-12-10T08:00:00Z" title="December 10, 2024">
  5 days ago
</wb-time>
```

### Best Practices

- Always include `datetime` attribute in ISO 8601 format
- Content can be any human-readable date/time format
- Use `title` attribute for full date when showing relative time
- Useful for events, articles, and timestamps

---

## Nav Component

Navigation links section using the `<nav>` element.

### Usage Examples

```html
<!-- Main navigation -->
<wb-nav aria-label="Main navigation">
  <wb-menu>
    <wb-menu-item href="/">Home</wb-menu-item>
    <wb-menu-item href="/about">About</wb-menu-item>
    <wb-menu-item href="/contact">Contact</wb-menu-item>
  </wb-menu>
</wb-nav>

<!-- Breadcrumb navigation -->
<wb-nav aria-label="Breadcrumb">
  <wb-breadcrumb>
    <wb-breadcrumb-item href="/">Home</wb-breadcrumb-item>
    <wb-breadcrumb-item href="/docs">Documentation</wb-breadcrumb-item>
    <wb-breadcrumb-item>Semantic HTML</wb-breadcrumb-item>
  </wb-breadcrumb>
</wb-nav>
```

### Accessibility Features

- Announced as "navigation" landmark
- Use `aria-label` to describe the navigation purpose
- For multiple nav elements, each needs unique label
- Skip redundant "navigation" in aria-label

---

## Progress Component

Task completion indicator using the native `<progress>` element.

### Usage Examples

```html
<!-- File upload progress -->
<wb-progress value="70" max="100" label="Uploading file...">
  70% complete
</wb-progress>

<!-- Task completion -->
<wb-progress value="3" max="5" label="Setup progress">
  Step 3 of 5
</wb-progress>

<!-- Indeterminate progress -->
<wb-progress label="Loading...">
  Please wait...
</wb-progress>
```

### Accessibility Features

- Browser provides native progress semantics
- Screen readers announce current value and maximum
- Fallback content displayed if unsupported
- Use `aria-valuetext` for custom status descriptions

---

## Dialog Component

Interactive dialog box/modal using the `<dialog>` element.

### Usage Examples

```html
<!-- Modal dialog -->
<wb-dialog aria-labelledby="dialog-title">
  <wb-dialog-header>
    <h2 id="dialog-title">Confirm Action</h2>
    <wb-button variant="ghost" onclick="this.closest('wb-dialog').close()">
      ✕
    </wb-button>
  </wb-dialog-header>
  <wb-dialog-body>
    <p>Are you sure you want to delete this item?</p>
  </wb-dialog-body>
  <wb-dialog-footer>
    <wb-button variant="outline" onclick="this.closest('wb-dialog').close()">
      Cancel
    </wb-button>
    <wb-button variant="primary" onclick="confirmDelete()">
      Delete
    </wb-button>
  </wb-dialog-footer>
</wb-dialog>
```

### Programmatic API

```javascript
const dialog = document.querySelector('wb-dialog');

// Open as modal (with backdrop)
dialog.showModal();

// Open as non-modal
dialog.show();

// Close dialog
dialog.close();

// Check if open
console.log(dialog.open); // true/false
```

### Accessibility Features

- Focus automatically trapped inside when open
- ESC key closes by default
- Proper ARIA attributes for screen readers
- Backdrop prevents interaction with background content

---

## Semantic HTML Element Reference

| Element | Purpose | ARIA Role | Used By |
|---------|---------|-----------|---------|
| `<article>` | Independent content | article | Cards, blog posts |
| `<aside>` | Supplementary content | complementary | Notifications, sidebars |
| `<figure>` | Self-contained media | figure | Images, diagrams |
| `<figcaption>` | Media caption | - | Image captions |
| `<address>` | Contact information | - | Author info, contact details |
| `<blockquote>` | Extended quote | blockquote | Testimonials, quotes |
| `<cite>` | Work/author name | - | Quote attribution |
| `<data>` | Machine-readable value | - | Statistics, metrics |
| `<time>` | Machine-readable date | time | Dates, timestamps |
| `<nav>` | Navigation links | navigation | Menus, breadcrumbs |
| `<progress>` | Progress indicator | progressbar | Loading, completion |
| `<dialog>` | Dialog/modal | dialog | Modals, alerts |

---

## Events

Semantic components emit appropriate events:

| Event | Component | Description | Detail |
|-------|-----------|-------------|--------|
| `wb:dialog:open` | Dialog | Dialog opened | `{ dialog }` |
| `wb:dialog:close` | Dialog | Dialog closed | `{ dialog }` |
| `wb:progress:complete` | Progress | Progress reached 100% | `{ progress, value }` |

---

## Accessibility Best Practices

### Semantic HTML Guidelines

- **Use semantic elements** for their intended purpose, not just styling
- **Include ARIA attributes** when semantic elements don't provide enough context
- **Provide text alternatives** for all non-text content
- **Maintain heading hierarchy** (H1 → H2 → H3, no skipping levels)
- **Test with screen readers** and keyboard navigation

### Common Mistakes to Avoid

- ❌ Using `<div>` when a semantic element would be more appropriate
- ❌ Relying solely on visual styling to convey meaning
- ❌ Skipping heading levels in document structure
- ❌ Using semantic elements purely for their default styling
- ❌ Forgetting keyboard navigation support

### Testing Checklist

- [ ] Screen reader announces correct landmark roles
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus indicators are visible and logical
- [ ] Color is not the only way information is conveyed
- [ ] Text alternatives provided for images and media
- [ ] Document has proper heading hierarchy

---

## Styling

Semantic components use CSS custom properties for theming:

```css
:root {
  /* Article */
  --article-border: var(--border-color);
  --article-padding: 1rem;

  /* Aside */
  --aside-bg: var(--bg-secondary);
  --aside-border: var(--border-color);

  /* Figure */
  --figure-margin: 1rem 0;
  --figure-caption-color: var(--text-secondary);

  /* Blockquote */
  --blockquote-border-left: 4px solid var(--primary-color);
  --blockquote-padding: 1rem;

  /* Time */
  --time-color: var(--text-secondary);

  /* Dialog */
  --dialog-overlay-bg: rgba(0, 0, 0, 0.5);
  --dialog-border-radius: 8px;
  --dialog-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
```

---

## Implementation
- **Components**: Located in `src/wb-viewmodels/` (article.js, aside.js, figure.js, etc.)
- **Styles**: [src/styles/components/semantic.css](../../src/styles/components/semantic.css)
- **Schemas**: Semantic component schemas in `src/wb-models/`
- **Tests**: Semantic tests in `tests/behaviors/ui/semantic.spec.ts`

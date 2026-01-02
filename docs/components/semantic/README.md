# Semantic HTML Elements

## Overview

Web Behaviors (WB) components use proper semantic HTML elements to ensure accessibility, SEO, and meaningful document structure.

---

## Article (`<article>`)

### Purpose
Self-contained, independently distributable content.

### Used By
- All card variants (except `cardnotification`)
- Blog posts, news items, forum posts

### Structure
```html
<article class="wb-card">
  <header class="wb-card__header">
    <h2 class="wb-card__title">Title</h2>
    <p class="wb-card__subtitle">Subtitle</p>
  </header>
  <main class="wb-card__main">
    <div class="wb-card__content">Content</div>
  </main>
  <footer class="wb-card__footer">Footer</footer>
</article>
```

### Accessibility
- Can have its own heading hierarchy
- Assistive tech announces as "article"
- Should make sense in isolation

---

## Aside (`<aside>`)

### Purpose
Tangentially related content, supplementary information.

### Used By
- `cardnotification`
- `sidebar`
- Pull quotes, related links

### Structure
```html
<aside class="wb-card wb-card--notification" role="alert">
  <div class="wb-card__notif-icon">ℹ️</div>
  <div class="wb-card__notif-content">
    <strong class="wb-card__notif-title">Title</strong>
    <p class="wb-card__notif-message">Message</p>
  </div>
</aside>
```

### Accessibility
- Announced as "complementary" landmark
- Use `role="alert"` for important notifications
- Don't overuse - reserve for truly supplementary content

---

## Figure & Figcaption (`<figure>`, `<figcaption>`)

### Purpose
Self-contained media with optional caption.

### Used By
- `cardimage`
- `image` component
- Any component with captioned media

### Structure
```html
<figure class="wb-card__figure">
  <img src="image.jpg" alt="Description" class="wb-card__image">
  <figcaption class="wb-card__caption">Caption text</figcaption>
</figure>
```

### Best Practices
- Always include `alt` text on images
- Caption should add context, not duplicate alt
- Can contain multiple images as a gallery

---

## Address (`<address>`)

### Purpose
Contact information for author/owner.

### Used By
- `cardportfolio`
- Contact cards, author bios

### Structure
```html
<address class="wb-card__portfolio-contact">
  <a href="mailto:email@example.com" class="wb-card__portfolio-email">
    email@example.com
  </a>
  <a href="tel:+1234567890" class="wb-card__portfolio-phone">
    (123) 456-7890
  </a>
  <span class="wb-card__portfolio-location">San Francisco, CA</span>
</address>
```

### Accessibility
- Only for contact info of the article/page author
- Not for general addresses (use `<p>` instead)
- Links within are appropriate (mailto:, tel:)

---

## Blockquote & Cite (`<blockquote>`, `<cite>`)

### Purpose
Extended quotations with attribution.

### Used By
- `cardtestimonial`
- Quote blocks, testimonials

### Structure
```html
<blockquote class="wb-card__quote" cite="https://source.url">
  <p>"This is the quoted text from the testimonial."</p>
  <footer class="wb-card__quote-footer">
    <cite class="wb-card__author">— Author Name</cite>
    <span class="wb-card__author-role">Job Title, Company</span>
  </footer>
</blockquote>
```

### Best Practices
- Use `cite` attribute for source URL
- Use `<cite>` element for work/author name
- Don't use for short inline quotes (use `<q>` instead)

---

## Data (`<data>`)

### Purpose
Machine-readable value linked to human-readable content.

### Used By
- `cardstats`
- Statistics, metrics, values

### Structure
```html
<data value="1234567" class="wb-card__stats-value">
  1.2M
</data>
```

### Accessibility
- `value` attribute contains machine-readable data
- Content is human-readable representation
- Useful for stats, counts, formatted numbers

---

## Time (`<time>`)

### Purpose
Machine-readable date/time.

### Used By
- Date displays, timestamps
- Event dates, article dates

### Structure
```html
<time datetime="2024-12-15T14:30:00Z" class="wb-card__date">
  December 15, 2024
</time>
```

### Best Practices
- Always include `datetime` attribute
- Use ISO 8601 format for datetime value
- Content can be any human-readable format

---

## Nav (`<nav>`)

### Purpose
Navigation links section.

### Used By
- `tabs`
- `breadcrumb`
- `menu`
- `pagination`

### Structure
```html
<nav class="wb-tabs" aria-label="Content tabs">
  <div class="wb-tabs__list" role="tablist">
    <button role="tab" aria-selected="true">Tab 1</button>
    <button role="tab" aria-selected="false">Tab 2</button>
  </div>
</nav>
```

### Accessibility
- Use `aria-label` to describe the navigation
- For multiple navs, each needs unique label
- Skip redundant "navigation" in label (screen readers announce it)

---

## Progress (`<progress>`)

### Purpose
Task completion indicator.

### Used By
- `progress` component
- Loading states, upload progress

### Structure
```html
<progress class="wb-progress" value="70" max="100">
  70%
</progress>
```

### Accessibility
- Browser provides native semantics
- Fallback content displayed if unsupported
- Use `aria-valuetext` for custom status text

---

## Dialog (`<dialog>`)

### Purpose
Interactive dialog box/modal.

### Used By
- `modal` component
- Confirmation dialogs, alerts

### Structure
```html
<dialog class="wb-modal" aria-labelledby="modal-title">
  <header class="wb-modal__header">
    <h2 id="modal-title">Modal Title</h2>
    <button class="wb-modal__close" aria-label="Close">×</button>
  </header>
  <div class="wb-modal__body">Content</div>
  <footer class="wb-modal__footer">
    <button>Cancel</button>
    <button>Confirm</button>
  </footer>
</dialog>
```

### Methods
```javascript
dialog.showModal(); // Open as modal (with backdrop)
dialog.show();      // Open as non-modal
dialog.close();     // Close dialog
```

### Accessibility
- Focus trapped inside when open
- ESC key closes by default
- Use `aria-labelledby` to link to title

---

## Summary Table

| Element | Purpose | ARIA Role | Used By |
|---------|---------|-----------|---------|
| `<article>` | Independent content | article | Cards |
| `<aside>` | Supplementary content | complementary | Notifications, Sidebar |
| `<figure>` | Self-contained media | figure | Image cards |
| `<figcaption>` | Media caption | - | Image cards |
| `<address>` | Contact information | - | Portfolio cards |
| `<blockquote>` | Extended quote | blockquote | Testimonials |
| `<cite>` | Work/author name | - | Testimonials |
| `<data>` | Machine-readable value | - | Stats cards |
| `<time>` | Machine-readable date | time | Date displays |
| `<nav>` | Navigation links | navigation | Tabs, Menu |
| `<progress>` | Progress indicator | progressbar | Progress bars |
| `<dialog>` | Dialog/modal | dialog | Modals |

---

## Best Practices

### Do
- ✅ Use semantic elements for their intended purpose
- ✅ Include ARIA attributes where needed
- ✅ Provide text alternatives for non-text content
- ✅ Use heading hierarchy (H1 → H2 → H3)
- ✅ Test with screen readers

### Don't
- ❌ Use `<div>` when a semantic element fits
- ❌ Rely solely on visual styling for meaning
- ❌ Skip heading levels (H1 → H3)
- ❌ Use semantic elements purely for styling
- ❌ Forget keyboard navigation

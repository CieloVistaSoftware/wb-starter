# Card Components

## Overview

The Web Behaviors (WB) library provides 19 card variants that all inherit from a base card. Cards use semantic `<article>` elements and support inline text editing.

## Base Card Properties

All card variants inherit these properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | "Card Title" | Main heading (H2/H3) |
| `subtitle` | string | "Card subtitle" | Secondary text |
| `footer` | string | "Card footer" | Footer content |
| `elevated` | boolean | false | Add drop shadow |
| `clickable` | boolean | false | Make entire card clickable |
| `href` | string | "" | Link URL when clickable |
| `hoverText` | string | "" | Tooltip on hover |

---

## Card Variants

### 1. Card (Base)
Basic card with title, subtitle, and footer.

```html
<article data-wb="card" 
         data-title="Card Title" 
         data-subtitle="Subtitle" 
         data-footer="Footer">
</article>
```

**Semantic HTML:** `<article>`

---

### 2. Card Button
Card with primary and secondary action buttons.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | string | "" | Card body content |
| `primary` | string | "Confirm" | Primary button text |
| `primaryHref` | string | "" | Primary button URL |
| `secondary` | string | "Cancel" | Secondary button text |
| `secondaryHref` | string | "" | Secondary button URL |
| `layout` | string | "row" | Button layout: row, column |

```html
<article data-wb="cardbutton" 
         data-title="Action Card" 
         data-primary="Submit" 
         data-secondary="Cancel">
</article>
```

---

### 3. Card Draggable
Moveable card with drag handle.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | string | "" | Card body content |
| `constrain` | string | "none" | Constraint: none, parent, viewport |
| `axis` | string | "both" | Movement axis: both, x, y |
| `snapToGrid` | boolean | false | Snap to grid lines |

```html
<article data-wb="carddraggable" 
         data-title="Draggable" 
         data-snap-to-grid="true">
</article>
```

---

### 4. Card Expandable
Card with expandable/collapsible content.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | string | "" | Expandable content |
| `maxHeight` | string | "100px" | Collapsed height |
| `expanded` | boolean | false | Start expanded |

```html
<article data-wb="cardexpandable" 
         data-title="Expandable" 
         data-max-height="100px">
</article>
```

---

### 5. Card File
File download card.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `filename` | string | "document.pdf" | File name |
| `type` | string | "pdf" | File type: pdf, doc, image, video, audio, zip |
| `size` | string | "2.4 MB" | File size |
| `date` | string | "" | Upload date |
| `downloadable` | boolean | true | Show download button |
| `downloadHref` | string | "#" | Download URL |

**Semantic HTML:** `<article>` with download link

---

### 6. Card Hero
Large banner card with background.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | string | "" | Background image URL |
| `cta` | string | "Learn More" | CTA button text |
| `ctaHref` | string | "#" | CTA button URL |
| `height` | string | "400px" | Card height |
| `align` | string | "center" | Text alignment: left, center, right |
| `overlay` | boolean | true | Dark overlay on image |

---

### 7. Card Horizontal
Side-by-side image and content layout.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | string | "" | Card body content |
| `image` | string | "" | Image URL |
| `imagePosition` | string | "left" | Image position: left, right |
| `imageWidth` | string | "40%" | Image width |

---

### 8. Card Image
Card with featured image.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | "" | Image URL |
| `alt` | string | "" | Image alt text |
| `aspect` | string | "16/9" | Aspect ratio: 16/9, 4/3, 1/1, 3/2 |
| `position` | string | "top" | Image position: top, bottom |
| `fit` | string | "cover" | Object fit: cover, contain, fill |

**Semantic HTML:** `<article>` containing `<figure>` with `<img>` and optional `<figcaption>`

---

### 9. Card Link
Fully clickable link card.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | string | "" | Card body content |
| `href` | string | "" | **Required** - Link URL |
| `target` | string | "_self" | Link target: _self, _blank |
| `icon` | string | "🔗" | Link icon |

**Semantic HTML:** `<article>` containing `<a>`

---

### 10. Card Minimizable
Card with minimize/restore toggle.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | string | "" | Card body content |
| `minimized` | boolean | false | Start minimized |

---

### 11. Card Notification
Alert/notification card (uses `<aside>` tag).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | "info" | Type: info, success, warning, error |
| `title` | string | "Notification" | Notification title |
| `message` | string | "" | Notification message |
| `dismissible` | boolean | true | Show close button |
| `icon` | string | "" | Custom icon |

**Semantic HTML:** `<aside>` (not `<article>`)

---

### 12. Card Overlay
Image with text overlay.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | string | "" | Background image URL |
| `position` | string | "bottom" | Text position: top, center, bottom |
| `gradient` | boolean | true | Add gradient overlay |
| `height` | string | "300px" | Card height |

---

### 13. Card Portfolio
Contact/portfolio card with address info.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | "" | Person name |
| `title` | string | "" | Job title |
| `bio` | string | "" | Biography |
| `company` | string | "" | Company name |
| `location` | string | "" | Location |
| `avatar` | string | "" | Avatar image URL |
| `email` | string | "" | Email address |
| `phone` | string | "" | Phone number |
| `website` | string | "" | Website URL |
| `linkedin` | string | "" | LinkedIn URL |
| `twitter` | string | "" | Twitter URL |
| `github` | string | "" | GitHub URL |

**Semantic HTML:** `<article>` containing `<address>`

---

### 14. Card Pricing
Pricing plan card.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `plan` | string | "Basic" | Plan name |
| `price` | string | "$9" | Price amount |
| `period` | string | "/month" | Billing period |
| `features` | string | "" | Comma-separated features |
| `cta` | string | "Get Started" | CTA button text |
| `ctaHref` | string | "#" | CTA button URL |
| `featured` | boolean | false | Highlight as featured |
| `badge` | string | "" | Badge text (e.g., "Popular") |

---

### 15. Card Product
E-commerce product card.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | string | "" | Product image URL |
| `price` | string | "" | Current price |
| `originalPrice` | string | "" | Original price (for sale) |
| `description` | string | "" | Product description |
| `cta` | string | "Add to Cart" | CTA button text |
| `ctaHref` | string | "#" | CTA button URL |
| `badge` | string | "" | Badge text (e.g., "Sale") |
| `rating` | string | "" | Star rating (1-5) |

---

### 16. Card Profile
User profile card.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | "" | User name |
| `role` | string | "" | User role |
| `bio` | string | "" | User bio |
| `avatar` | string | "" | Avatar image URL |
| `stats` | string | "" | Stats JSON |
| `social` | string | "" | Social links JSON |

---

### 17. Card Stats
Statistics display card.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | string | "0" | Main statistic value |
| `label` | string | "Label" | Statistic label |
| `trend` | string | "up" | Trend direction: up, down, neutral |
| `trendValue` | string | "" | Trend percentage |
| `icon` | string | "" | Optional icon |

**Semantic HTML:** `<article>` containing `<data value="...">`

---

### 18. Card Testimonial
Quote/testimonial card.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `quote` | string | "" | Testimonial quote |
| `author` | string | "" | Author name |
| `role` | string | "" | Author role/title |
| `avatar` | string | "" | Author avatar URL |
| `rating` | string | "" | Star rating (1-5) |

**Semantic HTML:** `<article>` containing `<blockquote>` with `<cite>`

---

### 19. Card Video
Video player card.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | string | "" | Video URL |
| `poster` | string | "" | Poster image URL |
| `autoplay` | boolean | false | Autoplay video |
| `muted` | boolean | false | Mute video |
| `loop` | boolean | false | Loop video |
| `controls` | boolean | true | Show controls |
| `aspect` | string | "16/9" | Aspect ratio |

**Semantic HTML:** `<article>` containing `<video>`

---

## Inline Editing

All text properties support double-click inline editing in the builder:

- **title** - H2/H3 heading
- **subtitle** - Paragraph
- **content** - Main body text
- **footer** - Footer text
- **name**, **role**, **bio** - Profile cards
- **quote**, **author** - Testimonial cards
- **value**, **label** - Stats cards

## CSS Classes

All cards use BEM naming:

```css
.wb-card { }
.wb-card__header { }
.wb-card__title { }
.wb-card__subtitle { }
.wb-card__main { }
.wb-card__content { }
.wb-card__footer { }
.wb-card__actions { }
.wb-card__btn { }
.wb-card__btn--primary { }
.wb-card__btn--secondary { }
.wb-card--elevated { }
.wb-card--clickable { }
```

## Events

Cards emit these events:

| Event | Description | Detail |
|-------|-------------|--------|
| `wb:card:click` | Card clicked | `{ card, href }` |
| `wb:card:expand` | Expandable toggled | `{ card, expanded }` |
| `wb:card:minimize` | Minimizable toggled | `{ card, minimized }` |
| `wb:card:drag:start` | Drag started | `{ card, x, y }` |
| `wb:card:drag:end` | Drag ended | `{ card, x, y }` |

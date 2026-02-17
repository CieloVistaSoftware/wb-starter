# Intellisense Tooltip Audit Report

**Date:** 1/5/2026, 8:37:47 PM
**Total Components:** 89

This report records exactly what is displayed in the VS Code hover tooltip for each component.

--- 

## `<button-tooltip>`

**Tooltip Output:**
```text
A button with a tooltip.

Attributes:
- content: string
- position: string
```

<details><summary>View 2 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `content` | Tooltip content. |
| `position` | Tooltip position. |

</details>

---

## `<wb-alert>`

**Tooltip Output:**
```text
Alert

Alert component for displaying messages with severity levels

Variants:
- info
- success
- warning
- error

CSS Rules:
- wb-alert--*
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `variant` | Alert severity/style variant |
| `title` | Alert title (optional heading) |
| `message` | Alert message content |
| `icon` | Icon (emoji or icon name) |
| `dismissible` | Show close button to dismiss alert |

</details>

---

## `<wb-audio>`

**Tooltip Output:**
```text
Audio

Audio player with optional 15-band graphic equalizer
```

<details><summary>View 8 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `src` | Audio source URL |
| `volume` | Initial volume (0-1) |
| `loop` | Loop playback |
| `autoplay` | Auto-play (requires muted) |
| `muted` | Start muted |
| `showEq` | Show 15-band equalizer |
| `bass` | Bass boost (-12 to 12 dB) |
| `treble` | Treble boost (-12 to 12 dB) |

</details>

---

## `<wb-avatar>`

**Tooltip Output:**
```text
Avatar

User avatar with image, initials fallback, and status indicator
```

<details><summary>View 8 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `src` | Image source URL |
| `alt` | Alt text for image |
| `initials` | Fallback initials (2 chars) |
| `name` | Full name (generates initials if not provided) |
| `size` | size |
| `shape` | shape |
| `status` | Status indicator |
| `bordered` | Show border |

</details>

---

## `<wb-badge>`

**Tooltip Output:**
```text
Badge

Small label/tag for status indicators, counts, or categories

Variants:
- default
- primary
- secondary
- success
- warning
- error
- info

CSS Rules:
- wb-badge--*
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `label` | Badge text content |
| `variant` | Color variant |
| `size` | Badge size |
| `pill` | Pill shape with full border radius |
| `dot` | Dot indicator (no text) |
| `outline` | Outline style (transparent background) |
| `removable` | Show remove/close button |

</details>

---

## `<wb-behavior>`

**Tooltip Output:**
```text
Web Behaviors (WB) Behavior Schema

Master schema defining all behavior metadata, properties, interactions, accessibility, and test requirements
```

---

## `<wb-behaviors-showcase>`

**Tooltip Output:**
```text
Behaviors Showcase

Schema for behaviors-showcase.html - validates all behaviors render correctly
```

---

## `<wb-builder>`

**Tooltip Output:**
```text
Builder Schema

Unified schema for builder components and UI interactions.
```

<details><summary>View 4 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `label` | label |
| `icon` | icon |
| `components` | List of components in the builder. |
| `meta` | Builder-level metadata (optional) |

</details>

---

## `<wb-button>`

**Tooltip Output:**
```text
Button

Interactive button with variants, sizes, and optional icon

Variants:
- primary
- secondary
- success
- warning
- error
- ghost
- outline
- link

CSS Rules:
- wb-button--*
```

<details><summary>View 9 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `label` | Button text |
| `icon` | Icon (emoji or icon name) |
| `iconPosition` | Icon position relative to label |
| `variant` | Visual style variant |
| `size` | Button size |
| `disabled` | Disabled state |
| `loading` | Loading state with spinner |
| `fullWidth` | Full width button |
| `iconOnly` | Icon-only button (square) |

</details>

---

## `<wb-card>`

**Tooltip Output:**
```text
A generic card component. Use this for basic content containers.

For specialized cards, use:
- <wb-card-hero> (Hero/Banner)
- <wb-card-product> (E-commerce)
- <wb-card-profile> (User profile)
- <wb-card-pricing> (Pricing table)

Methods (via JS):
- element.show()
- element.hide()
- element.toggle()
- element.update({ title: 'New' })
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `title` | Card title displayed in the header. |
| `subtitle` | Card subtitle displayed below the title. |
| `footer` | Text content for the card footer. |
| `variant` | Visual style variant. |
| `elevated` | Adds a drop shadow for depth. |
| `clickable` | Applies cursor pointer and click styles. |
| `draggable` | Makes the card draggable (Behavior). |

</details>

---

## `<wb-card-file>`

**Tooltip Output:**
```text
File attachment card.
```

<details><summary>View 4 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `filename` | Name of file |
| `size` | File size string |
| `type` | MIME type or extension |
| `url` | Download/view URL |

</details>

---

## `<wb-card-hero>`

**Tooltip Output:**
```text
Hero/Banner card component with background image and overlay.

Attributes:
- background: Image URL
- title: Headline
- subtitle: Tagline
- cta: Button text
- variant: cosmic, split, minimal
```

<details><summary>View 9 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `background` | Background image URL [Required] |
| `title` | Hero headline [Required] |
| `subtitle` | Hero tagline |
| `cta` | Call-to-action button text |
| `ctaHref` | CTA link URL |
| `overlay` | Show gradient overlay |
| `fullHeight` | Full viewport height |
| `variant` | Visual style variant |
| `xalign` | Horizontal alignment |

</details>

---

## `<wb-card-image>`

**Tooltip Output:**
```text
Image-focused card.
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `src` | Image URL |
| `alt` | Alt text |
| `caption` | Image caption |

</details>

---

## `<wb-card-link>`

**Tooltip Output:**
```text
Entirely clickable link card.
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `href` | Destination URL |
| `title` | Link title |
| `icon` | Optional icon name |

</details>

---

## `<wb-card-notification>`

**Tooltip Output:**
```text
Notification card style.
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `title` | Notification title |
| `message` | Notification body |
| `type` | info, success, warning, error |

</details>

---

## `<wb-card-overlay>`

**Tooltip Output:**
```text
Card with content overlaid on background image.
```

<details><summary>View 1 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `background` | Background image URL |

</details>

---

## `<wb-card-portfolio>`

**Tooltip Output:**
```text
Portfolio item card.
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `image` | Project image |
| `title` | Project title |
| `client` | Client name |

</details>

---

## `<wb-card-pricing>`

**Tooltip Output:**
```text
Pricing table card with price point, features, and CTA.
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `price` | Price string (e.g. $99) |
| `period` | Billing period (e.g. /mo) |
| `plan` | Plan name (e.g. Pro) |
| `features` | JSON array of features |
| `popular` | Mark as popular choice |

</details>

---

## `<wb-card-product>`

**Tooltip Output:**
```text
Product card component with image, price, rating, and CTA.

Attributes:
- image: Product image
- title: Product name
- price: Current price
- rating: 0-5 stars
```

<details><summary>View 10 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `image` | Product image URL |
| `title` | Product name [Required] |
| `price` | Current price [Required] |
| `originalPrice` | Original price (strikethrough) |
| `badge` | Badge text (Sale, New) |
| `rating` | Star rating (0-5) |
| `reviews` | Number of reviews |
| `cta` | Button text (default: Add to Cart) |
| `featured` | Highlight as featured |
| `variant` | Visual layout variant |

</details>

---

## `<wb-card-profile>`

**Tooltip Output:**
```text
User profile card with avatar, stats, and bio.
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `avatar` | Avatar image URL |
| `name` | User full name |
| `role` | Job title or role |
| `bio` | Short biography |
| `variant` | Profile layout style |

</details>

---

## `<wb-card-stats>`

**Tooltip Output:**
```text
Statistics card for dashboards.
```

<details><summary>View 4 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `value` | Main statistic value |
| `label` | Label for the stat |
| `trend` | Trend percentage/text |
| `trendDirection` | up/down/flat |

</details>

---

## `<wb-card-testimonial>`

**Tooltip Output:**
```text
Testimonial card with quote and author.
```

<details><summary>View 4 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `quote` | Testimonial text |
| `author` | Author name |
| `role` | Author role/company |
| `avatar` | Author avatar URL |

</details>

---

## `<wb-card-video>`

**Tooltip Output:**
```text
Video player card.
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `src` | Video source URL |
| `poster` | Preview image URL |
| `autoplay` |  |

</details>

---

## `<wb-cardbutton>`

**Tooltip Output:**
```text
Button Card

Card with action buttons in footer

Variants:
- default
- elevated
- bordered

CSS Rules:
- wb-card-button--*
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `title` | Card title |
| `content` | Card content/description |
| `primary` | Primary button text |
| `primaryHref` | Primary button link URL |
| `secondary` | Secondary button text |
| `secondaryHref` | Secondary button link URL |
| `variant` | variant |

</details>

---

## `<wb-carddraggable>`

**Tooltip Output:**
```text
Draggable Card

Card that can be dragged around the page

Variants:
- default
- elevated

CSS Rules:
- wb-card-draggable--*
```

<details><summary>View 6 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `title` | Card title |
| `content` | Card content |
| `constrain` | Constrain to area |
| `axis` | Drag axis |
| `snapToGrid` | Snap grid size (0=disabled) |
| `variant` | variant |

</details>

---

## `<wb-cardexpandable>`

**Tooltip Output:**
```text
Expandable Card

Card with collapsible/expandable content section

Variants:
- default
- elevated
- bordered

CSS Rules:
- wb-card-expandable--*
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `title` | Card title |
| `content` | Expandable content |
| `expanded` | Initial expanded state |
| `maxHeight` | Max height when collapsed |
| `variant` | variant |

</details>

---

## `<wb-cardfile>`

**Tooltip Output:**
```text
File Card

File display card with icon, name, size, and download

Variants:
- default
- compact
- elevated

CSS Rules:
- wb-card-file--*
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `filename` | File name |
| `fileType` | File type for icon |
| `size` | File size (e.g., 2.4 MB) |
| `date` | File date |
| `href` | Download URL |
| `downloadable` | Show download link |
| `variant` | variant |

</details>

---

## `<wb-cardhero>`

**Tooltip Output:**
```text
Hero Card

Hero banner with background image, title, subtitle, and optional CTA

Variants:
- default
- cosmic
- split
- minimal
- gradient

CSS Rules:
- wb-hero--*
```

<details><summary>View 9 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `background` | Background image URL |
| `title` | Hero headline |
| `subtitle` | Hero tagline/subheadline |
| `cta` | Call-to-action button text |
| `ctaHref` | Call-to-action link URL |
| `variant` | Visual style variant |
| `xalign` | Horizontal content alignment (x-axis) |
| `overlay` | Show gradient overlay for text readability |
| `fullHeight` | Make hero full viewport height |

</details>

---

## `<wb-cardhorizontal>`

**Tooltip Output:**
```text
Horizontal Card

Card with horizontal layout - image on side, content on other

Variants:
- default
- elevated
- bordered
- minimal

CSS Rules:
- wb-card-horizontal--*
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `image` | Image URL |
| `imageAlt` | Image alt text |
| `imagePosition` | Image position |
| `imageWidth` | Image width (CSS value) |
| `title` | Card title |
| `subtitle` | Card subtitle |
| `variant` | Visual style variant |

</details>

---

## `<wb-cardimage>`

**Tooltip Output:**
```text
Image Card

Card with featured image and optional title/subtitle

Variants:
- default
- elevated
- bordered
- minimal

CSS Rules:
- wb-card-image--*
```

<details><summary>View 11 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `src` | Image source URL |
| `alt` | Image alt text (accessibility) |
| `title` | Card title |
| `subtitle` | Card subtitle |
| `caption` | Image caption (displayed below image) |
| `href` | Link URL (makes card clickable) |
| `aspect` | Image aspect ratio |
| `position` | Image position relative to content |
| `fit` | Image object-fit mode |
| `loading` | Image loading strategy |
| `variant` | Visual style variant |

</details>

---

## `<wb-cardlink>`

**Tooltip Output:**
```text
Link Card

Clickable card that navigates to a URL

Variants:
- default
- elevated
- bordered
- minimal
- glass

CSS Rules:
- wb-card-link--*
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `href` | Link destination URL |
| `title` | Card title |
| `description` | Card description text |
| `icon` | Icon (emoji or icon name) |
| `badge` | Badge text |
| `target` | Link target |
| `variant` | Visual style variant |

</details>

---

## `<wb-cardminimizable>`

**Tooltip Output:**
```text
Minimizable Card

Card with minimize/expand toggle button in header

Variants:
- default
- elevated
- bordered

CSS Rules:
- wb-card-minimizable--*
```

<details><summary>View 4 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `title` | Card title (always visible) |
| `content` | Minimizable content |
| `minimized` | Initial minimized state |
| `variant` | variant |

</details>

---

## `<wb-cardnotification>`

**Tooltip Output:**
```text
Notification Card

Dismissible notification card with type-based styling

Variants:
- info
- success
- warning
- error

CSS Rules:
- wb-notification--*
```

<details><summary>View 6 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `variant` | Notification type/severity |
| `title` | Notification title |
| `message` | Notification message |
| `icon` | Custom icon (overrides type-based icon) |
| `dismissible` | Show dismiss button |
| `elevated` | Add shadow elevation |

</details>

---

## `<wb-cardoverlay>`

**Tooltip Output:**
```text
Overlay Card

Card with text overlaid on background image

Variants:
- default
- dark
- light
- blur

CSS Rules:
- wb-card-overlay--*
```

<details><summary>View 8 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `image` | Background image URL |
| `title` | Overlay title |
| `subtitle` | Overlay subtitle |
| `position` | Content position |
| `xalign` | Horizontal text alignment (x-axis) |
| `gradient` | Show gradient overlay for text readability |
| `height` | Card height (CSS value) |
| `variant` | Visual style variant |

</details>

---

## `<wb-cardportfolio>`

**Tooltip Output:**
```text
Portfolio Card

Professional portfolio/profile card with cover, avatar, bio, contact, and social

Variants:
- default
- compact
- horizontal

CSS Rules:
- wb-portfolio--*
```

<details><summary>View 12 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `name` | Full name |
| `title` | Job title |
| `company` | Company name |
| `location` | Location |
| `cover` | Cover image URL |
| `avatar` | Avatar image URL |
| `bio` | Biography text |
| `email` | Email address |
| `phone` | Phone number |
| `website` | Website URL |
| `social` | Social links as JSON [{name, url, icon}] |
| `variant` | variant |

</details>

---

## `<wb-cardpricing>`

**Tooltip Output:**
```text
Pricing Card

Pricing tier card with plan name, price, features list, and CTA

Variants:
- default
- bordered
- elevated
- minimal

CSS Rules:
- wb-pricing--*
```

<details><summary>View 9 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `plan` | Plan name (e.g., Basic, Pro, Enterprise) |
| `price` | Price amount (e.g., $29) |
| `period` | Billing period (e.g., /month, /year) |
| `description` | Short plan description |
| `features` | Comma-separated list of features |
| `cta` | Call-to-action button text |
| `ctaHref` | Call-to-action link URL |
| `featured` | Highlight as featured/recommended plan |
| `variant` | Visual style variant |

</details>

---

## `<wb-cardproduct>`

**Tooltip Output:**
```text
Product Card

E-commerce product card with image, price, rating, and CTA

Variants:
- default
- compact
- horizontal
- minimal

CSS Rules:
- wb-product--*
```

<details><summary>View 11 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `image` | Product image URL |
| `title` | Product name |
| `description` | Product description |
| `price` | Current price |
| `originalPrice` | Original price (shows discount) |
| `badge` | Badge text (Sale, New, etc.) |
| `rating` | Product rating (0-5) |
| `reviews` | Number of reviews |
| `cta` | CTA button text |
| `featured` | Highlight as featured |
| `variant` | Visual style variant |

</details>

---

## `<wb-cardprofile>`

**Tooltip Output:**
```text
Card Profile

Simple profile card. INHERITS from card.base (IS-A card), CONTAINS profile elements (HAS-A avatar, name, role, bio, cover).
```

<details><summary>View 8 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `name` | Person's name |
| `role` | Job title or role |
| `avatar` | Avatar image URL |
| `bio` | Short biography |
| `cover` | Cover/banner image URL |
| `size` | Avatar size |
| `align` | Content alignment |
| `hoverText` | Tooltip text shown on hover |

</details>

---

## `<wb-cardstats>`

**Tooltip Output:**
```text
Stats Card

Statistics display card with value, label, icon, and trend indicator

Variants:
- default
- compact
- large
- minimal

CSS Rules:
- wb-stats--*
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `value` | The main statistic value (e.g., 1,234 or $50K) |
| `label` | Label describing what the value represents |
| `icon` | Icon (emoji or icon name) |
| `trend` | Trend direction |
| `trendValue` | Trend amount (e.g., +12%, -5%) |
| `variant` | Visual style variant |
| `color` | Accent color (CSS color value) |

</details>

---

## `<wb-cardtestimonial>`

**Tooltip Output:**
```text
Testimonial Card

Customer testimonial/review card with quote, author, avatar, and rating

Variants:
- default
- elevated
- bordered
- minimal
- centered

CSS Rules:
- wb-testimonial--*
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `quote` | Testimonial quote text |
| `author` | Author name |
| `role` | Author role/title/company |
| `avatar` | Author avatar image URL |
| `rating` | Star rating (0-5) |
| `variant` | Visual style variant |
| `size` | Card size |

</details>

---

## `<wb-cardvideo>`

**Tooltip Output:**
```text
Video Card

Card with embedded video player

Variants:
- default
- minimal
- bordered
- elevated

CSS Rules:
- wb-card-video--*
```

<details><summary>View 10 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `src` | Video source URL |
| `poster` | Poster image URL |
| `title` | Video title |
| `description` | Video description |
| `autoplay` | Auto-play video (requires muted) |
| `muted` | Mute video |
| `loop` | Loop video playback |
| `controls` | Show video controls |
| `aspect` | Video aspect ratio |
| `variant` | Visual style variant |

</details>

---

## `<wb-center>`

**Tooltip Output:**
```text
A layout that centers its content horizontally and vertically.

Attributes:
- gutters: size
- intrinsic: true, false
- max-width: size
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `max-width` | Maximum width of the content. |
| `gutters` | Minimum side margins. |
| `intrinsic` | Whether to center based on intrinsic content size. |

</details>

---

## `<wb-checkbox>`

**Tooltip Output:**
```text
Checkbox

Checkbox input with label and custom styling

Variants:
- default
- primary
- success

CSS Rules:
- wb-checkbox--*
```

<details><summary>View 9 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `label` | Label text |
| `checked` | Checked state |
| `disabled` | Disabled state |
| `indeterminate` | Indeterminate state |
| `name` | Form field name |
| `value` | Form field value |
| `required` | Required field |
| `size` | size |
| `variant` | variant |

</details>

---

## `<wb-chip>`

**Tooltip Output:**
```text
Chip

Small pill-shaped tag/label, optionally dismissible

Variants:
- default
- primary
- success
- warning
- error
- info

CSS Rules:
- wb-chip--*
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `label` | Chip text content |
| `icon` | Leading icon |
| `dismissible` | Show dismiss button |
| `disabled` | Disabled state |
| `variant` | variant |
| `size` | size |
| `outlined` | Outlined style |

</details>

---

## `<wb-cluster>`

**Tooltip Output:**
```text
A layout that clusters items together (like tags).

Use for:
- Tag clouds
- Button groups

Attributes:
- align: start, center, end, stretch, baseline
- gap: size
- justify: start, center, end, between, around, evenly
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `justify` | Justify content (start, center, end, between, around, evenly) |
| `align` | Align items (start, center, end, stretch, baseline) |
| `gap` | Gap size. |

</details>

---

## `<wb-column>`

**Tooltip Output:**
```text
A column layout component that arranges items vertically using Flexbox.

Use for:
- Card stacks
- Sidebar content
- Vertical lists
- Form field stacks

Example:
<wb-column gap="sm">
  <h3>Title</h3>
  <p>Content</p>
</wb-column>
```

<details><summary>View 4 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `gap` | Space between items. (sm, md, lg, xl, none) or any CSS length (e.g. '1rem') |
| `align` | Horizontal alignment of items (CSS align-items). Default: stretch |
| `justify` | Vertical distribution of items (CSS justify-content). Default: flex-start |
| `wrap` | Whether to wrap items to new columns (requires height). Default: nowrap |

</details>

---

## `<wb-confetti>`

**Tooltip Output:**
```text
Confetti

Confetti particle animation effect
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `count` | Number of particles |
| `label` | Trigger button label |
| `showButton` | Show trigger button |
| `repeat` | Loop animation |
| `delay` | Start delay |
| `duration` | Animation duration |
| `colors` | Particle colors as JSON array |

</details>

---

## `<wb-container>`

**Tooltip Output:**
```text
A smart responsive container that centers content and sets a max-width.

Features:
- Centered margin auto
- Optional padding
- Layout directions (Row or Column)

Example:
<wb-container max-width="1200px" padding="2rem">
</wb-container>
```

<details><summary>View 8 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `direction` | Layout direction (column, row) |
| `columns` | Number of columns (1-12) or a custom grid template string. |
| `gap` | Gap size (sm, md, lg, xl, none) |
| `align` | Align items (start, center, end, stretch) |
| `justify` | Justify content (start, center, end, between, around, evenly) |
| `wrap` | Whether to wrap content. |
| `padding` | Padding size. |
| `max-width` | Maximum width of the container. |

</details>

---

## `<wb-cover>`

**Tooltip Output:**
```text
A layout that covers the viewport or container.

Attributes:
- min-height: size
- padding: size
```

<details><summary>View 2 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `min-height` | Minimum height of the cover. |
| `padding` | Padding size. |

</details>

---

## `<wb-demo>`

**Tooltip Output:**
```text
Demo Component

A component to display a live demo and its source code.
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `title` | Title of the demo |
| `tag` | Tag/Category of the demo |
| `contentClass` | Additional classes for the content wrapper |

</details>

---

## `<wb-details>`

**Tooltip Output:**
```text
Details

Native HTML5 details disclosure widget with optional animation

Variants:
- default
- bordered
- filled

CSS Rules:
- wb-details--*
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `summary` | Clickable summary text |
| `open` | Initially expanded |
| `name` | Accordion group name (native exclusive behavior) |
| `animated` | Animate open/close |
| `variant` | variant |

</details>

---

## `<wb-dialog>`

**Tooltip Output:**
```text
Dialog

Modal dialog using native HTML5 dialog element

Variants:
- default
- centered
- fullscreen

CSS Rules:
- wb-dialog--*
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `title` | Dialog title |
| `content` | Dialog body content |
| `size` | size |
| `closeOnBackdrop` | Close on backdrop click |
| `closeOnEscape` | Close on Escape key |
| `showClose` | Show close button |
| `variant` | variant |

</details>

---

## `<wb-drawer>`

**Tooltip Output:**
```text
A drawer component.

Attributes:
- open: true, false
- side: left, right
```

<details><summary>View 2 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `side` | Side to place the drawer (left, right) |
| `open` | Whether the drawer is open. |

</details>

---

## `<wb-drawer-layout>`

**Tooltip Output:**
```text
Drawer Layout

Collapsible sidebar layout with toggle
```

<details><summary>View 4 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `position` | position |
| `width` | Expanded width |
| `minWidth` | Collapsed width |
| `collapsed` | Initial collapsed state |

</details>

---

## `<wb-dropdown>`

**Tooltip Output:**
```text
Dropdown

Toggleable dropdown menu
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `position` | position |
| `trigger` | trigger |
| `closeOnSelect` | Close on item select |
| `closeOnOutside` | Close on outside click |
| `offset` | Offset from trigger (px) |

</details>

---

## `<wb-fireworks>`

**Tooltip Output:**
```text
Fireworks

Fireworks particle burst animation effect
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `count` | Particles per burst |
| `label` | Trigger button label |
| `showButton` | Show trigger button |
| `repeat` | Loop animation |
| `delay` | Start delay |
| `duration` | Animation duration |
| `colors` | Particle colors as JSON array |

</details>

---

## `<wb-flex>`

**Tooltip Output:**
```text
A flexible box layout component (Low-level wrapper).

Attributes:
- align: start, center, end, stretch, baseline
- direction: row, column, row-reverse, column-reverse
- gap: sm, md, lg, xl, none
- justify: start, center, end, between, around, evenly
- wrap: wrap, nowrap, wrap-reverse
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `direction` | Flex direction (row, column, row-reverse, column-reverse) |
| `gap` | Gap size (sm, md, lg, xl, none) |
| `wrap` | Flex wrap (wrap, nowrap, wrap-reverse) |
| `align` | Align items (start, center, end, stretch, baseline) |
| `justify` | Justify content (start, center, end, between, around, evenly) |

</details>

---

## `<wb-footer>`

**Tooltip Output:**
```text
Footer

Page footer with copyright, links, and social icons
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `copyright` | Copyright text |
| `brand` | Brand name |
| `links` | Navigation links as JSON [{label, href}] |
| `social` | Social links as JSON [{platform, href}] |
| `sticky` | Sticky at bottom |

</details>

---

## `<wb-frame>`

**Tooltip Output:**
```text
A component that maintains a specific aspect ratio.

Attributes:
- ratio: ratio
```

<details><summary>View 1 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `ratio` | Aspect ratio (e.g., 16:9, 4:3). |

</details>

---

## `<wb-grid>`

**Tooltip Output:**
```text
A layout component that creates a responsive CSS Grid.

Key Feature: The `min-width` attribute enables 'Auto-Fit' columns - no media queries needed.

Example:
<wb-grid min-width="300px" gap="md">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</wb-grid>
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `columns` | Number of columns (e.g. '3') or grid definition (e.g. '1fr 2fr'). Default: 3 |
| `gap` | Gap size (sm, md, lg, xl, none) or CSS length. Default: 1rem |
| `min-width` | Minimum width for auto-fit columns (e.g. '300px'). Enables responsive behavior. |

</details>

---

## `<wb-header>`

**Tooltip Output:**
```text
Header

Page header with logo, title, and optional navigation
```

<details><summary>View 6 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `icon` | Logo icon (emoji or text) |
| `title` | Header title |
| `subtitle` | Subtitle text |
| `badge` | Badge text (e.g., version) |
| `logoHref` | Logo link URL |
| `sticky` | Sticky at top |

</details>

---

## `<wb-icon>`

**Tooltip Output:**
```text
An icon component.

Attributes:
- color: string
- name: string
- size: size
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `name` | Name of the icon. |
| `size` | Size of the icon. |
| `color` | Color of the icon. |

</details>

---

## `<wb-input>`

**Tooltip Output:**
```text
Input

Text input field with label, helper text, and validation states

Variants:
- default
- success
- error

CSS Rules:
- wb-input--*
```

<details><summary>View 15 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `label` | Input label text |
| `placeholder` | Placeholder text |
| `value` | Input value |
| `name` | Form field name |
| `inputType` | HTML input type |
| `helper` | Helper text below input |
| `error` | Error message (shows error state) |
| `variant` | Visual validation state |
| `size` | Input size |
| `disabled` | Disabled state |
| `readonly` | Read-only state |
| `required` | Required field |
| `icon` | Icon (emoji or icon name) |
| `iconPosition` | Icon position |
| `clearable` | Show clear button when has value |

</details>

---

## `<wb-masonry>`

**Tooltip Output:**
```text
A masonry layout component.

Attributes:
- columns: number
- gap: size
```

<details><summary>View 2 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `columns` | Number of columns. |
| `gap` | Gap size. |

</details>

---

## `<wb-navbar>`

**Tooltip Output:**
```text
Navbar

Navigation bar with brand, links, and responsive menu

Variants:
- default
- dark
- transparent

CSS Rules:
- wb-navbar--*
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `brand` | Brand text or logo |
| `brandHref` | Brand link URL |
| `items` | Navigation items as JSON [{label, href}] |
| `sticky` | Sticky positioning |
| `variant` | variant |

</details>

---

## `<wb-notes>`

**Tooltip Output:**
```text
Notes

Slide-out notes drawer with multiple display modes
```

<details><summary>View 6 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `position` | position |
| `maxWidth` | Max width when resizing |
| `minWidth` | Min width when resizing |
| `defaultWidth` | Default width |
| `autoSave` | Auto-save to localStorage |
| `placeholder` | Textarea placeholder |

</details>

---

## `<wb-part>`

**Tooltip Output:**
```text
WB Part - Reusable HTML template. First boolean attribute specifies the part name.
```

<details><summary>View 41 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `card-tile` | Use the card-tile part template. Draggable component tile for sidebar/palette |
| `alert-box` | Use the alert-box part template. Alert/notification message box |
| `stat-tile` | Use the stat-tile part template. Statistics display tile with trend indicator |
| `nav-link` | Use the nav-link part template. Navigation link item |
| `user-avatar` | Use the user-avatar part template. User avatar with optional status indicator |
| `price-tag` | Use the price-tag part template. Price display with optional original price |
| `feature-item` | Use the feature-item part template. Feature list item with icon |
| `button-primary` | Use the button-primary part template. Primary action button |
| `icon-button` | Use the icon-button part template. Icon-only button |
| `badge` | Use the badge part template. Small badge/tag label |
| `empty-state` | Use the empty-state part template. Empty state placeholder with optional action |
| `loading-skeleton` | Use the loading-skeleton part template. Loading placeholder skeleton |
| `src` | URL to fetch JSON data for the part |
| `refresh` | Auto-refresh interval in milliseconds (requires src) |
| `icon` | [card-tile] Emoji or icon [required] | [stat-tile] Icon emoji | [nav-link] Icon emoji | [button-primary] Icon before label | [icon-button] Button icon [required] | [empty-state] Large icon |
| `label` | [card-tile] Display label [required] | [stat-tile] Statistic label [required] | [nav-link] Link text [required] | [button-primary] Button text [required] | [badge] Badge text [required] |
| `behavior` | [card-tile] Behavior ID to apply when dropped |
| `tag` | [card-tile] Custom element tag name |
| `variant` | [alert-box|button-primary|icon-button|badge|loading-skeleton] Style variant |
| `heading` | [alert-box] Alert heading | [empty-state] Empty state heading [required] |
| `message` | [alert-box] Alert message [required] | [empty-state] Additional message |
| `dismissible` | [alert-box] Show dismiss button |
| `value` | [stat-tile] Main statistic value (e.g., '1,234') [required] |
| `trend` | [stat-tile] Trend direction |
| `trend-value` | [stat-tile] Trend amount (e.g., '+12%') |
| `href` | [nav-link] Link URL [required] |
| `active` | [nav-link] Mark as active/current |
| `name` | [user-avatar] User's name (for alt text) [required] |
| `initials` | [user-avatar] Initials to show if no image |
| `size` | [user-avatar|button-primary|icon-button] Size |
| `status` | [user-avatar] Online status indicator |
| `price` | [price-tag] Current price (e.g., '$29') [required] |
| `original` | [price-tag] Original price (for discounts) |
| `period` | [price-tag] Billing period (e.g., '/mo', '/year') |
| `text` | [feature-item] Feature text [required] |
| `included` | [feature-item] Whether feature is included [default: true] |
| `disabled` | [button-primary|icon-button] Disable the button |
| `tooltip` | [icon-button] Tooltip/aria-label text [required] |
| `action-label` | [empty-state] Action button label |
| `width` | [loading-skeleton] Width (CSS value) [default: 100%] |
| `height` | [loading-skeleton] Height (CSS value) |

</details>

---

## `<wb-progress>`

**Tooltip Output:**
```text
Progress

Progress bar with determinate and indeterminate states

Variants:
- default
- primary
- success
- warning
- error
- info

CSS Rules:
- wb-progress--*
```

<details><summary>View 9 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `value` | Current progress value (0-100) |
| `max` | Maximum value |
| `label` | Progress label text |
| `showValue` | Show percentage value |
| `variant` | Color variant |
| `size` | Bar height size |
| `animated` | Animate on load |
| `striped` | Show striped pattern |
| `indeterminate` | Indeterminate loading state |

</details>

---

## `<wb-rating>`

**Tooltip Output:**
```text
Rating

Star rating component for displaying or collecting ratings
```

<details><summary>View 7 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `value` | Current rating value |
| `max` | Maximum rating |
| `readonly` | Display only, not interactive |
| `disabled` | Disabled state |
| `half` | Allow half-star ratings |
| `size` | size |
| `icon` | Custom icon (emoji or symbol) |

</details>

---

## `<wb-reel>`

**Tooltip Output:**
```text
A horizontal scrolling container.

Attributes:
- gap: size
- item-width: size
- no-bar: true, false
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `item-width` | Width of each item. |
| `gap` | Gap between items. |
| `no-bar` | Hide scrollbar. |

</details>

---

## `<wb-ripple>`

**Tooltip Output:**
```text
Ripple

Material Design ripple effect on click
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `color` | Ripple color |
| `duration` | Animation duration (ms) |
| `centered` | Center ripple instead of click position |

</details>

---

## `<wb-row>`

**Tooltip Output:**
```text
A row layout component that arranges items horizontally using Flexbox.

Defaults to wrapping items.

Use for:
- Toolbars
- Navigation menus
- Horizontal lists
- Form layouts

Example:
<wb-row gap="md" align="center">
  <button>OK</button>
  <button>Cancel</button>
</wb-row>
```

<details><summary>View 4 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `gap` | Space between items. (sm, md, lg, xl, none) or any CSS length (e.g. '1rem') |
| `align` | Vertical alignment of items (CSS align-items). Default: stretch |
| `justify` | Horizontal distribution of items (CSS justify-content). Default: flex-start |
| `wrap` | Whether to wrap items to new lines. Default: wrap |

</details>

---

## `<wb-scrollalong>`

**Tooltip Output:**
```text
ScrollAlong

CSS sticky positioning for sidebars that stay visible while scrolling
```

<details><summary>View 1 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `offset` | Top offset |

</details>

---

## `<wb-search-index>`

**Tooltip Output:**
```text
Search Index

Client-side search index for WB Behaviors sites. Generated by scripts/generate-search-index.js
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `$generated` | ISO timestamp when index was generated |
| `$version` | Schema version for cache busting |
| `$stats` | Index statistics |
| `documents` | Searchable documents |
| `index` | Inverted index: word -> document IDs |

</details>

---

## `<wb-select>`

**Tooltip Output:**
```text
Select

Enhanced select dropdown with search, clear, and multi-select

Variants:
- default
- success
- error

CSS Rules:
- wb-select--*
```

<details><summary>View 12 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `label` | Select label |
| `placeholder` | Placeholder text |
| `options` | Options as JSON [{value, label}] |
| `value` | Selected value |
| `name` | Form field name |
| `searchable` | Enable search |
| `clearable` | Enable clear button |
| `multiple` | Allow multiple selection |
| `disabled` | Disabled state |
| `required` | Required field |
| `size` | size |
| `variant` | variant |

</details>

---

## `<wb-sidebar>`

**Tooltip Output:**
```text
A layout that places a fixed-width sidebar alongside a flexible content area. The sidebar can be positioned on the left or right.

Attributes:
- gap: size
- side: left, right
- width: size
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `side` | Side to place the sidebar (left, right) |
| `width` | Width of the sidebar. |
| `gap` | Gap between sidebar and content. |

</details>

---

## `<wb-skeleton>`

**Tooltip Output:**
```text
Skeleton

Loading skeleton placeholder with shimmer animation

Variants:
- text
- circle
- rect
- card

CSS Rules:
- wb-skeleton--*
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `variant` | variant |
| `lines` | Number of text lines |
| `width` | Width (CSS value) |
| `height` | Height (CSS value) |
| `animated` | Enable shimmer animation |

</details>

---

## `<wb-snow>`

**Tooltip Output:**
```text
Snow

Falling snowflake animation effect
```

<details><summary>View 6 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `count` | Number of snowflakes |
| `label` | Trigger button label |
| `showButton` | Show trigger button |
| `repeat` | Loop animation |
| `delay` | Start delay |
| `duration` | Fall duration |

</details>

---

## `<wb-spinner>`

**Tooltip Output:**
```text
Spinner

Loading spinner indicator

Variants:
- default
- primary
- success
- warning
- error

CSS Rules:
- wb-spinner--*
```

<details><summary>View 4 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `size` | size |
| `variant` | variant |
| `speed` | speed |
| `label` | Accessible label |

</details>

---

## `<wb-stack>`

**Tooltip Output:**
```text
A vertical stack layout component (Alternative to wb-flex direction=column).

Use for:
- Vertical lists
- Form stacks

Attributes:
- gap: sm, md, lg, xl, none
```

<details><summary>View 1 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `gap` | Gap size (sm, md, lg, xl, none) |

</details>

---

## `<wb-sticky>`

**Tooltip Output:**
```text
A sticky component.

Attributes:
- bottom: size
- top: size
- z-index: number
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `top` | Top offset. |
| `bottom` | Bottom offset. |
| `z-index` | Z-index value. |

</details>

---

## `<wb-switch>`

**Tooltip Output:**
```text
Switch

Toggle switch for boolean settings

Variants:
- default
- primary
- success

CSS Rules:
- wb-switch--*
```

<details><summary>View 8 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `label` | Switch label |
| `checked` | On/off state |
| `disabled` | Disabled state |
| `name` | Form field name |
| `value` | Form field value when checked |
| `labelPosition` | labelPosition |
| `size` | size |
| `variant` | variant |

</details>

---

## `<wb-switcher>`

**Tooltip Output:**
```text
A layout that switches from horizontal to vertical at a breakpoint.

Attributes:
- gap: size
- limit: number
- threshold: size
```

<details><summary>View 3 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `threshold` | Width threshold to switch layout. |
| `limit` | Maximum number of items per row. |
| `gap` | Gap size. |

</details>

---

## `<wb-table>`

**Tooltip Output:**
```text
Table

Data table with sorting, filtering, and pagination
```

<details><summary>View 10 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `data` | Table data as JSON array |
| `columns` | Column config as JSON [{key, label, sortable}] |
| `sortable` | Enable column sorting |
| `filterable` | Enable filtering |
| `paginated` | Enable pagination |
| `pageSize` | Rows per page |
| `striped` | Striped rows |
| `hoverable` | Hover effect on rows |
| `compact` | Compact row spacing |
| `bordered` | Cell borders |

</details>

---

## `<wb-tabs>`

**Tooltip Output:**
```text
Tabs

Tab navigation for switching between content panels

Variants:
- default
- pills
- underline
- bordered

CSS Rules:
- wb-tabs--*
```

<details><summary>View 5 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `activeTab` | Initially active tab index |
| `variant` | variant |
| `size` | size |
| `fullWidth` | Tabs fill container width |
| `vertical` | Vertical tab layout |

</details>

---

## `<wb-textarea>`

**Tooltip Output:**
```text
Textarea

Multi-line text input with autosize and character count

Variants:
- default
- success
- error

CSS Rules:
- wb-textarea--*
```

<details><summary>View 13 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `label` | Field label |
| `placeholder` | Placeholder text |
| `value` | Text value |
| `name` | Form field name |
| `rows` | Visible rows |
| `maxLength` | Max character limit |
| `showCount` | Show character count |
| `autosize` | Auto-resize to content |
| `disabled` | Disabled state |
| `readonly` | Read-only state |
| `required` | Required field |
| `resize` | resize |
| `variant` | variant |

</details>

---

## `<wb-toast>`

**Tooltip Output:**
```text
Toast

Toast notification system for temporary messages

Variants:
- info
- success
- warning
- error

CSS Rules:
- wb-toast--*
```

<details><summary>View 9 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `message` | Toast notification message |
| `title` | Toast title (optional) |
| `variant` | Toast severity/type |
| `icon` | Icon (emoji or icon name) |
| `duration` | Auto-dismiss duration in milliseconds (0 = no auto-dismiss) |
| `position` | Toast container position |
| `dismissible` | Show close button |
| `action` | Action button text |
| `actionHref` | Action button link URL |

</details>

---

## `<wb-tooltip>`

**Tooltip Output:**
```text
Tooltip

Tooltip for displaying additional information on hover/focus

Variants:
- default
- dark
- light
- primary

CSS Rules:
- wb-tooltip--*
```

<details><summary>View 9 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `content` | Tooltip text content |
| `position` | Tooltip position relative to trigger |
| `variant` | Visual style variant |
| `delay` | Delay before showing (ms) |
| `hideDelay` | Delay before hiding (ms) |
| `trigger` | What triggers the tooltip |
| `arrow` | Show arrow pointing to trigger |
| `interactive` | Allow hovering over tooltip content |
| `maxWidth` | Maximum tooltip width |

</details>

---

## `<wb-views>`

**Tooltip Output:**
```text
WB Views Registry Schema

Schema for validating WB Views registry files. Views are reusable HTML templates that auto-register as custom elements.
```

<details><summary>View 4 Attribute Tooltips</summary>

| Attribute | Tooltip |
|-----------|---------|
| `$schema` | Reference to this schema file |
| `version` | Semantic version of the views registry |
| `description` | Description of this views registry |
| `views` | Map of view names to their definitions |

</details>

---


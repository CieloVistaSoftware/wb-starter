# Card Components - wb-starter v3.0

All card variants use the **WBServices pattern** with **Light DOM architecture**.

## Architecture

All card variants compose the shared `card` behavior and Light-DOM markup:

- card            - Card component
- cardimage       - Card with featured image
- cardvideo       - Card with video player
- cardbutton      - Card with action buttons
- cardhero        - Full-width hero card
- cardprofile     - User profile card
- cardpricing     - Pricing plan card
- cardstats       - Statistics/metric card
- cardtestimonial - Quote/testimonial card
- cardproduct     - E-commerce product card
- cardnotification- Alert/notification card
- cardfile        - File/document card
- cardlink        - Clickable link card
- cardhorizontal  - Side-by-side layout
- cardoverlay     - Image with text overlay
- cardexpandable  - Expandable/collapsible
- cardminimizable - Minimizable card
- carddraggable   - Draggable/movable card
- cardportfolio   - Portfolio/contact card

## Usage Patterns

### Custom Element (Recommended)

<div x-demo>
<article
  title="Card Title"
  subtitle="Subtitle">
  Card content here
</article>
</div>

### Semantic Element + Data Attributes

<div x-demo>
<article
  title="Card Title">
  Card content here
</article>
</div>

## Common Card Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `""` | Main heading |
| `subtitle` | string | `""` | Secondary text |
| `footer` | string | `""` | Footer text |
| `elevated` | boolean | `false` | Add drop shadow |
| `clickable` | boolean | `false` | Make card clickable |
| `variant` | string | `"default"` | Visual style: `default`, `glass`, `bordered`, `flat` |
| `hoverable` | boolean | `true` | Enable hover effects |

## Semantic Element Usage

| Card Variant | Primary Element | Secondary Elements |
|--------------|----------------|-------------------|
| card (default) | `<article>` | `<header>`, `<main>`, `<footer>` |
| cardtestimonial | `<article>` | `<blockquote>`, `<cite>`, `<figure>` |
| cardnotification | `<aside>` | - |
| cardportfolio | `<article>` | `<address>`, `<figure>` |
| cardstats | `<article>` | `<data>` |
| cardfile | `<article>` | `<figure>`, `<figcaption>`, `<time>` |
| cardproduct | `<article>` | `<figure>`, `<data>` |
| cardimage | `<article>` | `<figure>`, `<figcaption>` |
| cardvideo | `<article>` | `<figure>`, `<video>` |

## Quick Examples

### Basic Card
<div x-demo>
<article title="Hello World"> This is a simple card with content. </article>
</div>

### Elevated Card with Footer
<div x-demo>
<article
  title="Elevated Card"
  footer="Last updated: Today"
  elevated>
  Card content with elevation shadow.
</article>
</div>

### Glass Variant
<div x-demo>
<article
  title="Glass Card"
  variant="glass">
  Frosted glass effect card.
</article>
</div>

### Image Card
<div x-demo>
<div x-cardimage
  src="https://picsum.photos/seed/cardsindex/400/225"
  alt="Hero image"
  title="Featured Image"
  subtitle="Image description">
</div>
</div>

### Profile Card
<div x-demo>
<div x-cardprofile
  name="John Doe"
  role="Software Engineer"
  avatar="https://picsum.photos/seed/johndoe/100/100"
  bio="Building great software.">
</div>
</div>

### Pricing Card
<div x-demo>
<div x-cardpricing
  plan="Pro Plan"
  price="$29"
  period="/month"
  features="Unlimited projects, Priority support, API access"
  cta="Get Started">
</div>
</div>

## File Structure

```
src/wb-models/
├── card.schema.json
├── card.base.schema.json
├── cardimage.schema.json
├── cardvideo.schema.json
├── cardbutton.schema.json
├── cardhero.schema.json
├── cardprofile.schema.json
├── cardpricing.schema.json
├── cardstats.schema.json
├── cardtestimonial.schema.json
├── cardproduct.schema.json
├── cardnotification.schema.json
├── cardfile.schema.json
├── cardlink.schema.json
├── cardhorizontal.schema.json
├── cardoverlay.schema.json
├── cardexpandable.schema.json
├── cardminimizable.schema.json
├── carddraggable.schema.json
└── cardportfolio.schema.json

src/wb-viewmodels/
└── card.js              # All card variants
```

## Documentation

### Card & Common
- [card.md](./card.md) - Card component
- [cardbutton.md](./cardbutton.md) - Action buttons
- [cardimage.md](./cardimage.md) - Featured image
- [cardvideo.md](./cardvideo.md) - Video player

### Profile & Contact
- [cardprofile.md](./cardprofile.md) - User profile
- [cardportfolio.md](./cardportfolio.md) - Portfolio/contact

### Commerce
- [cardpricing.md](./cardpricing.md) - Pricing plans
- [cardproduct.md](./cardproduct.md) - Products

### Content
- [cardhero.md](./cardhero.md) - Hero banners
- [cardoverlay.md](./cardoverlay.md) - Image overlays
- [cardhorizontal.md](./cardhorizontal.md) - Horizontal layout
- [cardtestimonial.md](./cardtestimonial.md) - Testimonials
- [cardstats.md](./cardstats.md) - Statistics

### Utility
- [cardfile.md](./cardfile.md) - File downloads
- [cardlink.md](./cardlink.md) - Link cards
- [cardnotification.md](./cardnotification.md) - Notifications
- [cardexpandable.md](./cardexpandable.md) - Expandable
- [cardminimizable.md](./cardminimizable.md) - Minimizable
- [carddraggable.md](./carddraggable.md) - Draggable

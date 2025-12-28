# WB Behaviors Components

## Overview

The WB Behaviors provides 100+ components organized into categories. All components follow the **Light DOM architecture** and use the **WBServices** pattern (not WBBaseComponent).

## Component Categories

### Cards (19 variants)
All card variants inherit from `cardBase` and share common properties.

| Component | Tag | Description | Inherits |
|-----------|-----|-------------|----------|
| `card` | `ARTICLE` | Base card component | - |
| `cardbutton` | `ARTICLE` | Card with action buttons | card |
| `carddraggable` | `ARTICLE` | Draggable/moveable card | card |
| `cardexpandable` | `ARTICLE` | Expandable/collapsible content | card |
| `cardfile` | `ARTICLE` | File download card | card |
| `cardhero` | `ARTICLE` | Hero banner card | card |
| `cardhorizontal` | `ARTICLE` | Horizontal layout card | card |
| `cardimage` | `ARTICLE` + `FIGURE` | Card with image | card |
| `cardlink` | `ARTICLE` + `A` | Clickable link card | card |
| `cardminimizable` | `ARTICLE` | Minimizable window card | card |
| `cardnotification` | `ASIDE` | Notification/alert card | - |
| `cardoverlay` | `ARTICLE` | Image with text overlay | card |
| `cardportfolio` | `ARTICLE` + `ADDRESS` | Portfolio/contact card | card |
| `cardpricing` | `ARTICLE` | Pricing plan card | card |
| `cardproduct` | `ARTICLE` | Product showcase card | card |
| `cardprofile` | `ARTICLE` | User profile card | card |
| `cardstats` | `ARTICLE` + `DATA` | Statistics display card | card |
| `cardtestimonial` | `ARTICLE` + `BLOCKQUOTE` | Quote/testimonial card | card |
| `cardvideo` | `ARTICLE` + `VIDEO` | Video player card | card |

### Form Components
| Component | Tag | Description |
|-----------|-----|-------------|
| `input` | `INPUT` | Text input field |
| `textarea` | `TEXTAREA` | Multi-line text input |
| `checkbox` | `INPUT[type=checkbox]` | Checkbox input |
| `radio` | `INPUT[type=radio]` | Radio button |
| `select` | `SELECT` | Dropdown select |
| `switch` | `INPUT[type=checkbox]` | Toggle switch |
| `range` | `INPUT[type=range]` | Range slider |
| `datepicker` | `INPUT` | Date picker |
| `timepicker` | `INPUT` | Time picker |
| `colorpicker` | `INPUT[type=color]` | Color picker |
| `file` | `INPUT[type=file]` | File upload |
| `password` | `INPUT[type=password]` | Password input |
| `otp` | `INPUT` | OTP code input |
| `autocomplete` | `INPUT` | Auto-suggest input |
| `rating` | `INPUT[type=range]` | Star rating |
| `masked` | `INPUT` | Input with mask |

### Layout Components
| Component | Tag | Description |
|-----------|-----|-------------|
| `container` | `DIV` | Flexible container |
| `grid` | `DIV` | CSS Grid layout |
| `flex` | `DIV` | Flexbox layout |
| `stack` | `DIV` | Vertical stack |
| `center` | `DIV` | Center content |
| `sidebar` | `ASIDE` | Sidebar layout |
| `sidebarlayout` | `DIV` | Sidebar + main layout |

### Navigation Components
| Component | Tag | Description |
|-----------|-----|-------------|
| `tabs` | `NAV` + `DIV` | Tabbed interface |
| `accordion` | `DIV` | Collapsible sections |
| `breadcrumb` | `NAV` | Breadcrumb trail |
| `menu` | `NAV` | Navigation menu |
| `pagination` | `NAV` | Page navigation |
| `stepper` | `NAV` | Step indicator |
| `steps` | `NAV` | Progress steps |

### Feedback Components
| Component | Tag | Description |
|-----------|-----|-------------|
| `alert` | `DIV` | Alert message |
| `toast` | `DIV` | Toast notification |
| `notify` | `DIV` | Push notification |
| `progress` | `PROGRESS` | Progress bar |
| `progressbar` | `DIV` | Custom progress bar |
| `spinner` | `DIV` | Loading spinner |
| `skeleton` | `DIV` | Loading skeleton |

### Overlay Components
| Component | Tag | Description |
|-----------|-----|-------------|
| `modal` | `DIALOG` | Modal dialog |
| `drawer` | `DIV` | Slide-in drawer |
| `offcanvas` | `DIV` | Off-canvas panel |
| `tooltip` | `DIV` | Tooltip popup |
| `popover` | `DIV` | Popover content |
| `lightbox` | `DIV` | Image lightbox |

### Media Components
| Component | Tag | Description |
|-----------|-----|-------------|
| `image` | `IMG` | Image display |
| `video` | `VIDEO` | Video player |
| `audio` | `AUDIO` | Audio player |
| `youtube` | `IFRAME` | YouTube embed |
| `vimeo` | `IFRAME` | Vimeo embed |
| `embed` | `IFRAME` | Generic embed |
| `gallery` | `DIV` | Image gallery |

### Animation Components
| Component | Tag | Description |
|-----------|-----|-------------|
| `animate` | `DIV` | CSS animations |
| `bounce` | `DIV` | Bounce effect |
| `pulse` | `DIV` | Pulse effect |
| `shake` | `DIV` | Shake effect |
| `fade` | `DIV` | Fade effect |
| `slide` | `DIV` | Slide effect |
| `confetti` | `DIV` | Confetti animation |
| `fireworks` | `DIV` | Fireworks animation |
| `snow` | `DIV` | Snow animation |
| `particle` | `DIV` | Particle effects |

## Semantic HTML Inheritance

WB components use proper semantic HTML elements:

### Article (`ARTICLE`)
Used by: All card variants except `cardnotification`
- Self-contained content
- Can be distributed independently
- Has heading (title)

### Aside (`ASIDE`)
Used by: `cardnotification`, `sidebar`
- Tangentially related content
- Supplementary information

### Figure (`FIGURE`) + Figcaption (`FIGCAPTION`)
Used by: `cardimage`, image components
- Self-contained media
- Optional caption

### Address (`ADDRESS`)
Used by: `cardportfolio`
- Contact information
- Author details

### Blockquote (`BLOCKQUOTE`) + Cite (`CITE`)
Used by: `cardtestimonial`
- Extended quotations
- Attribution

### Data (`DATA`)
Used by: `cardstats`
- Machine-readable value
- Human-readable content

### Time (`TIME`)
Used by: Components with dates
- Machine-readable datetime
- Human-readable text

### Nav (`NAV`)
Used by: `tabs`, `breadcrumb`, `menu`, `pagination`
- Navigation links
- Site navigation

### Progress (`PROGRESS`)
Used by: `progress` component
- Task completion
- Loading state

### Dialog (`DIALOG`)
Used by: `modal`
- Interactive dialog box
- Focus management

## Property Inheritance

### Base Card Properties
All card variants inherit these from `_cardBase`:

```javascript
{
  title: 'Card Title',        // H2/H3 element
  subtitle: 'Subtitle',       // P element
  footer: 'Footer text',      // FOOTER element
  elevated: false,            // Add shadow
  clickable: false,           // Make clickable
  href: '',                   // Link URL
  hoverText: ''               // Tooltip
}
```

### Variant-Specific Properties
Each variant adds specific properties. Example for `cardimage`:

```javascript
{
  ...cardBase,
  src: 'image.jpg',           // Image URL
  alt: 'Description',         // Alt text
  aspect: '16/9',             // Aspect ratio
  position: 'top',            // Image position
  fit: 'cover'                // Object fit
}
```

## Schema Standard

Each component has a JSON schema file:
- Location: `src/behaviors/schema/{component}.schema.json`
- Validates: data attributes, required fields, types

Example schema structure:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "component",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "elevated": { "type": "boolean" }
  },
  "required": ["title"]
}
```

## File Organization

```
src/behaviors/
├── js/                    # Component JavaScript
│   ├── card.js            # All card variants
│   ├── alert.js           # Alert component
│   └── ...
├── css/                   # Component CSS
│   ├── card.css           # Card styles
│   └── ...
└── schema/                # JSON schemas
    ├── card.schema.json
    └── ...

docs/components/
├── README.md              # This file
├── cards/                 # Card documentation
│   ├── index.md
│   └── {variant}.md
└── semantic/              # Semantic element docs
    ├── index.md
    └── {element}.md
```

### Composition for Specialized Functionality

While all card types inherit core logic and structure from `cardBase` (is-a relationship), each variant uses **composition** to add or customize features unique to its purpose. For example:

- `wb-cardimage` composes an image section into the card layout.
- `wb-cardhero` adds a hero banner region and may include call-to-action buttons.
- `wb-cardprofile` composes avatar, user info, and social links.
- `wb-cardstats` adds stat blocks or data visualizations.

This means each card variant is built by combining (composing) the base card structure with additional elements, behaviors, or logic as needed. Composition allows for maximum flexibility—new features can be added to specific card types without affecting the base or other variants.

**Summary:**
- All card types are cards (inherit from cardBase)
- Each variant composes in new features or layouts to serve its specialized role

## Card Architecture and the Role of cardBase

The `wb-card` component is the root of a flexible, extensible card system. All card types in wb-starter—including `wb-card`, `wb-cardimage`, `wb-cardhero`, `wb-cardprofile`, `wb-cardstats`, and more—possess an **is-a** relationship to the shared base class `cardBase`. This means every card variant is fundamentally a card, inheriting all core card logic and structure.

### Card Structure
- **Header:** Displays the title, subtitle, and optional badge.
- **Main:** Contains the primary card content (user-provided).
- **Footer:** Optional area for footer text or actions.
- **Variants:** Support for different visual styles (e.g., glass, elevated, clickable).

By inheriting from `cardBase`, every card variant (such as `wb-cardimage`, `wb-cardhero`, `wb-cardprofile`, `wb-cardstats`, `wb-cardpricing`, etc.) guarantees consistent behavior and a unified API. This is the classic is-a relationship: every card variant is a card, and can be used wherever a card is expected.

### Why Use cardBase?
- **Shared Logic:** cardBase encapsulates all common logic, rendering, and property handling for cards, so each variant only needs to define what’s unique.
- **Consistency:** Ensures all card variants behave the same way for core features (header, footer, elevation, clickability, etc.).
- **DRY Principle:** Avoids code duplication—shared features are written once in cardBase and reused everywhere.
- **Easy Maintenance:** Bug fixes and improvements to cardBase automatically benefit all card variants.
- **Extensibility:** New card types can be created quickly by extending cardBase and customizing only what’s needed.

### Example (Conceptual)
```js
class cardBase extends HTMLElement {
  // Shared logic for all cards
}

class WbCard extends cardBase {
  // Only card-specific logic here
}

class WbCardImage extends cardBase {
  // Only image-card-specific logic here
}
```

**In summary:** The card architecture is modular and extensible, and inheriting from cardBase is the right thing to do because it guarantees consistency, reduces duplication, and makes the card system robust and maintainable.
## Why Inheritance Matters

The wb-card component (and all wb-starter components) use proper HTMLElement inheritance instead of a custom base class. This is the right choice because:

- **Native API Compatibility:** Extending HTMLElement ensures full compatibility with the browser’s built-in element lifecycle, events, and properties.
- **No Framework Lock-in:** You aren’t tied to a custom base class or legacy framework code. This makes components portable and future-proof.
- **Standards Compliance:** Modern web standards recommend extending HTMLElement directly for custom elements.
- **Interoperability:** Components work seamlessly with other libraries, tools, and browser features.
- **Performance:** Native inheritance avoids extra indirection and complexity, resulting in faster, leaner components.
- **Testability:** Components are easier to test and debug because they behave like standard DOM elements.

In summary: Proper inheritance means your components are robust, maintainable, and play well with the entire web platform.

# Card Component Overview

The `wb-card` is the foundational card component in the wb-starter library, designed for maximum flexibility, accessibility, and maintainability. Built on the Light DOM architecture and the WBServices pattern, it provides a robust base for dozens of card variants (image, hero, testimonial, product, etc.) while ensuring:

- **Consistent UI/UX:** All cards share a unified structure and behavior, making your app look and feel cohesive.
- **Modern Web Standards:** Uses proper HTMLElement inheritance, ES Modules, and schema-driven properties.
- **Easy Customization:** Extend or compose new card types with minimal code, thanks to the cardBase class.
- **Performance & Accessibility:** No Shadow DOM, so styles cascade naturally and accessibility is preserved.

This doc explains the core features, usage, and architectural choices behind `wb-card` and its variants.

## Overview

| Property | Value |
|----------|-------|
| Custom Tag | `<wb-card>` |
| Behavior | `card` |
| Semantic | `<article>` |
| Base Class | `wb-card` |
| Category | Cards |
| Schema | `src/wb-models/card.schema.json` |

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | `""` | Card title in header |
| `subtitle` | string | `""` | Subtitle below title |
| `footer` | string | `""` | Footer text |
| `elevated` | boolean | `false` | Add drop shadow |
| `clickable` | boolean | `false` | Make entire card clickable |
| `variant` | string | `"default"` | Style: `default`, `glass`, `bordered`, `flat`, `rack` |
| `hoverable` | boolean | `true` | Enable hover effects |
| `hoverText` | string | `""` | Tooltip on hover |
| `badge` | string | `""` | Badge text in header |

## Usage

### Custom Element (Recommended)

```html
<wb-card title="Card Title" subtitle="Subtitle text">
  This is the card content.
</wb-card>
```

### Semantic Element

```html
<article data-wb="card" data-wb-title="Card Title">
  This is the card content.
</article>
```

### With All Options

```html
<wb-card 
  title="Featured Card" 
  subtitle="A brief description"
  footer="Last updated: Today"
  elevated
  clickable
  variant="glass">
  Main content goes here.
</wb-card>
```

## Variants

### Default
```html
<wb-card title="Default Card">
  Standard card styling.
</wb-card>
```

### Glass
```html
<wb-card title="Glass Card" variant="glass">
  Frosted glass effect with blur.
</wb-card>
```

### Elevated
```html
<wb-card title="Elevated Card" elevated>
  Card with drop shadow.
</wb-card>
```

### Clickable
```html
<wb-card title="Click Me" clickable>
  Click anywhere on this card.
</wb-card>
```

## Generated Structure

The card generates this semantic HTML:

```html
<article class="wb-card">
  <!-- Header (when title/subtitle set) -->
  <header class="wb-card__header">
    <div class="wb-card__header-content">
      <h3 class="wb-card__title">Title</h3>
      <p class="wb-card__subtitle">Subtitle</p>
    </div>
    <span class="wb-card__badge">Badge</span>
  </header>
  
  <!-- Main (always present) -->
  <main class="wb-card__main">
    User content here...
  </main>
  
  <!-- Footer (when footer set) -->
  <footer class="wb-card__footer">
    Footer text
  </footer>
</article>
```

## CSS Classes

| Class | Applied When | Description |
|-------|--------------|-------------|
| `.wb-card` | Always | Base styling |
| `.wb-card--elevated` | `elevated` | Drop shadow |
| `.wb-card--clickable` | `clickable` | Pointer cursor |
| `.wb-card--hoverable` | `hoverable` | Hover effects |
| `.wb-card--glass` | `variant="glass"` | Glass effect |
| `.wb-card--active` | After click | Active state |

## CSS API (Custom Properties)

| Variable | Description | Default |
|----------|-------------|---------|
| `--bg-secondary` | Background color | `#1f2937` |
| `--border-color` | Border color | `#374151` |
| `--radius-lg` | Border radius | `8px` |
| `--shadow-elevated` | Elevated shadow | `0 4px 12px rgba(0,0,0,0.15)` |
| `--shadow-hover` | Hover shadow | `0 8px 24px rgba(0,0,0,0.2)` |

## Events

### wb:card:click
Fired when a clickable card is clicked.

```javascript
document.querySelector('wb-card').addEventListener('click', (e) => {
  console.log('Card clicked');
});
```

## Accessibility

| Attribute | Value | Condition |
|-----------|-------|-----------|
| `role` | `button` | When clickable |
| `tabindex` | `0` | When clickable |

Keyboard support for clickable cards:
- `Enter` - Trigger click
- `Space` - Trigger click

## Methods

Available via JavaScript:

```javascript
const card = document.querySelector('wb-card');

// Show/hide
card.show();
card.hide();
card.toggle();

// Update properties
card.update({ title: 'New Title', elevated: true });
```

## Card Variants

The base card is extended by specialized variants:

| Variant | Purpose | Tag |
|---------|---------|-----|
| [cardimage](./cardimage.md) | Featured image | `<wb-cardimage>` |
| [cardhero](./cardhero.md) | Hero banner | `<wb-cardhero>` |
| [cardprofile](./cardprofile.md) | User profile | `<wb-cardprofile>` |
| [cardstats](./cardstats.md) | Statistics | `<wb-cardstats>` |
| [cardpricing](./cardpricing.md) | Pricing tier | `<wb-cardpricing>` |
| [cardbutton](./cardbutton.md) | Action buttons | `<wb-cardbutton>` |
| [cardlink](./cardlink.md) | Navigation link | `<wb-cardlink>` |

## Schema

Located at `src/wb-models/card.schema.json`:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "card.schema.json",
  "title": "Card Component",
  "behavior": "card",
  "baseClass": "wb-card",
  "semanticElement": {
    "tagName": "article",
    "implicitRole": "article"
  },
  "properties": {
    "title": { "type": "string", "default": "" },
    "subtitle": { "type": "string", "default": "" },
    "footer": { "type": "string", "default": "" },
    "elevated": { "type": "boolean", "default": false },
    "clickable": { "type": "boolean", "default": false },
    "variant": { 
      "type": "string", 
      "enum": ["default", "glass", "bordered", "flat"],
      "default": "default" 
    }
  }
}
```

## Related

- [Cards Overview](./cards.index.md) - All card components
- [Article Element](../semantic/article.md) - Semantic foundation

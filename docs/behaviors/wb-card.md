

## WB Card System

A card is a flexible, modular container for grouping related information, actions, or media in a visually distinct block. Cards are a universal UI pattern used in dashboards, galleries, product listings, notifications, and more. They help organize content, improve readability, and provide a consistent user experience.

The WB Card System provides a comprehensive set of custom elements for building all types of cards in modern web applications. It includes:
- 19+ card variants (e.g., `<wb-card>`, `<card-hero>`, `<card-profile>`, etc.)
- Semantic HTML for accessibility and SEO
- Light DOM only (no Shadow DOM)
- Customizable via attributes, slots, and CSS variables
- Support for badges, headers, footers, actions, and media
- Responsive and dark mode by default
- Designed for use with the WBServices pattern and builder

---

## Introduction

Cards are a universal UI pattern for grouping related information, actions, and media. The WB Card System provides a unified API and consistent styling for all card types, while allowing each variant to specialize for its use case (e.g., hero, profile, product, notification, etc.).

**Key Features:**
- 19+ card variants, each as a custom element (e.g., `<wb-card>`, `<card-hero>`, `<card-profile>`, etc.)
- Semantic HTML structure for accessibility and SEO
- Light DOM only (no Shadow DOM)
- Fully customizable via attributes, slots, and CSS variables
- Supports badges, headers, footers, actions, and media
- Responsive and dark mode by default
- Designed for use with the WBServices pattern and builder

---

## When to Use Cards

- To visually group related content or actions
- To present media, stats, or user profiles
- For dashboards, galleries, product listings, notifications, and more

---

## Card Variants Overview

The WB Card System includes a wide range of card types, each with its own tag and specialized features. See the table below for a summary. (Full usage, parameters, and examples for each variant follow in later sections.)
- Semantic HTML: uses `<article>` or `<section>` internally
- Supports header, subtitle, badge, footer, and main content
- Multiple visual variants (default, glass, cosmic, etc.)
- Interactive states: clickable, hoverable, elevated
- Fully customizable via attributes and slots
- Dark mode and accessible by default

---

## API Methods

- All logic is attribute-driven; advanced users can access the `.card` property for the base instance

---

## Schema & Tests
- [Schema](../../src/wb-models/wb-card.schema.json) (if present)
- [Tests](../../tests/behaviors/auto-injection-compliance.spec.ts), [behavior-verification.spec.ts], [behaviors-showcase-definitive.spec.ts] (integration)

---

## Source
- [wb-card.js](../../src/wb-viewmodels/wb-card.js)
- [card.js (behavior)](../../src/wb-viewmodels/card.js)

---

## Card Examples Demo

All live card examples are now available in a single demo file:

**View all card examples at:**

http://localhost:3000/demos/card-examples.html

This page shows every WB Card variant in action, including the full feature sample and all specialized card types.

# WB Card System

The WB Card System is a comprehensive, flexible, and accessible set of custom elements for presenting content in a visually consistent, modular, and interactive way. It is designed for modern web applications that require a wide variety of card layouts—ranging from simple content containers to rich, interactive UI blocks like pricing tables, hero banners, product listings, and more.

## Introduction

Cards are a universal UI pattern for grouping related information, actions, and media. The WB Card System provides a unified API and consistent styling for all card types, while allowing each variant to specialize for its use case (e.g., hero, profile, product, notification, etc.).

**Key Features:**
- 19+ card variants, each as a custom element (e.g., `<wb-card>`, `<card-hero>`, `<card-profile>`, etc.)
- Semantic HTML structure for accessibility and SEO
- Light DOM only (no Shadow DOM)
- Fully customizable via attributes, slots, and CSS variables
- Supports badges, headers, footers, actions, and media
- Responsive and dark mode by default
- Designed for use with the WBServices pattern and builder

---

## When to Use Cards

- To visually group related content or actions
- To present media, stats, or user profiles
- For dashboards, galleries, product listings, notifications, and more

---

## Card Variants Overview

The WB Card System includes a wide range of card types, each with its own tag and specialized features. See the table below for a summary. (Full usage, parameters, and examples for each variant follow in later sections.)
- Semantic HTML: uses `<article>` or `<section>` internally
- Supports header, subtitle, badge, footer, and main content
- Multiple visual variants (default, glass, cosmic, etc.)
- Interactive states: clickable, hoverable, elevated
- Fully customizable via attributes and slots
- Dark mode and accessible by default

---

## API Methods

- All logic is attribute-driven; advanced users can access the `.card` property for the base instance

---

## Schema & Tests
- [Schema](../../src/wb-models/wb-card.schema.json) (if present)
- [Tests](../../tests/behaviors/auto-injection-compliance.spec.ts), [behavior-verification.spec.ts], [behaviors-showcase-definitive.spec.ts] (integration)

---

## Source
- [wb-card.js](../../src/wb-viewmodels/wb-card.js)
- [card.js (behavior)](../../src/wb-viewmodels/card.js)

---


# WB Card System

The WB Card System is a comprehensive, flexible, and accessible set of custom elements for presenting content in a visually consistent, modular, and interactive way. It is designed for modern web applications that require a wide variety of card layouts—ranging from simple content containers to rich, interactive UI blocks like pricing tables, hero banners, product listings, and more.

## Introduction

Cards are a universal UI pattern for grouping related information, actions, and media. The WB Card System provides a unified API and consistent styling for all card types, while allowing each variant to specialize for its use case (e.g., hero, profile, product, notification, etc.).

**Key Features:**
- 19+ card variants, each as a custom element (e.g., `<wb-card>`, `<card-hero>`, `<card-profile>`, etc.)
- Semantic HTML structure for accessibility and SEO
- Light DOM only (no Shadow DOM)
- Fully customizable via attributes, slots, and CSS variables
- Supports badges, headers, footers, actions, and media
- Responsive and dark mode by default
- Designed for use with the WBServices pattern and builder

---

## When to Use Cards

- To visually group related content or actions
- To present media, stats, or user profiles
- For dashboards, galleries, product listings, notifications, and more

---

## Card Variants Overview

The WB Card System includes a wide range of card types, each with its own tag and specialized features. See the table below for a summary. (Full usage, parameters, and examples for each variant follow in later sections.)
- Semantic HTML: uses `<article>` or `<section>` internally
- Supports header, subtitle, badge, footer, and main content
- Multiple visual variants (default, glass, cosmic, etc.)
- Interactive states: clickable, hoverable, elevated
- Fully customizable via attributes and slots
- Dark mode and accessible by default

---

## API Methods

- All logic is attribute-driven; advanced users can access the `.card` property for the base instance

---

## Schema & Tests
- [Schema](../../src/wb-models/wb-card.schema.json) (if present)
- [Tests](../../tests/behaviors/auto-injection-compliance.spec.ts), [behavior-verification.spec.ts], [behaviors-showcase-definitive.spec.ts] (integration)

---

## Source
- [wb-card.js](../../src/wb-viewmodels/wb-card.js)
- [card.js (behavior)](../../src/wb-viewmodels/card.js)

---

## Sample System: Full Feature Example
```html
<wb-card title="Glass Card" subtitle="With Badge" badge="NEW" variant="glass" clickable hoverable elevated size="md" footer="Footer text here.">
  <p>All features enabled.</p>
</wb-card>
```

# Price Card & PCE (Pseudo-Custom Elements) Refactor

## Context & Problem
The original implementation of the Web Behavior (WB) system relied heavily on `div` elements with `data-wb` attributes (e.g., `<div data-wb="cardpricing">`). While functional, this approach led to:
1.  **"HTML Mess"**: Nested divs with numerous data attributes made the markup difficult to read and maintain.
2.  **IntelliSense Clutter**: The VS Code autocomplete list was populated with every single `data-` attribute ever used, making it hard to find relevant attributes.
3.  **Lack of Semantics**: Generic divs provided no semantic meaning to the developer about the component's purpose.

## The Request
The goal was to simplify the usage of complex components like Pricing Cards and Product Cards by allowing custom tag names, such as `<price-card>` and `<product-card>`, while retaining the underlying behavior logic.

## The Solution: Pseudo-Custom Elements (PCE)

We implemented a "Pseudo-Custom Element" (PCE) system that maps specific HTML tags to WB behaviors without requiring the `data-wb` attribute.

### 1. Core Logic (`src/core/wb-lazy.js`)
We introduced a `customElementMappings` registry to map tags to behaviors:

```javascript
const customElementMappings = [
  { selector: 'price-card', behavior: 'cardpricing' },
  { selector: 'product-card', behavior: 'cardproduct' }
];
```

The `getAutoInjectBehaviors` function and the `MutationObserver` were updated to scan for these tags and inject the corresponding behavior automatically.

### 2. Behavior Validation (`src/behaviors/js/card.js`)
The card behavior includes strict semantic validation. We updated the `ALLOWED_TAGS` list to accept these new custom tags so the behavior wouldn't reject the container:

```javascript
const ALLOWED_TAGS = ['ARTICLE', 'SECTION', 'DIV', 'PRICE-CARD', 'PRODUCT-CARD'];
```

### 3. IntelliSense Cleanup
We pruned the `.vscode/html-custom-data.json` file. Instead of listing every specific attribute (like `data-price`, `data-plan`), we reduced it to global/common attributes. This keeps the autocomplete menu clean while still supporting the custom tags.

## Usage Comparison

**Before (Div Soup):**
```html
<div data-wb="cardpricing" 
     data-plan="Pro" 
     data-price="$29" 
     data-period="/mo" 
     data-features="Feature 1, Feature 2">
</div>
```

**After (Custom Tag):**
```html
<price-card 
     data-plan="Pro" 
     data-price="$29" 
     data-period="/mo" 
     data-features="Feature 1, Feature 2">
</price-card>
```

## Supported Tags
Currently supported custom tags:
- `<price-card>` → `cardpricing`
- `<product-card>` → `cardproduct`

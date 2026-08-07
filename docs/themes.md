# Theme System Documentation

The WB-Starter library uses a powerful, variable-based theming system that supports:
- 25+ built-in themes
- Dark/Light mode switching
- Nested themes (sections with different themes)
- Forced themes (locking a section to a specific theme)

## Architecture

Themes are defined in `src/styles/themes.css`. This file contains:
1.  **Base Structure**: Defines required CSS variables (colors, spacing, typography).
2.  **Theme Definitions**: Sets variable values for each theme (e.g., `[data-theme="dark"]`, `[data-theme="ocean"]`).
3.  **Utility Rules**: Helper classes for theme application.

## Usage

### Global Theme
Set the `data-theme` attribute on the `<html>` or `<body>` tag:

```html
<html
  lang="en"
  data-theme="dark">
```

### Nested Themes
You can apply a different theme to any section of the page by adding `data-theme` to a container:

```html
<div
  class="section"
  data-theme="forest">
  <!-- Everything inside here uses Forest theme variables -->
  <button class="wb-button wb-button--primary">Forest Button</button>
</div>
```

### Forced Themes (Dark Mode Enforcer)
To force a section to be Light or Dark regardless of the global preference, use `data-theme` combined with the `darkmode` behavior if needed (though `data-theme` alone handles the CSS variables).

**Important Note on Text Color:**
When nesting themes, especially when switching between Dark and Light modes within the same page, you must ensure the text color updates to match the new background.

The framework handles this automatically with the following rule in `themes.css`:

```css
/* Apply theme text color to any element defining a theme */
[data-theme] {
  color: var(--text-primary);
}
```

This ensures that if you have a global Dark theme (white text) and force a section to Light theme (white background), the text inside that section will correctly switch to dark color.

## Available Themes

- **Standard**: `dark`, `light`
- **Vibrant**: `cyberpunk`, `neon-dreams`
- **Natural**: `ocean`, `sunset`, `forest`, `desert`, `mint`
- **Elegant**: `midnight`, `sakura`, `lavender`, `ruby`, `golden`, `emerald`
- **Professional**: `slate`, `coffee`, `noir`
- **Atmospheric**: `arctic`, `retro-wave`, `aurora`, `twilight`, `grape`

## Typography Scale (Golden Ratio)

The type scale uses a golden-ratio progression (1.618) for consistent visual hierarchy. These tokens are derived mathematically from `--text-base` (1rem), not hand-picked:

```css
/* Text size tokens (golden-ratio derived) */
--text-xs: 0.75rem;                                                               /* ~12px, hand-picked base */
--text-sm: 0.875rem;                                                              /* ~14px, hand-picked base */
--text-base: 1rem;                                                                /* 16px, foundation */
--text-lg: calc(var(--text-base) * var(--golden-ratio));                          /* ~1.618rem (25.9px) */
--text-xl: calc(var(--text-base) * var(--golden-ratio) * var(--golden-ratio));    /* ~2.618rem (41.9px) */
--text-2xl: calc(var(--text-base) * var(--golden-ratio) * var(--golden-ratio) * var(--golden-ratio)); /* ~4.236rem (67.8px) */
--text-3xl: calc(var(--text-base) * var(--golden-ratio) * var(--golden-ratio) * var(--golden-ratio) * var(--golden-ratio)); /* ~6.854rem (109.7px) */
```

**Usage:** Apply these to headings, display text, and content that needs emphasis:

```css
h1 { font-size: var(--text-3xl); }
h2 { font-size: var(--text-2xl); }
h3 { font-size: var(--text-xl); }
h4 { font-size: var(--text-lg); }
body { font-size: var(--text-base); }
small { font-size: var(--text-sm); }
```

## Spacing Scale (Golden Ratio)

Spacing also follows the golden-ratio progression for visual consistency:

```css
--space-xs: 0.25rem;  /* 4px */
--space-sm: 0.5rem;   /* 8px */
--space-md: 1rem;     /* 16px */
--space-lg: calc(var(--space-md) * var(--golden-ratio));  /* ~1.618rem (25.9px) */
--space-xl: calc(var(--space-md) * var(--golden-ratio) * var(--golden-ratio));  /* ~2.618rem (41.9px) */
--space-2xl: calc(var(--space-md) * var(--golden-ratio) * var(--golden-ratio) * var(--golden-ratio));  /* ~4.236rem (67.8px) */
```

## Aspect Ratio

For golden rectangle proportions on media containers:

```css
--aspect-golden: var(--golden-ratio);  /* 1.618:1 ratio */
```

**Usage:** Apply to images, cards, or media containers:

```css
img { aspect-ratio: var(--aspect-golden); }
.hero { aspect-ratio: var(--aspect-golden); }
```

## Creating a New Theme

To add a new theme, define it in `src/styles/themes.css`:

```css
[data-theme="my-new-theme"] {
  /* Foundation */
  --hue-primary: 123;
  --saturation-primary: 50;
  --lightness-primary: 50;
  
  /* Colors */
  --primary: hsl(...);
  --bg-color: hsl(...);
  --text-primary: hsl(...);
  /* ... define all required variables */
}
```

**Note:** The `--golden-ratio`, `--text-*`, and `--space-*` tokens are defined in the shared `:root` block and inherited by all themes. Do not override them per-theme.

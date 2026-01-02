# Theme System Documentation

The Web Behaviors (WB) library uses a powerful, variable-based theming system that supports:
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
<html lang="en" data-theme="dark">
```

### Nested Themes
You can apply a different theme to any section of the page by adding `data-theme` to a container:

```html
<div class="section" data-theme="forest">
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

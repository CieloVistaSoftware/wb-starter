# Builder Section Focus System
## Overview
The builder uses a **Section Focus** system to control where new components are added. At any time, one of the three sections (Header, Main, Footer) is the **focused section**.
## Core Behavior

### On Page Load
1. **Header section is focused by default** - This is the first thing users should add
2. The Tree panel shows Header with green highlight/active state
3. The Template Browser filters to show only Header components
4. Any component clicked in the Template Browser adds to Header

### Changing Focus
Users change focus by clicking a section in the Tree panel:
- Click "Header" → Focus moves to Header, Template Browser shows header components
- Click "Main" → Focus moves to Main, Template Browser shows main content sections  
- Click "Footer" → Focus moves to Footer, Template Browser shows footer components

### Adding Components
**When a section is focused:**
- Single-click any component in Template Browser → Adds to the focused section
- Components are appended in order to the focused section
- The canvas scrolls to show the newly added component

### Visual Indicators
- **Tree Panel:** Active section has green background, expanded state
- **Template Browser:** Shows filter hint bar (e.g., "🔝 Showing header components only")
- **Canvas:** Components in focused section may have green outline

## Implementation Files

| File | Responsibility |
|------|---------------|
| `builder-tree.js` | Tree panel, section selection, `window.selectSection()` |
| `builder-template-browser.js` | Filters templates, listens for section changes |
| `builder-canvas-sections.js` | Adds components to correct section on canvas |

## Events

### `wb:section:activated`
Dispatched when section focus changes:
```javascript
document.dispatchEvent(new CustomEvent('wb:section:activated', { 
  detail: { section: 'header' | 'main' | 'footer' } 
}));
```

### Global Functions

```javascript
// Set active section programmatically
window.setActiveSection(section)  // 'header' | 'main' | 'footer' | null

// Get current active section
window.getActiveSection()  // Returns current section or null

// Select and focus a section (includes UI updates)
window.selectSection(section)
```

## Initialization Sequence

1. `builder-tree.js` initializes → renders tree, sets `activeSection = 'header'`
2. `builder-template-browser.js` initializes → sets `activeTreeSection = 'header'`
3. Both dispatch `wb:section:activated` event with `section: 'header'`
4. Template browser re-renders filtered to header components
5. Tree panel shows header as active with green highlight

## Rules

1. **ONE focused section at a time** - Never null during normal operation
2. **Default is Header** - First load always focuses Header
3. **Focus persists** - Clicking a template doesn't change focus
4. **Clear focus with "Show All"** - Button in Template Browser clears filter

---

*Last updated: January 4, 2026*

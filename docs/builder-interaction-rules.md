# Builder Interaction Rules
## Source of Truth
All interaction rules are defined in: `src/wb-models/builder.schema.json` under the `interactions` section.
## Quick Reference
### Selection Synchronization

| Rule ID | Trigger | Action |
|---------|---------|--------|
| CANVAS_TO_TREE_SYNC | Click component on canvas | Tree scrolls to & highlights component |
| TREE_TO_CANVAS_SYNC | Click component in tree | Canvas scrolls to & selects component |
| SECTION_FOCUS_FROM_CANVAS | Click component on canvas | Parent section (Header/Main/Footer) becomes focused |
| SECTION_FOCUS_FROM_TREE | Click section in tree | Section becomes focused, template browser filters |

### Section Focus System

| Rule ID | Trigger | Action |
|---------|---------|--------|
| DEFAULT_SECTION | Page load (empty) | Header section focused by default |
| SECTION_PERSISTENCE | Add via template browser | Section focus unchanged |
| SHOW_ALL_OVERRIDE | Click "Show All" | Section filter cleared |

### Properties Panel

| Rule ID | Trigger | Action |
|---------|---------|--------|
| PROP_CATEGORY_TOGGLE | Click category header | Category body collapses/expands |
| PROP_DEFAULT_EXPANDED | Panel opens | All categories expanded by default |
| PROP_TAB_ICONS | Tab section | Icons display at 1.5rem height |

## Property Panel Collapsible Categories

The properties panel groups properties into collapsible categories:

- **Click on category header** → Toggle show/collapse children
- Categories include: Element ID, Content, Appearance, Layout, etc.
- Collapsed state shows ▶, Expanded shows ▼
- CSS class `.collapsed` added when collapsed

```html
<div class="prop-category">
  <div class="prop-category-header" onclick="this.parentElement.classList.toggle('collapsed')">
    <span class="prop-category-label">Category Name</span>
    <span class="prop-category-toggle">▼</span>
  </div>
  <div class="prop-category-body">
    <!-- Property rows here -->
  </div>
</div>
```

## Events

| Event | Detail | When |
|-------|--------|------|
| `wb:section:activated` | `{ section: 'header'|'main'|'footer' }` | Section focus changes |
| `wb:component:selected` | `{ id, behavior }` | Component selected |

## API Methods

```javascript
window.setActiveSection('header')  // Set active section
window.getActiveSection()          // Get current section
```

## Implementation Files

| File | Responsibility |
|------|---------------|
| `builder-tree.js` | Tree panel rendering, selection sync, section activation |
| `builder-template-browser.js` | Section filtering, listens to `wb:section:activated` |
| `builder-canvas-sections.js` | Determines which section a component belongs to |
| `builder-properties.js` | Property panel rendering, collapsible categories |
| `index.js` | Selection handler (`selComp`), event dispatch |

---

*Rules defined in builder.schema.json → Implementation in JS files → Tests verify behavior*

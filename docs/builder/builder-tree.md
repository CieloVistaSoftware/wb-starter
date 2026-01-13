# WB Builder Tree Panel - Comprehensive Schema

## CRITICAL RULES - DO NOT VIOLATE

### 1. Only 2 Tabs: Tree+Props (🌳) and Style (🎨)
- Tree and Props are COMBINED into ONE tab (🌳)
- Tree shows component hierarchy at top
- Properties panel shows below tree when component selected
- Style tab (🎨) is separate for decorations

### 2. Tree View is DEFAULT - User Controls Tab Selection
- **Tree tab (🌳) is ALWAYS the default**
- **NEVER switch tabs automatically** - only the user decides which tab to show
- When a component is selected, stay on current tab
- When a DOM child is selected, stay on current tab
- Tab changes ONLY happen when user clicks a tab

### 3. Selection Behavior
- **ALL selections are GREEN** (`#22c55e`)
- Components (`.dropped` wrappers) → green outline
- DOM children (inner elements) → green outline
- Tree items → green background highlight
- **Click any element** → highlight + scroll into view

### 4. Parent Elements MUST Show ALL Meaningful Content
When expanding a component, show ALL content elements found ANYWHERE in the component:
- **Text content**: h1, h2, h3, h4, h5, h6, p, span, label, blockquote, code
- **Interactive**: button (with real text), a (links with text)
- **Media**: img, svg, video, audio, picture, canvas
- **Forms**: input, select, textarea
- **Lists**: li items
- **Tables**: th, td cells

### 5. Content Filtering
Skip these elements (they're not meaningful content):
- **Builder UI**: resize handles, delete buttons, toolbars
- **Hamburger buttons**: buttons with aria-label "menu", "toggle", "close"
- **Icon-only buttons**: buttons with text ≤ 2 characters or just symbols
- **Hash-only links**: `<a href="#">` with no text
- **Structural containers**: div, section, nav, article (walk into them, don't display them)

## Tree Structure

Content is **FLATTENED** - no intermediate containers shown, only meaningful content:

```
📄 Main (7)
  ▼ 📑 SECTION                                   #home
      🔤 h1: "Welcome to Our Platform"              .hero-title
      📝 p: "Build beautiful single-page..."        .hero-desc
      🔘 button: "Explore Services"                  .btn-primary
      🔘 button: "Contact Us"                        .btn-outline
  ▼ 📑 SECTION                                   #about
      🔤 h2: "About Us"                              .section-title
      📝 p: "We are a team of passionate..."        .about-text
      🖼️ img: team-photo.jpg                       .team-img
  ▼ 📑 SECTION                                   #services
      🔤 h2: "Our Services"                          .section-title
      🎨 svg: icon                                   .service-icon
      🔤 h3: "Web Development"                       .card-title
      📝 p: "Custom web applications..."             .card-desc
      🎨 svg: icon                                   .service-icon
      🔤 h3: "Mobile Apps"                           .card-title
      📝 p: "Native and hybrid apps..."              .card-desc
```

**What gets shown:** h1, h2, h3, p, button, img, svg, a (with text), input, select
**What gets skipped:** div, section, nav, containers, hamburger buttons, icon-only links

## Element Icon Map

| Icon | Elements |
|------|----------|
| 📑 | section |
| 📰 | article |
| 📌 | aside |
| 🔝 | header |
| 🔻 | footer |
| 🧭 | nav |
| 📄 | main |
| 📦 | div, generic containers |
| 🏷️ | span, label |
| 🔤 | h1, h2, h3, h4, h5, h6 |
| 📝 | p, textarea |
| 🔗 | a (links) |
| 💪 | strong |
| ✨ | em |
| 💬 | blockquote |
| 💻 | code |
| 📋 | pre, form, ul, select |
| 🖼️ | img, picture, figure |
| 🎬 | video |
| 🔊 | audio |
| 🎨 | svg, canvas |
| 🪟 | iframe |
| ✏️ | input |
| 🔘 | button |
| 🔢 | ol |
| • | li |
| 📊 | table |
| ➡️ | tr |
| ➖ | hr |
| ↵ | br |

## Display Name Rules

Elements show meaningful content in the tree:

| Element | Display Format | Example |
|---------|---------------|---------|
| h1-h6 | `tag: "text content"` | `h1: "Welcome to Our Site"` |
| p | `p: "text content..."` | `p: "Lorem ipsum dolor..."` |
| button | `button: "text"` | `button: "Get Started"` |
| a | `🔗 text` | `🔗 Learn More` |
| img | `img: alt or filename` | `img: hero-background.jpg` |
| input | `input[type]` | `input[email]` |
| svg | `svg icon` | `svg icon` |
| div with class | `.classname` | `.container` |
| div with id | Shows in ID column | `#hero-section` |

## ID/Class Display

Every tree item shows identifier on the right:
- Elements with `id` → `#element-id`
- Elements with `class` → `.first-class`
- Elements with neither → `tagname`

## Selection States

### Component Selection (Green)
```css
.dropped.selected {
  outline: 2px solid #22c55e !important;
  outline-offset: 2px;
}
```

### DOM Child Selection (Green)
```css
.dom-highlight {
  outline: 2px solid #22c55e !important;
  outline-offset: 2px;
}
```

### Tree Item Selection (Green)
```css
.tree-item.selected,
.tree-item-dom.highlighted {
  background: rgba(34, 197, 94, 0.15) !important;
  border-color: #22c55e !important;
  color: #22c55e;
}
```

## Expand/Collapse Behavior

### Section Headers (Header/Main/Footer)
- Click toggles expand/collapse
- Main is expanded by default
- Header and Footer start collapsed
- Count badge shows number of components

### Component Items
- Click ▶ to expand and see DOM children
- Click component row to select + scroll to canvas
- Expanding shows ALL nested DOM elements

### DOM Children
- Click ▶ to expand nested children
- Click row to highlight + scroll on canvas
- Max depth: 4 levels (performance limit)

## Event Flow

```
User clicks tree item
    ↓
Clear previous highlights
    ↓
Highlight element on canvas (GREEN)
    ↓
Scroll element into view
    ↓
Update tree item highlight (GREEN)
    ↓
DO NOT SWITCH TABS
```

## Global Functions

| Function | Purpose |
|----------|---------|
| `window.renderTree()` | Re-render entire tree |
| `window.selectFromTree(id)` | Select component by ID |
| `window.highlightDOMElement(key)` | Highlight DOM child |
| `window.toggleContainerExpand(id)` | Toggle expand/collapse |
| `window.selectSection(section)` | Toggle section expand |
| `window.setAllTreeSections(bool)` | Expand/collapse all |

## Files

| File | Purpose |
|------|---------|
| `src/wb-viewmodels/builder-app/builder-tree.js` | Tree panel implementation |
| `docs/builder/builder-tree.md` | This documentation |

## Integration Points

1. **Canvas** - Syncs selection with canvas elements
2. **Properties Panel** - Tree is default tab, no auto-switching
3. **Template Browser** - Section states sync between panels
4. **Undo/Redo** - Tree updates after undo/redo operations

## DO NOT

- ❌ Auto-switch tabs when selecting (NEVER)
- ❌ Use different colors for DOM children (always GREEN)
- ❌ Hide IDs/classes (always visible)
- ❌ Collapse Main section by default
- ❌ Limit child content display (show ALL text, images, icons)
- ❌ Have 3 tabs (only 2: Tree+Props and Style)
- ❌ Switch away from Tree tab without user clicking

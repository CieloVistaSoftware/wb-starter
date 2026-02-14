# 🏗️ WB Page Builder - Specification Document

## Overview

WB Page Builder is a **drag-and-drop website builder** that allows users to create professional websites by combining pre-built components. The builder features a three-section layout (Header, Main, Footer) with visual editing capabilities.

---

## 1. Core Architecture

### 1.1 Layout Structure
The builder interface consists of **4 main areas**:

| Section | Purpose | Width | Content |
|---------|---------|-------|---------|
| **Left Sidebar** | Component Library | 280px | Categorized draggable components |
| **Center Canvas** | Visual Editor | Flexible | WYSIWYG editing area with 3 site sections |
| **Right Sidebar** | Properties Panel | 300px | Edit selected component properties |
| **Top/Status Bars** | Controls & Info | Full width | Save, Export, Preview buttons + status |

### 1.2 Three-Section Design
Every website created must have exactly **3 sections**:

1. **🔝 HEADER** - Navigation, logo, branding
2. **📄 MAIN** - Hero, features, content, pricing, testimonials, etc.
3. **🔻 FOOTER** - Copyright, links, newsletter signup

---

## 2. Component Library (Left Sidebar)

### 2.1 Header Components
```
🔝 Navigation Bar
  - Multi-link navigation menu
  - Logo placeholder
  - Responsive layout

📍 Logo & Title
  - Company logo area
  - Title/branding text
  - Customizable styling
```

### 2.2 Main Content Components
```
🦸 Hero Section
  - Large headline
  - Gradient background options
  - Background image support
  - Call-to-action button

✨ Features
  - 3-column feature cards
  - Icon + title + description
  - Grid layout

💬 Testimonials
  - Customer quotes
  - Author attribution
  - Star ratings (future)

💰 Pricing Table
  - Multiple pricing tiers
  - Feature lists per tier
  - CTA buttons

👥 Team Members
  - Team member cards
  - Name, role, photo
  - Social links (future)

🖼️ Image Gallery
  - Grid image display
  - Lightbox support (future)
  - Multiple layout options

❓ FAQ Section
  - Accordion-style Q&A
  - Expandable/collapsible items
  - Search functionality (future)

📢 Call to Action (CTA)
  - Large banner section
  - Headline + description + button
  - Email signup integration (future)

🃏 Card
  - Generic content card
  - Flexible content area
  - Border & shadow customization
```

### 2.3 Footer Components
```
🔻 Footer
  - Copyright notice
  - Links section
  - Social media icons
  - Company info

📧 Newsletter Signup
  - Email input field
  - Subscribe button
  - Confirmation message (future)
```

---

## 3. Canvas Area (Center)

### 3.1 Visual Representation
- Shows exact preview of website being built
- **1200px max width** for consistent desktop view
- **Grid background** (20px) for alignment reference
- **Responsive design** - components adapt to container width

### 3.2 Three Drop Zones
Each section has its own **drop zone**:

```
┌─────────────────────────────────┐
│  🔝 HEADER SECTION              │
│  ┌───────────────────────────┐  │
│  │ Drop components here      │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  📄 MAIN CONTENT SECTION        │
│  ┌───────────────────────────┐  │
│  │ Drop components here      │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  🔻 FOOTER SECTION              │
│  ┌───────────────────────────┐  │
│  │ Drop components here      │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 3.3 Drag & Drop Functionality
- **Drag from library** → Drop into canvas
- **Visual feedback** on drag-over (blue border + highlight)
- **Unlimited components** per section
- **Reorder components** within sections (future)
- **Real-time rendering** - see changes immediately

### 3.4 Component Selection & Editing
- **Click any component** to select it
- **Blue highlight border** on selected component
- **Properties panel updates** automatically
- **Visual feedback** confirms selection

---

## 4. Properties Panel (Right Sidebar)

### 4.1 Dynamic Properties
Properties change based on **selected component type**:

**Common Properties** (All Components):
- Component name/title
- Background color picker
- Text color picker
- Padding (Small/Medium/Large/XL)
- Delete button

**Component-Specific Properties** (Future):
- Hero: Image upload, gradient editor
- Features: Icon selector, column count
- Testimonials: Rating, author info
- Pricing: Tier name, price, features list
- Gallery: Image uploader, layout options

### 4.2 Property Controls

| Control | Type | Options |
|---------|------|---------|
| **Text Input** | Text field | For titles, descriptions |
| **Color Picker** | Hex/RGB | Visual color selection |
| **Dropdown** | Select | Padding, alignment, layout |
| **Range Slider** | Number | Opacity, blur, width |
| **Toggle** | Checkbox | Borders, shadows, visibility |

### 4.3 Empty State
When no component is selected:
```
"Click a component to edit its properties"
```

---

## 5. Top Bar Controls

### 5.1 Buttons
```
👁️ Preview      [Secondary]  Open full-page preview
📤 Export       [Secondary]  Download website as JSON
💾 Save         [Primary]    Save to config/site.json
```

### 5.2 Title
- Displays: **"🏗️ WB Page Builder"**
- Indicates this is the editor/builder interface

---

## 6. Canvas Toolbar

### 6.1 Information Display
- Current canvas mode: "Canvas"
- **Component counter**: "X components" (updates in real-time)
- **Section indicators**: Shows which section is being worked on

---

## 7. Status Bar (Bottom)

### 7.1 Left Side
- General status: "Ready to build"

### 7.2 Right Side (Dynamic)
- Updates with user actions:
  - "Added Hero Section"
  - "Updated background color"
  - "Component deleted"
  - "✅ Site saved!"
  - "Site exported!"

---

## 8. Data Management

### 8.1 Component Tracking
Each component stores:
```javascript
{
  id: "comp-0",              // Unique identifier
  type: "hero",              // Component type
  section: "main",           // Header/Main/Footer
  element: HTMLElement,      // DOM reference
  properties: {              // Editable properties
    title: "Welcome",
    bgColor: "#667eea",
    textColor: "#ffffff",
    padding: "1.5rem"
  }
}
```

### 8.2 Site Data Structure
```json
{
  "title": "My Website",
  "components": [
    {
      "type": "navbar",
      "section": "header",
      "content": "<html>..."
    },
    {
      "type": "hero",
      "section": "main",
      "content": "<html>..."
    }
  ]
}
```

### 8.3 Save & Export
- **Save**: Sends JSON to `/api/save-config` endpoint
- **Export**: Downloads website.json file to user's computer
- **Format**: Pretty-printed JSON with 2-space indentation

---

## 9. Visual Design

### 9.1 Color Scheme
- **Theme**: Dark theme (data-theme="dark")
- **Primary**: #6366f1 (Indigo)
- **Secondary**: #8b5cf6 (Purple)
- **Backgrounds**: Gradient backgrounds for depth

### 9.2 Typography
- **Font**: Inter (400, 500, 600, 700, 800 weights)
- **Headers**: Bold, uppercase, letter-spaced
- **Buttons**: 600 weight, 0.9rem size

### 9.3 Spacing & Layout
- **Sidebar width**: 280px (left), 300px (right)
- **Component padding**: 0.75rem default
- **Gap between elements**: 0.75rem - 1.5rem
- **Border radius**: 6px - 8px

### 9.4 Animations
- **Hover effects**: translateX/Y, shadow changes
- **Drag feedback**: Color change, border highlight
- **Transitions**: 0.3s ease on all interactive elements

---

## 10. Interactions & Workflows

### 10.1 Creating a Website

**Step 1: Add Header Component**
1. Drag "🔝 Navigation Bar" from left sidebar
2. Drop into "Header" section on canvas
3. Component appears in drop zone

**Step 2: Add Main Content**
1. Drag "🦸 Hero Section" from left sidebar
2. Drop into "Main" section on canvas
3. Repeat for Features, CTA, etc.

**Step 3: Customize**
1. Click component on canvas to select
2. Edit properties in right sidebar
3. Changes apply in real-time

**Step 4: Add Footer**
1. Drag footer component
2. Drop into "Footer" section
3. Customize as needed

**Step 5: Save or Export**
1. Click "💾 Save" → Saves to config/site.json
2. Click "📤 Export" → Downloads website.json
3. Click "👁️ Preview" → Opens live preview

### 10.2 Editing Workflow
1. **Select**: Click any component on canvas
2. **Edit**: Modify properties in right panel
3. **Preview**: See changes in real-time on canvas
4. **Delete**: Click trash button to remove
5. **Reorder**: Drag within section (future feature)

---

## 11. Responsive Behavior

### 11.1 Desktop Layout (1200px+)
- All 4 areas visible simultaneously
- Sidebar fixed width
- Canvas fills remaining space

### 11.2 Tablet Layout (768px - 1199px)
- Canvas expands
- Sidebars stack or collapse
- Component properties in modal (future)

### 11.3 Mobile Layout (<768px)
- Single column layout
- Sidebars collapse to tabs
- Full-screen canvas view
- Bottom toolbar becomes floating buttons

---

## 12. Error Handling & Validation

### 12.1 Validation Rules
- ✅ Minimum 1 component required to save
- ✅ All sections (Header/Main/Footer) recommended
- ✅ Component names must be non-empty
- ✅ Color values must be valid hex/RGB

### 12.2 Error Messages
```
"Please add at least one component"
"Invalid color format"
"Failed to save site"
"Export failed - check console"
```

---

## 13. Keyboard Shortcuts (Future)

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Save site |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Delete` | Delete selected component |
| `Escape` | Deselect component |

---

## 14. Feature Roadmap

### Phase 1 (Current)
- ✅ Drag-and-drop components
- ✅ Basic property editing
- ✅ Save/Export functionality
- ✅ Component library

### Phase 2 (Next)
- [ ] Component reordering
- [ ] Image upload to components
- [ ] Background image editor
- [ ] Gradient color picker
- [ ] Undo/Redo history
- [ ] Component duplication

### Phase 3 (Future)
- [ ] Custom CSS editor
- [ ] Page templates library
- [ ] Mobile preview
- [ ] Publish to web
- [ ] Domain integration
- [ ] Analytics dashboard
- [ ] AI-powered suggestions

---

## 15. Technical Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Structure |
| **CSS3** | Styling (Grid, Flexbox, Gradients) |
| **Vanilla JS** | Drag-drop, DOM manipulation, state management |
| **Dark Theme CSS Variables** | Consistent theming |
| **No Framework** | Lightweight, fast, dependency-free |

---

## 16. Performance Requirements

- **Canvas rendering**: <100ms
- **Component drag-drop**: Smooth, no lag
- **Property updates**: Instant visual feedback
- **Save operation**: <500ms
- **Export operation**: <1000ms

---

## 17. Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | Latest | ✅ Full |
| Firefox | Latest | ✅ Full |
| Safari | Latest | ✅ Full |
| Edge | Latest | ✅ Full |
| IE | Any | ❌ Not supported |

---

## 18. Accessibility Requirements

- ✅ Keyboard navigation support
- ✅ ARIA labels on interactive elements
- ✅ High contrast colors (WCAG AA)
- ✅ Focus indicators on buttons
- ✅ Screen reader compatible

---

## 19. File Locations

```
C:\Users\jwpmi\Downloads\AI\wb-starter\
├── builder.html              ← Main builder interface
├── src/
│   ├── styles/
│   │   ├── themes.css       ← Dark/light theme variables
│   │   └── site.css         ← Site structure styles
│   └── api/
│       └── save-config.js   ← Backend save endpoint
├── config/
│   └── site.json            ← Saved site configurations
└── docs/
    └── BUILDER_SPECS.md     ← This document
```

---

## 20. Success Criteria

✅ **Must Have:**
- Drag components to canvas
- Select and edit properties
- Save website configuration
- Export as JSON
- Three-section layout (Header/Main/Footer)
- Real-time visual updates
- Status feedback to user

✅ **Should Have:**
- Multiple component types (15+)
- Responsive design
- Undo/Redo (Phase 2)
- Preview mode
- Component deletion

✅ **Nice to Have:**
- Custom CSS editor
- AI suggestions
- Template library
- Mobile preview
- Live publish

---

## Summary

The **WB Page Builder** is a professional website builder that:
- 🎯 Enables **drag-and-drop website creation**
- 🎨 Provides **visual editing** with real-time feedback
- 📦 Includes **15+ pre-built components**
- 💾 Allows **saving and exporting** websites
- 🔝 Organizes content in **3 sections** (Header/Main/Footer)
- ⚡ Delivers **instant visual updates**
- 📱 Works on **desktop, tablet, and mobile**

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-12  
**Status**: ✅ Complete & Implemented


# WB Page Builder – Pages System (2026)

> **Version:** 3.0.0  
> **Last Updated:** 2026-01-17  
> **Status:** Active Development
> **Schema:** `src/wb-models/page-builder.schema.json`

---

## Overview

The Pages system enables multi-page website creation in the WB Page Builder. It is schema-driven, no-build, and fully integrated with the modern WB architecture (Light DOM, ESM, global CSS, and JSON-driven data).

---

## Core Principles (2026)

- **Use Only WB Components:** All UI must use `<wb-*>` custom elements. Native HTML elements are not allowed for interactive controls.
- **Breadcrumb Navigation:** Every properties panel must show a full breadcrumb path for context.
- **Immediate Visual Feedback:** All user actions provide instant feedback (flashes, transitions, etc.).
- **Component Browser:** All container components must provide a categorized, searchable browser with 20+ WB components.
- **site.json Integration:** All settings panels must support site.json path and auto-load.

---

## Data Model (2026)

```typescript
interface Page {
  id: string;                    // Unique (e.g., 'home', 'about')
  name: string;                  // Display name
  slug: string;                  // URL (e.g., 'about.html')
  seoTitle?: string;             // SEO/browser title
  seoDescription?: string;       // Meta description
  main: Component[];             // Page-specific components
}

interface SiteState {
  pages: Page[];
  globalSections: {
    header: Component[];
    footer: Component[];
  };
  currentPageId: string;
  settings: SiteSettings;
}

interface SiteSettings {
  siteName: string;
  siteJson: string;              // Path to site.json
  defaultTheme: 'light' | 'dark';
  confirmDelete: boolean;
  showTooltips: boolean;
  autoSave: boolean;
  autoSaveInterval: number;      // Minutes
}
```

---

## Breadcrumb Navigation

**Rule:** Every properties panel must display a breadcrumb showing the current navigation path.

**Format:**
```
📁 Site / 📄 {page.name} / 🧩 {section} / {component.icon} {component.name}
```

**Behavior:**
- Clickable segments for site, page, section, and component (except current, which is bold).
- Always reflects the current selection context.

**Implementation:**
See `src/wb-viewmodels/breadcrumb.js` for the latest logic.

---

## Color Picker Component

**Rule:** All color inputs must use `<wb-colorpicker>`, not native `<input type="color">`.

**Features:**
- Large swatch preview (≥48x48px)
- Hex input with validation
- Preset palette and recent colors
- Alpha channel support (if needed)

**See:** `src/wb-models/colorpicker.schema.json` and `src/wb-viewmodels/colorpicker.js`

---

## Phone Number Input Mask

**Rule:** All phone number fields must use input masking for consistent formatting.

**Supported:** US, International, Extension formats.

**See:** `src/wb-viewmodels/phone-mask.js` for up-to-date implementation.

---

## Visual Feedback

**Rule:** All key actions (edit, error, save, select) must trigger a visible feedback animation (e.g., border flash).

**Colors:**
- Green: Edit/Save
- Red: Error
- Purple: Selection

**See:** `src/styles/components/feedback.css` for animation details.

---

## Auto-Create Linked Pages

**Rule:** When dropping any component that contains a link to a page (e.g., navigation links, buttons with href, card links), the linked page **must be automatically created** if it doesn't exist.

**Auto-Created Page Requirements:**

| Requirement | Description |
|-------------|-------------|
| **Filename** | `{page-slug}.html` in `/pages/` folder |
| **Created Date** | Today's date (YYYY-MM-DD) in page metadata and content |
| **Page Title** | Derived from link text or component name |
| **Default Content** | Helpful placeholder with customization instructions |

**Template for Auto-Created Pages:**
```html
<!--
  Page: {Page Name}
  Created: {YYYY-MM-DD}
  Source: Auto-generated from Page Builder
-->
<section class="page-placeholder">
  <h1>{Page Name}</h1>
  <p class="page-meta">📅 Created: {Month DD, YYYY}</p>
  
  <div class="customize-guide">
    <h2>🎨 How to Customize This Page</h2>
    <p>This page was auto-created when you added a link to it. Here's how to make it yours:</p>
    <ol>
      <li><strong>Open Page Builder</strong> – Select this page from the Pages panel</li>
      <li><strong>Add Components</strong> – Drag components from the library to the canvas</li>
      <li><strong>Edit Content</strong> – Click any component to edit its properties</li>
      <li><strong>Change the Layout</strong> – Use wb-grid or wb-stack for structure</li>
      <li><strong>Update SEO</strong> – Set the page title and description in Page Settings</li>
      <li><strong>Save Changes</strong> – Click the Save button to publish</li>
    </ol>
    <p>💡 <em>Delete this placeholder section after adding your content.</em></p>
  </div>
</section>
```

**Behavior:**
- ✅ Check if target page exists before creating
- ✅ Show toast notification: "📄 Created new page: {name}"
- ✅ Auto-add page to the Pages list in the left sidebar
- ✅ Set page SEO title to match the page name
- ❌ Do NOT auto-navigate to the new page (stay on current page)

**Implementation:**
See `src/builder/builder-pages.js` → `createLinkedPage(slug, linkText)` function.

---

## Container Component Browser

**Rule:** All container components (wb-stack, wb-grid, etc.) must show a categorized, searchable browser with 20+ WB components.

**Categories:** Layout, Cards, Content, Interactive, Feedback

**See:** `src/wb-viewmodels/component-browser.js` for the latest logic and categories.

---

## Settings – site.json Integration

**Rule:** Settings panel must include site.json path and auto-load toggle.

**Panel Structure:**
- Path input for site.json
- Auto-load toggle
- Manual load button

**See:** `src/wb-viewmodels/settings.js` for up-to-date integration code.

---

## Test Cases (2026)

Test cases are defined in `tests/behaviors/ui/pages.spec.ts` and are auto-generated from schemas. See the test file for the latest scenarios.

---

## Schema Reference

See: `src/wb-models/builder.schema.json` for the complete schema definition for the builder page system.

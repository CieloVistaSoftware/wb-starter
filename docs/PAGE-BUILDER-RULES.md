# WB Page Builder - Content Creation Rules

## 📄 PAGE

### Page Properties

| Property | Description | Editable |
|----------|-------------|----------|
| **Name** | Display name shown in navbar and pages list | Yes (except Home) |
| **Slug** | URL filename (e.g., `about.html`) | Yes (except Home) |
| **SEO Title** | Browser tab title / search result title | Yes |
| **SEO Description** | Meta description for search engines | Yes |

### Page Rules

| Rule | Details |
|------|---------|
| **Home page is protected** | Cannot rename, cannot change slug, cannot delete |
| **Home slug is always** | `index.html` |
| **Minimum pages** | Must have at least 1 page (Home) |
| **Maximum pages in navbar** | First 4 pages shown in navigation |
| **Duplicate IDs blocked** | Cannot create page with same ID as existing |
| **Slug auto-generates** | From page name: lowercase, spaces→hyphens, special chars removed, `.html` suffix |
| **Slug manual override** | Once manually edited, won't auto-update when name changes |
| **Auto-switch after create** | Builder switches to new page immediately |
| **Navbar auto-updates** | When pages are added/removed/renamed |

### Page Templates

| Template | Initial Content |
|----------|-----------------|
| **📋 Blank** | Empty page (no components) |
| **🦸 With Hero** | Hero section with page name as title |
| **📞 Contact** | Hero + CTA component (green gradient, phone mode) |
| **ℹ️ About** | Hero + Team Members section |

---

## 🌐 SPA vs NON-SPA

### Current Mode: **Non-SPA (Multi-Page Application)**

The builder currently generates a traditional multi-page website where each page is a separate HTML file.

| Aspect | Non-SPA (Current) | SPA (Future) |
|--------|-------------------|--------------|
| **File Structure** | Separate `.html` file per page | Single `index.html` + JS router |
| **Navigation** | Full page reload (`<a href="about.html">`) | Client-side routing (no reload) |
| **Header/Footer** | Duplicated in each HTML file | Single instance, always visible |
| **URL Format** | `/about.html`, `/contact.html` | `/#/about`, `/#/contact` or `/about`, `/contact` |
| **SEO** | ✅ Each page fully crawlable | ⚠️ Requires SSR/prerendering |
| **Initial Load** | Fast (only load current page) | Slower (load entire app) |
| **Subsequent Nav** | Slower (full reload) | Instant (no reload) |
| **Hosting** | Any static host | Any static host (with routing config) |
| **Offline Support** | Limited | Better (with service worker) |

### Export Behavior by Mode

#### Non-SPA Export (Current)
```
site-export.zip
├── index.html      (Home page - complete HTML)
├── about.html      (About page - complete HTML)
├── contact.html    (Contact page - complete HTML)
├── src/
│   └── styles/
│       ├── themes.css
│       └── site.css
└── site.json       (Data backup)
```

Each HTML file contains:
- Full `<!DOCTYPE html>` structure
- Duplicated header/footer
- Page-specific main content
- All CSS links

#### SPA Export (Future Enhancement)
```
site-export.zip
├── index.html      (Shell with router)
├── src/
│   ├── styles/
│   │   ├── themes.css
│   │   └── site.css
│   └── js/
│       └── router.js
└── site.json       (Page data loaded dynamically)
```

Single HTML file with:
- App shell (header/footer once)
- JavaScript router
- Dynamic content loading from `site.json`

### Recommended Mode by Use Case

| Use Case | Recommended | Reason |
|----------|-------------|--------|
| Simple marketing site | Non-SPA | Better SEO, simpler hosting |
| Blog or content site | Non-SPA | Each page indexed separately |
| Web application | SPA | Faster navigation, app-like feel |
| Portfolio | Either | Depends on interactivity needs |
| E-commerce | Non-SPA | SEO critical for products |

---

## 🧩 COMPONENTS

### Component Placement Rules

| Component | Header | Main | Footer | Notes |
|-----------|:------:|:----:|:------:|-------|
| 🔝 Navigation Bar | ✅ | ❌ | ❌ | Auto-creates pages when dropped |
| 📍 Logo & Title | ✅ | ❌ | ❌ | |
| 🦸 Hero Section | ❌ | ✅ | ❌ | |
| ✨ Features | ❌ | ✅ | ❌ | **Main only** - blocked elsewhere |
| 💬 Testimonials | ❌ | ✅ | ❌ | |
| 💰 Pricing Table | ❌ | ✅ | ❌ | |
| 👥 Team Members | ❌ | ✅ | ❌ | |
| 🖼️ Image Gallery | ❌ | ✅ | ❌ | |
| ❓ FAQ Section | ❌ | ✅ | ❌ | |
| 📞 Call to Action | ❌ | ✅ | ❌ | |
| 🃏 Card | ❌ | ✅ | ❌ | 6 card types available |
| 🔻 Footer | ❌ | ❌ | ✅ | |
| 📧 Newsletter | ❌ | ❌ | ✅ | |

### Section Behavior

| Section | Shared Across Pages? | Content Scope |
|---------|:-------------------:|---------------|
| **Header** | ✅ Yes | Global - same on all pages |
| **Main Content** | ❌ No | Page-specific - unique per page |
| **Footer** | ✅ Yes | Global - same on all pages |

### Duplicate Component Rules

- **Warning shown** if same component type already exists in section
- User can choose to add another or cancel
- No hard limit on duplicates

---

## 🃏 CARD COMPONENT

The Card component supports 6 different types, each with unique fields:

### Card Types

| Type | Icon | Use Case |
|------|------|----------|
| **Basic** | 🖼️ | General content card |
| **Feature** | ✨ | Highlight a feature/benefit |
| **Pricing** | 💰 | Single pricing tier |
| **Team** | 👤 | Team member profile |
| **Testimonial** | 💬 | Customer quote |
| **CTA** | 📞 | Call to action |

### Card Fields by Type

| Field | Basic | Feature | Pricing | Team | Testimonial | CTA |
|-------|:-----:|:-------:|:-------:|:----:|:-----------:|:---:|
| Icon | ✅ | ✅ | | | | |
| Title | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Description | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Price | | | ✅ | | | |
| Period | | | ✅ | | | |
| Highlighted | | | ✅ | | | |
| Image URL | | | | ✅ | ✅ | |
| Subtitle | | | | ✅ | ✅ | |
| Contact Type | | | | | | ✅ |
| Phone Number | | | | | | ✅* |
| Email | | | | | | ✅* |
| Email Subject | | | | | | ✅* |
| Button Text | | | | | | ✅* |
| Gradient Start | | | | | | ✅ |
| Gradient End | | | | | | ✅ |

*Fields shown based on Contact Type selection

---

## 📞 CTA COMPONENT

### Contact Modes

| Mode | Button Action | Display |
|------|---------------|---------|
| **Phone** | `tel:` link - opens phone dialer | 📞 (555) 123-4567 |
| **Email** | `mailto:` link - opens email client | ✉️ Send Us an Email |

### CTA Fields

| Field | Phone Mode | Email Mode |
|-------|:----------:|:----------:|
| Headline | ✅ | ✅ |
| Description | ✅ | ✅ |
| Contact Type | ✅ | ✅ |
| Phone Number | ✅ | |
| Email Address | | ✅ |
| Email Subject | | ✅ |
| Button Text | | ✅ |
| Gradient Start | ✅ | ✅ |
| Gradient End | ✅ | ✅ |

---

## ✨ FEATURES GRID

- **Fixed 3-card layout**
- Click individual card to select and edit
- Selected card shows purple border

### Feature Card Fields

| Field | Description |
|-------|-------------|
| Icon | Emoji or symbol |
| Title | Feature name |
| Description | Feature explanation |

---

## 💰 PRICING GRID

- **Fixed 3-card layout**
- Click individual card to select and edit
- One card can be "highlighted" (recommended tier)

### Pricing Card Fields

| Field | Description |
|-------|-------------|
| Plan Name | Tier name (Basic, Pro, Enterprise) |
| Price | Amount ($29, Custom, etc.) |
| Period | Billing cycle (/month, /year, empty) |
| Features | Comma-separated list |
| Highlighted | Toggle for recommended tier styling |

---

## ✏️ EDITING METHODS

| Component | Edit Method | Details |
|-----------|-------------|---------|
| Hero | Contenteditable | Click text and type directly |
| Testimonials | Contenteditable | Click text and type directly |
| Gallery | Contenteditable | Click text and type directly |
| FAQ | Contenteditable | Click text and type directly |
| Footer | Contenteditable | Click text and type directly |
| Newsletter | Contenteditable | Click text and type directly |
| Logo & Title | Contenteditable | Click text and type directly |
| Navbar | Properties Panel | Logo text field only; links auto-generated |
| Features Grid | Properties Panel | Click card → edit in panel |
| Pricing Grid | Properties Panel | Click card → edit in panel |
| Card | Properties Panel | Type selector + dynamic fields |
| CTA | Properties Panel | Contact type + dynamic fields |

---

## 💾 SAVING & EXPORT

### Save (LocalStorage)

| Key | Content |
|-----|---------|
| `wb-page-builder-site` | Complete site JSON |

### Load Options

| Source | Description |
|--------|-------------|
| **From Browser** | Restore from localStorage |
| **From Template** | Load pre-built site.json template |
| **From File** | Upload custom .json file |

### Export Options

| Format | Output |
|--------|--------|
| **JSON** | `site.json` - data backup, can be re-imported |
| **HTML** | `site-export.zip` - deployable website |

### Export Security

| Risk | Mitigation |
|------|------------|
| Script injection | `<script>` tags escaped to `&lt;script&gt;` |
| Event handlers | Preserved (onclick, etc.) - user responsibility |

---

## 🔄 STATE MANAGEMENT

### Data Model

```
Site State
├── pages[]
│   ├── id
│   ├── name
│   ├── slug
│   ├── seoTitle
│   ├── seoDescription
│   └── main[] (page-specific components)
│       ├── id
│       ├── type
│       ├── section
│       ├── html
│       └── data{}
├── globalSections
│   ├── header[] (shared components)
│   └── footer[] (shared components)
└── currentPageId
```

### Page Switch Behavior

1. Save current page's main content
2. Clear main section from DOM
3. Load new page's main content
4. Update pages list (green border on active)
5. Update properties panel (page settings)
6. Update status bar (active element)

---

## 📊 STATUS BAR

The status bar always shows the current active element:

| State | Display | Color |
|-------|---------|-------|
| Page selected | 📄 **Page:** [Name] | Green (#10b981) |
| Component selected | [Icon] **[Name]** | Purple (var(--primary)) |

---

## 🚀 FUTURE ENHANCEMENTS

### Planned Features

- [ ] SPA export mode with client-side routing
- [ ] Component reordering (drag within section)
- [ ] Undo/Redo
- [ ] Custom CSS per component
- [ ] Image upload (not just URLs)
- [ ] More page templates
- [ ] Theme/color customization
- [ ] Mobile preview mode
- [ ] Collaboration features

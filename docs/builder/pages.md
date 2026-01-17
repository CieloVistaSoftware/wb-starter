# WB Page Builder - Pages System

> **Version:** 2.1.0  
> **Last Updated:** 2026-01-16  
> **Status:** Active Development
> **Schema:** `src/wb-models/page-builder.schema.json`

## 📋 Overview

The Pages system manages multi-page website creation in the WB Page Builder. This document defines all rules, behaviors, and implementation requirements.

---

## 🎯 Core Principles

| ID | Principle | Description |
|----|-----------|-------------|
| CORE-001 | **Reuse WB Components** | ALWAYS use wb-* components (wb-input, wb-control, etc.) - NEVER native HTML inputs |
| CORE-002 | **Breadcrumb Navigation** | Properties panel shows path: `contact.html / Hero Section / wb-card` |
| CORE-003 | **Visual Feedback** | All interactions provide immediate visual feedback (flash, borders, transitions) |
| CORE-004 | **Searchable Browser** | Container components show categorized, searchable 20+ component list |
| CORE-005 | **site.json Integration** | Settings MUST include site.json path and auto-load capability |

---

## 🗂️ Page Structure

### Data Model

```typescript
interface Page {
  id: string;                    // Unique identifier (e.g., 'home', 'about')
  name: string;                  // Display name
  slug: string;                  // URL filename (e.g., 'about.html')
  seoTitle?: string;             // Browser tab / search title
  seoDescription?: string;       // Meta description
  main: Component[];             // Page-specific components
}

interface SiteState {
  pages: Page[];
  globalSections: {
    header: Component[];         // Shared across all pages
    footer: Component[];         // Shared across all pages
  };
  currentPageId: string;
  settings: SiteSettings;
}

interface SiteSettings {
  siteName: string;
  siteJson: string;              // Path to site.json config
  defaultTheme: 'light' | 'dark';
  confirmDelete: boolean;
  showTooltips: boolean;
  autoSave: boolean;
  autoSaveInterval: number;      // Minutes
}
```

---

## 🧭 Breadcrumb Navigation

### Rule: BREADCRUMB-001
**Every properties panel MUST display a breadcrumb showing the current navigation path.**

### Format
```
📁 Site / 📄 {page.name} / 🧩 {section} / {component.icon} {component.name}
```

### Examples
```
📁 Site / 📄 Contact / 🧩 Main / 🦸 Hero Section
📁 Site / 📄 Contact / 🧩 Main / 🦸 Hero Section / 🃏 wb-card
📁 Site / 📄 Home / 🧩 Header / 🔝 Navigation Bar
```

### Behavior
| Action | Result |
|--------|--------|
| Click `📁 Site` | Show site-level settings |
| Click `📄 {page}` | Show page properties |
| Click `🧩 {section}` | Show section overview |
| Click `{component}` | Show component properties |
| Current item | Non-clickable, bold text |

### Implementation
```javascript
function renderBreadcrumb(context) {
  const { page, section, component, nestedComponent } = context;
  
  const crumbs = [
    { icon: '📁', label: 'Site', onClick: () => showSiteSettings() },
    { icon: '📄', label: page.name, onClick: () => showPageProperties(page) }
  ];
  
  if (section) {
    crumbs.push({ icon: '🧩', label: section, onClick: () => showSectionOverview(section) });
  }
  
  if (component) {
    crumbs.push({ 
      icon: component.template.icon, 
      label: component.template.name, 
      onClick: () => selectComponent(component) 
    });
  }
  
  if (nestedComponent) {
    crumbs.push({ 
      icon: getNestedInfo(nestedComponent.type).icon, 
      label: nestedComponent.config?.title || nestedComponent.type,
      current: true 
    });
  }
  
  return crumbs;
}
```

---

## 🎨 Color Picker Component

### Rule: COLOR-001
**All color inputs MUST use the full WB colorpicker component, not native `<input type="color">`.**

### Required Features
- Large swatch preview (48x48px minimum)
- Hex input field with validation
- Preset color palette
- Recent colors history
- Alpha channel support (where applicable)

### HTML Structure
```html
<div class="wb-color-picker" data-field="gradientStart">
  <label>Gradient Start Color</label>
  <div class="color-picker-preview">
    <div class="color-swatch" style="background: #667eea;">
      <input type="color" value="#667eea" 
             onchange="updateColorFromPicker(this, 'gradientStart')">
    </div>
    <div class="color-value">
      <input type="text" class="color-hex-input" value="#667EEA" 
             pattern="^#[0-9A-Fa-f]{6}$"
             onchange="updateColorFromHex(this, 'gradientStart')">
    </div>
  </div>
  <div class="color-presets">
    <!-- Primary palette -->
    <button class="color-preset" style="background: #667eea;" 
            onclick="setColor('gradientStart', '#667eea')"></button>
    <button class="color-preset" style="background: #764ba2;" 
            onclick="setColor('gradientStart', '#764ba2')"></button>
    <button class="color-preset" style="background: #10b981;" 
            onclick="setColor('gradientStart', '#10b981')"></button>
    <button class="color-preset" style="background: #f59e0b;" 
            onclick="setColor('gradientStart', '#f59e0b')"></button>
    <button class="color-preset" style="background: #ef4444;" 
            onclick="setColor('gradientStart', '#ef4444')"></button>
    <button class="color-preset" style="background: #8b5cf6;" 
            onclick="setColor('gradientStart', '#8b5cf6')"></button>
    <button class="color-preset" style="background: #06b6d4;" 
            onclick="setColor('gradientStart', '#06b6d4')"></button>
    <button class="color-preset" style="background: #ec4899;" 
            onclick="setColor('gradientStart', '#ec4899')"></button>
  </div>
</div>
```

### Color Presets (Standard Palette)
```javascript
const COLOR_PRESETS = {
  primary: ['#667eea', '#764ba2', '#6366f1', '#8b5cf6'],
  success: ['#10b981', '#059669', '#22c55e', '#16a34a'],
  warning: ['#f59e0b', '#d97706', '#eab308', '#ca8a04'],
  danger:  ['#ef4444', '#dc2626', '#f87171', '#b91c1c'],
  info:    ['#06b6d4', '#0891b2', '#22d3ee', '#0e7490'],
  neutral: ['#1f2937', '#374151', '#6b7280', '#9ca3af']
};
```

---

## 📞 Phone Number Input Mask

### Rule: PHONE-001
**All phone number inputs MUST use input masking for consistent formatting.**

### Supported Formats
| Format | Pattern | Example |
|--------|---------|---------|
| US/Canada | `(###) ###-####` | (555) 123-4567 |
| International | `+## ### ### ####` | +44 123 456 7890 |
| Extension | `(###) ###-#### x####` | (555) 123-4567 x1234 |

### Implementation
```javascript
function formatPhoneNumber(input) {
  // Strip all non-digits
  let value = input.value.replace(/\D/g, '');
  
  // Limit to 10 digits (US) or 15 (international)
  const maxLength = value.startsWith('1') || value.length <= 10 ? 10 : 15;
  value = value.substring(0, maxLength);
  
  // Format based on length
  if (value.length <= 3) {
    input.value = value.length ? `(${value}` : '';
  } else if (value.length <= 6) {
    input.value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
  } else {
    input.value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
  }
}

function getCleanPhoneNumber(formatted) {
  return formatted.replace(/\D/g, '');
}
```

### HTML Structure
```html
<div class="property">
  <label>Phone Number</label>
  <div class="phone-input-group">
    <span style="font-size: 1.2rem;">📞</span>
    <input type="tel" 
           class="phone-masked-input"
           value="(555) 123-4567"
           placeholder="(___) ___-____"
           maxlength="14"
           oninput="formatPhoneNumber(this)"
           onchange="updateCTA('phoneNumber', getCleanPhoneNumber(this.value))">
  </div>
  <div class="phone-format-hint">Format: (555) 123-4567</div>
</div>
```

---

## ⚡ Visual Feedback

### Rule: FEEDBACK-001
**Right-click "Edit Properties" MUST flash green border on properties panel.**

### Implementation
```javascript
function flashPropertiesPanel() {
  const panel = document.getElementById('propertiesPanel');
  panel.classList.add('props-flash');
  setTimeout(() => panel.classList.remove('props-flash'), 600);
}

// CSS Animation
@keyframes propsFlash {
  0% { box-shadow: inset 0 0 0 3px #10b981; }
  50% { box-shadow: inset 0 0 0 3px #10b981, 0 0 20px rgba(16, 185, 129, 0.3); }
  100% { box-shadow: none; }
}

.props-flash {
  animation: propsFlash 0.6s ease-out;
}
```

### When to Flash
| Trigger | Flash Color |
|---------|-------------|
| Edit Properties (context menu) | Green (#10b981) |
| Error / Validation failure | Red (#ef4444) |
| Save successful | Green (#10b981) |
| Component selected | Purple (#6366f1) |

---

## 📦 Container Component Browser

### Rule: CONTAINER-001
**Container components (wb-stack, wb-grid, wb-cluster, etc.) MUST show searchable component browser with 20+ components.**

### Browser Structure
```html
<div class="context-menu" style="width: 320px;">
  <input type="text" class="ctx-search" placeholder="🔍 Search components..." 
         oninput="filterComponents(this.value)">
  
  <div class="ctx-scrollable">
    <!-- Layout Components -->
    <div class="ctx-category-header">📐 Layout</div>
    <button class="ctx-item" onclick="insertComponent('wb-stack')">
      <span>📚</span> wb-stack
    </button>
    <button class="ctx-item" onclick="insertComponent('wb-grid')">
      <span>🔲</span> wb-grid
    </button>
    <!-- ... more layout components -->
    
    <!-- Content Components -->
    <div class="ctx-category-header">📝 Content</div>
    <button class="ctx-item" onclick="insertComponent('wb-card')">
      <span>🃏</span> wb-card
    </button>
    <!-- ... more content components -->
    
    <!-- Cards (expanded) -->
    <div class="ctx-category-header">🎴 Cards</div>
    <button class="ctx-item" onclick="insertComponent('wb-cardimage')">
      <span>🖼️</span> wb-cardimage
    </button>
    <!-- ... all 20 card variants -->
  </div>
</div>
```

### Component Categories
```javascript
const COMPONENT_CATEGORIES = {
  layout: {
    icon: '📐',
    label: 'Layout',
    items: [
      { id: 'wb-stack', icon: '📚', name: 'Stack', desc: 'Vertical flow' },
      { id: 'wb-cluster', icon: '🔷', name: 'Cluster', desc: 'Horizontal wrap' },
      { id: 'wb-grid', icon: '🔲', name: 'Grid', desc: 'CSS Grid layout' },
      { id: 'wb-container', icon: '📦', name: 'Container', desc: 'Max-width wrapper' },
      { id: 'wb-sidebar', icon: '📑', name: 'Sidebar', desc: 'Main + aside' },
      { id: 'wb-center', icon: '🎯', name: 'Center', desc: 'Centered content' },
      { id: 'wb-cover', icon: '📋', name: 'Cover', desc: 'Full viewport' },
      { id: 'wb-switcher', icon: '🔀', name: 'Switcher', desc: 'Responsive flip' },
      { id: 'wb-reel', icon: '🎞️', name: 'Reel', desc: 'Horizontal scroll' },
      { id: 'wb-frame', icon: '🖼️', name: 'Frame', desc: 'Aspect ratio' }
    ]
  },
  cards: {
    icon: '🎴',
    label: 'Cards',
    items: [
      { id: 'wb-card', icon: '🃏', name: 'Card', desc: 'Basic card' },
      { id: 'wb-cardimage', icon: '🖼️', name: 'Image Card', desc: 'Featured image' },
      { id: 'wb-cardvideo', icon: '🎬', name: 'Video Card', desc: 'Embedded video' },
      { id: 'wb-cardprofile', icon: '👤', name: 'Profile Card', desc: 'Team member' },
      { id: 'wb-cardpricing', icon: '💰', name: 'Pricing Card', desc: 'Price tier' },
      { id: 'wb-cardproduct', icon: '🛍️', name: 'Product Card', desc: 'E-commerce' },
      { id: 'wb-cardstats', icon: '📊', name: 'Stats Card', desc: 'Key metrics' },
      { id: 'wb-cardtestimonial', icon: '💬', name: 'Testimonial', desc: 'Customer quote' },
      { id: 'wb-cardhero', icon: '🦸', name: 'Hero Card', desc: 'Full-width hero' },
      { id: 'wb-cardfile', icon: '📁', name: 'File Card', desc: 'File download' },
      { id: 'wb-cardnotification', icon: '🔔', name: 'Notification', desc: 'Alert card' },
      { id: 'wb-cardportfolio', icon: '💼', name: 'Portfolio', desc: 'Project showcase' },
      { id: 'wb-cardlink', icon: '🔗', name: 'Link Card', desc: 'Clickable card' },
      { id: 'wb-cardhorizontal', icon: '↔️', name: 'Horizontal', desc: 'Side-by-side' },
      { id: 'wb-cardoverlay', icon: '🎭', name: 'Overlay', desc: 'Text on image' },
      { id: 'wb-cardbutton', icon: '🔘', name: 'Button Card', desc: 'With CTA' },
      { id: 'wb-cardexpandable', icon: '📖', name: 'Expandable', desc: 'Collapsible' },
      { id: 'wb-cardminimizable', icon: '➖', name: 'Minimizable', desc: 'Minimize' },
      { id: 'wb-carddraggable', icon: '✋', name: 'Draggable', desc: 'Drag & drop' }
    ]
  },
  content: {
    icon: '📝',
    label: 'Content',
    items: [
      { id: 'wb-hero', icon: '🦸', name: 'Hero', desc: 'Page header' },
      { id: 'wb-header', icon: '🔝', name: 'Header', desc: 'Site header' },
      { id: 'wb-footer', icon: '🔻', name: 'Footer', desc: 'Site footer' },
      { id: 'wb-mdhtml', icon: '📄', name: 'Markdown', desc: 'Rich text' }
    ]
  },
  interactive: {
    icon: '🎮',
    label: 'Interactive',
    items: [
      { id: 'wb-tabs', icon: '📑', name: 'Tabs', desc: 'Tab panels' },
      { id: 'wb-collapse', icon: '📂', name: 'Collapse', desc: 'Accordion' },
      { id: 'wb-dropdown', icon: '🔽', name: 'Dropdown', desc: 'Menu' },
      { id: 'wb-drawer', icon: '📥', name: 'Drawer', desc: 'Slide panel' }
    ]
  },
  feedback: {
    icon: '💬',
    label: 'Feedback',
    items: [
      { id: 'wb-alert', icon: '⚠️', name: 'Alert', desc: 'Notification' },
      { id: 'wb-badge', icon: '🏷️', name: 'Badge', desc: 'Status indicator' },
      { id: 'wb-progress', icon: '📊', name: 'Progress', desc: 'Progress bar' },
      { id: 'wb-spinner', icon: '🔄', name: 'Spinner', desc: 'Loading' },
      { id: 'wb-rating', icon: '⭐', name: 'Rating', desc: 'Star rating' }
    ]
  }
};
```

### Search Filter
```javascript
function filterComponents(query) {
  const q = query.toLowerCase();
  document.querySelectorAll('.ctx-item').forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(q) ? '' : 'none';
  });
  
  // Hide empty categories
  document.querySelectorAll('.ctx-category-header').forEach(header => {
    const items = getNextSiblings(header, '.ctx-item');
    const hasVisible = items.some(i => i.style.display !== 'none');
    header.style.display = hasVisible ? '' : 'none';
  });
}
```

---

## ⚙️ Settings - site.json Integration

### Rule: SETTINGS-001
**Settings panel MUST include site.json configuration path and auto-load capability.**

### Settings Panel Structure
```html
<div class="config-section">
  <h3>📁 Site Configuration</h3>
  
  <div class="config-row">
    <div>
      <label>site.json Path</label>
      <small>Path to your site configuration file</small>
    </div>
    <input type="text" id="cfgSiteJson" value="config/site.json" 
           placeholder="config/site.json"
           onchange="updateSetting('siteJsonPath', this.value)">
  </div>
  
  <div class="config-row">
    <div>
      <label>Auto-load site.json</label>
      <small>Load configuration on startup</small>
    </div>
    <label class="toggle-switch">
      <input type="checkbox" id="cfgAutoLoadSiteJson" 
             onchange="updateSetting('autoLoadSiteJson', this.checked)">
      <span class="toggle-slider"></span>
    </label>
  </div>
  
  <div class="config-row">
    <div>
      <label>Load site.json Now</label>
      <small>Import configuration from file</small>
    </div>
    <button class="btn btn-secondary btn-sm" onclick="loadSiteJsonConfig()">
      📥 Load Config
    </button>
  </div>
</div>
```

### site.json Integration
```javascript
async function loadSiteJsonConfig() {
  const path = builderSettings.siteJsonPath || 'config/site.json';
  
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    
    const config = await response.json();
    applyConfig(config);
    updateStatus(`✅ Loaded configuration from ${path}`);
  } catch (error) {
    console.error('Failed to load site.json:', error);
    updateStatus(`❌ Failed to load ${path}: ${error.message}`);
  }
}

function applyConfig(config) {
  // Apply branding
  if (config.branding) {
    // Update navbar logo
    const navComp = components.find(c => c.type === 'navbar');
    if (navComp) {
      navComp.data.logo = config.branding.companyName;
      updateNavbarDisplay(navComp);
    }
  }
  
  // Apply navigation menu as pages
  if (config.navigationMenu) {
    config.navigationMenu.forEach(item => {
      ensurePageExists(item.menuItemId, item.menuItemText, item.pageToLoad);
    });
  }
  
  // Apply services as features
  if (config.servicesList) {
    const featuresComp = components.find(c => c.type === 'features');
    if (featuresComp) {
      featuresComp.data.cards = config.servicesList.slice(0, 3).map(s => ({
        icon: s.serviceIcon || '✨',
        title: s.serviceName,
        description: s.serviceDescription
      }));
      updateFeaturesDisplay(featuresComp);
    }
  }
}
```

---

## 🧪 Test Cases

### Page Tests
```javascript
const PAGE_TESTS = [
  {
    name: 'Create page with template',
    steps: [
      'Click "Add Page"',
      'Select "Contact" template',
      'Click "Create Page"'
    ],
    expect: {
      pageExists: 'contact',
      hasComponents: ['hero', 'cta'],
      breadcrumb: '📁 Site / 📄 Contact'
    }
  },
  {
    name: 'Breadcrumb navigation',
    steps: [
      'Select Hero component on Contact page',
      'Verify breadcrumb shows full path',
      'Click page name in breadcrumb'
    ],
    expect: {
      breadcrumb: '📁 Site / 📄 Contact / 🧩 Main / 🦸 Hero Section',
      afterClick: 'Shows page properties'
    }
  },
  {
    name: 'Color picker interaction',
    steps: [
      'Select CTA component',
      'Click gradient start color swatch',
      'Select preset color'
    ],
    expect: {
      colorUpdates: true,
      previewUpdates: true,
      hexInputUpdates: true
    }
  },
  {
    name: 'Phone mask formatting',
    steps: [
      'Select CTA component',
      'Set contact type to Phone',
      'Type "5551234567" in phone field'
    ],
    expect: {
      displayValue: '(555) 123-4567',
      storedValue: '5551234567'
    }
  },
  {
    name: 'Edit Properties flash',
    steps: [
      'Right-click Hero component',
      'Click "Edit Properties"'
    ],
    expect: {
      propsPanel: 'has class props-flash',
      animationDuration: '600ms'
    }
  },
  {
    name: 'Container component browser',
    steps: [
      'Right-click wb-stack component',
      'Click "Insert WB Component"'
    ],
    expect: {
      menuWidth: '320px',
      hasSearch: true,
      categories: ['Layout', 'Cards', 'Content', 'Interactive', 'Feedback'],
      componentCount: '20+'
    }
  }
];
```

---

## 📐 Schema Reference

See: `src/wb-models/builder.schema.json`

The complete schema for the builder page system is defined in the schema file.

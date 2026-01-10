# BUILDER BROKEN - Critical Fixes Needed

## 🔴 IMMEDIATE ISSUES (Builder Unusable)

### 1. Components Drop But Show NOTHING
These behaviors work but render NOTHING visible when dropped:

| Component | What It Does | What User Sees | FIX NEEDED |
|-----------|--------------|----------------|------------|
| **Clipboard** | Copies target text | Empty/invisible | Needs button: "📋 Copy" |
| **Confetti** | Fires on click | Empty/invisible | Needs button: "🎉 Fire Confetti" |
| **Clock** | Shows time | Just numbers | Needs variants: digital, LED, analog |
| **Print** | Prints page | Empty | Needs button: "🖨️ Print" |
| **Share** | Shares URL | Empty | Needs button: "📤 Share" |
| **Fullscreen** | Toggles fullscreen | Empty | Needs button: "⛶ Fullscreen" |
| **Lazy** | Lazy loads images | Shows ⏳ | OK but needs src set |
| **Scroll** | Scrolls to target | Empty | Needs button: "↓ Scroll to..." |
| **Offline** | Shows online status | Works | OK |
| **Debug** | Shows console | Works | OK |

### 2. Sidebar Can't Resize Past Canvas
**Current:** Sidebar stops at canvas edge
**Fix:** Allow sidebar to expand up to 50% of window width
**File:** `builder.js` line ~1050 (sidebar resize code)

### 3. No Right-Click Context Menu
**Needed:** Right-click on dropped component should show:
- View Schema
- Edit Properties
- Duplicate
- Delete
- Move Up/Down

### 4. Container Has No Layout Control
**Current:** `{ n: 'Container', d: {} }` - empty!
**Fix:** Add direction, columns, gap, align properties

---

## 🟡 Component Fixes Required

### Clipboard - Needs Visible Button
```javascript
// Current: does nothing visible
// Fix: render a button
export function clipboard(element, options = {}) {
  const config = {
    target: options.target || element.dataset.target || '',
    text: options.text || element.dataset.clipboardText || '',
    label: options.label || element.dataset.label || '📋 Copy to Clipboard',
    // ...
  };
  
  // Make it visible!
  if (!element.textContent.trim()) {
    element.textContent = config.label;
  }
  element.style.cssText = 'cursor:pointer;padding:0.5rem 1rem;background:var(--bg-tertiary);border-radius:6px;display:inline-flex;align-items:center;gap:0.5rem;';
  // ...
}
```

### Clock - Needs Variants
```javascript
export function clock(element, options = {}) {
  const config = {
    variant: options.variant || element.dataset.variant || 'digital', // digital, led, analog
    format: options.format || element.dataset.format || '24',
    // ...
  };
  
  if (config.variant === 'led') {
    element.style.fontFamily = '"LCD", monospace';
    element.style.background = '#000';
    element.style.color = '#0f0';
    element.style.padding = '1rem';
    element.style.letterSpacing = '0.2em';
  }
}
```

### Confetti - Needs Visible Trigger
```javascript
export function confetti(element, options = {}) {
  // Make it visible!
  if (!element.textContent.trim()) {
    element.innerHTML = '🎉 <span>Fire Confetti!</span>';
  }
  element.style.cssText = 'cursor:pointer;padding:0.75rem 1.5rem;background:linear-gradient(135deg,#ff6b6b,#feca57);color:#fff;border-radius:8px;font-weight:bold;';
  // ...
}
```

### Container - Needs Layout Properties
```javascript
// builder.js
{ n: 'Container', i: '📦', b: 'container', d: {
  direction: 'column',      // column, row
  columns: 1,               // 1 = flex, 2+ = grid
  gap: '1rem',
  align: 'stretch',
  justify: 'start',
  wrap: true,
  padding: '1rem'
}, container: true }
```

---

## 🟢 Builder UI Fixes

### Fix Sidebar Resize (builder.js ~line 1050)
```javascript
const MIN_WIDTH = 192;
const MAX_WIDTH = window.innerWidth * 0.5; // Allow 50% of window

// Remove: const MAX_WIDTH = canvas.offsetLeft; // This was the bug!
```

### Add Right-Click Context Menu
```javascript
// In builder.js
document.addEventListener('contextmenu', e => {
  const wrapper = e.target.closest('.dropped');
  if (!wrapper) return;
  
  e.preventDefault();
  showContextMenu(e.clientX, e.clientY, wrapper);
});

function showContextMenu(x, y, wrapper) {
  // Remove existing menu
  document.getElementById('builderContextMenu')?.remove();
  
  const c = JSON.parse(wrapper.dataset.c);
  const menu = document.createElement('div');
  menu.id = 'builderContextMenu';
  menu.className = 'context-menu';
  menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;padding:0.5rem 0;min-width:180px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.3);`;
  
  menu.innerHTML = `
    <button class="ctx-item" onclick="viewSchema('${c.b}')">📋 View Schema</button>
    <button class="ctx-item" onclick="selComp(document.getElementById('${wrapper.id}'))">⚙️ Edit Properties</button>
    <hr class="ctx-divider">
    <button class="ctx-item" onclick="dup('${wrapper.id}')">📄 Duplicate</button>
    <button class="ctx-item" onclick="moveUp('${wrapper.id}')">⬆️ Move Up</button>
    <button class="ctx-item" onclick="moveDown('${wrapper.id}')">⬇️ Move Down</button>
    <hr class="ctx-divider">
    <button class="ctx-item ctx-item--danger" onclick="del('${wrapper.id}')">🗑️ Delete</button>
  `;
  
  document.body.appendChild(menu);
  
  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', () => menu.remove(), { once: true });
  }, 0);
}

window.viewSchema = (behavior) => {
  window.open(`src/behaviors/schema/${behavior}.schema.json`, '_blank');
};
```

### Context Menu Styles
```css
.context-menu { animation: fadeIn 0.15s ease; }
.ctx-item {
  display: block;
  width: 100%;
  padding: 0.5rem 1rem;
  text-align: left;
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.875rem;
}
.ctx-item:hover { background: var(--bg-tertiary); }
.ctx-item--danger { color: #ef4444; }
.ctx-divider { border: none; border-top: 1px solid var(--border-color); margin: 0.25rem 0; }
```

---

## Execution Order

1. **Fix sidebar resize** - Allow wider sidebar
2. **Add context menu** - Right-click support
3. **Fix invisible components** - Clipboard, Confetti, Print, Share, etc.
4. **Add Container layout** - direction, columns, gap
5. **Add Clock variants** - digital, LED, analog
6. **Fix card inheritance** - cardbutton shows subtitle/footer

---

## 🔵 Recent Fixes (Dec 27, 2025)

### Semantic Components Compliance
- **Checkbox**: Added `wb-checkbox` class, wrapper label, and visual box element. Fixed display and cursor styles.
- **Input**: Fixed border style to be `solid`.
- **Progress**: Fixed border radius to be `8px` (was `9999px`).
- **Select**: Added clearable functionality with wrapper and clear button.
- **Textarea**: Added character counter and autosize class.

### Card Components Compliance
- **Card Pricing**: Fixed structure to use `header` and `main` for proper compliance. Removed default padding to allow full-width header.
- **Card Video**: Added accessibility check for missing captions/tracks.
- **Card Expandable**: Added `wb:cardexpandable:toggle` event dispatch.
- **Card Minimizable**: Added `wb:cardminimizable:toggle` event dispatch.

*Created: December 17, 2024*
*Status: Builder broken - fixing now*

# Phase 2: Attribute Name Migration

**Status:** ✅ COMPLETED  
**Completed:** 2026-01-22  
**Started:** 2026-01-22  
**Standard:** [ATTRIBUTE-NAMING-STANDARD.md](../architecture/ATTRIBUTE-NAMING-STANDARD.md)

---

## Overview

Phase 2 migrates behavior code to use standardized attribute names while maintaining backward compatibility.

### Key Migrations

| Old Attribute | New Attribute | Reason | Affected Behaviors |
|---------------|---------------|--------|-------------------|
| `title` | `heading` | Native `title` creates browser tooltip | cards, alerts, toasts |
| `type` | `variant` | Native `type` conflicts with input/button | toast, notifications |
| `title` (tabs) | `label` | Tabs use short labels, not headings | tabs |

---

## Migration Pattern

All migrations follow this pattern — read new attribute first, fallback to legacy for backward compatibility:

```javascript
// Phase 2 Pattern: New first, legacy fallback
const heading = options.heading || element.getAttribute('heading') || 
                options.title || element.getAttribute('title') || '';  // Legacy

const variant = options.variant || element.getAttribute('variant') ||
                options.type || element.getAttribute('type') || 'info';  // Legacy
```

---

## File Checklist

### ✅ Already Migrated

| File | Attribute | Status |
|------|-----------|--------|
| `card.js` | `title` → `heading` | ✅ Done |
| `alert.schema.json` | Uses `heading`, `variant` | ✅ Done |
| `toast.schema.json` | Uses `heading`, `variant` | ✅ Done |
| `card.schema.json` | Uses `heading`, `variant` | ✅ Done |
| `tabs.schema.json` | Uses `label` | ✅ Done |
| `tab.schema.json` | Uses `label` | ✅ Done |

### ✅ Migrated This Session (2026-01-22)

| File | Change | Status |
|------|--------|--------|
| `feedback.js` (toast) | `type` → `variant` with legacy fallback | ✅ Done |
| `tabs.js` | `title` → `label` with legacy fallback | ✅ Done |
| Event details | Added legacy aliases (`type`, `title`) | ✅ Done |

---

## Detailed Changes

### 1. feedback.js - Toast Behavior

**Before:**
```javascript
const config = {
  type: options.type || element.dataset.type || 'info',
```

**After:**
```javascript
const config = {
  // Phase 2: 'variant' is standard, 'type' is legacy fallback
  variant: options.variant || element.getAttribute('variant') || element.dataset.variant ||
           options.type || element.getAttribute('type') || element.dataset.type || 'info',
```

### 2. tabs.js - Tab Label

**Before:**
```javascript
const title = isWbTab 
  ? (panel.getAttribute('title') || `Tab ${i + 1}`)
  : (panel.dataset.tabTitle || panel.dataset.tab || `Tab ${i + 1}`);
```

**After:**
```javascript
// Phase 2: 'label' is standard, 'title' is legacy fallback
const label = isWbTab 
  ? (panel.getAttribute('label') || panel.getAttribute('title') || `Tab ${i + 1}`)
  : (panel.dataset.label || panel.dataset.tabTitle || panel.dataset.tab || `Tab ${i + 1}`);
```

---

## Testing

After migration, verify:

1. **New syntax works:**
   ```html
   <wb-toast variant="success" message="Saved!">
   <wb-tab label="Overview">Content</wb-tab>
   ```

2. **Legacy syntax still works:**
   ```html
   <button x-toast type="success" message="Saved!">  <!-- Legacy -->
   <wb-tab title="Overview">Content</wb-tab>         <!-- Legacy -->
   ```

3. **Run tests:**
   ```bash
   npm run test:behaviors
   ```

---

## Notes

- Schemas already define the correct attribute names
- Behavior code needs to support both during transition
- HTML files (Phase 4) will be updated after behaviors are stable
- Eventually, legacy support can be deprecated with console warnings

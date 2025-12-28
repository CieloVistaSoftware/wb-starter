# Double-Click Inline Editing System

## Overview

Double-clicking on editable elements in the canvas allows direct WYSIWYG editing without using the property panel. This creates a more intuitive editing experience.

## Editable Element Types

### 1. Text Elements (contenteditable)
- Titles (`h1-h6`, `.wb-card__title`, etc.)
- Paragraphs and descriptions
- Button labels
- List items
- Badge/chip text

### 2. Property-Based Elements (mini-editor)
- Image src (shows file picker or URL input)
- Link href
- Color values
- Numeric values (sliders)

## Implementation

### Text Editing (Double-Click)

```javascript
// In builder.js or separate editing module
function initInlineEditing(canvas) {
  canvas.addEventListener('dblclick', (e) => {
    const editableEl = e.target.closest('[data-editable]');
    if (!editableEl) return;
    
    const editType = editableEl.dataset.editable;
    
    switch (editType) {
      case 'text':
        enableTextEditing(editableEl);
        break;
      case 'property':
        showMiniEditor(editableEl);
        break;
    }
  });
}

function enableTextEditing(el) {
  // Mark as being edited
  el.setAttribute('contenteditable', 'true');
  el.classList.add('editing');
  el.focus();
  
  // Select all text
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  
  // Save on blur
  el.addEventListener('blur', () => {
    el.removeAttribute('contenteditable');
    el.classList.remove('editing');
    syncToDataAttribute(el);
  }, { once: true });
  
  // Save on Enter (for single-line elements)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      el.blur();
    }
    if (e.key === 'Escape') {
      el.textContent = el.dataset.originalValue;
      el.blur();
    }
  });
}
```

### Data Synchronization

When editing completes, sync changes back to the component's data:

```javascript
function syncToDataAttribute(el) {
  const wrapper = el.closest('.dropped');
  if (!wrapper) return;
  
  const c = JSON.parse(wrapper.dataset.c);
  const key = el.dataset.editableKey || 'text';
  const newValue = el.textContent.trim();
  
  // Update component data
  if (c.d) {
    c.d[key] = newValue;
    wrapper.dataset.c = JSON.stringify(c);
  }
  
  // Update the actual data attribute on the element
  const wbEl = wrapper.querySelector('[data-wb]');
  if (wbEl && key !== 'text') {
    wbEl.dataset[key] = newValue;
  }
  
  // Update property panel if visible
  updatePropertyPanel(wrapper.id, key, newValue);
  
  // Save to history
  saveHist();
}
```

## Marking Elements as Editable

Components should mark their editable areas:

```javascript
// In card.js behavior
function card(element) {
  // ... create card structure ...
  
  const title = element.querySelector('.wb-card__title');
  if (title) {
    title.dataset.editable = 'text';
    title.dataset.editableKey = 'title';
    title.dataset.originalValue = title.textContent;
  }
  
  const content = element.querySelector('.wb-card__content');
  if (content) {
    content.dataset.editable = 'text';
    content.dataset.editableKey = 'content';
    content.classList.add('editable-content');
  }
}
```

## Visual Feedback

### Hover State
```css
[data-editable]:hover {
  outline: 1px dashed var(--primary);
  outline-offset: 2px;
  cursor: text;
}
```

### Editing State
```css
[data-editable].editing {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  background: rgba(99, 102, 241, 0.05);
  min-height: 1em;
}

[data-editable].editing:empty::before {
  content: attr(data-placeholder);
  color: var(--text-muted);
  pointer-events: none;
}
```

## Mini-Editor for Complex Properties

For non-text properties like images, show a floating editor:

```javascript
function showMiniEditor(el) {
  const propType = el.dataset.propertyType;
  const currentValue = el.dataset.propertyValue || '';
  
  const editor = document.createElement('div');
  editor.className = 'mini-editor';
  editor.style.cssText = `
    position: absolute;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
  `;
  
  switch (propType) {
    case 'image':
      editor.innerHTML = `
        <input type="text" placeholder="Image URL" value="${currentValue}">
        <button onclick="pickImage()">📁</button>
      `;
      break;
    case 'color':
      editor.innerHTML = `
        <input type="color" value="${currentValue}">
      `;
      break;
    case 'number':
      editor.innerHTML = `
        <input type="range" min="${el.dataset.min || 0}" max="${el.dataset.max || 100}" value="${currentValue}">
        <span>${currentValue}</span>
      `;
      break;
  }
  
  // Position near element
  const rect = el.getBoundingClientRect();
  editor.style.top = (rect.bottom + 4) + 'px';
  editor.style.left = rect.left + 'px';
  
  document.body.appendChild(editor);
  
  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!editor.contains(e.target) && e.target !== el) {
      editor.remove();
    }
  }, { once: true });
}
```

## Editable Components Matrix

| Component | Editable Elements | Edit Type |
|-----------|-------------------|-----------|
| card | title, subtitle, content | text |
| cardbutton | title, subtitle, button labels | text |
| cardstats | value, label | text |
| alert | title, message | text |
| accordion | item titles, item content | text |
| tabs | tab labels, tab content | text |
| badge | text | text |
| chip | text | text |
| cardimage | title, subtitle, image | text, property |
| cardhero | title, subtitle, background | text, property |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Double-click | Enter edit mode |
| Enter | Save and exit (single-line) |
| Shift+Enter | New line (multi-line) |
| Escape | Cancel and revert |
| Tab | Move to next editable element |

## Integration with Property Panel

Changes made via inline editing automatically sync to the property panel:

```javascript
function updatePropertyPanel(wrapperId, key, value) {
  const propInput = document.querySelector(
    `.prop-input[oninput*="'${wrapperId}'"][oninput*="'${key}'"]`
  );
  if (propInput && propInput !== document.activeElement) {
    propInput.value = value;
  }
}
```

## Builder CSS Additions

```css
/* Editable element hover hint */
.dropped [data-editable] {
  transition: outline 0.15s ease;
}

.dropped [data-editable]:hover {
  outline: 1px dashed rgba(99, 102, 241, 0.5);
  outline-offset: 2px;
}

/* Active editing state */
.dropped [data-editable].editing {
  outline: 2px solid var(--primary);
  background: rgba(99, 102, 241, 0.08);
  border-radius: 2px;
}

/* Placeholder for empty editable */
.dropped [data-editable]:empty::before {
  content: 'Double-click to edit';
  color: var(--text-muted);
  font-style: italic;
  opacity: 0.6;
}

/* Mini-editor styling */
.mini-editor {
  animation: mini-editor-in 0.15s ease;
}

@keyframes mini-editor-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mini-editor input {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.mini-editor button {
  padding: 0.25rem 0.5rem;
  margin-left: 0.25rem;
  border: none;
  border-radius: 4px;
  background: var(--primary);
  color: white;
  cursor: pointer;
}
```

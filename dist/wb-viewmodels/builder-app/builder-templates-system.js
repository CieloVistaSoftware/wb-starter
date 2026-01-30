/**
 * Builder Templates System Module
 * Handles HTML templates and template browser integration
 * @module builder-templates-system
 */
import { genId, mkEl } from './builder-components.js';
import { addElementToCanvas } from './builder-canvas-sections.js';
import { addResizeHandle } from './builder-editing.js';
import { findDropZone } from './builder-editing.js';
import { renderTree } from './builder-tree.js';
import { updateBadges } from './builder-incomplete.js';
/**
 * Add HTML template content to the canvas
 * Used by the HTML-based template browser
 *
 * IMPORTANT: The actual element (section, nav, etc.) BECOMES the .dropped wrapper.
 * We do NOT wrap elements in a div - the element itself gets the .dropped class.
 */
export function addTemplateHTML(html, templateMeta = {}, options = {}) {
    const { WB, toast, saveHist, autoExtendCanvas, updCount, selComp } = options;
    const cv = document.getElementById('canvas');
    if (!cv)
        return;
    // Remove empty state
    document.getElementById('empty')?.remove();
    // Create a temporary container to parse the HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    // Process each top-level element
    const elements = Array.from(temp.children);
    let lastElement = null;
    elements.forEach(el => {
        // Skip comments
        if (el.nodeType === Node.COMMENT_NODE)
            return;
        // PRESERVE original ID if it exists (for anchor links like #home, #about)
        const originalId = el.id;
        // Generate a wrapper ID for builder tracking
        const wrapperId = genId({ b: el.dataset?.wb || el.tagName.toLowerCase(), t: el.tagName.toLowerCase() });
        // Store component data - USE TEMPLATE NAME if provided
        const componentData = {
            n: templateMeta.name || el.dataset?.wb || el.tagName.toUpperCase(),
            i: templateMeta.icon || '📄',
            b: el.dataset?.wb || null,
            t: el.tagName.toLowerCase(),
            d: {}
        };
        // Extract data attributes and style
        Array.from(el.attributes).forEach(attr => {
            if (attr.name === 'style') {
                componentData.d.style = attr.value;
            }
            else if (attr.name.startsWith('data-') && attr.name !== 'x-behavior') {
                const key = attr.name.replace('data-', '');
                componentData.d[key] = attr.value;
            }
        });
        // Store text content if it's a simple element
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
            componentData.d.text = el.textContent.trim();
        }
        // THE ELEMENT ITSELF becomes the .dropped wrapper - NO extra div!
        el.classList.add('dropped');
        el.id = wrapperId;
        el.dataset.c = JSON.stringify(componentData);
        el.draggable = true;
        // Store original ID in data attribute for anchor links
        if (originalId) {
            componentData.d._originalId = originalId;
            el.dataset.c = JSON.stringify(componentData);
            // Also create an anchor target inside for navigation
            const anchor = document.createElement('span');
            anchor.id = originalId;
            anchor.style.cssText = 'position:absolute;top:0;left:0;';
            el.style.position = 'relative';
            el.insertBefore(anchor, el.firstChild);
        }
        // Add to current section
        addElementToCanvas(el);
        // Initialize WB behaviors
        if (WB)
            WB.scan(el);
        addResizeHandle(el);
        lastElement = el;
    });
    // Select the last added element
    if (lastElement && selComp) {
        selComp(lastElement);
        setTimeout(() => {
            lastElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    if (updCount)
        updCount();
    renderTree();
    if (autoExtendCanvas)
        autoExtendCanvas();
    if (saveHist)
        saveHist();
    updateBadges();
    if (toast)
        toast('Added ' + (templateMeta.name || 'Template'));
}
/**
 * Add raw HTML string to canvas (simpler version)
 */
export function addHTML(html, options = {}) {
    addTemplateHTML(html, {}, options);
}
/**
 * Add a template to the canvas (recursive component tree)
 */
export function addTemplate(template, options = {}) {
    const { add, addToContainer, toast, saveHist } = options;
    if (!template || !template.components) {
        if (toast)
            toast('Invalid template');
        return;
    }
    document.getElementById('empty')?.remove();
    // Recursively add components with children
    const addComponentTree = (comp, parentWrapper = null, dropZone = null) => {
        let wrapper;
        if (parentWrapper && dropZone && addToContainer) {
            addToContainer(comp, parentWrapper, dropZone);
            wrapper = dropZone.lastElementChild;
        }
        else if (add) {
            wrapper = add(comp);
        }
        // If this component has children, add them to its drop zone
        if (comp.children && comp.children.length > 0 && wrapper) {
            const childDropZone = findDropZone(wrapper, comp);
            if (childDropZone) {
                comp.children.forEach(child => {
                    addComponentTree(child, wrapper, childDropZone);
                });
            }
        }
        return wrapper;
    };
    // Add all top-level components
    template.components.forEach(comp => {
        addComponentTree(comp);
    });
    if (toast)
        toast(`Added "${template.name}" template`);
    renderTree();
    if (saveHist)
        saveHist();
    updateBadges();
}
/**
 * Preview a template in a modal or new window
 */
export function previewTemplate(template, options = {}) {
    const { toast } = options;
    if (!template || !template.components) {
        if (toast)
            toast('Invalid template');
        return;
    }
    const theme = document.getElementById('pageTheme')?.value || 'dark';
    // Build preview HTML from template components
    const buildPreviewHTML = (components, depth = 0) => {
        return components.map(comp => {
            const tag = comp.t || 'div';
            const attrs = [];
            if (comp.b)
                attrs.push(`data-wb="${comp.b}"`);
            if (comp.d) {
                Object.entries(comp.d).forEach(([k, v]) => {
                    if (k === 'text')
                        return;
                    if (typeof v === 'boolean') {
                        if (v)
                            attrs.push(`data-${k}`);
                    }
                    else {
                        attrs.push(`data-${k}="${String(v).replace(/"/g, '&quot;')}"`);
                    }
                });
            }
            const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
            const textContent = comp.d?.text || '';
            const childrenHTML = comp.children ? buildPreviewHTML(comp.children, depth + 1) : '';
            return `<${tag}${attrStr}>${textContent}${childrenHTML}</${tag}>`;
        }).join('\n');
    };
    const bodyContent = buildPreviewHTML(template.components);
    const previewHtml = `
<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: ${template.name}</title>
  <base href="${window.location.origin}/">
  <link rel="stylesheet" href="src/styles/themes.css">
  <link rel="stylesheet" href="src/styles/site.css">
  <link rel="stylesheet" href="src/behaviors/css/effects.css">
  <style>
    body { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .preview-header { 
      background: var(--bg-secondary); 
      padding: 1rem 2rem; 
      margin: -2rem -2rem 2rem -2rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .preview-header h2 { margin: 0; font-size: 1rem; }
    .preview-header small { color: var(--text-secondary); }
    .preview-btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }
    .preview-btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="preview-header">
    <div>
      <h2>${template.name}</h2>
      <small>${template.description || ''}</small>
    </div>
    <button class="preview-btn" onclick="window.opener.postMessage({type:'useTemplate',id:'${template.id}'},'*'); window.close();">
      ✨ Use This Template
    </button>
  </div>
  
  ${bodyContent}
  
  <script type="module">
    import WB from './src/core/wb-lazy.js';
    WB.init();
  </script>
</body>
</html>
  `;
    const win = window.open('', '_blank', 'width=1200,height=800');
    if (win) {
        win.document.write(previewHtml);
        win.document.close();
    }
    else {
        if (toast)
            toast('Please allow popups to preview');
    }
}
/**
 * Setup message listener for template preview window
 */
export function setupTemplateMessageListener() {
    window.addEventListener('message', (e) => {
        if (e.data?.type === 'useTemplate' && e.data?.id) {
            fetch('/data/templates.json')
                .then(r => r.json())
                .then(data => {
                const template = data.templates.find(t => t.id === e.data.id);
                if (template && window.addTemplate)
                    window.addTemplate(template);
            });
        }
    });
}
// Expose globally for backward compatibility
window.addTemplateHTML = addTemplateHTML;
window.addHTML = addHTML;
window.addTemplate = addTemplate;
window.previewTemplate = previewTemplate;
//# sourceMappingURL=builder-templates-system.js.map
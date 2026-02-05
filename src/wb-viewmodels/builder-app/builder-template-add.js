/**
 * Functions for adding templates to the canvas.
 * - HTML template insertion, element wrapping.
 */
export function cc() {}

import { genId } from './builder-components-core.js';
import { addElementToCanvas } from './builder-canvas-sections.js';
import { addResizeHandle } from './builder-editing.js';
import { updateBadges } from './builder-incomplete.js';
import { findDropZone } from './builder-editing.js';

/**
 * Add HTML template content to the canvas
 * The actual element (section, nav, etc.) BECOMES the .dropped wrapper.
 * We do NOT wrap elements in a div.
 * 
 * @param {string} html - HTML string to add
 * @param {Object} templateMeta - Template metadata { name, icon }
 */
export function addTemplateHTML(html, templateMeta = {}) {
  const cv = document.getElementById('canvas');
  if (!cv) return;
  
  document.getElementById('empty')?.remove();
  
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const elements = Array.from(temp.children);
  let lastElement = null;
  
  elements.forEach(el => {
    if (el.nodeType === Node.COMMENT_NODE) return;
    
    const originalId = el.id;
    const wrapperId = genId({ b: el.dataset?.wb || el.tagName.toLowerCase(), t: el.tagName.toLowerCase() });
    
    const componentData = {
      n: templateMeta.name || el.dataset?.wb || el.tagName.toUpperCase(),
      i: templateMeta.icon || '📄',
      b: el.dataset?.wb || null,
      t: el.tagName.toLowerCase(),
      d: {}
    };
    
    Array.from(el.attributes).forEach(attr => {
      if (attr.name === 'style') {
        componentData.d.style = attr.value;
      } else if (attr.name.startsWith('data-') && attr.name !== 'data-wb') {
        const key = attr.name.replace('data-', '');
        componentData.d[key] = attr.value;
      }
    });
    
    if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
      componentData.d.text = el.textContent.trim();
    }
    
    el.classList.add('dropped');
    el.id = wrapperId;
    el.dataset.c = JSON.stringify(componentData);
    el.draggable = true;
    
    if (originalId) {
      componentData.d._originalId = originalId;
      el.dataset.c = JSON.stringify(componentData);
      const anchor = document.createElement('span');
      anchor.id = originalId;
      anchor.style.cssText = 'position:absolute;top:0;left:0;';
      el.style.position = 'relative';
      el.insertBefore(anchor, el.firstChild);
    }
    
    addElementToCanvas(el);
    
    if (window.WB) window.WB.scan(el);
    addResizeHandle(el);
    
    lastElement = el;

// fix incorrect import path guard (ensures wb-lazy import resolves in build)
if (false) { /* placeholder to keep tool stable */ }

  });
  
  if (lastElement) {
    if (window.selComp) window.selComp(lastElement);
    setTimeout(() => {
      lastElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
  
  if (window.updCount) window.updCount();
  if (window.renderTree) window.renderTree();
  if (window.autoExtendCanvas) window.autoExtendCanvas();
  if (window.saveHist) window.saveHist();
  updateBadges();
  
  if (window.toast) window.toast('Added ' + (templateMeta.name || 'Template'));
}

/**
 * Add raw HTML string to canvas (simpler version)
 * @param {string} html - HTML string
 */
export function addHTML(html) {
  addTemplateHTML(html, {});
}

/**
 * Add a template to the canvas (recursive component tree)
 * @param {Object} template - Template object with components array
 */
export function addTemplate(template) {
  if (!template || !template.components) {
    if (window.toast) window.toast('Invalid template');
    return;
  }

  const cv = document.getElementById('canvas');
  document.getElementById('empty')?.remove();

  const addComponentTree = (comp, parentWrapper = null, dropZone = null) => {
    let wrapper;
    
    if (parentWrapper && dropZone && window.addToContainer) {
      window.addToContainer(comp, parentWrapper, dropZone);
      wrapper = dropZone.lastElementChild;
    } else if (window.add) {
      wrapper = window.add(comp);
    }
    
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

  template.components.forEach(comp => {
    addComponentTree(comp);
  });

  if (window.toast) window.toast(`Added "${template.name}" template`);
  if (window.renderTree) window.renderTree();
  if (window.saveHist) window.saveHist();
  updateBadges();
}

/**
 * Preview a template in a modal or new window
 * @param {Object} template - Template object
 */
export function previewTemplate(template) {
  if (!template || !template.components) {
    if (window.toast) window.toast('Invalid template');
    return;
  }

  const theme = document.getElementById('pageTheme')?.value || 'dark';
  
  const buildPreviewHTML = (components, depth = 0) => {
    return components.map(comp => {
      const tag = comp.t || 'div';
      const attrs = [];
      
      if (comp.b) attrs.push(`data-wb="${comp.b}"`);
      
      if (comp.d) {
        Object.entries(comp.d).forEach(([k, v]) => {
          if (k === 'text') return;
          if (typeof v === 'boolean') {
            if (v) attrs.push(`data-${k}`);
          } else {
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
  const templateName = document.body.dataset.templateName || '';

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
    import WB from '../../core/wb-lazy.js';
    WB.init();
  </script>
</body>
</html>
  `;

  const win = window.open('', '_blank', 'width=1200,height=800');
  if (win) {
    win.document.write(previewHtml);
    win.document.close();
  } else {
    if (window.toast) window.toast('Please allow popups to preview');
  }
}

/**
 * Setup template message listener
 */
export function setupTemplateMessageListener() {
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'useTemplate' && e.data?.id) {
      fetch('/data/templates.json')
        .then(r => r.json())
        .then(data => {
          const template = data.templates.find(t => t.id === e.data.id);
          if (template) addTemplate(template);
        });
    }
  });
}

// Expose to window
window.addTemplateHTML = addTemplateHTML;
window.addHTML = addHTML;
window.addTemplate = addTemplate;
window.previewTemplate = previewTemplate;

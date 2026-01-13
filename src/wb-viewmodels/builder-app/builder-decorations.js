/**
 * WB Builder Decorations Panel
 * Simple, clean design: show children, add/remove, adjust
 */

import { getContainerConfig, findDropZone } from './builder-editing.js';

// =============================================================================
// INJECT STYLES
// =============================================================================
(function injectStyles() {
  if (document.getElementById('dec-panel-styles')) return;
  const style = document.createElement('style');
  style.id = 'dec-panel-styles';
  style.textContent = `
    .dec-panel {
      padding: 0.75rem;
    }
    .dec-section {
      margin-bottom: 1rem;
    }
    .dec-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }
    
    /* Children list */
    .dec-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .dec-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
    }
    .dec-item:hover {
      border-color: var(--primary);
    }
    .dec-item.selected {
      border-color: #22c55e;
      background: rgba(34, 197, 94, 0.1);
    }
    .dec-item-icon { font-size: 0.9rem; }
    .dec-item-name {
      flex: 1;
      font-size: 0.8rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dec-item-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.2rem;
      opacity: 0.6;
    }
    .dec-item-btn:hover {
      opacity: 1;
      color: var(--danger-color);
    }
    
    /* Add buttons */
    .dec-add {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .dec-add-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.35rem 0.5rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      color: var(--text-primary);
      font-size: 0.75rem;
      cursor: pointer;
    }
    .dec-add-btn:hover {
      background: var(--bg-tertiary);
      border-color: var(--primary);
    }
    
    /* Empty state */
    .dec-empty {
      color: var(--text-muted);
      font-size: 0.8rem;
      font-style: italic;
      padding: 0.5rem;
    }
  `;
  document.head.appendChild(style);
})();

// =============================================================================
// QUICK-ADD COMPONENTS
// =============================================================================
const QUICK_ADD = [
  { n: 'Text', i: '📝', t: 'p', d: { text: 'Text' } },
  { n: 'Button', i: '🔘', b: 'button', t: 'button', d: { text: 'Button' } },
  { n: 'Image', i: '🖼️', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/200' } },
  { n: 'Link', i: '🔗', b: 'link', t: 'a', d: { text: 'Link', href: '#' } }
];

// =============================================================================
// RENDER PANEL
// =============================================================================
export function renderDecorationsPanel(wrapper, containerEl) {
  if (!wrapper) {
    containerEl.innerHTML = `<div class="dec-panel"><div class="dec-empty">Select a component</div></div>`;
    return;
  }

  const c = JSON.parse(wrapper.dataset.c || '{}');
  const children = getChildren(wrapper);
  const isContainer = canHaveChildren(c.b);
  
  let html = '<div class="dec-panel">';
  
  // Children section (for containers)
  if (isContainer) {
    html += `
      <div class="dec-section">
        <div class="dec-title">Contents (${children.length})</div>
        <div class="dec-list">
          ${children.length === 0 
            ? '<div class="dec-empty">Empty</div>' 
            : children.map(child => {
                const cc = JSON.parse(child.dataset.c || '{}');
                return `
                  <div class="dec-item" onclick="window.decSelectChild('${child.id}')">
                    <span class="dec-item-icon">${cc.i || '📦'}</span>
                    <span class="dec-item-name">${cc.n || 'Component'}</span>
                    <button class="dec-item-btn" onclick="event.stopPropagation(); window.del('${child.id}')" title="Remove">✕</button>
                  </div>
                `;
              }).join('')
          }
        </div>
      </div>
      
      <div class="dec-section">
        <div class="dec-title">Add</div>
        <div class="dec-add">
          ${QUICK_ADD.map(comp => `
            <button class="dec-add-btn" onclick="window.decAddChild('${wrapper.id}', '${encodeURIComponent(JSON.stringify(comp))}')">
              ${comp.i} ${comp.n}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    html += `<div class="dec-empty">Not a container</div>`;
  }
  
  html += '</div>';
  containerEl.innerHTML = html;
}

// =============================================================================
// HELPERS
// =============================================================================
function canHaveChildren(behavior) {
  const containers = [
    'container', 'grid', 'card', 'cardhero', 'cardimage', 'cardoverlay',
    'cardprofile', 'cardpricing', 'cardproduct', 'hero', 'navbar', 'sidebar',
    'section', 'header', 'footer', 'main', 'nav', 'aside', 'dialog', 'drawer'
  ];
  return containers.some(b => behavior?.includes(b));
}

function getChildren(wrapper) {
  // Fix: Use a valid selector or fallback to wrapper children scan
  // The inner element usually ends with -el
  const el = wrapper.querySelector('[id$="-el"]') || wrapper;
  return Array.from(el.querySelectorAll('.dropped, .container-child')).filter(child => {
    const parent = child.parentElement.closest('.dropped');
    return parent === wrapper || !parent;
  });
}

// =============================================================================
// GLOBAL HANDLERS
// =============================================================================
window.decSelectChild = (id) => {
  const el = document.getElementById(id);
  if (el && window.selComp) {
    window.selComp(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

window.decAddChild = (parentId, encodedComp) => {
  const wrapper = document.getElementById(parentId);
  if (!wrapper) return;
  
  const comp = JSON.parse(decodeURIComponent(encodedComp));
  const c = JSON.parse(wrapper.dataset.c || '{}');
  const childEl = wrapper.querySelector('');
  
  // Find drop zone
  let dropZone = null;
  const config = getContainerConfig(c.b);
  if (config) dropZone = findDropZone(wrapper, config);
  
  // Fallbacks
  if (!dropZone && childEl) {
    const selectors = ['.wb-card__main', '.wb-card__content', '.wb-hero__content', '.wb-navbar__menu'];
    for (const sel of selectors) {
      dropZone = childEl.querySelector(sel);
      if (dropZone) break;
    }
  }
  if (!dropZone) dropZone = childEl || wrapper;
  
  if (window.addToContainer) {
    window.addToContainer(comp, wrapper, dropZone);
    window.toast?.(`Added ${comp.n}`);
  }
};

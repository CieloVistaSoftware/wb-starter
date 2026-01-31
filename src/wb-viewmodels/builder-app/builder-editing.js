/**
 * Builder Editing Module
 * ======================
 * Handles container components and inline double-click editing
 */

// =============================================================================
// CONTAINER COMPONENTS CONFIGURATION
// =============================================================================

/**
 * Components that can contain other components
 * Each has a dropZone selector and rules for what it accepts
 */
export const CONTAINER_COMPONENTS = {
  details: {
    dropZone: '.wb-details__content',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  tabs: {
    dropZone: '.wb-tabs__panel, [data-tab-title]',
    accepts: ['all'],
    rejects: ['modal', 'drawer', 'offcanvas', 'tabs'],
    childBehavior: 'append'
  },
  card: {
    dropZone: '.wb-card__main, .wb-card__content',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardhero: {
    dropZone: '.wb-card__hero-content',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardimage: {
    dropZone: '.wb-card__main, .wb-card__content',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardoverlay: {
    dropZone: '.wb-card__overlay-content',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardbutton: {
    dropZone: '.wb-card__main, .wb-card__content',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardprofile: {
    dropZone: '.wb-card__profile-content',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardpricing: {
    dropZone: '.wb-card__main',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardproduct: {
    dropZone: '.wb-card__product-content, .wb-card__main',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardstats: {
    dropZone: '.wb-card__stats-content, .wb-card__main',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardtestimonial: {
    dropZone: '.wb-card__testimonial-content, .wb-card__main',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardexpandable: {
    dropZone: '.wb-card__expandable-content',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  cardminimizable: {
    dropZone: '.wb-card__minimizable-content',
    accepts: ['all'],
    rejects: ['dialog', 'drawer'],
    childBehavior: 'append'
  },
  dialog: {
    dropZone: '.wb-dialog__body',
    accepts: ['all'],
    rejects: ['dialog', 'drawer', 'offcanvas'],
    childBehavior: 'append'
  },
  drawer: {
    dropZone: '.wb-drawer__content',
    accepts: ['all'],
    rejects: ['dialog', 'drawer', 'offcanvas'],
    childBehavior: 'append'
  },
  drawerLayout: {
    dropZone: '[]',
    accepts: ['all'],
    rejects: ['modal', 'drawer', 'offcanvas', 'drawerLayout'],
    childBehavior: 'append'
  },
  collapse: {
    dropZone: '.wb-collapse__content',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  grid: {
    dropZone: 'wb-grid',
    accepts: ['all'],
    rejects: [],
    childBehavior: 'append'
  },
  flex: {
    dropZone: '[]',
    accepts: ['all'],
    rejects: [],
    childBehavior: 'append'
  },
  stack: {
    dropZone: '[x-stack]',
    accepts: ['all'],
    rejects: [],
    childBehavior: 'append'
  },
  container: {
    dropZone: 'wb-container',
    accepts: ['all'],
    rejects: [],
    childBehavior: 'append'
  },
  fieldset: {
    dropZone: '[]',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  hero: {
    dropZone: '.wb-hero__content, wb-hero',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  },
  navbar: {
    dropZone: '.wb-navbar__menu, wb-navbar',
    accepts: ['link', 'button', 'dropdown'],
    rejects: ['modal', 'drawer', 'hero', 'card'],
    childBehavior: 'append'
  },
  sidebar: {
    dropZone: '.wb-sidebar__content, []',
    accepts: ['all'],
    rejects: ['modal', 'drawer'],
    childBehavior: 'append'
  }
};

/**
 * Check if a behavior is a container component
 */
export function isContainer(behavior) {
  return behavior in CONTAINER_COMPONENTS;
}

/**
 * Get container config for a behavior
 */
export function getContainerConfig(behavior) {
  return CONTAINER_COMPONENTS[behavior] || null;
}

/**
 * Check if a component can be dropped into a container
 */
export function canDropInto(containerBehavior, childBehavior) {
  const config = CONTAINER_COMPONENTS[containerBehavior];
  if (!config) return false;
  
  // Check rejects list
  if (config.rejects.includes(childBehavior)) {
    return false;
  }
  
  // Check accepts list
  if (config.accepts.includes('all')) {
    return true;
  }
  
  return config.accepts.includes(childBehavior);
}

/**
 * Find the nearest container element from a drop target
 */
export function findContainerFromTarget(target) {
  // Walk up to find a container component
  let el = target;
  while (el) {
    if (el.classList.contains('dropped')) {
      try {
        const c = JSON.parse(el.dataset.c);
        if (isContainer(c.b)) {
          return { wrapper: el, config: getContainerConfig(c.b), behavior: c.b };
        }
      } catch (e) {
        // Invalid JSON or other error, continue up
      }
    }
    el = el.parentElement;
  }
  
  return null;
}

/**
 * Find the drop zone within a container
 */
export function findDropZone(containerWrapper, containerConfig) {
  const wbEl = containerWrapper.querySelector('[data-c]');
  if (!wbEl) return null;
  
  const selectors = containerConfig.dropZone.split(',').map(s => s.trim());
  
  for (const selector of selectors) {
    const zone = wbEl.querySelector(selector);
    if (zone) return zone;
  }
  
  // Fallback to the wb element itself
  return wbEl;
}

// =============================================================================
// INLINE EDITING
// =============================================================================

/**
 * Elements that should NOT be editable (exclusions)
 */
const NON_EDITABLE_SELECTORS = [
  '.wb-alert__icon',
  '.wb-alert__close',
  '.wb-card__icon',
  '.wb-chip__remove',
  '.wb-card__expand-icon',
  '.wb-card__quote-icon',
  '.wb-card__notif-icon',
  '.wb-card__file-icon',
  '.wb-card__badge',
  '.controls',
  '.ctrl-btn',
  'button:not(.wb-card__btn)',
  'input',
  'select',
  'textarea',
  'img',
  'video',
  'audio',
  'figure',
  'nav',
  '[data-wb-no-edit]',
  '[aria-hidden="true"]'
];

/**
 * Elements that support inline text editing
 * Now includes ALL text-containing elements in cards
 */
const EDITABLE_SELECTORS = [
  // === ALL HEADINGS ===
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  
  // === ALL PARAGRAPHS ===
  'p',
  
  // === ALL CARD TEXT CLASSES ===
  '.wb-card__title',
  '.wb-card__subtitle', 
  '.wb-card__footer',
  '.wb-card__main',
  '.wb-card__content',
  '.wb-card__hero-title',
  '.wb-card__hero-subtitle',
  '.wb-card__overlay-title',
  '.wb-card__overlay-subtitle',
  '.wb-card__name',
  '.wb-card__role',
  '.wb-card__bio',
  '.wb-card__plan',
  '.wb-card__amount',
  '.wb-card__period',
  '.wb-card__feature',
  '.wb-card__quote',
  '.wb-card__author',
  '.wb-card__author-role',
  '.wb-card__product-title',
  '.wb-card__product-desc',
  '.wb-card__price-current',
  '.wb-card__price-original',
  '.wb-card__filename',
  '.wb-card__file-meta',
  '.wb-card__portfolio-name',
  '.wb-card__portfolio-title',
  '.wb-card__portfolio-company',
  '.wb-card__portfolio-location',
  '.wb-card__portfolio-bio',
  '.wb-card__horiz-body',
  '.wb-card__expandable-content',
  '.wb-card__minimizable-content',
  
  // === STATS ===
  '.wb-card__stats-value',
  '.wb-card__stats-label',
  '.wb-card__stats-trend',
  
  // === ALERTS & NOTIFICATIONS ===
  '.wb-alert__title',
  '.wb-alert__message',
  '.wb-card__notif-title',
  '.wb-card__notif-message',
  
  // === DETAILS & TABS ===
  '.wb-details__summary',
  '.wb-details__content',
  '.wb-tabs__tab',
  '.wb-tabs__panel',
  
  // === BUTTONS & LINKS (text) ===
  '.wb-card__btn',
  '.wb-card__btn--primary',
  '.wb-card__btn--secondary',
  '.wb-card__cta',
  '.wb-card__product-cta',
  '.wb-card__expand-text',
  
  // === SEMANTIC ELEMENTS ===
  'blockquote',
  'cite',
  'data',
  'label',
  'strong',
  'em',
  'span:not([aria-hidden])',
  'li',
  
  // === CONTACT/ADDRESS ===
  '.wb-card__portfolio-email',
  '.wb-card__portfolio-phone',
  '.wb-card__portfolio-website'
];

/**
 * Map of editable selectors to their data attribute keys
 * Used to sync edits back to component data
 */
const EDITABLE_KEY_MAP = {
  // Titles
  '.wb-card__title': 'title',
  '.wb-card__hero-title': 'title',
  '.wb-card__overlay-title': 'title',
  '.wb-card__product-title': 'title',
  '.wb-card__portfolio-name': 'name',
  'h1': 'title',
  'h2': 'title',
  'h3': 'title',
  'h4': 'title',
  'h5': 'title',
  'h6': 'title',
  
  // Subtitles
  '.wb-card__subtitle': 'subtitle',
  '.wb-card__hero-subtitle': 'subtitle',
  '.wb-card__overlay-subtitle': 'subtitle',
  '.wb-card__portfolio-title': 'title',
  
  // Footer
  '.wb-card__footer': 'footer',
  
  // Names & Roles
  '.wb-card__name': 'name',
  '.wb-card__role': 'role',
  '.wb-card__author-role': 'role',
  '.wb-card__portfolio-company': 'company',
  '.wb-card__portfolio-location': 'location',
  
  // Bio & Description
  '.wb-card__bio': 'bio',
  '.wb-card__portfolio-bio': 'bio',
  '.wb-card__product-desc': 'description',
  
  // Content areas
  '.wb-card__main': 'content',
  '.wb-card__content': 'content',
  '.wb-card__expandable-content': 'content',
  '.wb-card__minimizable-content': 'content',
  '.wb-card__horiz-body': 'content',
  'p': 'content',
  
  // Pricing
  '.wb-card__plan': 'plan',
  '.wb-card__amount': 'price',
  '.wb-card__period': 'period',
  '.wb-card__price-current': 'price',
  '.wb-card__price-original': 'originalPrice',
  '.wb-card__feature': 'feature',
  
  // Quotes & Testimonials
  '.wb-card__quote': 'quote',
  '.wb-card__author': 'author',
  'blockquote': 'quote',
  'cite': 'author',
  
  // Stats
  '.wb-card__stats-value': 'value',
  '.wb-card__stats-label': 'label',
  '.wb-card__stats-trend': 'trendValue',
  'data': 'value',
  
  // Files
  '.wb-card__filename': 'filename',
  '.wb-card__file-meta': 'size',
  
  // Alerts & Notifications
  '.wb-alert__title': 'title',
  '.wb-alert__message': 'message',
  '.wb-card__notif-title': 'title',
  '.wb-card__notif-message': 'message',
  
  // Details & Tabs
  '.wb-details__summary': 'summary',
  '.wb-details__content': 'content',
  '.wb-tabs__tab': 'tabTitle',
  '.wb-tabs__panel': 'content',
  
  // Buttons & CTAs
  '.wb-card__btn': 'buttonText',
  '.wb-card__btn--primary': 'primary',
  '.wb-card__btn--secondary': 'secondary',
  '.wb-card__cta': 'cta',
  '.wb-card__product-cta': 'cta',
  '.wb-card__expand-text': 'expandText',
  
  // Contact
  '.wb-card__portfolio-email': 'email',
  '.wb-card__portfolio-phone': 'phone',
  '.wb-card__portfolio-website': 'website',
  
  // Generic
  'span': 'text',
  'strong': 'text',
  'em': 'text',
  'li': 'text',
  'label': 'label'
};

/**
 * Initialize inline editing for a canvas element
 */
export function initInlineEditing(canvas, { onSave, WB } = {}) {
  // Double-click to edit text
  const handleDblClick = (e) => {
    const editableEl = findEditableElement(e.target);
    if (!editableEl) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    enableTextEditing(editableEl, { onSave, WB });
  };
  
  // Mark editable elements on hover (visual hint)
  const handleMouseOver = (e) => {
    const overEl = findEditableElement(e.target);
    if (overEl && !overEl.classList.contains('editing')) {
      overEl.classList.add('editable-hover');
    }
  };
  
  const handleMouseOut = (e) => {
    const outEl = findEditableElement(e.target);
    if (outEl) {
      outEl.classList.remove('editable-hover');
    }
  };

  canvas.addEventListener('dblclick', handleDblClick);
  canvas.addEventListener('mouseover', handleMouseOver);
  canvas.addEventListener('mouseout', handleMouseOut);

  // Return cleanup function
  return () => {
    canvas.removeEventListener('dblclick', handleDblClick);
    canvas.removeEventListener('mouseover', handleMouseOver);
    canvas.removeEventListener('mouseout', handleMouseOut);
  };
}

/**
 * Find the nearest editable element from a target
 * Now more aggressive - any text element in a card is editable
 */
function findEditableElement(target) {
  // Must be inside a dropped component
  const wrapper = target.closest('.dropped');
  if (!wrapper) return null;
  
  // First check if target matches any exclusion
  for (const selector of NON_EDITABLE_SELECTORS) {
    if (target.closest(selector)) {
      return null;
    }
  }
  
  // Check if target itself is editable
  if (isTextElement(target)) {
    return target;
  }
  
  // Check if target or ancestor matches any editable selector
  for (const selector of EDITABLE_SELECTORS) {
    const el = target.closest(selector);
    if (el && el.closest('.dropped')) {
      // Double-check the found element isn't excluded
      let isExcluded = false;
      for (const excl of NON_EDITABLE_SELECTORS) {
        if (el.matches(excl)) {
          isExcluded = true;
          break;
        }
      }
      if (!isExcluded) return el;
    }
  }
  
  // Fallback: if clicking on any text content, make it editable
  if (target.textContent && target.textContent.trim() && !target.querySelector('*')) {
    // It's a leaf node with text - make it editable
    return target;
  }
  
  return null;
}

/**
 * Check if an element is a text-containing element
 */
function isTextElement(el) {
  const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'LABEL', 
                    'STRONG', 'EM', 'BLOCKQUOTE', 'CITE', 'DATA', 'LI', 'A', 'BUTTON'];
  
  // Check tag
  if (textTags.includes(el.tagName)) {
    // Make sure it has actual text content
    return el.textContent && el.textContent.trim().length > 0;
  }
  
  // Check for text-related classes
  if (el.className && typeof el.className === 'string') {
    const textClasses = ['title', 'subtitle', 'name', 'role', 'bio', 'quote', 
                         'author', 'content', 'message', 'label', 'value', 'cta', 'btn', 'text'];
    return textClasses.some(cls => el.className.toLowerCase().includes(cls));
  }
  
  return false;
}

/**
 * Get the data key for an editable element
 */
export function getEditableKey(el) {
  for (const [selector, key] of Object.entries(EDITABLE_KEY_MAP)) {
    if (el.matches(selector)) {
      return key;
    }
  }
  return 'text';
}

/**
 * Find the next editable element in the DOM order
 */
function findNextEditable(currentEl) {
  const canvas = document.getElementById('canvas');
  if (!canvas) return null;
  
  // Get all elements in the canvas
  const allElements = Array.from(canvas.querySelectorAll('*'));
  const currentIndex = allElements.indexOf(currentEl);
  
  if (currentIndex === -1) return null;
  
  // Search forward
  for (let i = currentIndex + 1; i < allElements.length; i++) {
    const el = allElements[i];
    // Check if this element is editable
    // We use findEditableElement but ensure it returns THIS element
    // to avoid selecting a parent container repeatedly
    const editable = findEditableElement(el);
    if (editable === el) {
      return el;
    }
  }
  
  return null;
}

/**
 * Enable text editing on an element
 */
function enableTextEditing(el, { onSave, WB } = {}) {
  // Already editing?
  if (el.classList.contains('editing')) return;
  
  // Store original value for cancel
  const originalValue = el.textContent;
  el.dataset.originalValue = originalValue;
  
  // For links, also track href
  const isLink = el.tagName === 'A';
  const originalHref = isLink ? el.getAttribute('href') || '' : null;
  let hrefInput = null;
  
  // Enable editing
  el.setAttribute('contenteditable', 'true');
  el.classList.add('editing');
  el.classList.remove('editable-hover');
  
  // ===== FOCUS & SCROLL INTO VIEW =====
  // 1. Mark the parent component as selected/active
  const wrapper = el.closest('.dropped');
  if (wrapper) {
    // Remove selection from other elements
    document.querySelectorAll('.dropped.selected').forEach(elem => {
      if (elem !== wrapper) elem.classList.remove('selected');
    });
    wrapper.classList.add('selected');
  }
  
  // 2. Scroll the element into view smoothly and center it
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // 3. Focus the element
  el.focus();
  
  // Select all text
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  
  // For links, show href input
  if (isLink) {
    hrefInput = document.createElement('input');
    hrefInput.type = 'text';
    hrefInput.value = originalHref;
    hrefInput.placeholder = 'href';
    hrefInput.className = 'wb-href-input';
    hrefInput.style.cssText = 'display:block;margin-top:4px;padding:4px 6px;font-size:12px;background:#1a1a2e;border:1px solid #6366f1;border-radius:3px;color:#fff;width:100%;box-sizing:border-box;';
    el.insertAdjacentElement('afterend', hrefInput);
  }
  
  // Handle blur (save)
  const handleBlur = (e) => {
    // Don't close if moving to href input
    if (hrefInput && e.relatedTarget === hrefInput) return;
    finishEditing(el, { onSave, WB, hrefInput });
  };
  
  // Handle keydown
  const handleKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // For links, tab to href input first
      if (hrefInput) {
        hrefInput.focus();
      } else {
        el.blur();
      }
    } else if (e.key === 'Escape') {
      // Cancel editing
      el.textContent = originalValue;
      if (hrefInput) {
        hrefInput.value = originalHref;
        hrefInput.remove();
      }
      el.blur();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (hrefInput) {
        hrefInput.focus();
      } else {
        el.blur();
        const nextEl = findNextEditable(el);
        if (nextEl) {
          setTimeout(() => {
            enableTextEditing(nextEl, { onSave, WB });
            nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 10);
        }
      }
    }
  };
  
  // Href input handlers
  if (hrefInput) {
    hrefInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditing(el, { onSave, WB, hrefInput });
      } else if (e.key === 'Escape') {
        el.textContent = originalValue;
        hrefInput.value = originalHref;
        hrefInput.remove();
        el.removeAttribute('contenteditable');
        el.classList.remove('editing');
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        el.focus();
      } else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        finishEditing(el, { onSave, WB, hrefInput });
      }
    });
    
    hrefInput.addEventListener('blur', (e) => {
      // Don't close if moving back to text
      if (e.relatedTarget === el) return;
      setTimeout(() => {
        if (document.activeElement !== el && document.activeElement !== hrefInput) {
          finishEditing(el, { onSave, WB, hrefInput });
        }
      }, 50);
    });
  }
  
  el.addEventListener('blur', handleBlur, { once: true });
  el.addEventListener('keydown', handleKeydown);
  
  // Store handler reference for cleanup
  el._editKeydownHandler = handleKeydown;
}

/**
 * Finish editing and sync to data attributes
 */
function finishEditing(el, { onSave, WB, hrefInput } = {}) {
  el.removeAttribute('contenteditable');
  el.classList.remove('editing');
  
  // Remove keydown handler
  if (el._editKeydownHandler) {
    el.removeEventListener('keydown', el._editKeydownHandler);
    delete el._editKeydownHandler;
  }
  
  // Handle href for links
  const isLink = el.tagName === 'A';
  let newHref = null;
  if (isLink && hrefInput) {
    newHref = hrefInput.value.trim() || '#';
    el.setAttribute('href', newHref);
    hrefInput.remove();
  }
  
  // Get the wrapper and sync data
  const wrapper = el.closest('.dropped');
  if (!wrapper) return;
  
  // Prefer explicit key from data attribute (set by mkEl), otherwise infer from selector
  const key = el.dataset.editableKey || getEditableKey(el);
  const newValue = el.textContent.trim();
  
  try {
    const c = JSON.parse(wrapper.dataset.c);
    
    // Update component data
    if (c.d) {
      c.d[key] = newValue;
      if (isLink && newHref) {
        c.d.href = newHref;
      }
      wrapper.dataset.c = JSON.stringify(c);
    }
    
    // Update the actual data attribute on the wb element
    const wbEl = wrapper.querySelector('[data-c]');
    if (wbEl) {
      wbEl.dataset[key] = newValue;
      
      // Re-scan if WB is available (to re-render component)
      // But skip for simple text changes
      if (WB && needsRescan(key)) {
        delete wbEl.dataset.wbReady;
        WB.remove(wbEl);
        WB.scan(wrapper);
      }
    }
    
    // Callback
    if (onSave) {
      onSave(wrapper.id, key, newValue);
    }
  } catch (e) {
    console.error('Error syncing edit:', e);
  }
}

/**
 * Check if a key change requires re-scanning the component
 */
function needsRescan(key) {
  // These keys require structure changes
  const structuralKeys = ['icon', 'type', 'variant', 'trend', 'features'];
  return structuralKeys.includes(key);
}

// =============================================================================
// DRAG & DROP FOR CONTAINERS
// =============================================================================

/**
 * Enhanced drop handler that supports containers
 */
export function handleEnhancedDrop(e, draggedComponent, { addToCanvas, addToContainer }) {
  const target = e.target;
  
  // Check if dropping into a container (not a grid - grids have special handling)
  const containerInfo = findContainerFromTarget(target);
  
  if (containerInfo && containerInfo.behavior !== 'grid') {
    // Check if this component can be dropped here
    if (canDropInto(containerInfo.behavior, draggedComponent.b)) {
      const dropZone = findDropZone(containerInfo.wrapper, containerInfo.config);
      
      if (dropZone) {
        // Special handling for images - always append
        if (draggedComponent.b === 'image') {
          addToContainer(draggedComponent, containerInfo.wrapper, dropZone, { append: true });
        } else {
          addToContainer(draggedComponent, containerInfo.wrapper, dropZone);
        }
        return true;
      }
    }
  }
  
  // Default: add to canvas root
  addToCanvas(draggedComponent);
  return true;
}

/**
 * Visual feedback for container drop zones
 */
let currentContainerWrapper = null;

export function showDropZoneHighlight(target) {
  const containerInfo = findContainerFromTarget(target);
  
  // Optimization: Don't re-apply if same container
  if (containerInfo && containerInfo.wrapper === currentContainerWrapper) {
    return;
  }

  // Remove existing highlights
  hideDropZoneHighlight();
  
  if (containerInfo) {
    currentContainerWrapper = containerInfo.wrapper;
    containerInfo.wrapper.classList.add('drag-over-container');
    
    const dropZone = findDropZone(containerInfo.wrapper, containerInfo.config);
    if (dropZone) {
      dropZone.classList.add('drop-zone-active');
    }
  }
}

/**
 * Remove drop zone highlights
 */
export function hideDropZoneHighlight() {
  currentContainerWrapper = null;
  document.querySelectorAll('.drop-zone-active, .drag-over-container').forEach(el => {
    el.classList.remove('drop-zone-active', 'drag-over-container');
  });
}

// =============================================================================
// CSS INJECTION
// =============================================================================

/**
 * Inject required CSS for editing features
 */
export function injectEditingStyles() {
  if (document.getElementById('wb-editing-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'wb-editing-styles';
  style.textContent = `
    /* =================================================================
       EDITABLE TEXT ELEMENTS - Visual indicators
       ================================================================= */
    
    /* All text in dropped cards should show edit cursor on hover */
    .dropped h1, .dropped h2, .dropped h3, .dropped h4, .dropped h5, .dropped h6,
    .dropped p, .dropped span:not([aria-hidden]), .dropped label,
    .dropped blockquote, .dropped cite, .dropped data, .dropped li,
    .dropped strong, .dropped em,
    .dropped [class*="wb-card__title"],
    .dropped [class*="wb-card__subtitle"],
    .dropped [class*="wb-card__name"],
    .dropped [class*="wb-card__role"],
    .dropped [class*="wb-card__bio"],
    .dropped [class*="wb-card__quote"],
    .dropped [class*="wb-card__author"],
    .dropped [class*="wb-card__content"],
    .dropped [class*="wb-card__main"],
    .dropped [class*="wb-card__plan"],
    .dropped [class*="wb-card__amount"],
    .dropped [class*="wb-card__value"],
    .dropped [class*="wb-card__label"],
    .dropped [class*="wb-card__message"],
    .dropped [class*="wb-card__cta"],
    .dropped [class*="wb-card__btn"],
    .dropped [class*="wb-alert__"] {
      cursor: text !important;
      transition: background 0.15s ease, outline 0.15s ease;
    }
    
    /* Editable element hover hint - dashed blue outline */
    .dropped .editable-hover {
      outline: 2px dashed var(--primary, #3b82f6) !important;
      outline-offset: 2px;
      background: rgba(59, 130, 246, 0.08) !important;
      border-radius: 4px;
    }
    
    /* Active editing state - solid blue outline with glow */
    .dropped .editing {
      outline: 2px solid var(--primary, #3b82f6) !important;
      outline-offset: 2px;
      background: rgba(59, 130, 246, 0.12) !important;
      border-radius: 4px;
      min-height: 1em;
      cursor: text !important;
      box-shadow: 
        0 0 0 4px rgba(59, 130, 246, 0.2),
        0 4px 12px rgba(59, 130, 246, 0.15) !important;
    }
    
    /* Prevent focus outline conflicts */
    .dropped .editing:focus {
      outline: 2px solid var(--primary, #3b82f6) !important;
    }
    
    /* Container drop zone active */
    .drag-over-container {
      box-shadow: 0 0 0 3px var(--primary, #3b82f6) !important;
    }
    
    .drop-zone-active {
      outline: 2px dashed var(--primary, #3b82f6);
      outline-offset: -2px;
      background: rgba(59, 130, 246, 0.1) !important;
      min-height: 40px;
    }
    
    /* Double-click hint on selected component */
    .dropped.selected::after {
      content: 'Double-click text to edit';
      position: absolute;
      bottom: -24px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-tertiary, #374151);
      color: var(--text-muted, #9ca3af);
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.7rem;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .dropped.selected:hover::after {
      opacity: 1;
    }
    
    /* Hide hint when actively editing */
    .dropped.selected:has(.editing)::after {
      display: none;
    }
    
    /* Empty editable placeholder */
    .dropped .editing:empty::before {
      content: 'Click to type...';
      color: var(--text-muted, #6b7280);
      font-style: italic;
      opacity: 0.5;
    }
    
    /* Visual pulse on newly editable element */
    @keyframes edit-pulse {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
      70% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
    
    .dropped .editing {
      animation: edit-pulse 0.4s ease-out;
    }
    
    /* =================================================================
       COMPONENT WIDTH RESIZE HANDLES
       ================================================================= */
    
    .dropped {
      position: relative;
    }
    
    /* Right resize handle */
    .dropped .wb-resize-handle {
      position: absolute;
      top: 0;
      right: -2px;
      width: 12px;
      height: 100%;
      cursor: ew-resize;
      background: transparent;
      z-index: 50;
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    
    .dropped:hover .wb-resize-handle,
    .dropped.selected .wb-resize-handle {
      opacity: 1;
    }
    
    .dropped .wb-resize-handle::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 4px;
      height: 40px;
      max-height: 80%;
      background: var(--primary, #6366f1);
      border-radius: 2px;
      box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
    }
    
    .dropped .wb-resize-handle:hover::before {
      width: 6px;
      background: #818cf8;
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.7);
    }
    
    .dropped.resizing {
      user-select: none;
    }
    
    .dropped.resizing .wb-resize-handle::before {
      background: #a5b4fc;
      width: 6px;
    }
    
    /* Width indicator tooltip */
    .dropped .wb-width-indicator {
      position: absolute;
      top: -28px;
      right: 0;
      background: var(--bg-tertiary, #374151);
      color: var(--text-primary, #f9fafb);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    .dropped.resizing .wb-width-indicator {
      opacity: 1;
    }
    
    /* Width presets bar */
    .dropped .wb-width-presets {
      position: absolute;
      top: -32px;
      left: 50%;
      transform: translateX(-50%);
      display: none;
      gap: 4px;
      background: var(--bg-tertiary, #374151);
      padding: 4px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      z-index: 100;
    }
    
    .dropped.selected:hover .wb-width-presets {
      display: flex;
    }
    
    .dropped .wb-width-presets button {
      padding: 2px 8px;
      font-size: 0.65rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 3px;
      color: #fff;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .dropped .wb-width-presets button:hover {
      background: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
    }
    
    .dropped .wb-width-presets button.active {
      background: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
    }
  `;
  
  document.head.appendChild(style);
}

// =============================================================================
// COMPONENT WIDTH RESIZE HANDLES
// =============================================================================

/**
 * Add resize handle to a dropped component
 */
export function addResizeHandle(wrapper) {
  // Skip if already has handle
  if (wrapper.querySelector('.wb-resize-handle')) return;
  
  // Create resize handle
  const handle = document.createElement('div');
  handle.className = 'wb-resize-handle';
  handle.title = 'Drag to resize width';
  
  // Create width indicator
  const indicator = document.createElement('div');
  indicator.className = 'wb-width-indicator';
  
  // Create width presets bar
  const presets = document.createElement('div');
  presets.className = 'wb-width-presets';
  presets.innerHTML = `
    <button id="btn-row-${wrapper.id}" data-flex="row" title="Row Layout">Row</button>
    <button id="btn-col-${wrapper.id}" data-flex="column" title="Column Layout">Col</button>
    <div style="width: 1px; height: 12px; background: rgba(255,255,255,0.2); margin: 0 2px;"></div>
    <button id="btn-25-${wrapper.id}" data-width="calc(25% - (var(--gap, 0px) * 0.75))" title="1/4 width">25%</button>
    <button id="btn-33-${wrapper.id}" data-width="calc(33.333% - (var(--gap, 0px) * 0.666))" title="1/3 width">33%</button>
    <button id="btn-50-${wrapper.id}" data-width="calc(50% - (var(--gap, 0px) * 0.5))" title="1/2 width">50%</button>
    <button id="btn-75-${wrapper.id}" data-width="calc(75% - (var(--gap, 0px) * 0.25))" title="3/4 width">75%</button>
    <button id="btn-100-${wrapper.id}" data-width="100%">100%</button>
    <button id="btn-auto-${wrapper.id}" data-width="auto">Auto</button>
  `;
  
  wrapper.appendChild(handle);
  wrapper.appendChild(indicator);
  wrapper.appendChild(presets);
  
  // Preset click handlers
  presets.querySelectorAll('button').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      
      // Handle Flex Direction
      if (btn.dataset.flex) {
        const dir = btn.dataset.flex;
        const wbEl = wrapper.querySelector('[data-c]');
        if (wbEl) {
          wbEl.style.flexDirection = dir;
          // Ensure it's flex
          if (getComputedStyle(wbEl).display !== 'flex') {
            wbEl.style.display = 'flex';
          }
        }
        
        // Save to component data
        try {
          const c = JSON.parse(wrapper.dataset.c);
          if (!c.d) c.d = {};
          c.d.direction = dir;
          wrapper.dataset.c = JSON.stringify(c);
          if (window.saveHist) window.saveHist();
        } catch (err) {
          console.error('Error saving flex direction:', err);
        }
        
        // Update active state for flex buttons
        presets.querySelectorAll('[data-flex]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        return;
      }

      const width = btn.dataset.width;
      
      if (width === 'auto') {
        // Auto = shrink to fit content (not expand to 100%)
        wrapper.style.width = 'fit-content';
        wrapper.style.maxWidth = 'fit-content';
      } else {
        wrapper.style.width = width;
        wrapper.style.maxWidth = width;
      }
      
      // Update active state
      presets.querySelectorAll('[data-width]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Save to component data
      saveWidthToComponent(wrapper, width);
    };
  });
  
  // Resize drag handling
  let isResizing = false;
  let startX = 0;
  let startWidth = 0;
  
  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = true;
    startX = e.clientX;
    startWidth = wrapper.offsetWidth;
    wrapper.classList.add('resizing');
    document.body.style.cursor = 'ew-resize';
  });
  
  const onMouseMove = (e) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(100, startWidth + deltaX);
    const parentWidth = wrapper.parentElement?.offsetWidth || window.innerWidth;
    const maxWidth = parentWidth - 20;
    
    const computedWidth = Math.min(newWidth, maxWidth);
    wrapper.style.width = computedWidth + 'px';
    wrapper.style.maxWidth = computedWidth + 'px';
    
    // Update indicator
    const percent = Math.round((computedWidth / parentWidth) * 100);
    indicator.textContent = `${computedWidth}px (${percent}%)`;
  };
  
  const onMouseUp = () => {
    if (isResizing) {
      isResizing = false;
      wrapper.classList.remove('resizing');
      document.body.style.cursor = '';
      
      // Save final width
      const savedWidth = wrapper.style.width;
      if (savedWidth) {
        saveWidthToComponent(wrapper, savedWidth);
      }
    }
  };
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

/**
 * Save width to component data
 */
function saveWidthToComponent(wrapper, width) {
  try {
    const c = JSON.parse(wrapper.dataset.c);
    if (!c.d) c.d = {};
    c.d._width = width;
    wrapper.dataset.c = JSON.stringify(c);
    
    // Also set as data attribute
    const wbEl = wrapper.querySelector('[data-c]');
    if (wbEl) {
      wbEl.dataset.width = width;
    }
    
    // Trigger save
    if (window.saveHist) {
      window.saveHist();
    }
  } catch (e) {
    console.error('Error saving width:', e);
  }
}

/**
 * Initialize resize handles for all dropped components
 */
export function initResizeHandles(canvas) {
  // Add to existing
  canvas.querySelectorAll('.dropped').forEach(addResizeHandle);
  
  // Watch for new components
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.classList?.contains('dropped')) {
          addResizeHandle(node);
        }
      });
    });
  });
  
  observer.observe(canvas, { childList: true, subtree: true });
  
  return () => observer.disconnect();
}

// =============================================================================
// SNAP GRID SYSTEM
// =============================================================================

const SNAP_GRID_SIZE = 20; // pixels

/**
 * Inject snap grid CSS
 */
export function injectSnapGridStyles() {
  if (document.getElementById('wb-snap-grid-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'wb-snap-grid-styles';
  style.textContent = `
    /* =================================================================
       SNAP GRID - Visual Grid Overlay
       ================================================================= */
    
    /* Grid container */
    #canvas.snap-enabled {
      position: relative;
    }
    
    /* Grid overlay using CSS background */
    #canvas.snap-enabled::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
      background-image: 
        linear-gradient(to right, rgba(99, 102, 241, 0.15) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px);
      background-size: ${SNAP_GRID_SIZE}px ${SNAP_GRID_SIZE}px;
      opacity: 1;
      transition: opacity 0.2s ease;
    }
    
    /* Major grid lines every 5 cells (100px) */
    #canvas.snap-enabled::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
      background-image: 
        linear-gradient(to right, rgba(99, 102, 241, 0.35) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(99, 102, 241, 0.35) 1px, transparent 1px);
      background-size: ${SNAP_GRID_SIZE * 5}px ${SNAP_GRID_SIZE * 5}px;
    }
    
    /* Ensure dropped components are above the grid */
    #canvas.snap-enabled .dropped {
      position: relative;
      z-index: 1;
    }
    
    /* Snap indicator on dragged element */
    .dropped.snapping {
      box-shadow: 
        0 0 0 2px var(--primary, #6366f1),
        0 4px 20px rgba(99, 102, 241, 0.4) !important;
    }
    
    /* Grid info badge */
    #canvas.snap-enabled .snap-grid-info {
      position: fixed;
      bottom: 70px;
      right: 20px;
      background: var(--bg-tertiary, #374151);
      color: var(--text-muted, #9ca3af);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-family: 'JetBrains Mono', monospace;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    #canvas.snap-enabled .snap-grid-info::before {
      content: '⊞';
      font-size: 1rem;
      color: var(--primary, #6366f1);
    }
    
    /* Crosshair cursor when dragging with snap */
    #canvas.snap-enabled .dropped.dragging {
      cursor: crosshair !important;
      opacity: 0.5;
      filter: grayscale(100%);
      z-index: 1000 !important;
    }
    
    /* Keyboard movement visual feedback */
    .dropped.keyboard-moving {
      outline: 2px solid var(--primary, #6366f1) !important;
      outline-offset: 2px;
      transition: none !important;
    }
    
    .dropped.keyboard-moving::before {
      content: '↑↓←→';
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary, #6366f1);
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.65rem;
      white-space: nowrap;
      z-index: 1000;
      pointer-events: none;
    }
    
    /* Snap alignment guides */
    .snap-guide-h,
    .snap-guide-v {
      position: fixed;
      background: rgba(239, 68, 68, 0.5);
      z-index: 10000;
      pointer-events: none;
    }
    
    .snap-guide-h {
      height: 1px;
      left: 0;
      right: 0;
    }
    
    .snap-guide-v {
      width: 1px;
      top: 0;
      bottom: 0;
    }

    /* Snap Guide Lines (Red Crosshair) */
    .snap-guide-lines {
      position: absolute;
      width: 0;
      height: 0;
      pointer-events: none;
      z-index: 10000;
      display: none;
    }

    .snap-guide-lines::before {
      content: '';
      position: absolute;
      top: -3rem;
      left: 0;
      width: 1px;
      height: 6rem;
      background-color: #ef4444; /* Red */
      transform: translateX(-50%);
    }

    .snap-guide-lines::after {
      content: '';
      position: absolute;
      top: 0;
      left: -3rem;
      width: 6rem;
      height: 1px;
      background-color: #ef4444; /* Red */
      transform: translateY(-50%);
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Snap a value to the grid
 */
export function snapToGrid(value, gridSize = SNAP_GRID_SIZE) {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap threshold for element-to-element snapping (pixels)
 */
const SNAP_THRESHOLD = 8;

/**
 * Get all snappable elements except the one being dragged
 */
function getSnapTargets(canvas, excludeEl) {
  const targets = [];
  canvas.querySelectorAll('.dropped').forEach(el => {
    if (el === excludeEl || el.contains(excludeEl) || excludeEl.contains(el)) return;
    const rect = el.getBoundingClientRect();
    targets.push({
      el,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height
    });
  });
  return targets;
}

/**
 * Find snap points for an element being dragged
 * Returns adjusted position and guide lines to show
 */
function findSnapPoints(dragRect, targets, canvasRect) {
  const guides = [];
  let snapX = null;
  let snapY = null;
  
  const dragLeft = dragRect.left;
  const dragRight = dragRect.right;
  const dragTop = dragRect.top;
  const dragBottom = dragRect.bottom;
  const dragCenterX = dragLeft + dragRect.width / 2;
  const dragCenterY = dragTop + dragRect.height / 2;
  
  for (const target of targets) {
    // === HORIZONTAL SNAPPING (X axis) ===
    
    // Left edge to left edge
    if (Math.abs(dragLeft - target.left) < SNAP_THRESHOLD) {
      snapX = target.left - canvasRect.left;
      guides.push({ type: 'v', pos: target.left, from: Math.min(dragTop, target.top), to: Math.max(dragBottom, target.bottom) });
    }
    // Right edge to right edge
    else if (Math.abs(dragRight - target.right) < SNAP_THRESHOLD) {
      snapX = target.right - canvasRect.left - dragRect.width;
      guides.push({ type: 'v', pos: target.right, from: Math.min(dragTop, target.top), to: Math.max(dragBottom, target.bottom) });
    }
    // Left edge to right edge
    else if (Math.abs(dragLeft - target.right) < SNAP_THRESHOLD) {
      snapX = target.right - canvasRect.left;
      guides.push({ type: 'v', pos: target.right, from: Math.min(dragTop, target.top), to: Math.max(dragBottom, target.bottom) });
    }
    // Right edge to left edge
    else if (Math.abs(dragRight - target.left) < SNAP_THRESHOLD) {
      snapX = target.left - canvasRect.left - dragRect.width;
      guides.push({ type: 'v', pos: target.left, from: Math.min(dragTop, target.top), to: Math.max(dragBottom, target.bottom) });
    }
    // Center to center (horizontal)
    else if (Math.abs(dragCenterX - target.centerX) < SNAP_THRESHOLD) {
      snapX = target.centerX - canvasRect.left - dragRect.width / 2;
      guides.push({ type: 'v', pos: target.centerX, from: Math.min(dragTop, target.top), to: Math.max(dragBottom, target.bottom) });
    }
    
    // === VERTICAL SNAPPING (Y axis) ===
    
    // Top edge to top edge
    if (Math.abs(dragTop - target.top) < SNAP_THRESHOLD) {
      snapY = target.top - canvasRect.top;
      guides.push({ type: 'h', pos: target.top, from: Math.min(dragLeft, target.left), to: Math.max(dragRight, target.right) });
    }
    // Bottom edge to bottom edge
    else if (Math.abs(dragBottom - target.bottom) < SNAP_THRESHOLD) {
      snapY = target.bottom - canvasRect.top - dragRect.height;
      guides.push({ type: 'h', pos: target.bottom, from: Math.min(dragLeft, target.left), to: Math.max(dragRight, target.right) });
    }
    // Top edge to bottom edge
    else if (Math.abs(dragTop - target.bottom) < SNAP_THRESHOLD) {
      snapY = target.bottom - canvasRect.top;
      guides.push({ type: 'h', pos: target.bottom, from: Math.min(dragLeft, target.left), to: Math.max(dragRight, target.right) });
    }
    // Bottom edge to top edge
    else if (Math.abs(dragBottom - target.top) < SNAP_THRESHOLD) {
      snapY = target.top - canvasRect.top - dragRect.height;
      guides.push({ type: 'h', pos: target.top, from: Math.min(dragLeft, target.left), to: Math.max(dragRight, target.right) });
    }
    // Center to center (vertical)
    else if (Math.abs(dragCenterY - target.centerY) < SNAP_THRESHOLD) {
      snapY = target.centerY - canvasRect.top - dragRect.height / 2;
      guides.push({ type: 'h', pos: target.centerY, from: Math.min(dragLeft, target.left), to: Math.max(dragRight, target.right) });
    }
  }
  
  return { snapX, snapY, guides };
}

/**
 * Show snap guide lines
 */
function showGuides(guides) {
  // Remove existing guides
  document.querySelectorAll('.snap-guide').forEach(g => g.remove());
  
  guides.forEach((guide, i) => {
    const el = document.createElement('div');
    el.className = 'snap-guide';
    
    if (guide.type === 'h') {
      // Horizontal line
      el.style.cssText = `
        position: fixed;
        left: ${guide.from}px;
        width: ${guide.to - guide.from}px;
        top: ${guide.pos}px;
        height: 1px;
        background: #ef4444;
        z-index: 10000;
        pointer-events: none;
        box-shadow: 0 0 4px #ef4444;
      `;
    } else {
      // Vertical line
      el.style.cssText = `
        position: fixed;
        left: ${guide.pos}px;
        width: 1px;
        top: ${guide.from}px;
        height: ${guide.to - guide.from}px;
        background: #ef4444;
        z-index: 10000;
        pointer-events: none;
        box-shadow: 0 0 4px #ef4444;
      `;
    }
    
    document.body.appendChild(el);
  });
}

/**
 * Hide all snap guide lines
 */
function hideGuides() {
  document.querySelectorAll('.snap-guide').forEach(g => g.remove());
}

/**
 * Initialize keyboard arrow movement for selected elements
 */
export function initKeyboardMove(canvas) {
  const MOVE_STEP = 1;        // Normal move: 1px
  const MOVE_STEP_FAST = 10;  // Shift+Arrow: 10px
  const MOVE_STEP_GRID = SNAP_GRID_SIZE; // Ctrl+Arrow: snap to grid (20px)
  
  document.addEventListener('keydown', (e) => {
    // Only handle arrow keys
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    
    // Find selected element
    const selected = canvas.querySelector('.dropped.selected');
    if (!selected) return;

    // Only handle if snap is enabled (absolute positioning mode)
    if (!canvas.classList.contains('snap-enabled')) return;
    
    // Don't interfere with text editing
    if (document.activeElement?.isContentEditable || 
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA') {
      return;
    }
    
    e.preventDefault();
    
    // Get the actual component element (not the wrapper)
    const component = selected.querySelector('[data-c]') || selected;
    
    // Determine move step
    let step = MOVE_STEP;
    if (e.shiftKey) step = MOVE_STEP_FAST;
    if (e.ctrlKey || e.metaKey) step = MOVE_STEP_GRID;
    
    // Get current position (default to 0 if not set)
    let currentLeft = parseFloat(component.style.left) || 0;
    let currentTop = parseFloat(component.style.top) || 0;
    
    // If element doesn't have position yet, calculate from offset
    if (!component.style.position || component.style.position === 'static') {
      const rect = component.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      currentLeft = rect.left - canvasRect.left;
      currentTop = rect.top - canvasRect.top;
    }
    
    // Calculate new position
    let newLeft = currentLeft;
    let newTop = currentTop;
    
    switch (e.key) {
      case 'ArrowUp':
        newTop -= step;
        break;
      case 'ArrowDown':
        newTop += step;
        break;
      case 'ArrowLeft':
        newLeft -= step;
        break;
      case 'ArrowRight':
        newLeft += step;
        break;
    }
    
    // Snap to grid if Ctrl is held
    if (e.ctrlKey || e.metaKey) {
      newLeft = snapToGrid(newLeft);
      newTop = snapToGrid(newTop);
    }
    
    // Apply position
    component.style.position = 'absolute';
    component.style.left = newLeft + 'px';
    component.style.top = newTop + 'px';
    component.style.margin = '0';
    
    // Visual feedback
    selected.classList.add('keyboard-moving');
    clearTimeout(selected._keyMoveTimeout);
    selected._keyMoveTimeout = setTimeout(() => {
      selected.classList.remove('keyboard-moving');
    }, 150);
    
    // Check for element snapping
    const snapTargets = getSnapTargets(canvas, selected);
    const dragRect = {
      left: component.getBoundingClientRect().left,
      top: component.getBoundingClientRect().top,
      right: component.getBoundingClientRect().right,
      bottom: component.getBoundingClientRect().bottom,
      width: component.offsetWidth,
      height: component.offsetHeight
    };
    const snapCanvasRect = canvas.getBoundingClientRect();
    const { snapX, snapY, guides } = findSnapPoints(dragRect, snapTargets, snapCanvasRect);
    
    // Show guides briefly
    if (guides.length > 0) {
      showGuides(guides);
      clearTimeout(canvas._guideTimeout);
      canvas._guideTimeout = setTimeout(hideGuides, 500);
    }
    
    // Save position to component data
    try {
      const c = JSON.parse(selected.dataset.c);
      if (!c.d) c.d = {};
      c.d._posX = component.style.left;
      c.d._posY = component.style.top;
      selected.dataset.c = JSON.stringify(c);
      
      // Trigger save after a short delay
      clearTimeout(canvas._saveTimeout);
      canvas._saveTimeout = setTimeout(() => {
        if (window.saveHist) window.saveHist();
      }, 300);
    } catch (err) {}
  });
}

/**
 * Initialize snap grid for draggable components
 */
export function initSnapGrid(canvas) {
  let isDragging = false;
  let draggedEl = null;
  let draggedWrapper = null;
  let offsetX = 0;
  let offsetY = 0;
  let gridInfo = null;
  let snapTargets = [];
  
  // Also initialize keyboard movement
  initKeyboardMove(canvas);
  
  // Create grid info badge
  function showGridInfo() {
    if (gridInfo) return;
    gridInfo = document.createElement('div');
    gridInfo.className = 'snap-grid-info';
    gridInfo.textContent = `Grid: ${SNAP_GRID_SIZE}px • Smart Snap: ON`;
    canvas.appendChild(gridInfo);
  }
  
  function hideGridInfo() {
    if (gridInfo) {
      gridInfo.remove();
      gridInfo = null;
    }
  }
  
  // Watch for snap-enabled class
  const intersectionObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'class') {
        if (canvas.classList.contains('snap-enabled')) {
          showGridInfo();
        } else {
          hideGridInfo();
        }
      }
    });
  });
  
  try {
    // NOTE: fixed variable-name bug here (was calling `observer.observe`) and
    // guard the call to prevent a ReferenceError from bubbling — fixes #41.
    intersectionObserver.observe(canvas, { attributes: true });
  } catch (obsErr) {
    console.debug('[initSnapGrid] MutationObserver.observe failed', obsErr);
  }
  
  // Initial check
  if (canvas.classList.contains('snap-enabled')) {
    showGridInfo();
  }
  
  // Handle dragging for components
  canvas.addEventListener('mousedown', (e) => {
    // 1. Find the wrapper
    const wrapper = e.target.closest('.dropped');
    if (!wrapper) return;
    
    // 2. Check if snap is enabled
    let shouldSnap = canvas.classList.contains('snap-enabled');
    try {
      const c = JSON.parse(wrapper.dataset.c);
      if (c.d?.snapToGrid === true || c.d?.snapToGrid === 'true') {
        shouldSnap = true;
      }
    } catch (err) {}
    
    // 3. Determine draggable element
    let targetEl = null;
    const cardDraggable = e.target.closest('wb-carddraggable');
    
    if (cardDraggable) {
      // Existing logic for carddraggable
      const header = cardDraggable.querySelector('.wb-card__header, .wb-card__drag-handle');
      if (header && !header.contains(e.target)) return; // Only drag from header
      targetEl = cardDraggable;
    } else if (shouldSnap) {
      // Allow dragging generic elements if snap is enabled
      // Avoid dragging if interacting with content
      if (e.target.isContentEditable || 
          ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(e.target.tagName)) return;
          
      targetEl = wrapper.querySelector('[data-c]') || wrapper.firstElementChild || wrapper;
    } else {
      return;
    }
    
    if (!targetEl) return;
    
    isDragging = true;
    draggedEl = targetEl;
    draggedWrapper = wrapper;
    
    // Cache snap targets at drag start
    snapTargets = getSnapTargets(canvas, wrapper);
    
    const rect = targetEl.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    targetEl.classList.add('snapping', 'dragging');
    wrapper.classList.add('dragging');
    e.preventDefault();
  });
  
  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging || !draggedEl) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    let newX = e.clientX - canvasRect.left - offsetX;
    let newY = e.clientY - canvasRect.top - offsetY;
    
    // Calculate where the element would be
    const dragRect = {
      left: e.clientX - offsetX,
      top: e.clientY - offsetY,
      right: e.clientX - offsetX + draggedEl.offsetWidth,
      bottom: e.clientY - offsetY + draggedEl.offsetHeight,
      width: draggedEl.offsetWidth,
      height: draggedEl.offsetHeight
    };
    
    // Find element-to-element snap points
    const { snapX, snapY, guides } = findSnapPoints(dragRect, snapTargets, canvasRect);
    
    // Apply element snapping first (higher priority)
    if (snapX !== null) {
      newX = snapX;
    } else if (canvas.classList.contains('snap-enabled')) {
      // Fall back to grid snapping
      newX = snapToGrid(newX);
    }
    
    if (snapY !== null) {
      newY = snapY;
    } else if (canvas.classList.contains('snap-enabled')) {
      // Fall back to grid snapping
      newY = snapToGrid(newY);
    }
    
    // Show guide lines
    if (guides.length > 0) {
      showGuides(guides);
    } else {
      hideGuides();
    }

    // Smart Snap Highlight
    if (canvas.classList.contains('snap-enabled')) {
        let snapHighlight = document.getElementById('snap-guide-lines');
        if (!snapHighlight) {
            snapHighlight = document.createElement('div');
            snapHighlight.id = 'snap-guide-lines';
            snapHighlight.className = 'snap-guide-lines';
            canvas.appendChild(snapHighlight);
        }
        
        // Highlight the snap position (grid or element)
        snapHighlight.style.left = newX + 'px';
        snapHighlight.style.top = newY + 'px';
        snapHighlight.style.display = 'block';
    }
    
    // Apply position
    draggedEl.style.position = 'absolute';
    draggedEl.style.left = newX + 'px';
    draggedEl.style.top = newY + 'px';
    draggedEl.style.margin = '0';
  });
  
  canvas.addEventListener('mouseup', () => {
    if (isDragging && draggedEl) {
      draggedEl.classList.remove('snapping', 'dragging');
      draggedWrapper?.classList.remove('dragging');
      hideGuides();
      
      // Remove highlight
      const highlight = document.getElementById('snap-guide-lines');
      if (highlight) highlight.remove();
      
      // Save position to component data
      if (draggedWrapper) {
        try {
          const dragConfig = JSON.parse(draggedWrapper.dataset.c);
          if (!dragConfig.d) dragConfig.d = {};
          dragConfig.d._posX = draggedEl.style.left;
          dragConfig.d._posY = draggedEl.style.top;
          draggedWrapper.dataset.c = JSON.stringify(dragConfig);
        } catch (err) {}
      }
    }
    
    isDragging = false;
    draggedEl = null;
    draggedWrapper = null;
    snapTargets = [];
  });
  
  return () => {
    observer.disconnect();
    hideGridInfo();
    hideGuides();
  };
}

// Auto-inject styles when module loads
if (typeof document !== 'undefined') {
  injectEditingStyles();
  injectSnapGridStyles();
}

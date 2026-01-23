/**
 * Collapse Behavior
 * -----------------------------------------------------------------------------
 * Collapsible content sections.
 *
 * Custom Tag: <wb-collapse>
 * Helper Attribute: [x-collapse]
 * -----------------------------------------------------------------------------
 */
export function collapse(element, options = {}) {
  const config = {
    label: options.label || element.dataset.label || 'Toggle',
    open: options.open ?? element.hasAttribute('data-open'),
    target: options.target || element.dataset.target,
    ...options
  };

  element.classList.add('wb-collapse');

  // If target is specified, act as a remote trigger
  if (config.target) {
    const targetEl = document.querySelector(config.target);
    if (targetEl) {
      let isTargetOpen = config.open || targetEl.style.display !== 'none';
      
      // Initialize target state
      targetEl.style.display = isTargetOpen ? 'block' : 'none';
      
      element.addEventListener('click', () => {
        isTargetOpen = !isTargetOpen;
        targetEl.style.display = isTargetOpen ? 'block' : 'none';
        element.setAttribute('aria-expanded', isTargetOpen);
        
        element.dispatchEvent(new CustomEvent('wb:collapse:toggle', { 
          bubbles: true, 
          detail: { open: isTargetOpen, target: config.target } 
        }));
      });
      
      return () => element.classList.remove('wb-collapse');
    }
  }

  // Default behavior: Wrap content (Accordion style)
  const content = element.innerHTML;

  element.innerHTML = `
    <button class="wb-collapse__trigger" style="
      display:flex;align-items:center;justify-content:space-between;
      width:100%;padding:0.75rem 1rem;
      background:var(--bg-secondary,#1f2937);
      border:1px solid var(--border-color,#374151);
      border-radius:6px;cursor:pointer;color:inherit;
      font-weight:500;
    ">
      <span>${config.label}</span>
      <span class="wb-collapse__icon" style="transition:transform 0.2s;">${config.open ? '▲' : '▼'}</span>
    </button>
    <div class="wb-collapse__content" style="
      padding:0.75rem 1rem;
      border:1px solid var(--border-color,#374151);
      border-top:none;border-radius:0 0 6px 6px;
      display:${config.open ? 'block' : 'none'};
      background:var(--bg-primary,#111827);
    ">${content}</div>
  `;

  const trigger = element.querySelector('.wb-collapse__trigger');
  const contentEl = element.querySelector('.wb-collapse__content');
  const icon = element.querySelector('.wb-collapse__icon');

  let isOpen = config.open;

  trigger.addEventListener('click', () => {
    isOpen = !isOpen;
    contentEl.style.display = isOpen ? 'block' : 'none';
    icon.textContent = isOpen ? '▲' : '▼';
    trigger.style.borderRadius = isOpen ? '6px 6px 0 0' : '6px';

    element.dispatchEvent(new CustomEvent('wb:collapse:toggle', { 
      bubbles: true, 
      detail: { open: isOpen } 
    }));
  });

  element.wbCollapse = {
    toggle: () => trigger.click(),
    open: () => { if (!isOpen) trigger.click(); },
    close: () => { if (isOpen) trigger.click(); },
    get isOpen() { return isOpen; }
  };

  element.dataset.wbReady = 'collapse';
  return () => element.classList.remove('wb-collapse');
}

/**
 * Accordion - Multi-panel collapsible container
 * Custom Tag: <wb-accordion>
 * Children should have [accordion-title] attribute
 */
export function accordion(element, options = {}) {
  const config = {
    multiple: options.multiple ?? element.hasAttribute('data-multiple'),
    ...options
  };

  element.classList.add('wb-accordion');
  element.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `;

  // Find all children with accordion-title
  const panels = Array.from(element.children).filter(child => 
    child.hasAttribute('accordion-title') || child.dataset.accordionTitle
  );

  // If no panels with accordion-title, use all children as panels
  const items = panels.length > 0 ? panels : Array.from(element.children);
  
  if (items.length === 0) {
    // No content - show placeholder
    element.innerHTML = `
      <div style="padding: 1rem; background: var(--bg-secondary, #1f2937); border-radius: 8px; color: var(--text-secondary, #9ca3af);">
        Add panels with <code>accordion-title</code> attribute
      </div>
    `;
    element.dataset.wbReady = 'accordion';
    return () => element.classList.remove('wb-accordion');
  }

  // Process each panel
  const accordionItems = [];
  
  items.forEach((panel, index) => {
    const title = panel.getAttribute('accordion-title') || panel.dataset.accordionTitle || `Section ${index + 1}`;
    const content = panel.innerHTML;
    const isOpen = panel.hasAttribute('data-open') || index === 0;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-accordion__item';
    wrapper.style.cssText = `
      border: 1px solid var(--border-color, #374151);
      border-radius: 8px;
      overflow: hidden;
    `;
    
    wrapper.innerHTML = `
      <button class="wb-accordion__trigger" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 1rem;
        background: var(--bg-secondary, #1f2937);
        border: none;
        cursor: pointer;
        color: var(--text-primary, #f9fafb);
        font-weight: 500;
        font-size: 0.95rem;
        text-align: left;
        transition: background 0.15s;
      ">
        <span>${title}</span>
        <span class="wb-accordion__icon" style="
          transition: transform 0.2s;
          font-size: 0.75rem;
          transform: ${isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
        ">▼</span>
      </button>
      <div class="wb-accordion__content" style="
        padding: 1rem;
        background: var(--bg-primary, #111827);
        display: ${isOpen ? 'block' : 'none'};
        border-top: 1px solid var(--border-color, #374151);
      ">${content}</div>
    `;
    
    const trigger = wrapper.querySelector('.wb-accordion__trigger');
    const contentEl = wrapper.querySelector('.wb-accordion__content');
    const icon = wrapper.querySelector('.wb-accordion__icon');
    
    let open = isOpen;
    
    const toggle = () => {
      // If not multiple mode, close other panels
      if (!config.multiple && !open) {
        accordionItems.forEach(item => {
          if (item !== wrapper && item.isOpen) {
            item.close();
          }
        });
      }
      
      open = !open;
      contentEl.style.display = open ? 'block' : 'none';
      icon.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
      
      element.dispatchEvent(new CustomEvent('wb:accordion:toggle', {
        bubbles: true,
        detail: { index, open, title }
      }));
    };
    
    trigger.addEventListener('click', toggle);
    trigger.addEventListener('mouseenter', () => trigger.style.background = 'var(--bg-tertiary, #374151)');
    trigger.addEventListener('mouseleave', () => trigger.style.background = 'var(--bg-secondary, #1f2937)');
    
    // Store reference with API
    wrapper.isOpen = open;
    wrapper.close = () => { if (open) { open = false; contentEl.style.display = 'none'; icon.style.transform = 'rotate(0deg)'; wrapper.isOpen = false; } };
    wrapper.open = () => { if (!open) { toggle(); } };
    
    accordionItems.push(wrapper);
    
    // Replace original panel with wrapper
    panel.replaceWith(wrapper);
  });

  element.dataset.wbReady = 'accordion';
  return () => element.classList.remove('wb-accordion');
}

export default collapse;

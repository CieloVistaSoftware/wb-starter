/**
 * Click-to-show dropdown menu component.
 * - `<wb-dropdown>` with data-items or child element menu items.
 */
export function cc() {}

/**
 * Dropdown Component
 * 
 * Creates a dropdown menu that opens on click. Supports both data-items
 * attribute for simple menus and child elements for custom content.
 * Dispatches `wb:dropdown:select` on item selection.
 * 
 * @param {HTMLElement} element - The trigger element
 * @param {Object} [options] - Configuration options
 * @param {string} [options.items] - Comma-separated menu items
 * @param {string} [options.label] - Button label text
 * @param {string} [options.position] - Menu position: bottom-left, bottom-right, ...
 * @param {boolean} [options.closeOnSelect] - Close menu on item selection
 * @returns {Function} Cleanup function to remove behavior
 */export function dropdown(element, options = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    label: options.label || element.dataset.label || '',
    position: options.position || element.dataset.position || 'bottom-left',
    closeOnSelect: options.closeOnSelect ?? (element.dataset.closeOnSelect !== 'false'),
    ...options
  };

  element.classList.add('wb-dropdown');
  element.style.position = 'relative';
  element.style.display = 'inline-block';

  // Check if using child elements as menu items
  const childElements = Array.from(element.children).filter(
    child => child.tagName === 'A' || child.tagName === 'BUTTON' || child.tagName === 'DIV'
  );
  const hasChildItems = childElements.length > 0 && config.items.length === 0;

  // Create trigger button if using label
  let trigger;
  if (config.label || hasChildItems) {
    trigger = document.createElement('button');
    trigger.className = 'wb-dropdown__trigger';
    trigger.type = 'button';
    trigger.innerHTML = `${config.label || 'Menu'} <span style="margin-left:0.5rem;font-size:0.7em;">▼</span>`;
    trigger.style.cssText = `
      background: var(--bg-secondary, #1f2937);
      border: 1px solid var(--border-color, #374151);
      border-radius: 6px;
      padding: 0.5rem 1rem;
      color: var(--text-primary, inherit);
      cursor: pointer;
      font-size: inherit;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    `;
  }

  // Create menu
  const menu = document.createElement('div');
  menu.className = 'wb-dropdown__menu';

  // Position styles
  const posStyles = {
    'bottom-left': 'top:100%;left:0;',
    'bottom-right': 'top:100%;right:0;',
    'top-left': 'bottom:100%;left:0;',
    'top-right': 'bottom:100%;right:0;'
  };

  menu.style.cssText = `
    position:absolute;${posStyles[config.position] || posStyles['bottom-left']}
    background:var(--bg-secondary,#1f2937);
    border:1px solid var(--border-color,#374151);
    border-radius:8px;min-width:150px;
    box-shadow:0 10px 25px rgba(0,0,0,0.2);
    display:none;z-index:1000;overflow:hidden;
    margin-top:4px;
  `;

  // Populate menu from items OR move child elements into menu
  if (hasChildItems) {
    // Move existing children into menu and style them
    childElements.forEach(child => {
      child.classList.add('wb-dropdown__item');
      Object.assign(child.style, {
        display: 'block',
        padding: '0.5rem 0.75rem',
        cursor: 'pointer',
        transition: 'background 0.15s',
        textDecoration: 'none',
        color: 'inherit'
      });
      child.addEventListener('mouseenter', () => child.style.background = 'var(--bg-tertiary,#374151)');
      child.addEventListener('mouseleave', () => child.style.background = '');
      menu.appendChild(child);
    });
  } else if (config.items.length > 0) {
    // Create menu items from data-items
    menu.innerHTML = config.items.map(item => `
      <div class="wb-dropdown__item" style="
        padding:0.5rem 0.75rem;cursor:pointer;
        transition:background 0.15s;
      ">${item.trim()}</div>
    `).join('');

    // Add hover events
    menu.querySelectorAll('.wb-dropdown__item').forEach(item => {
      item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-tertiary,#374151)');
      item.addEventListener('mouseleave', () => item.style.background = '');
    });
  }

  // Assemble: if using label/children, add trigger first
  if (trigger) {
    element.innerHTML = '';
    element.appendChild(trigger);
  }
  element.appendChild(menu);

  let isOpen = false;

  const toggle = () => {
    isOpen = !isOpen;
    menu.style.display = isOpen ? 'block' : 'none';
    element.classList.toggle('open', isOpen);
    if (trigger) {
      trigger.setAttribute('aria-expanded', isOpen);
    }
    if (isOpen) {
      menu.style.animation = 'wb-fade-in 0.15s ease';
    }
  };

  const close = () => {
    isOpen = false;
    menu.style.display = 'none';
    element.classList.remove('open');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  };

  // Click handler
  const clickHandler = (e) => {
    const item = e.target.closest('.wb-dropdown__item');

    if (item) {
      // Item clicked
      element.dispatchEvent(new CustomEvent('wb:dropdown:select', {
        bubbles: true,
        detail: {
          value: item.textContent.trim(),
          href: item.href || null
        }
      }));

      if (config.closeOnSelect) {
        close();
      }

      // Don't prevent default for links
      if (item.tagName !== 'A') {
        e.preventDefault();
      }
    } else if (e.target.closest('.wb-dropdown__trigger') || (!trigger && e.target === element)) {
      // Trigger clicked
      e.preventDefault();
      toggle();
    }
  };

  element.addEventListener('click', clickHandler);

  // Close on outside click
  const outsideClickHandler = (e) => {
    if (!element.contains(e.target)) close();
  };
  document.addEventListener('click', outsideClickHandler);

  // Keyboard support
  const keyHandler = (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
      (trigger || element).focus();
    }
  };
  element.addEventListener('keydown', keyHandler);

  // ARIA
  if (trigger) {
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
  }
  menu.setAttribute('role', 'menu');
  menu.querySelectorAll('.wb-dropdown__item').forEach(item => {
    item.setAttribute('role', 'menuitem');
  });

  element.dataset.wbReady = 'dropdown';

  return () => {
    element.removeEventListener('click', clickHandler);
    document.removeEventListener('click', outsideClickHandler);
    element.removeEventListener('keydown', keyHandler);
    menu.remove();
    if (trigger) trigger.remove();
    element.classList.remove('wb-dropdown', 'open');
  };
}

export default dropdown;

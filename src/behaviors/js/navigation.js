/**
 * Navigation Behaviors
 * All behaviors generate content from data attributes
 * 
 * FIXED: v2.0
 * - Menu component: Proper flex layout with correct spacing
 * - Navbar component: Better responsive design
 * - Sidebar component: Fixed item layout and hover states
 */

/**
 * Navbar - Navigation bar from data attributes
 */
export function navbar(element, options = {}) {
  const config = {
    brand: options.brand || element.dataset.brand || '',
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    sticky: options.sticky ?? element.hasAttribute('data-sticky'),
    ...options
  };

  element.classList.add('wb-navbar');
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'space-between';
  element.style.padding = '0.5rem 1rem';
  element.style.background = 'var(--bg-secondary, #1f2937)';
  element.style.borderRadius = '6px';
  element.style.gap = '1rem';

  if (config.sticky) {
    element.style.position = 'sticky';
    element.style.top = '0';
    element.style.zIndex = '100';
  }

  element.innerHTML = `
    <div class="wb-navbar__brand" style="
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    ">${config.brand}</div>
    <nav class="wb-navbar__menu" style="
      display: flex;
      gap: 1.5rem;
      flex: 1;
      flex-wrap: wrap;
    ">
      ${config.items.map(item => `
        <a class="wb-navbar__item" href="#" style="
          opacity: 0.8;
          text-decoration: none;
          color: inherit;
          transition: opacity 0.15s ease;
          white-space: nowrap;
        " onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.8'">
          ${item.trim()}
        </a>
      `).join('')}
    </nav>
  `;

  element.dataset.wbReady = 'navbar';
  return () => element.classList.remove('wb-navbar');
}

/**
 * Sidebar - Vertical navigation from data-items
 */
export function sidebar(element, options = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    active: options.active || element.dataset.active || '',
    collapsed: options.collapsed ?? element.hasAttribute('data-collapsed'),
    ...options
  };

  element.classList.add('wb-sidebar');
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  element.style.gap = '0.5rem';
  element.style.padding = '0.75rem';
  element.style.background = 'var(--bg-secondary, #1f2937)';
  element.style.borderRadius = '6px';
  element.style.minWidth = config.collapsed ? '48px' : '160px';
  element.style.width = config.collapsed ? '48px' : '100%';
  element.style.maxWidth = '100%';

  element.innerHTML = config.items.map(item => {
    const isActive = item.trim() === config.active;
    return `
      <a class="wb-sidebar__item" href="#" style="
        padding: 0.6rem 0.75rem;
        border-radius: 4px;
        text-decoration: none;
        color: inherit;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.15s ease;
        white-space: nowrap;
        ${isActive ? 'background: var(--primary, #6366f1); color: white; font-weight: 500;' : 'opacity: 0.8;'}
      " onmouseenter="this.style.background='var(--bg-tertiary,#374151)';this.style.opacity='1'" 
         onmouseleave="${isActive ? 'this.style.background=\"var(--primary, #6366f1)\";' : 'this.style.background=\"\";this.style.opacity=\"0.8\";'}">
        ${item.trim()}
      </a>
    `;
  }).join('');

  element.dataset.wbReady = 'sidebar';
  return () => element.classList.remove('wb-sidebar');
}

/**
 * Menu - Clickable menu from data-items
 * FIXED: Proper flex layout, correct spacing, better hover states
 */
export function menu(element, options = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    ...options
  };

  element.classList.add('wb-menu');
  element.setAttribute('role', 'menu');
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  element.style.gap = '0.25rem';
  element.style.padding = '0.5rem';
  element.style.background = 'var(--bg-secondary, #1f2937)';
  element.style.borderRadius = '6px';
  element.style.minWidth = '140px';
  element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

  element.innerHTML = config.items.map((item, idx) => `
    <div class="wb-menu__item" role="menuitem" tabindex="0" data-index="${idx}" style="
      padding: 0.6rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.15s ease;
      color: inherit;
      font-size: 0.9rem;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    " onmouseenter="this.style.background='var(--bg-tertiary,#374151)';this.style.opacity='1'" 
       onmouseleave="this.style.background='';this.style.opacity='0.9'">
      <span>${item.trim()}</span>
    </div>
  `).join('');

  // Add keyboard navigation
  const items = element.querySelectorAll('.wb-menu__item');
  items.forEach((item, idx) => {
    item.addEventListener('click', (e) => {
      element.dispatchEvent(new CustomEvent('wb:menu:select', {
        bubbles: true,
        detail: { index: idx, item: item.textContent.trim() }
      }));
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });

  element.dataset.wbReady = 'menu';
  return () => element.classList.remove('wb-menu');
}

/**
 * Pagination - Page navigation from data-pages
 */
export function pagination(element, options = {}) {
  const config = {
    pages: parseInt(options.pages || element.dataset.pages || '1'),
    current: parseInt(options.current || element.dataset.current || '1'),
    ...options
  };

  element.classList.add('wb-pagination');
  element.setAttribute('role', 'navigation');
  element.style.display = 'flex';
  element.style.gap = '0.25rem';
  element.style.alignItems = 'center';

  const render = () => {
    let html = `
      <button class="wb-pagination__btn" ${config.current <= 1 ? 'disabled' : ''} data-action="prev" 
        style="
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color, #4b5563);
          background: var(--bg-tertiary, #374151);
          border-radius: 4px;
          cursor: ${config.current <= 1 ? 'not-allowed' : 'pointer'};
          opacity: ${config.current <= 1 ? '0.5' : '1'};
          transition: all 0.15s ease;
          color: inherit;
        ">‹</button>
    `;
    
    for (let i = 1; i <= config.pages; i++) {
      const active = i === config.current;
      html += `
        <button class="wb-pagination__btn" data-page="${i}" 
          style="
            padding: 0.5rem 0.75rem;
            border: 1px solid ${active ? 'var(--primary, #6366f1)' : 'var(--border-color, #4b5563)'};
            background: ${active ? 'var(--primary, #6366f1)' : 'var(--bg-tertiary, #374151)'};
            border-radius: 4px;
            cursor: pointer;
            color: ${active ? 'white' : 'inherit'};
            font-weight: ${active ? '600' : '400'};
            transition: all 0.15s ease;
          ">${i}</button>
      `;
    }
    
    html += `
      <button class="wb-pagination__btn" ${config.current >= config.pages ? 'disabled' : ''} data-action="next" 
        style="
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color, #4b5563);
          background: var(--bg-tertiary, #374151);
          border-radius: 4px;
          cursor: ${config.current >= config.pages ? 'not-allowed' : 'pointer'};
          opacity: ${config.current >= config.pages ? '0.5' : '1'};
          transition: all 0.15s ease;
          color: inherit;
        ">›</button>
    `;
    
    element.innerHTML = html;
  };

  element.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    
    if (btn.dataset.action === 'prev') config.current--;
    else if (btn.dataset.action === 'next') config.current++;
    else if (btn.dataset.page) config.current = parseInt(btn.dataset.page);
    
    render();
    element.dispatchEvent(new CustomEvent('wb:pagination:change', { 
      bubbles: true, 
      detail: { page: config.current } 
    }));
  });

  render();
  element.dataset.wbReady = 'pagination';
  return () => element.classList.remove('wb-pagination');
}

/**
 * Steps - Step indicator from data-items
 */
export function steps(element, options = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    current: parseInt(options.current || element.dataset.current || '1'),
    ...options
  };

  element.classList.add('wb-steps');
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.gap = '1rem';
  element.style.flexWrap = 'wrap';

  element.innerHTML = config.items.map((item, i) => {
    const step = i + 1;
    const isComplete = step < config.current;
    const isActive = step === config.current;
    
    return `
      <div class="wb-steps__item" style="display: flex; align-items: center; gap: 0.5rem;">
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
          ${isComplete ? 'background: var(--success, #22c55e); color: white;' : ''}
          ${isActive ? 'background: var(--primary, #6366f1); color: white;' : ''}
          ${!isComplete && !isActive ? 'background: var(--bg-tertiary, #374151); opacity: 0.5;' : ''}
        ">${isComplete ? '✓' : step}</div>
        <span style="font-size: 0.875rem; white-space: nowrap; ${!isActive ? 'opacity: 0.7;' : 'font-weight: 500;'}">${item.trim()}</span>
        ${i < config.items.length - 1 ? '<div style="width: 32px; height: 2px; background: var(--border-color, #374151); flex-shrink: 0;"></div>' : ''}
      </div>
    `;
  }).join('');

  element.dataset.wbReady = 'steps';
  return () => element.classList.remove('wb-steps');
}

/**
 * Treeview - Hierarchical tree from JSON
 */
export function treeview(element, options = {}) {
  const config = {
    items: options.items || JSON.parse(element.dataset.items || '[]'),
    ...options
  };

  element.classList.add('wb-treeview');
  element.setAttribute('role', 'tree');
  element.style.fontSize = '0.875rem';
  element.style.padding = '0.5rem';

  const renderNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const padding = depth * 1.5;
    
    return `
      <div class="wb-treeview__item" role="treeitem" style="margin-bottom: 0.25rem;">
        <div style="
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.35rem 0;
          cursor: ${hasChildren ? 'pointer' : 'default'};
          padding-left: ${padding}rem;
          border-radius: 3px;
          transition: background 0.15s ease;
        " class="wb-treeview__node" onmouseenter="this.style.background='var(--bg-tertiary,#374151)'" onmouseleave="this.style.background=''">
          ${hasChildren ? '<span class="wb-treeview__toggle" style="width: 16px; font-size: 0.7rem; transition: transform 0.15s ease;">▶</span>' : '<span style="width: 16px;"></span>'}
          <span class="wb-treeview__label">${node.name}</span>
        </div>
        ${hasChildren ? `<div class="wb-treeview__children" style="display: none;">${node.children.map(c => renderNode(c, depth + 1)).join('')}</div>` : ''}
      </div>
    `;
  };

  element.innerHTML = config.items.map(item => renderNode(item)).join('');

  // Toggle children visibility
  element.addEventListener('click', (e) => {
    const toggle = e.target.closest('.wb-treeview__toggle');
    if (!toggle) return;
    
    const item = toggle.closest('.wb-treeview__item');
    const children = item?.querySelector('.wb-treeview__children');
    
    if (children) {
      const isOpen = children.style.display !== 'none';
      children.style.display = isOpen ? 'none' : 'block';
      toggle.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
    }
  });

  element.dataset.wbReady = 'treeview';
  return () => element.classList.remove('wb-treeview');
}

/**
 * BackToTop - Scroll to top button
 */
export function backtotop(element, options = {}) {
  const config = {
    threshold: parseInt(options.threshold || element.dataset.threshold || '300'),
    ...options
  };

  element.classList.add('wb-backtotop');
  element.style.cursor = 'pointer';
  element.style.transition = 'opacity 0.3s ease';

  const updateVisibility = () => {
    element.style.opacity = window.scrollY > config.threshold ? '1' : '0';
    element.style.pointerEvents = window.scrollY > config.threshold ? 'auto' : 'none';
  };

  window.addEventListener('scroll', updateVisibility);
  updateVisibility();

  element.onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  element.dataset.wbReady = 'backtotop';
  return () => {
    element.classList.remove('wb-backtotop');
    window.removeEventListener('scroll', updateVisibility);
  };
}

/**
 * Link - Clickable link that navigates to internal sections or external URLs
 * Validates URLs on click - turns red and logs error if invalid
 */
export function link(element, options = {}) {
  const config = {
    href: options.href || element.dataset.href || element.getAttribute('href') || '#',
    text: options.text || element.dataset.text || element.textContent || 'Link',
    offset: parseInt(options.offset || element.dataset.offset || '0'),
    ...options
  };

  element.classList.add('wb-link');
  element.style.cursor = 'pointer';
  element.style.color = 'var(--primary, #6366f1)';
  element.style.textDecoration = 'underline';
  element.style.transition = 'color 0.2s ease';
  
  // Set href attribute and text content
  if (element.tagName === 'A') {
    element.href = config.href;
    // External links open in new tab
    if (config.href.startsWith('http://') || config.href.startsWith('https://')) {
      element.target = '_blank';
      element.rel = 'noopener noreferrer';
    }
  } else {
    element.dataset.href = config.href;
  }
  
  if (!element.textContent.trim() || element.textContent === 'Link') {
    element.textContent = config.text;
  }

  // Mark link as invalid (red)
  const markInvalid = (reason) => {
    element.style.color = 'var(--danger-color, #ef4444)';
    element.classList.add('wb-link--invalid');
    element.title = reason;
    
    // Log to Events if available (builder debug log)
    if (window.Events) {
      window.Events.error('Invalid Link', `${config.href}: ${reason}`);
    } else {
      console.error('[Anchor]', config.href, reason);
    }
  };
  
  // Mark link as valid (restore color)
  const markValid = () => {
    element.style.color = 'var(--primary, #6366f1)';
    element.classList.remove('wb-link--invalid');
    element.title = '';
  };

  element.onclick = async (e) => {
    const href = config.href;
    
    // External URL - validate then open
    if (href.startsWith('http://') || href.startsWith('https://')) {
      e.preventDefault();
      
      // Validate URL format
      try {
        new URL(href);
      } catch {
        markInvalid('Invalid URL format');
        return;
      }
      
      // Try to fetch (check if reachable)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        await fetch(href, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        markValid();
        window.open(href, '_blank', 'noopener,noreferrer');
      } catch (err) {
        if (err.name === 'AbortError') {
          markInvalid('URL timeout - server not responding');
        } else {
          // no-cors mode - assume reachable if no network error
          markValid();
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }
      return;
    }
    
    // Internal anchor with ID - validate then scroll
    if (href?.startsWith('#') && href.length > 1) {
      e.preventDefault();
      const targetId = href.slice(1);
      
      // Check if it's a page reference or element ID
      const validPages = ['home', 'about', 'components', 'contact', 'docs', 'features', 'newpage'];
      const target = document.querySelector(href);
      
      if (target) {
        // Element exists - scroll to it
        markValid();
        const top = target.getBoundingClientRect().top + window.scrollY - config.offset;
        window.scrollTo({ top, behavior: 'smooth' });
      } else if (validPages.includes(targetId)) {
        // Valid page - navigate
        markValid();
        window.location.hash = href;
      } else {
        // Invalid - mark red
        markInvalid(`Target "${targetId}" not found`);
      }
      return;
    }
    
    // Empty anchor - prevent page jump
    if (href === '#') {
      e.preventDefault();
      markInvalid('Empty link - no href set');
    }
  };

  element.dataset.wbReady = 'link';
  return () => element.classList.remove('wb-link');
}

/**
 * Statusbar - Bottom status bar
 */
export function statusbar(element, options = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    position: options.position || element.dataset.position || 'bottom',
    ...options
  };

  element.classList.add('wb-statusbar');
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'space-between';
  element.style.padding = '0 1rem';
  element.style.height = '1.5rem';
  element.style.background = 'var(--bg-secondary, #1f2937)';
  element.style.borderTop = '1px solid var(--border-color, #374151)';
  element.style.fontSize = '0.75rem';
  element.style.color = 'var(--text-secondary, #9ca3af)';
  element.style.width = '100%';
  element.style.boxSizing = 'border-box';

  if (config.position === 'bottom' || config.position === 'fixed') {
    element.style.position = 'fixed';
    element.style.bottom = '0';
    element.style.left = '0';
    element.style.zIndex = '100';
    document.body.style.paddingBottom = '1.5rem';
  } else if (config.position === 'top') {
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.zIndex = '100';
    element.style.borderTop = 'none';
    element.style.borderBottom = '1px solid var(--border-color, #374151)';
    document.body.style.paddingTop = '1.5rem';
  }

  // Create message area
  let messageArea = element.querySelector('.wb-statusbar__message');
  if (!messageArea) {
    messageArea = document.createElement('span');
    messageArea.className = 'wb-statusbar__message';
    messageArea.style.flex = '1';
    messageArea.style.textAlign = 'center';
    messageArea.style.fontWeight = '500';
    messageArea.style.color = 'var(--text-primary, #e5e7eb)';
    messageArea.style.transition = 'opacity 0.3s ease';
    messageArea.style.opacity = '0';
    
    // If items exist, insert in middle, otherwise append
    if (element.children.length > 0) {
      const mid = Math.floor(element.children.length / 2);
      element.insertBefore(messageArea, element.children[mid]);
    } else {
      element.appendChild(messageArea);
    }
  }

  // If items are provided via data attribute
  if (config.items.length > 0) {
    // Clear but save message area
    const msg = messageArea;
    element.innerHTML = '';
    
    // Add left items
    const leftItems = config.items.slice(0, Math.ceil(config.items.length / 2));
    leftItems.forEach(item => {
      const span = document.createElement('span');
      span.textContent = item.trim();
      element.appendChild(span);
    });

    // Add message area
    element.appendChild(msg);

    // Add right items
    const rightItems = config.items.slice(Math.ceil(config.items.length / 2));
    rightItems.forEach(item => {
      const span = document.createElement('span');
      span.textContent = item.trim();
      element.appendChild(span);
    });
  }

  // Event listener for status messages
  const handleStatusMessage = (e) => {
    const { message, type, duration = 3000 } = e.detail;
    messageArea.textContent = message;
    messageArea.style.opacity = '1';
    
    if (type === 'error') messageArea.style.color = 'var(--danger-color, #ef4444)';
    else if (type === 'success') messageArea.style.color = 'var(--success-color, #10b981)';
    else messageArea.style.color = 'var(--text-primary, #e5e7eb)';

    if (element._statusTimeout) clearTimeout(element._statusTimeout);
    
    element._statusTimeout = setTimeout(() => {
      messageArea.style.opacity = '0';
    }, duration);
  };

  document.addEventListener('wb:status:message', handleStatusMessage);

  element.dataset.wbReady = 'statusbar';
  return () => {
    element.classList.remove('wb-statusbar');
    document.removeEventListener('wb:status:message', handleStatusMessage);
  };
}

export default { navbar, sidebar, menu, pagination, steps, treeview, backtotop, link, statusbar };

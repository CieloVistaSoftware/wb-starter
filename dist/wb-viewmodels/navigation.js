/**
 * Navigation Behaviors
 * -----------------------------------------------------------------------------
 * Provides responsive navigation components including navbars, sidebars,
 * menus, breadcrumbs, and pagination steps.
 *
 * Custom Tag: <wb-navigation>
 * -----------------------------------------------------------------------------
 *
 * Usage:
 *   <wb-navbar  data-logo="MySite">...</nav>
 *   <aside data-items='[...]'>...</aside>
 * -----------------------------------------------------------------------------
 *
 * FIXED: v2.0
 * - Menu component: Proper flex layout with correct spacing
 * - Navbar component: Better responsive design
 * - Sidebar component: Fixed item layout and hover states
 */
/**
 * Navbar - Navigation bar from data attributes
 * Custom Tag: <wb-navbar>
 *
 * Attributes:
 * - data-brand: Brand name text
 * - data-brand-href: Brand link URL (optional, defaults to /)
 * - data-logo: Logo image URL (optional)
 * - data-logo-size: Logo size in pixels (optional, defaults to 32)
 * - data-items: Comma-separated nav items
 * - data-sticky: Makes navbar sticky on scroll
 */
export function navbar(element, options = {}) {
    const config = {
        brand: options.brand || element.dataset.brand || '',
        brandHref: options.brandHref || element.dataset.brandHref || '/',
        logo: options.logo || element.dataset.logo || '',
        logoSize: options.logoSize || element.dataset.logoSize || '32',
        tagline: options.tagline || element.dataset.tagline || '',
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
    // Build brand element with optional logo
    const buildBrandHTML = () => {
        const logoHTML = config.logo ?
            `<img src="${config.logo}" alt="" style="
        width: ${config.logoSize}px;
        height: ${config.logoSize}px;
        object-fit: contain;
        border-radius: 4px;
      ">` : '';
        const brandTextHTML = config.brand ?
            `<span class="wb-navbar__brand-text">${config.brand}</span>` : '';
        const taglineHTML = config.tagline ?
            `<span class="wb-navbar__tagline" style="font-size: 0.75rem; opacity: 0.7; font-weight: 400;">${config.tagline}</span>` : '';
        // Brand is always a link
        const hasTextContent = config.brand || config.tagline;
        const textWrapperHTML = hasTextContent ? `
      <div class="wb-navbar__brand-wrap" style="display: flex; flex-direction: column; line-height: 1.2;">
        ${brandTextHTML}
        ${taglineHTML}
      </div>` : '';
        return `
      <a class="wb-navbar__brand" href="${config.brandHref}" style="
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        color: inherit;
        transition: opacity 0.15s ease;
      " onmouseenter="this.style.opacity='0.8'" onmouseleave="this.style.opacity='1'">
        ${logoHTML}
        ${textWrapperHTML}
      </a>
    `;
    };
    // Helper to apply navbar item styling to any link element
    const styleNavbarItem = (link) => {
        link.classList.add('wb-navbar__item');
        link.style.opacity = '0.8';
        link.style.textDecoration = 'none';
        link.style.color = 'inherit';
        link.style.transition = 'opacity 0.15s ease';
        link.style.whiteSpace = 'nowrap';
        // Add hover effects if not already added
        if (!link._navbarHover) {
            link._navbarHover = true;
            link.addEventListener('mouseenter', () => link.style.opacity = '1');
            link.addEventListener('mouseleave', () => link.style.opacity = '0.8');
        }
    };
    // Check for existing custom children (links dropped by user in builder)
    const existingChildren = Array.from(element.children).filter(child => {
        // Look for links or elements with
        return child.tagName === 'A' ||
            child.dataset?.wb === 'link' ||
            child.querySelector?.('a, []');
    });
    // If items are provided via data attributes AND no custom children, generate the content
    if ((config.items.length > 0 || config.brand || config.logo) && existingChildren.length === 0) {
        element.innerHTML = `
      ${buildBrandHTML()}
      <div class="wb-navbar__menu" style="
        display: flex;
        gap: 1.5rem;
        flex: 1;
        flex-wrap: wrap;
        justify-content: flex-end;
      ">
        ${config.items.map(item => {
            let label = item.trim();
            let href = '#';
            if (item.includes(':')) {
                const idx = item.indexOf(':');
                label = item.substring(0, idx).trim();
                href = item.substring(idx + 1).trim();
            }
            return `
          <a class="wb-navbar__item" href="${href}" style="
            opacity: 0.8;
            text-decoration: none;
            color: inherit;
            transition: opacity 0.15s ease;
            white-space: nowrap;
          " onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.8'">
            ${label}
          </a>
        `;
        }).join('')}
      </div>
    `;
    }
    else if (existingChildren.length > 0) {
        // Has custom children - style them to match navbar items
        // First, ensure we have a brand if configured
        let menu = element.querySelector('.wb-navbar__menu');
        if (!menu) {
            // Create menu container for the items
            menu = document.createElement('div');
            menu.className = 'wb-navbar__menu';
            menu.style.display = 'flex';
            menu.style.gap = '1.5rem';
            menu.style.flex = '1';
            menu.style.flexWrap = 'wrap';
            menu.style.justifyContent = 'flex-end';
            menu.style.alignItems = 'center';
            // Move custom children into menu
            existingChildren.forEach(child => {
                menu.appendChild(child);
            });
            // Add brand if configured
            if (config.brand || config.logo) {
                element.insertAdjacentHTML('afterbegin', buildBrandHTML());
            }
            element.appendChild(menu);
        }
        // Style all links in the navbar to match
        element.querySelectorAll('a, []').forEach(link => {
            // Don't style the brand link
            if (!link.classList.contains('wb-navbar__brand')) {
                styleNavbarItem(link);
            }
        });
    }
    else {
        // Semantic Mode: Enhance existing content
        // 1. Find or style the list
        const list = element.querySelector('ul, ol');
        if (list) {
            list.style.display = 'flex';
            list.style.gap = '1.5rem';
            list.style.listStyle = 'none';
            list.style.margin = '0';
            list.style.padding = '0';
            list.style.flex = '1';
            list.style.flexWrap = 'wrap';
            // Style links within the list
            const links = list.querySelectorAll('a');
            links.forEach(link => {
                link.style.opacity = '0.8';
                link.style.textDecoration = 'none';
                link.style.color = 'inherit';
                link.style.transition = 'opacity 0.15s ease';
                link.style.whiteSpace = 'nowrap';
                link.addEventListener('mouseenter', () => link.style.opacity = '1');
                link.addEventListener('mouseleave', () => link.style.opacity = '0.8');
            });
        }
        // 2. Style any headings as brand
        const brand = element.querySelector('h1, h2, h3, h4, h5, h6, .brand');
        if (brand) {
            brand.style.fontWeight = '700';
            brand.style.whiteSpace = 'nowrap';
            brand.style.flexShrink = '0';
            brand.style.margin = '0';
            brand.style.fontSize = '1.25rem';
        }
    }
    element.dataset.wbReady = 'navbar';
    return () => element.classList.remove('wb-navbar');
}
/**
 * Sidebar - Vertical navigation from data-items
 * Custom Tag: <wb-sidebar>
 */
export function sidebar(element, options = {}) {
    // Initial config
    let config = {
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
    element.style.transition = 'width 0.2s ease, min-width 0.2s ease';
    const render = () => {
        element.style.minWidth = config.collapsed ? '48px' : '160px';
        element.style.width = config.collapsed ? '48px' : '100%';
        element.style.maxWidth = '100%';
        element.innerHTML = config.items.map(item => {
            let label = item.trim();
            let href = '#';
            if (item.includes(':')) {
                const idx = item.indexOf(':');
                label = item.substring(0, idx).trim();
                href = item.substring(idx + 1).trim();
            }
            const isActive = label === config.active;
            const tooltipAttrs = config.collapsed ? `x-tooltip data-tooltip="${label}" data-tooltip-position="right"` : `title="${label}"`;
            return `
        <a class="wb-sidebar__item" href="${href}" ${tooltipAttrs} style="
          padding: 0.6rem 0.75rem;
          border-radius: 4px;
          text-decoration: none;
          color: inherit;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.15s ease;
          white-space: nowrap;
          overflow: hidden;
          ${isActive ? 'background: var(--primary, #6366f1); color: white; font-weight: 500;' : 'opacity: 0.8;'}
        " onmouseenter="this.style.background='var(--bg-tertiary,#374151)';this.style.opacity='1'" 
           onmouseleave="${isActive ? 'this.style.background=\"var(--primary, #6366f1)\";' : 'this.style.background=\"\";this.style.opacity=\"0.8\";'}">
          ${label}
        </a>
      `;
        }).join('');
        // Initialize behaviors on new content (e.g. tooltips)
        if (window.WB && window.WB.scan) {
            window.WB.scan(element);
        }
    };
    render();
    // Watch for attribute changes to handle dynamic collapsing
    const observer = new MutationObserver((mutations) => {
        let shouldRender = false;
        for (const mutation of mutations) {
            if (mutation.attributeName === 'data-collapsed') {
                config.collapsed = element.hasAttribute('data-collapsed');
                shouldRender = true;
            }
            else if (mutation.attributeName === 'data-items') {
                config.items = (element.dataset.items || '').split(',').filter(Boolean);
                shouldRender = true;
            }
            else if (mutation.attributeName === 'data-active') {
                config.active = element.dataset.active || '';
                shouldRender = true;
            }
        }
        if (shouldRender) {
            render();
        }
    });
    observer.observe(element, { attributes: true, attributeFilter: ['data-collapsed', 'data-items', 'data-active'] });
    element.dataset.wbReady = 'sidebar';
    return () => {
        observer.disconnect();
        element.classList.remove('wb-sidebar');
    };
}
/**
 * Menu - Clickable menu from data-items
 * Custom Tag: <wb-menu>
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
    element.innerHTML = config.items.map((item, idx) => {
        let label = item.trim();
        let value = label;
        if (item.includes(':')) {
            const splitIdx = item.indexOf(':');
            label = item.substring(0, splitIdx).trim();
            value = item.substring(splitIdx + 1).trim();
        }
        return `
    <div class="wb-menu__item" role="menuitem" tabindex="0" data-index="${idx}" data-value="${value}" style="
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
      <span>${label}</span>
    </div>
  `;
    }).join('');
    // Add keyboard navigation
    const items = element.querySelectorAll('.wb-menu__item');
    items.forEach((item, idx) => {
        item.addEventListener('click', (e) => {
            element.dispatchEvent(new CustomEvent('wb:menu:select', {
                bubbles: true,
                detail: {
                    index: idx,
                    label: item.textContent.trim(),
                    value: item.dataset.value || item.textContent.trim()
                }
            }));
        });
        item.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                items[(idx + 1) % items.length]?.focus();
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                items[(idx - 1 + items.length) % items.length]?.focus();
            }
            else if (e.key === 'Enter' || e.key === ' ') {
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
 * Custom Tag: <wb-pagination>
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
        if (!btn || btn.disabled)
            return;
        if (btn.dataset.action === 'prev')
            config.current--;
        else if (btn.dataset.action === 'next')
            config.current++;
        else if (btn.dataset.page)
            config.current = parseInt(btn.dataset.page);
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
 * Custom Tag: <wb-steps>
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
 * Custom Tag: <wb-treeview>
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
        if (!toggle)
            return;
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
 * Custom Tag: <wb-backtotop>
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
 * Custom Tag: <wb-link>
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
    }
    else {
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
        }
        else {
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
            }
            catch {
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
            }
            catch (err) {
                if (err.name === 'AbortError') {
                    markInvalid('URL timeout - server not responding');
                }
                else {
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
            }
            else if (validPages.includes(targetId)) {
                // Valid page - navigate
                markValid();
                window.location.hash = href;
            }
            else {
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
 * Custom Tag: <wb-statusbar>
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
        // Compliance: Do not modify body padding. User must handle layout spacing.
        // document.body.style.paddingBottom = '1.5rem';
    }
    else if (config.position === 'top') {
        element.style.position = 'fixed';
        element.style.top = '0';
        element.style.left = '0';
        element.style.zIndex = '100';
        element.style.borderTop = 'none';
        element.style.borderBottom = '1px solid var(--border-color, #374151)';
        // Compliance: Do not modify body padding.
        // document.body.style.paddingTop = '1.5rem';
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
        }
        else {
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
            const rightSpan = document.createElement('span');
            rightSpan.textContent = item.trim();
            element.appendChild(rightSpan);
        });
    }
    // Event listener for status messages
    const handleStatusMessage = (e) => {
        const { message, type, duration = 3000 } = e.detail;
        messageArea.textContent = message;
        messageArea.style.opacity = '1';
        if (type === 'error')
            messageArea.style.color = 'var(--danger-color, #ef4444)';
        else if (type === 'success')
            messageArea.style.color = 'var(--success-color, #10b981)';
        else
            messageArea.style.color = 'var(--text-primary, #e5e7eb)';
        if (element._statusTimeout)
            clearTimeout(element._statusTimeout);
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
//# sourceMappingURL=navigation.js.map
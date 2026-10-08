import { readFlag, readAttr, authoredAttr } from '../core/read-attr.js';
import { setRule, clearRulesIn } from '../core/dynamic-style.js';
/**
 * Navigation Behaviors
 * -----------------------------------------------------------------------------
 * Provides responsive navigation components including navbars, sidebars,
 * menus, breadcrumbs, and pagination steps.
 * 
 * Custom Tag: <div>
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <div x-navbar  data-logo="MySite">...</nav>
 *   <aside data-items='[...]'>...</aside>
 * -----------------------------------------------------------------------------
 * 
 * FIXED: v2.0
 * - Menu component: Proper flex layout with correct spacing
 * - Navbar component: Better responsive design
 * - Sidebar component: Fixed item layout and hover states
 */

/**
 * Split one "Label:value" list item. With no colon the whole (trimmed) item is
 * the label and the value is `fallback`, or the label itself when no fallback
 * is given. navbar(), sidebar() and menu() each parsed this by hand (#883).
 */
function splitItem(item, fallback) {
  const idx = item.indexOf(':');
  if (idx === -1) {
    const label = item.trim();
    return { label, value: fallback === undefined ? label : fallback };
  }
  return { label: item.substring(0, idx).trim(), value: item.substring(idx + 1).trim() };
}

/**
 * Navbar - Navigation bar from data attributes
 * Custom Tag: <div x-navbar>
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
    brand: options.brand || element.getAttribute('brand') || '',
    brandHref: options.brandHref || readAttr(element, 'brandHref', '/'),
    logo: options.logo || element.getAttribute('logo') || '',
    logoSize: options.logoSize || authoredAttr(element, 'logo-size') || '32',
    tagline: options.tagline || element.getAttribute('tagline') || '',
    items: (options.items || element.getAttribute('items') || '').split(',').filter(Boolean),
    sticky: options.sticky ?? readFlag(element, 'sticky'),
    ...options
  };

  // #448: no classList.add('x-navbar') -- no CSS selector anywhere depends
  // on the bare class.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-navbar> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-navbar> tag does not get a redundant class.
  element.classList.add('x-navbar');

  // #958: a <nav> picks up navbar with no attribute (nativeMap). A PLAIN one --
  // no x-navbar, no brand/logo/items/sticky/variant -- is an in-page nav: it
  // gets the site's link look (.x-navbar--plain, navbar.css) and nothing else.
  // Wrapping its links into the header's flex menu moved a "Back" link from
  // 0px to 854px on 9 of 12 such navs. A <nav> that asks for a header gets
  // .x-navbar--site, which navbar.css styles exactly like [x-navbar].
  const authored = element.hasAttribute('x-navbar');
  const asksForHeader = config.brand || config.logo || config.items.length > 0 || config.sticky || element.hasAttribute('variant');
  if (!authored && !asksForHeader) {
    element.classList.add('x-navbar--plain');
    return () => element.classList.remove('x-navbar', 'x-navbar--plain');
  }
  if (!authored) element.classList.add('x-navbar--site');
  // Appearance lives in src/styles/behaviors/navbar.css (#903). Writing it
  // inline here beat every stylesheet rule, which is why the declared
  // variant=dark|transparent rendered identically to default.

  // #779: sticky / brand / logo / tagline / menu / item styling are all
  // navbar.css rules keyed on the classes below -- every one of them used to
  // be an inline style or an onmouseenter handler writing element.style.
  if (config.sticky) element.classList.add('x-navbar--sticky');

  // Build brand element with optional logo. The logo's 32px default is
  // navbar.css's; another logo-size is applied as a generated rule once the
  // markup exists (sizeLogo below).
  const buildBrandHTML = () => {
    const logoHTML = config.logo ?
      `<img class="x-navbar__logo" src="${config.logo}" alt="">` : '';

    const brandTextHTML = config.brand ?
      `<span class="x-navbar__brand-text">${config.brand}</span>` : '';

    const taglineHTML = config.tagline ?
      `<span class="x-navbar__tagline">${config.tagline}</span>` : '';

    // Brand is always a link
    const hasTextContent = config.brand || config.tagline;
    const textWrapperHTML = hasTextContent ? `
      <div class="x-navbar__brand-wrap">
        ${brandTextHTML}
        ${taglineHTML}
      </div>` : '';

    return `
      <a class="x-navbar__brand" href="${config.brandHref}">
        ${logoHTML}
        ${textWrapperHTML}
      </a>
    `;
  };

  // Weight 4: navbar.css sizes `[x-navbar] a:first-of-type img` at 40px and
  // the default 32px rule has to outrank that, so an author's size must too.
  const sizeLogo = () => {
    const logo = element.querySelector(':scope > .x-navbar__brand > .x-navbar__logo');
    if (logo && String(config.logoSize) !== '32') {
      setRule(logo, 'size', { width: `${config.logoSize}px`, height: `${config.logoSize}px` }, { weight: 4 });
    }
  };

  // Helper to apply navbar item styling to any link element: the class is
  // the styling, including its :hover (navbar.css, #779).
  const styleNavbarItem = (link) => {
    link.classList.add('x-navbar__item');
  };

  // Check for existing custom children (links dropped by user in builder)
  // On the lazy runtime navbar.schema.json's $view is built FIRST: it adds
  // its own a.x-navbar__brand, div.x-navbar__nav and button.x-navbar__toggle.
  // Those are this behavior's parts, not links the author dropped in -- but
  // the schema brand is an <a>, so it was taken for a custom child: moved into
  // .x-navbar__menu while a second brand was prepended, and the long brand
  // text overflowed the menu onto the empty toggle button (overlap on
  // demos/site/layout.html). Schema-built parts are excluded here, so this
  // falls through to the brand/items build below like any unbuilt navbar.
  const SCHEMA_PARTS = ['x-navbar__brand', 'x-navbar__nav', 'x-navbar__toggle'];
  const existingChildren = Array.from(element.children).filter(child => {
    if (SCHEMA_PARTS.some(cls => child.classList.contains(cls))) return false;
    // Direct child is a link/x-link, OR a link/x-link sits nested inside
    // it (e.g. a wrapper <div><a>...</a></div>) -- was querySelector('a,
    // []'), an invalid selector ('[]' has no attribute name) that threw on
    // every navbar render.
    return child.tagName === 'A' ||
           child.getAttribute('wb') === 'link' ||
           child.querySelector?.('a, [wb="link"]');
  });

  // If items are provided via data attributes AND no custom children, generate the content
  if ((config.items.length > 0 || config.brand || config.logo) && existingChildren.length === 0) {
    element.innerHTML = `
      ${buildBrandHTML()}
      <div class="x-navbar__menu">
        ${config.items.map(item => {
          const { label, value: href } = splitItem(item, '#');
          return `
          <a class="x-navbar__item" href="${href}">
            ${label}
          </a>
        `}).join('')}
      </div>
    `;
    sizeLogo();
  } else if (existingChildren.length > 0) {
    // Has custom children - style them to match navbar items
    // First, ensure we have a brand if configured
    let menu = element.querySelector('.x-navbar__menu');
    if (!menu) {
      // Create menu container for the items
      // (align-items: center is --custom's addition to .x-navbar__menu.)
      menu = document.createElement('div');
      menu.className = 'x-navbar__menu x-navbar__menu--custom';

      // Move custom children into menu
      existingChildren.forEach(child => {
        menu.appendChild(child);
      });
      
      // Add brand if configured
      if (config.brand || config.logo) {
        element.insertAdjacentHTML('afterbegin', buildBrandHTML());
        sizeLogo();
      }
      element.appendChild(menu);
    }
    
    // Style all links in the navbar to match -- was 'a, []' (same invalid
    // empty-attribute-selector bug as the existingChildren filter above),
    // throwing on every navbar render that reaches this custom-children branch.
    element.querySelectorAll('a, [wb="link"]').forEach(link => {
      // Don't style the brand link
      if (!link.classList.contains('x-navbar__brand')) {
        styleNavbarItem(link);
      }
    });
  } else {
    // Semantic Mode: Enhance existing content
    // 1. Find or style the list
    // The list, its links and a heading-as-brand get classes navbar.css
    // styles (#779); the links share .x-navbar__item's look and hover.
    const list = element.querySelector('ul, ol');
    if (list) {
      list.classList.add('x-navbar__list');
      list.querySelectorAll('a').forEach(link => link.classList.add('x-navbar__item'));
    }

    // 2. Style any headings as brand
    const brand = element.querySelector('h1, h2, h3, h4, h5, h6, .brand');
    if (brand) brand.classList.add('x-navbar__heading-brand');
  }

  return () => {
    clearRulesIn(element);
    element.classList.remove('x-navbar', 'x-navbar--sticky');
  };
}

/**
 * Sidebar - Vertical navigation panel
 * Custom Tag: <nav x-sidebar> (or any element)
 *
 * Attributes (plain or data-* spelling, followed after load):
 * - items:       "Label:href,Label:href" -- or a JSON array of
 *                {id, label, href, icon, target} for items with an icon (#829)
 * - active:      the id (or label) of the highlighted item
 * - collapsed:   icon-only; each item keeps its label as aria-label + tooltip
 * - resizable:   a drag handle on the right edge (arrow keys when focused)
 * - width:       starting width (px number or any CSS length)
 * - resize-min / resize-max: drag bounds in px (default 60 / 600)
 *
 * The site's own left nav (site-engine.js) is this behavior (#829 step 4); it
 * used to be a second, hand-rolled copy of items, active, collapse and resize.
 */
export function sidebar(element, options = {}) {
  /** One item, whichever spelling it came in. */
  const toItem = (raw) => {
    const name = String(raw.label ?? raw.id ?? '');
    return {
      id: raw.id == null || raw.id === '' ? name : String(raw.id),
      label: name,
      href: raw.href || '#',
      icon: raw.icon,
      target: raw.target || '',
    };
  };
  const parseItems = (raw) => {
    if (Array.isArray(raw)) return raw.map(toItem);
    const text = String(raw || '').trim();
    if (text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed.map(toItem) : [];
      } catch (err) {
        console.warn('[WB:sidebar] items is not valid JSON:', err.message);
        return [];
      }
    }
    return text.split(',').filter(Boolean).map((item) => {
      const { label, value } = splitItem(item, '#');
      return toItem({ label, href: value });
    });
  };

  // #1683: items/active/collapsed are read in every spelling read-attr.js
  // accepts (plain or data-*), here AND when they change -- the observer
  // used to watch only data-* and then re-read only the plain spelling, so
  // neither form moved the active item after load.
  const config = {
    items: parseItems(options.items ?? readAttr(element, 'items')),
    active: options.active || readAttr(element, 'active'),
    collapsed: options.collapsed ?? readFlag(element, 'collapsed'),
    resizable: options.resizable ?? readFlag(element, 'resizable'),
  };

  // #779: the panel, its collapsed width and the items (with their active
  // and :hover states) are .x-sidebar* rules in navigation.css -- they were
  // inline styles and onmouseenter/onmouseleave attribute handlers.
  element.classList.add('x-sidebar');

  const list = document.createElement('div');
  list.className = 'x-sidebar__items';
  element.replaceChildren(list);

  /** Highlight the active item in place: no rebuild, so focus and ripples stay. */
  const applyActive = () => {
    list.querySelectorAll('.x-sidebar__item').forEach((a, i) => {
      const item = config.items[i];
      const on = !!item && !!config.active && (item.id === config.active || item.label === config.active);
      a.classList.toggle('x-sidebar__item--active', on);
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  };

  const render = () => {
    element.classList.toggle('x-sidebar--collapsed', !!config.collapsed);
    // A rebuild must not drop the reader's place: put focus back on the same item.
    const focused = [...list.children].indexOf(/** @type {Element} */ (document.activeElement));

    list.replaceChildren(...config.items.map((item) => {
      const a = document.createElement('a');
      a.className = 'x-sidebar__item';
      a.setAttribute('href', item.href);
      if (item.target) a.setAttribute('target', item.target);
      a.setAttribute('x-ripple', '');
      if (item.icon !== undefined) {
        const icon = document.createElement('span');
        icon.className = 'x-sidebar__icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = item.icon || '';
        a.append(icon);
      }
      const label = document.createElement('span');
      label.className = 'x-sidebar__label';
      label.textContent = item.label;
      a.append(label);
      if (config.collapsed) {
        // Icon-only: the label is hidden, so it becomes the link's name and tooltip.
        a.setAttribute('aria-label', item.label);
        a.setAttribute('x-tooltip', '');
        a.setAttribute('content', item.label);
        a.setAttribute('position', 'right');
      }
      return a;
    }));
    applyActive();
    if (focused >= 0) /** @type {HTMLElement|undefined} */ (list.children[focused])?.focus();

    // Initialize behaviors on new content (ripples, tooltips)
    if (window.WB && window.WB.scan) {
      window.WB.scan(list);
    }
  };

  // ── width and drag-resize ────────────────────────────────────────────────
  // The width travels as --x-sidebar-width through a generated rule, never a
  // style attribute (#779), so a stylesheet can still decide what to do with it.
  const bound = (name, fallback) => {
    const n = Number(readAttr(element, name, ''));
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  let width = null;
  let handle = null;
  const setWidth = (value) => {
    if (value === '' || value == null) return;
    if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value))) {
      const min = bound('resize-min', 60);
      const max = bound('resize-max', 600);
      width = Math.round(Math.min(max, Math.max(min, Number(value))));
      setRule(element, 'width', { '--x-sidebar-width': `${width}px` });
      handle?.setAttribute('aria-valuenow', String(width));
      element.dispatchEvent(new CustomEvent('wb:sidebar:resize', { bubbles: true, detail: { width } }));
    } else {
      width = null;
      setRule(element, 'width', { '--x-sidebar-width': String(value) });
    }
  };
  setWidth(options.width ?? readAttr(element, 'width'));

  if (config.resizable) {
    element.classList.add('x-sidebar--resizable');
    handle = document.createElement('div');
    handle.className = 'x-sidebar__resizer';
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.setAttribute('aria-label', 'Resize navigation');
    handle.setAttribute('aria-valuemin', String(bound('resize-min', 60)));
    handle.setAttribute('aria-valuemax', String(bound('resize-max', 600)));
    handle.tabIndex = 0;
    element.append(handle);

    const current = () => width ?? Math.round(element.getBoundingClientRect().width);
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const left = element.getBoundingClientRect().left;
      handle.setPointerCapture?.(e.pointerId);
      // The col-resize cursor over the whole page while dragging (navigation.css).
      document.body.classList.add('x-sidebar--resizing');
      const move = (ev) => setWidth(ev.clientX - left);
      const stop = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', stop);
        handle.removeEventListener('pointercancel', stop);
        document.body.classList.remove('x-sidebar--resizing');
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', stop);
      handle.addEventListener('pointercancel', stop);
    });
    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 50 : 10;
      const to = {
        ArrowLeft: () => current() - step,
        ArrowRight: () => current() + step,
        Home: () => bound('resize-min', 60),
        End: () => bound('resize-max', 600),
      }[e.key];
      if (!to) return;
      e.preventDefault();
      setWidth(to());
    });
  }

  render();

  // Watch for attribute changes: a new active item only moves the highlight;
  // new items or a collapse rebuild the list.
  const observer = new MutationObserver((mutations) => {
    const changed = new Set(mutations.map((m) => String(m.attributeName).replace(/^data-/, '')));
    if (changed.has('width')) setWidth(readAttr(element, 'width'));
    config.active = readAttr(element, 'active');
    if (changed.has('items') || changed.has('collapsed')) {
      config.collapsed = readFlag(element, 'collapsed');
      config.items = parseItems(readAttr(element, 'items'));
      render();
    } else {
      applyActive();
    }
  });

  observer.observe(element, {
    attributes: true,
    attributeFilter: ['collapsed', 'items', 'active', 'width', 'data-collapsed', 'data-items', 'data-active', 'data-width'],
  });

  return () => {
    observer.disconnect();
    handle?.remove();
    clearRulesIn(element);
    element.classList.remove('x-sidebar', 'x-sidebar--collapsed', 'x-sidebar--resizable');
  };
}

/**
 * Menu - Clickable menu from data-items
 * Custom Tag: <div>
 * FIXED: Proper flex layout, correct spacing, better hover states
 */
export function menu(element, options = {}) {
  const config = {
    items: (options.items || element.getAttribute('items') || '').split(',').filter(Boolean),
    ...options
  };

  // #779: the panel and its items (and their :hover) are .x-menu* rules in
  // navigation.css, not inline styles and attribute handlers.
  element.classList.add('x-menu');
  element.setAttribute('role', 'menu');

  element.innerHTML = config.items.map((item, idx) => {
    const { label, value } = splitItem(item);

    return `
    <div class="x-menu__item" role="menuitem" tabindex="0" data-index="${idx}" data-value="${value}">
      <span>${label}</span>
    </div>
  `}).join('');

  // Add keyboard navigation
  const items = element.querySelectorAll('.x-menu__item');
  items.forEach((item, idx) => {
    // The old onmouseleave left an item at opacity 0.9 once it had been
    // hovered (it started at 1). Kept as a class so the look is unchanged.
    item.addEventListener('mouseleave', () => item.classList.add('x-menu__item--visited'), { once: true });
    item.addEventListener('click', (e) => {
      element.dispatchEvent(new CustomEvent('wb:menu:select', {
        bubbles: true,
        detail: { 
          index: idx, 
          label: item.textContent.trim(),
          value: item.getAttribute('value') || item.textContent.trim()
        }
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

  return () => element.classList.remove('x-menu');
}

/**
 * Pagination - Page navigation from data-pages
 * Custom Tag: <div>
 */
/**
 * Pagination
 * CSS: src/styles/behaviors/pagination.css
 * Uses <span role="button"> to avoid button auto-inject collision.
 * No x-ready, no component classes added by JS.
 */
export function pagination(element, options = {}) {
  const total = parseInt(options.total || element.getAttribute('total') || '0');
  const perPage = parseInt(options.perPage || authoredAttr(element, 'per-page') || '10');
  const pages = parseInt(options.pages || element.getAttribute('pages') || '0') || Math.ceil(total / perPage) || 1;
  let current = parseInt(options.current || element.getAttribute('current') || '1');

  element.setAttribute('role', 'navigation');

  // #879: which page a button goes to is this behavior's own state, kept
  // here. It used to be written to a `page` attribute only to be read back on
  // click, which made it look like an option an author could pass.
  const pageOf = new WeakMap();

  const createBtn = (text, attrs, page) => {
    const span = document.createElement('span');
    span.setAttribute('role', 'button');
    for (const [k, v] of Object.entries(attrs)) span.setAttribute(k, v);
    if (page) pageOf.set(span, page);
    span.textContent = text;
    element.appendChild(document.createTextNode('\n  '));
    element.appendChild(span);
  };

  const render = () => {
    element.innerHTML = '';

    const prevAttrs = { action: 'prev', 'aria-label': 'Previous page' };
    if (current <= 1) { prevAttrs['aria-disabled'] = 'true'; prevAttrs.tabindex = '-1'; }
    createBtn('\u2039', prevAttrs);

    for (let i = 1; i <= pages; i++) {
      const attrs = { 'aria-label': `Page ${i}` };
      if (i === current) attrs['aria-current'] = 'page';
      createBtn(String(i), attrs, i);
    }

    const nextAttrs = { action: 'next', 'aria-label': 'Next page' };
    if (current >= pages) { nextAttrs['aria-disabled'] = 'true'; nextAttrs.tabindex = '-1'; }
    createBtn('\u203a', nextAttrs);

    element.appendChild(document.createTextNode('\n'));
  };

  element.addEventListener('click', (e) => {
    const btn = e.target.closest('[role="button"]');
    if (!btn || btn.getAttribute('aria-disabled') === 'true') return;

    const action = btn.getAttribute('action');
    const page = pageOf.get(btn);
    if (action === 'prev') current--;
    else if (action === 'next') current++;
    else if (page) current = page;

    render();
    element.dispatchEvent(new CustomEvent('wb:pagination:change', {
      bubbles: true,
      detail: { page: current }
    }));
  });

  render();
  return () => { element.innerHTML = ''; };
}

/**
 * Steps - Step indicator from data-items
 * Custom Tag: <div>
 */
export function steps(element, options = {}) {
  const config = {
    items: (options.items || element.getAttribute('items') || '').split(',').map(s => s.trim()).filter(Boolean),
    current: parseInt(options.current || element.getAttribute('current') || '1'),
    ...options
  };

  // #779: the row, each step's marker (complete / active / pending), its
  // label and the connector are .x-steps* rules in steps.css -- they were
  // inline style="" blocks in this template.
  element.classList.add('x-steps');

  element.innerHTML = config.items.map((item, i) => {
    const step = i + 1;
    const isComplete = step < config.current;
    const isActive = step === config.current;
    const state = isComplete ? 'complete' : isActive ? 'active' : 'pending';

    return `
      <div class="x-steps__item">
        <div class="x-steps__marker x-steps__marker--${state}">${isComplete ? '✓' : step}</div>
        <span class="x-steps__label${isActive ? ' x-steps__label--active' : ''}">${item.trim()}</span>
        ${i < config.items.length - 1 ? '<div class="x-steps__connector"></div>' : ''}
      </div>
    `;
  }).join('');

  return () => element.classList.remove('x-steps');
}

/**
 * Treeview - Hierarchical tree from JSON
 * Custom Tag: <div>
 */
export function treeview(element, options = {}) {
  const config = {
    items: options.items || JSON.parse(element.getAttribute('items') || '[]'),
    ...options
  };

  // #779: node, toggle and collapsed-children styling are .x-treeview* rules
  // in navigation.css; open/closed is a class. Only each node's indent
  // (1.5rem per level) is computed, so it travels as a generated rule.
  element.classList.add('x-treeview');
  element.setAttribute('role', 'tree');

  const renderNode = (node) => {
    const hasChildren = node.children && node.children.length > 0;

    return `
      <div class="x-treeview__item" role="treeitem">
        <div class="x-treeview__node${hasChildren ? ' x-treeview__node--branch' : ''}">
          ${hasChildren ? '<span class="x-treeview__toggle">▶</span>' : '<span class="x-treeview__spacer"></span>'}
          <span class="x-treeview__label">${node.name}</span>
        </div>
        ${hasChildren ? `<div class="x-treeview__children">${node.children.map(c => renderNode(c)).join('')}</div>` : ''}
      </div>
    `;
  };

  element.innerHTML = config.items.map(item => renderNode(item)).join('');
  // #879: the depth is where the node sits, so it is counted from the tree
  // itself. It used to be written into a data-depth attribute only to be read
  // straight back here, which made internal state look like an author option.
  element.querySelectorAll('.x-treeview__node').forEach((nodeEl) => {
    let depth = 0;
    for (let p = nodeEl.parentElement; p && p !== element; p = p.parentElement) {
      if (p.classList.contains('x-treeview__children')) depth++;
    }
    if (depth) setRule(nodeEl, 'indent', { paddingLeft: `${depth * 1.5}rem` }, { weight: 2 });
  });

  // Toggle children visibility
  element.addEventListener('click', (e) => {
    const toggle = e.target.closest('.x-treeview__toggle');
    if (!toggle) return;
    
    const item = toggle.closest('.x-treeview__item');
    const children = item?.querySelector('.x-treeview__children');
    
    if (children) {
      const isOpen = children.classList.contains('x-treeview__children--open');
      children.classList.toggle('x-treeview__children--open', !isOpen);
      toggle.classList.toggle('x-treeview__toggle--open', !isOpen);
    }
  });

  return () => {
    clearRulesIn(element);
    element.classList.remove('x-treeview');
  };
}

/**
 * BackToTop - Scroll to top button
 * Custom Tag: <div>
 */
export function backtotop(element, options = {}) {
  const config = {
    threshold: parseInt(options.threshold || element.getAttribute('threshold') || '300'),
    ...options
  };

  // #779: hidden/shown is .x-backtotop / --visible in navigation.css.
  element.classList.add('x-backtotop');

  const updateVisibility = () => {
    element.classList.toggle('x-backtotop--visible', window.scrollY > config.threshold);
  };

  window.addEventListener('scroll', updateVisibility);
  updateVisibility();

  element.onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return () => {
    element.classList.remove('x-backtotop', 'x-backtotop--visible');
    window.removeEventListener('scroll', updateVisibility);
  };
}

/**
 * Link - Clickable link that navigates to internal sections or external URLs
 * Custom Tag: <div>
 * Validates URLs on click - turns red and logs error if invalid
 */
export function link(element, options = {}) {
  const config = {
    href: options.href || element.getAttribute('href') || element.getAttribute('href') || '#',
    text: options.text || element.getAttribute('text') || element.textContent || 'Link',
    offset: parseInt(options.offset || element.getAttribute('offset') || '0'),
    ...options
  };

  // #779: colour, underline and the red invalid state are .x-link and
  // .x-link--invalid in navigation.css.
  element.classList.add('x-link');
  
  // Set href attribute and text content
  if (element.tagName === 'A') {
    element.href = config.href;
    // External links open in new tab
    if (config.href.startsWith('http://') || config.href.startsWith('https://')) {
      element.target = '_blank';
      element.rel = 'noopener noreferrer';
    }
  } else {
    element.setAttribute('href', config.href);
  }
  
  if (!element.textContent.trim() || element.textContent === 'Link') {
    element.textContent = config.text;
  }

  // Mark link as invalid (red)
  const markInvalid = (reason) => {
    element.classList.add('x-link--invalid');
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
    element.classList.remove('x-link--invalid');
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

  return () => element.classList.remove('x-link');
}

/**
 * Statusbar - Bottom status bar
 * Custom Tag: <div>
 */
export function statusbar(element, options = {}) {
  const config = {
    items: (options.items || element.getAttribute('items') || '').split(',').filter(Boolean),
    position: options.position || element.getAttribute('position') || 'bottom',
    ...options
  };

  // #779: the bar, its fixed top/bottom placement and the message area's
  // states are .x-statusbar* rules in navigation.css. (Compliance: body
  // padding is still never modified -- the author handles layout spacing.)
  element.classList.add('x-statusbar');
  if (config.position === 'bottom' || config.position === 'fixed') {
    element.classList.add('x-statusbar--bottom');
  } else if (config.position === 'top') {
    element.classList.add('x-statusbar--top');
  }

  // Create message area
  let messageArea = element.querySelector('.x-statusbar__message');
  if (!messageArea) {
    messageArea = document.createElement('span');
    messageArea.className = 'x-statusbar__message';

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
      const rightSpan = document.createElement('span');
      rightSpan.textContent = item.trim();
      element.appendChild(rightSpan);
    });
  }

  // Event listener for status messages
  const handleStatusMessage = (e) => {
    const { message, type, duration = 3000 } = e.detail;
    messageArea.textContent = message;
    messageArea.classList.add('x-statusbar__message--visible');
    messageArea.classList.toggle('x-statusbar__message--error', type === 'error');
    messageArea.classList.toggle('x-statusbar__message--success', type === 'success');

    if (element._statusTimeout) clearTimeout(element._statusTimeout);

    element._statusTimeout = setTimeout(() => {
      messageArea.classList.remove('x-statusbar__message--visible');
    }, duration);
  };

  document.addEventListener('wb:status:message', handleStatusMessage);

  return () => {
    element.classList.remove('x-statusbar');
    document.removeEventListener('wb:status:message', handleStatusMessage);
  };
}

export default { navbar, sidebar, menu, pagination, steps, treeview, backtotop, link, statusbar };

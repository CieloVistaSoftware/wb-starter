import { readFlag, readNumber } from '../core/read-attr.js';
import { setRule } from '../core/dynamic-style.js';
/**
 * Dropdown Behavior
 * -----------------------------------------------------------------------------
 * Click to show menu.
 * 
 * Custom Tag: <div x-dropdown>
 * 
 * Usage:
 *   Option 1 - data-items attribute:
 *     <div x-dropdown  data-items="Profile,Settings,Logout">Click me</div>
 * 
 *   Option 2 - data-label with child elements:
 *     <div x-dropdown  data-label="Options">
 *       <a href="#">Profile</a>
 *       <a href="#">Settings</a>
 *     </div>
 * -----------------------------------------------------------------------------
 */
export function dropdown(element, options = {}) {
  const config = {
    items: (options.items || element.getAttribute('items') || '').split(',').filter(Boolean),
    label: options.label || element.getAttribute('label') || '',
    // dropdown.schema.json's actual enum is bottom-start/bottom-end/
    // top-start/top-end (RTL-aware logical naming) -- the default here
    // must match, or the posStyles lookup below always misses and every
    // position value collapses to the same fallback.
    position: options.position || element.getAttribute('position') || 'bottom-start',
    closeOnSelect: options.closeOnSelect ?? (element.getAttribute('close-on-select') !== 'false'),
    // dropdown.schema.json declares trigger: click|hover, but this was never
    // actually read anywhere in this file -- only the unconditional click
    // handler below existed, so `trigger="hover"` silently did nothing
    // (confirmed live: hovering never opened the menu, only clicking did,
    // identical to every other dropdown regardless of this attribute).
    trigger: options.trigger || element.getAttribute('trigger') || 'click',
    // Both declared in dropdown.schema.json and read by nothing until now:
    // outside-click-to-close was unconditional and the menu gap a fixed 4px.
    closeOnOutside: options.closeOnOutside ?? readFlag(element, 'close-on-outside', true),
    offset: options.offset ?? readNumber(element, 'offset', 4),
    ...options
  };

  // #448: skip the class on a literal <div x-dropdown> host -- dropdown.css
  // selects the `x-dropdown` TAG directly for that case now. Still added
  // for every OTHER host (x-dropdown on a <button>, per demos/site/
  // interactive.html), since dropdown.css's `.x-dropdown`/`.x-dropdown.open`
  // rules still select those by class.
  element.classList.add('x-dropdown');
  element.classList.add('x-dropdown-trigger');
  // position: relative / display: inline-block were already the
  // `x-dropdown, [x-dropdown], .x-dropdown` rule in dropdown.css -- the inline
  // copies are gone (#779).

  // Check if using child elements as menu items
  const childElements = Array.from(element.children).filter(
    child => child.tagName === 'A' || child.tagName === 'BUTTON' || child.tagName === 'DIV'
  );
  const hasChildItems = childElements.length > 0 && config.items.length === 0;

  // Create trigger button if using label
  let trigger;
  if (config.label || hasChildItems) {
    trigger = document.createElement('button');
    trigger.className = 'x-dropdown__trigger';
    trigger.type = 'button';
    // Styled by .x-dropdown__trigger / __chevron in dropdown.css (#779).
    trigger.innerHTML = `${config.label || 'Menu'} <span class="x-dropdown__chevron">▼</span>`;
  }

  // Create menu
  const menu = document.createElement('div');
  menu.className = 'x-dropdown__menu';
  
  // Placement is an x-dropdown__menu--{position} class in dropdown.css. Keys
  // MUST match dropdown.schema.json's `position` enum (bottom-start/
  // bottom-end/top-start/top-end) -- this used to be keyed left/right, which
  // never matched any real attribute value, so every position silently fell
  // through to the same default (confirmed live: all 4 position-variant
  // demos rendered identically). An unknown value still falls back to
  // bottom-start. #779: the whole menu box used to be one cssText block; it
  // is .x-dropdown__menu now, including #707's fluid width. Only an offset
  // other than the 4px default travels, as a generated rule.
  const POSITIONS = ['bottom-start', 'bottom-end', 'top-start', 'top-end'];
  const position = POSITIONS.includes(config.position) ? config.position : 'bottom-start';
  menu.classList.add(`x-dropdown__menu--${position}`);
  if (Number(config.offset) !== 4) {
    setRule(menu, 'offset', { '--x-dropdown-offset': `${config.offset}px` });
  }

  // Populate menu from items OR move child elements into menu
  if (hasChildItems) {
    // Move existing children into menu and style them
    childElements.forEach(child => {
      // #707 (never wrap), #701 (flex, so an avatar or icon sits on the
      // label's baseline) and the hover background are .x-dropdown__item and
      // .x-dropdown__item--child in dropdown.css (#779) -- the hover is a
      // :hover rule now, not a pair of listeners writing element.style.
      child.classList.add('x-dropdown__item', 'x-dropdown__item--child');
      menu.appendChild(child);
    });
  } else if (config.items.length > 0) {
    // Create menu items from data-items
    // Item box and hover: .x-dropdown__item in dropdown.css (#779).
    menu.innerHTML = config.items.map(item => `
      <div class="x-dropdown__item">${item.trim()}</div>
    `).join('');
  }

  // Assemble: if using label/children, add trigger first
  if (trigger) {
    element.innerHTML = '';
    element.appendChild(trigger);
  } else {
    // No label, no child <a>/<button>/<div> items -- the host's own bare
    // text content (e.g. <div x-dropdown position="...">click me</div>)
    // IS the trigger (clickHandler below already handles `e.target ===
    // element`), but it had zero visual styling: no background, border,
    // padding, or pointer cursor -- confirmed live, it just looked like
    // plain unstyled text with no clickable affordance. Style the host
    // itself the same way .x-dropdown__trigger styles a real button.
    //
    // It must also BE a button to anything that is not a mouse. With no role
    // and no tabindex the host was unreachable by keyboard and announced as
    // plain text, and page audits judged it a text panel rather than the
    // control it is (demo-layout-standards flagged every bare-text trigger on
    // demos/site/overlays.html for its button-scale padding).
    if (!element.hasAttribute('role')) element.setAttribute('role', 'button');
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');
    element.setAttribute('aria-haspopup', 'menu');
    element.setAttribute('aria-expanded', 'false');
  }
  element.appendChild(menu);

  let isOpen = false;

  const toggle = () => {
    if (config.trigger === 'hover' && isOpen) return;
    isOpen = !isOpen;
    // Shown (with its fade-in) by .x-dropdown__menu--open (#779).
    menu.classList.toggle('x-dropdown__menu--open', isOpen);
    element.classList.toggle('open', isOpen);
    (trigger || element).setAttribute('aria-expanded', String(isOpen));
  };

  const close = () => {
    isOpen = false;
    menu.classList.remove('x-dropdown__menu--open');
    element.classList.remove('open');
    (trigger || element).setAttribute('aria-expanded', 'false');
  };

  // Click handler
  const clickHandler = (e) => {
    const item = e.target.closest('.x-dropdown__item');
    
    if (item) {
      // Item clicked
      // #708 -- John: "when any option is clicked the event must give the option
      // id or index and the value". Text alone is ambiguous the moment two
      // options share a label, and it changes whenever the label is reworded, so
      // a handler had nothing stable to switch on. id when the item has one,
      // index always; value keeps its old meaning so existing handlers still work.
      const index = Array.prototype.indexOf.call(
        menu.querySelectorAll('.x-dropdown__item'), item);
      element.dispatchEvent(new CustomEvent('wb:dropdown:select', {
        bubbles: true,
        detail: {
          id: item.id || null,
          index,
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
    } else if (e.target.closest('.x-dropdown__trigger') || e.target === element) {
      // Trigger clicked
      e.preventDefault();
      toggle();
    }
  };

  element.addEventListener('click', clickHandler);

  // trigger="hover" was read into config but never actually used anywhere
  // in this file (confirmed by grep before this fix) -- only the
  // unconditional click handler above existed, so hovering never opened
  // the menu regardless of the attribute. A short close delay lets the
  // pointer travel from the trigger into the menu itself without closing
  // it (standard hover-menu UX -- without it, any gap between trigger and
  // menu edge closes the menu before the item underneath can be clicked).
  let hoverCloseTimer = null;
  if (config.trigger === 'hover') {
    element.addEventListener('mouseenter', () => {
      if (hoverCloseTimer) { clearTimeout(hoverCloseTimer); hoverCloseTimer = null; }
      if (!isOpen) toggle();
    });
    element.addEventListener('mouseleave', () => {
      hoverCloseTimer = setTimeout(() => {
        // #704: close(), NOT toggle(). toggle() early-returns while a hover menu
        // is open -- that guard exists to stop a CLICK closing it -- so routing
        // the leave through toggle() meant a hover dropdown never closed at all.
        close();
        hoverCloseTimer = null;
      }, 150);
    });
  }

  // Close on outside click
  const outsideClickHandler = (e) => {
    if (!element.contains(e.target)) close();
  };
  if (config.closeOnOutside) document.addEventListener('click', outsideClickHandler);

  // Keyboard support
  const keyHandler = (e) => {
    // A bare-text host is its own trigger (role="button" above), so it opens
    // from the keyboard the way a real <button> would.
    if (!trigger && e.target === element && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggle();
      return;
    }
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
  menu.querySelectorAll('.x-dropdown__item').forEach(item => {
    item.setAttribute('role', 'menuitem');
  });

  return () => { 
    element.removeEventListener('click', clickHandler);
    document.removeEventListener('click', outsideClickHandler);
    element.removeEventListener('keydown', keyHandler);
    menu.remove();
    if (trigger) trigger.remove();
    element.classList.remove('x-dropdown', 'x-dropdown-trigger', 'open');
  };
}

export default dropdown;

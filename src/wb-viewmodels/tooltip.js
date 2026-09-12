/**
 * WB Tooltip Behavior
 * -----------------------------------------------------------------------------
 * Adds tooltip on hover/focus/click to any element.
 *
 * Attribute: [tooltip]
 * -----------------------------------------------------------------------------
 *
 * @example
 * <button x-tooltip data-tooltip="Save changes">Save</button>
 * <span x-tooltip data-tooltip="More info" data-tooltip-position="right">?</span>
 */

import { readAttr, readFlag } from '../core/read-attr.js';

// tooltip.schema.json declares 8 positions and 4 trigger modes. This file used
// to accept 4 positions and no trigger at all, so the other spellings were
// advertised by the docs, IntelliSense and the Behaviors selector and then
// silently discarded (#1107). The lists live here, once, so the accepted set
// and the declared set cannot drift apart again.
const POSITIONS = ['top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end'];
const TRIGGERS = ['hover', 'focus', 'click', 'hover-focus'];

// Inject styles once
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    .x-tooltip {
      position: absolute;
      z-index: 10000;
      padding: 0.5rem 0.75rem;
      background: var(--bg-tertiary, #333);
      color: var(--text-primary, #fff);
      border-radius: 6px;
      font-size: 0.8rem;
      /* maxWidth (#1107). The schema declares maxWidth (default 200px) and a
         --x-tooltip-max-width CSS API variable; neither reached the element,
         so the cap was a hardcoded 250px no author could change. The behavior
         now sets the custom property per instance, which keeps the value on
         the declared CSS API instead of an inline max-width. border-box makes
         the cap mean the RENDERED width, which is what "maximum tooltip width"
         says to the person reading the docs. */
      box-sizing: border-box;
      max-width: var(--x-tooltip-max-width, 200px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 0.15s, transform 0.15s;
      pointer-events: none;
    }
    .x-tooltip--visible {
      opacity: 1;
      transform: scale(1);
    }
    /* interactive (#1107). A tooltip is click-through by default so it never
       steals the pointer from the page underneath. interactive="true" is the
       author asking for the opposite -- content you can move onto, such as a
       link or selectable text -- which is impossible while pointer-events is
       none, so the flag has to reach the CSS as well as the listeners. */
    .x-tooltip--interactive {
      pointer-events: auto;
    }
    .x-tooltip__arrow {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--bg-tertiary, #333);
      transform: rotate(45deg);
    }
    /* The 4 compound positions need their own selectors: .x-tooltip--top does
       not match the class x-tooltip--top-start, so the compound spellings used
       to render an arrow with no placement rule at all (#1107). */
    .x-tooltip--top .x-tooltip__arrow,
    .x-tooltip--top-start .x-tooltip__arrow,
    .x-tooltip--top-end .x-tooltip__arrow {
      bottom: -4px;
      left: 50%;
      margin-left: -4px;
    }
    .x-tooltip--bottom .x-tooltip__arrow,
    .x-tooltip--bottom-start .x-tooltip__arrow,
    .x-tooltip--bottom-end .x-tooltip__arrow {
      top: -4px;
      left: 50%;
      margin-left: -4px;
    }
    /* start/end align the tooltip's edge with the trigger's edge, so the arrow
       moves to that edge too rather than staying centred over nothing. */
    .x-tooltip--top-start .x-tooltip__arrow,
    .x-tooltip--bottom-start .x-tooltip__arrow {
      left: 12px;
      margin-left: 0;
    }
    .x-tooltip--top-end .x-tooltip__arrow,
    .x-tooltip--bottom-end .x-tooltip__arrow {
      left: auto;
      right: 12px;
      margin-left: 0;
    }
    .x-tooltip--left .x-tooltip__arrow {
      right: -4px;
      top: 50%;
      margin-top: -4px;
    }
    .x-tooltip--right .x-tooltip__arrow {
      left: -4px;
      top: 50%;
      margin-top: -4px;
    }
    .x-tooltip--dark {
      background: var(--x-tooltip-dark-bg, #1f2937);
      color: var(--x-tooltip-dark-color, #ffffff);
    }
    .x-tooltip--dark .x-tooltip__arrow {
      background: var(--x-tooltip-dark-bg, #1f2937);
    }
    .x-tooltip--light {
      background: var(--x-tooltip-light-bg, #ffffff);
      color: var(--x-tooltip-light-color, #1f2937);
      border: var(--x-tooltip-light-border, 1px solid #e5e7eb);
    }
    .x-tooltip--light .x-tooltip__arrow {
      background: var(--x-tooltip-light-bg, #ffffff);
      border: var(--x-tooltip-light-border, 1px solid #e5e7eb);
    }
    .x-tooltip--primary {
      background: var(--x-tooltip-primary-bg, var(--primary, #6366f1));
      color: var(--x-tooltip-primary-color, #ffffff);
    }
    .x-tooltip--primary .x-tooltip__arrow {
      background: var(--x-tooltip-primary-bg, var(--primary, #6366f1));
    }
  `;
  document.head.appendChild(style);
  stylesInjected = true;
}

export async function tooltip(element, options = {}) {
  if (!element || !(element instanceof HTMLElement)) {
    console.warn('[WB:tooltip] Invalid element');
    return () => {};
  }

  if (element._wbTooltip) {
    return element._wbTooltip.cleanup;
  }

  // Inject styles
  injectStyles();

  // Config
  // `??` was wrong here and made the documented form dead. On
  // <button x-tooltip content="hi">, getAttribute('x-tooltip') returns "" --
  // an empty string, not null -- so `??` accepted it and every later source,
  // including `content`, was never consulted. The tooltip then bailed on
  // `if (!content)`. That is #861's "x-tooltip touches nothing": the bare
  // token form advertised by the docs could never produce a tooltip.
  // Empty means absent for every one of these sources.
  const firstNonEmpty = (...vals) => {
    for (const v of vals) {
      if (v != null && String(v).trim() !== '') return v;
    }
    return '';
  };
  const content = String(
    firstNonEmpty(
      options.content,
      element.getAttribute('x-tooltip'),
      element.getAttribute('content'),
      element.getAttribute('x-content'),
      element.getAttribute('tooltip'),
      element.getAttribute('title'),
      element.innerText.trim(),
    )
  );
  if (!content) {
    console.warn('[WB:tooltip] No content');
    return () => {};
  }

  // parseInt('abc') is NaN and Math.max(0, NaN) is still NaN, which setTimeout
  // then reads as 0 -- the right outcome reached by accident, through a value
  // that poisons any arithmetic downstream of it. The oracle in
  // scripts/tooltip-permutations.schema.json says an invalid or negative delay
  // clamps to 0, so make that the rule rather than a coincidence (#1107).
  const ms = (raw, fallback) => {
    if (raw == null || String(raw).trim() === '') return fallback;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  };

  // A boolean the author may also pass programmatically. readFlag already knows
  // the attribute spellings (plain, kebab, data-) and that "false"/"0" mean off.
  const optFlag = (opt, name, fallback) => (
    opt === undefined || opt === null
      ? readFlag(element, name, fallback)
      : (opt !== false && opt !== 'false' && opt !== '0' && opt !== 0)
  );

  const config = {
    content,
    position: (() => {
      const p = options.position
        ?? element.getAttribute('x-position')
        ?? element.getAttribute('position')
        ?? element.getAttribute('tooltip-position');
      return POSITIONS.includes(p) ? p : 'top';
    })(),
    variant: (() => {
      const v = options.variant ?? element.getAttribute('variant');
      return ['default', 'dark', 'light', 'primary'].includes(v) ? v : 'default';
    })(),
    // The plain `delay` spelling -- the one tooltip.schema.json declares and
    // every doc and example writes -- was NOT in this chain: only `x-delay` and
    // `tooltip-delay` were read, so <button x-tooltip delay="500"> waited the
    // 200ms default (#1107, same class as #752). readAttr covers the plain,
    // kebab and data- spellings at once; the x-/tooltip- forms stay for the
    // markup already written against them.
    delay: ms(options.delay ?? readAttr(element, 'delay', null) ?? element.getAttribute('x-delay') ?? element.getAttribute('tooltip-delay'), 200),
    // `hide-delay` comes first: tooltip.schema.json declares hideDelay, so the
    // generated docs and the showcase both tell authors to write hide-delay --
    // and that was the one spelling this chain did not read (#861).
    // The 100ms default is now what the schema declares too: it used to say 0,
    // so the generated docs stated a number the code never used (#1107). 100
    // stays because it is the shipped behaviour and because a 0ms hide leaves
    // no bridge for `interactive` -- the tooltip would vanish while the pointer
    // is still crossing the 8px gap towards it.
    hideDelay: ms(options.hideDelay ?? readAttr(element, 'hideDelay', null) ?? element.getAttribute('x-hide-delay') ?? element.getAttribute('tooltip-hide-delay'), 100),
    // trigger (#1107). Declared with 4 values and read by nothing: the
    // listeners below were bound unconditionally, so trigger="click" both
    // failed to open on click AND opened on hover -- the exact opposite of the
    // one spelling an author picks in order to avoid hover.
    // The declared default is "hover", so a keyboard user no longer gets the
    // tooltip on Tab unless the author writes trigger="hover-focus". That is
    // what the enum says the word means; a tooltip carrying information a
    // keyboard user needs should be authored as hover-focus.
    trigger: (() => {
      const t = options.trigger ?? readAttr(element, 'trigger', '');
      return TRIGGERS.includes(t) ? t : 'hover';
    })(),
    // arrow (#1107). Declared default true and built unconditionally, so the
    // flag could not turn the arrow off.
    arrow: optFlag(options.arrow, 'arrow', true),
    // interactive (#1107). Declared default false with no pointer-bridge logic
    // anywhere, so the tooltip always closed before you could reach it.
    interactive: optFlag(options.interactive, 'interactive', false),
    // maxWidth (#1107). Declared default 200px and never applied.
    maxWidth: options.maxWidth || readAttr(element, 'maxWidth', '200px'),
    customClass: options.customClass ?? element.getAttribute('x-custom-class') ?? element.getAttribute('tooltip-class') ?? '',
  };

  // Remove native title
  const originalTitle = element.getAttribute('title');
  if (originalTitle) element.removeAttribute('title');

  // State
  const state = {
    visible: false,
    destroyed: false,
    showTimer: null,
    hideTimer: null,
    // The removal that ends the fade is its own timer now: `interactive` and
    // click-toggle both need to catch a tooltip mid-fade and keep it (#1107).
    removeTimer: null,
    // What the user last asked for, as opposed to what is on screen. `visible`
    // only turns true after the show delay, so a click toggle that consulted it
    // would fire a second show while the first was still pending.
    open: false,
  };

  // Create tooltip element
  const tip = document.createElement('div');
  tip.className = `x-tooltip x-tooltip--${config.position} x-tooltip--${config.variant}`;
  if (config.interactive) {
    tip.classList.add('x-tooltip--interactive');
  }
  if (config.customClass) {
    tip.classList.add(...config.customClass.split(' '));
  }

  // The declared CSS API variable is how maxWidth reaches the element -- see
  // the max-width rule in injectStyles (#1107).
  if (config.maxWidth) {
    tip.style.setProperty('--x-tooltip-max-width', config.maxWidth);
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'x-tooltip__content';
  contentDiv.textContent = config.content;

  tip.appendChild(contentDiv);

  // arrow="false" means no arrow. It was built here unconditionally, so the
  // declared flag was inert and the arrow could not be removed (#1107).
  if (config.arrow) {
    const arrowDiv = document.createElement('div');
    arrowDiv.className = 'x-tooltip__arrow';
    tip.appendChild(arrowDiv);
  }

  const tooltipId = `x-tooltip-${Math.random().toString(36).substr(2, 9)}`;
  tip.id = tooltipId;

  // Position tooltip
  const position = () => {
    if (!tip.parentNode) return;
    
    const rect = element.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const gap = 8;

    let top, left;

    // "top-start" is the side plus an alignment along the trigger's edge. The
    // switch used to match the whole string against 4 literals, so the 4
    // compound positions the schema declares fell through with top and left
    // undefined -- the tooltip landed at "8pxpx" (#1107).
    const [side, align = 'center'] = config.position.split('-');
    const alignedLeft = () => {
      if (align === 'start') return rect.left + scrollX;
      if (align === 'end') return rect.right + scrollX - tipRect.width;
      return rect.left + scrollX + (rect.width - tipRect.width) / 2;
    };

    switch (side) {
      case 'top':
        top = rect.top + scrollY - tipRect.height - gap;
        left = alignedLeft();
        break;
      case 'bottom':
        top = rect.bottom + scrollY + gap;
        left = alignedLeft();
        break;
      case 'left':
        top = rect.top + scrollY + (rect.height - tipRect.height) / 2;
        left = rect.left + scrollX - tipRect.width - gap;
        break;
      case 'right':
        top = rect.top + scrollY + (rect.height - tipRect.height) / 2;
        left = rect.right + scrollX + gap;
        break;
    }

    // Keep in viewport
    left = Math.max(8, Math.min(left, window.innerWidth + scrollX - tipRect.width - 8));
    top = Math.max(8, top);

    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
  };

  // Show / Hide
  const show = () => {
    if (state.destroyed) return;
    state.open = true;
    clearTimeout(state.hideTimer);
    clearTimeout(state.removeTimer);

    // Caught mid-fade: the element is still in the DOM and still ours, so put
    // it back rather than waiting out a removal that is no longer wanted.
    if (state.visible) {
      tip.classList.add('x-tooltip--visible');
      return;
    }

    state.showTimer = setTimeout(() => {
      if (state.destroyed) return;
      document.body.appendChild(tip);
      position();
      void tip.offsetWidth;
      tip.classList.add('x-tooltip--visible');
      state.visible = true;
    }, config.delay);
  };

  const hide = () => {
    if (state.destroyed) return;
    state.open = false;
    clearTimeout(state.showTimer);

    state.hideTimer = setTimeout(() => {
      if (state.destroyed) return;
      tip.classList.remove('x-tooltip--visible');
      state.removeTimer = setTimeout(() => {
        if (tip.parentNode) tip.remove();
        state.visible = false;
      }, 150);
    }, config.hideDelay);
  };

  // Event handlers
  const handleEnter = () => show();
  const handleLeave = () => hide();
  const handleScroll = () => { if (state.visible) position(); };
  // Click is a toggle: there is no pointer-leave to close it, so the same
  // interaction that opened it has to close it again (#1107).
  const handleToggle = () => { if (state.open) hide(); else show(); };
  // The pointer crossing the gap onto the tooltip must cancel the pending hide,
  // or the content the author made interactive disappears mid-reach.
  const handleTipEnter = () => {
    clearTimeout(state.hideTimer);
    clearTimeout(state.removeTimer);
    state.open = true;
  };

  // Init
  element.classList.add('x-tooltip-trigger');
  element.setAttribute('aria-describedby', tooltipId);

  // trigger gating (#1107). Each mode binds only the events it names. "click"
  // in particular must bind NEITHER hover NOR focus: binding them is what made
  // the mode an author chose in order to escape hover behave as hover.
  const bindings = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    bindings.push([target, type, fn, opts]);
  };

  const wantsHover = config.trigger === 'hover' || config.trigger === 'hover-focus';
  const wantsFocus = config.trigger === 'focus' || config.trigger === 'hover-focus';

  if (wantsHover) {
    on(element, 'mouseenter', handleEnter);
    on(element, 'mouseleave', handleLeave);
  }
  if (wantsFocus) {
    on(element, 'focus', handleEnter);
    on(element, 'blur', handleLeave);
  }
  if (config.trigger === 'click') {
    on(element, 'click', handleToggle);
  }
  if (config.interactive) {
    on(tip, 'mouseenter', handleTipEnter);
    // Only the hover modes close on leaving. In click mode the tooltip stays up
    // until the next click, so a pointer wandering off it must not dismiss it.
    if (wantsHover) on(tip, 'mouseleave', handleLeave);
  }
  on(window, 'scroll', handleScroll, { passive: true });

  // Cleanup
  const cleanup = () => {
    if (state.destroyed) return;
    state.destroyed = true;

    clearTimeout(state.showTimer);
    clearTimeout(state.hideTimer);
    clearTimeout(state.removeTimer);

    for (const [target, type, fn, opts] of bindings) {
      target.removeEventListener(type, fn, opts);
    }
    bindings.length = 0;

    if (tip.parentNode) tip.remove();
    if (originalTitle) element.setAttribute('title', originalTitle);
    element.removeAttribute('aria-describedby');

    delete element._wbTooltip;
  };

  element._wbTooltip = { cleanup };

  return cleanup;
}

export default tooltip;

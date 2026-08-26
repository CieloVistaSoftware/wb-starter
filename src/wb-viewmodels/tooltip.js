/**
 * WB Tooltip Behavior
 * -----------------------------------------------------------------------------
 * Adds tooltip on hover/focus to any element.
 * 
 * Custom Tag: <button-tooltip>
 * Attribute: [tooltip]
 * -----------------------------------------------------------------------------
 * 
 * @example
 * <button x-tooltip data-tooltip="Save changes">Save</button>
 * <span x-tooltip data-tooltip="More info" data-tooltip-position="right">?</span>
 */

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
      max-width: 250px;
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
    .x-tooltip__arrow {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--bg-tertiary, #333);
      transform: rotate(45deg);
    }
    .x-tooltip--top .x-tooltip__arrow {
      bottom: -4px;
      left: 50%;
      margin-left: -4px;
    }
    .x-tooltip--bottom .x-tooltip__arrow {
      top: -4px;
      left: 50%;
      margin-left: -4px;
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

  const config = {
    content,
    position: (() => {
      const p = options.position
        ?? element.getAttribute('x-position')
        ?? element.getAttribute('position')
        ?? element.getAttribute('tooltip-position');
      return ['top', 'bottom', 'left', 'right'].includes(p) ? p : 'top';
    })(),
    variant: (() => {
      const v = options.variant ?? element.getAttribute('variant');
      return ['default', 'dark', 'light', 'primary'].includes(v) ? v : 'default';
    })(),
    delay: Math.max(0, parseInt(options.delay ?? element.getAttribute('x-delay') ?? element.getAttribute('tooltip-delay') ?? '200', 10)),
    // `hide-delay` comes first: tooltip.schema.json declares hideDelay, so the
    // generated docs and the showcase both tell authors to write hide-delay --
    // and that was the one spelling this chain did not read (#861).
    hideDelay: Math.max(0, parseInt(options.hideDelay ?? element.getAttribute('hide-delay') ?? element.getAttribute('x-hide-delay') ?? element.getAttribute('tooltip-hide-delay') ?? '100', 10)),
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
  };

  // Create tooltip element
  const tip = document.createElement('div');
  tip.className = `x-tooltip x-tooltip--${config.position} x-tooltip--${config.variant}`;
  if (config.customClass) {
    tip.classList.add(...config.customClass.split(' '));
  }
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'x-tooltip__content';
  contentDiv.textContent = config.content;
  
  const arrowDiv = document.createElement('div');
  arrowDiv.className = 'x-tooltip__arrow';
  
  tip.appendChild(contentDiv);
  tip.appendChild(arrowDiv);

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

    switch (config.position) {
      case 'top':
        top = rect.top + scrollY - tipRect.height - gap;
        left = rect.left + scrollX + (rect.width - tipRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + gap;
        left = rect.left + scrollX + (rect.width - tipRect.width) / 2;
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
    if (state.destroyed || state.visible) return;
    clearTimeout(state.hideTimer);

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
    clearTimeout(state.showTimer);

    state.hideTimer = setTimeout(() => {
      if (state.destroyed) return;
      tip.classList.remove('x-tooltip--visible');
      setTimeout(() => {
        if (tip.parentNode) tip.remove();
        state.visible = false;
      }, 150);
    }, config.hideDelay);
  };

  // Event handlers
  const handleEnter = () => show();
  const handleLeave = () => hide();
  const handleScroll = () => { if (state.visible) position(); };

  // Init
  element.classList.add('x-tooltip-trigger');
  element.setAttribute('aria-describedby', tooltipId);
  element.addEventListener('mouseenter', handleEnter);
  element.addEventListener('mouseleave', handleLeave);
  element.addEventListener('focus', handleEnter);
  element.addEventListener('blur', handleLeave);
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Cleanup
  const cleanup = () => {
    if (state.destroyed) return;
    state.destroyed = true;

    clearTimeout(state.showTimer);
    clearTimeout(state.hideTimer);

    element.removeEventListener('mouseenter', handleEnter);
    element.removeEventListener('mouseleave', handleLeave);
    element.removeEventListener('focus', handleEnter);
    element.removeEventListener('blur', handleLeave);
    window.removeEventListener('scroll', handleScroll);

    if (tip.parentNode) tip.remove();
    if (originalTitle) element.setAttribute('title', originalTitle);
    element.removeAttribute('aria-describedby');

    delete element._wbTooltip;
  };

  element._wbTooltip = { cleanup };

  return cleanup;
}

export default tooltip;

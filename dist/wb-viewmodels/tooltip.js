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
    if (stylesInjected)
        return;
    const style = document.createElement('style');
    style.textContent = `
    .wb-tooltip {
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
    .wb-tooltip--visible {
      opacity: 1;
      transform: scale(1);
    }
    .wb-tooltip__arrow {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--bg-tertiary, #333);
      transform: rotate(45deg);
    }
    .wb-tooltip--top .wb-tooltip__arrow {
      bottom: -4px;
      left: 50%;
      margin-left: -4px;
    }
    .wb-tooltip--bottom .wb-tooltip__arrow {
      top: -4px;
      left: 50%;
      margin-left: -4px;
    }
    .wb-tooltip--left .wb-tooltip__arrow {
      right: -4px;
      top: 50%;
      margin-top: -4px;
    }
    .wb-tooltip--right .wb-tooltip__arrow {
      left: -4px;
      top: 50%;
      margin-top: -4px;
    }
  `;
    document.head.appendChild(style);
    stylesInjected = true;
}
export async function tooltip(element, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
        console.warn('[WB:tooltip] Invalid element');
        return () => { };
    }
    if (element._wbTooltip) {
        return element._wbTooltip.cleanup;
    }
    // Inject styles
    injectStyles();
    // Config
    const content = String(options.content ?? element.dataset.content ?? element.getAttribute('x-content') ?? element.dataset.tooltip ?? element.getAttribute('tooltip') ?? element.getAttribute('title') ?? element.innerText.trim() ?? '');
    if (!content) {
        console.warn('[WB:tooltip] No content');
        return () => { };
    }
    const config = {
        content,
        position: ['top', 'bottom', 'left', 'right'].includes(options.position ?? element.getAttribute('x-position') ?? element.dataset.tooltipPosition ?? element.getAttribute('tooltip-position'))
            ? (options.position ?? element.getAttribute('x-position') ?? element.dataset.tooltipPosition ?? element.getAttribute('tooltip-position')) : 'top',
        delay: Math.max(0, parseInt(options.delay ?? element.getAttribute('x-delay') ?? element.dataset.tooltipDelay ?? '200', 10)),
        hideDelay: Math.max(0, parseInt(options.hideDelay ?? element.getAttribute('x-hide-delay') ?? element.dataset.tooltipHideDelay ?? '100', 10)),
        customClass: options.customClass ?? element.getAttribute('x-custom-class') ?? element.dataset.tooltipClass ?? '',
    };
    // Remove native title
    const originalTitle = element.getAttribute('title');
    if (originalTitle)
        element.removeAttribute('title');
    // State
    const state = {
        visible: false,
        destroyed: false,
        showTimer: null,
        hideTimer: null,
    };
    // Create tooltip element
    const tip = document.createElement('div');
    tip.className = `wb-tooltip wb-tooltip--${config.position}`;
    if (config.customClass) {
        tip.classList.add(...config.customClass.split(' '));
    }
    const contentDiv = document.createElement('div');
    contentDiv.className = 'wb-tooltip__content';
    contentDiv.textContent = config.content;
    const arrowDiv = document.createElement('div');
    arrowDiv.className = 'wb-tooltip__arrow';
    tip.appendChild(contentDiv);
    tip.appendChild(arrowDiv);
    const tooltipId = `wb-tooltip-${Math.random().toString(36).substr(2, 9)}`;
    tip.id = tooltipId;
    // Position tooltip
    const position = () => {
        if (!tip.parentNode)
            return;
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
        if (state.destroyed || state.visible)
            return;
        clearTimeout(state.hideTimer);
        state.showTimer = setTimeout(() => {
            if (state.destroyed)
                return;
            document.body.appendChild(tip);
            position();
            void tip.offsetWidth;
            tip.classList.add('wb-tooltip--visible');
            state.visible = true;
        }, config.delay);
    };
    const hide = () => {
        if (state.destroyed)
            return;
        clearTimeout(state.showTimer);
        state.hideTimer = setTimeout(() => {
            if (state.destroyed)
                return;
            tip.classList.remove('wb-tooltip--visible');
            setTimeout(() => {
                if (tip.parentNode)
                    tip.remove();
                state.visible = false;
            }, 150);
        }, config.hideDelay);
    };
    // Event handlers
    const handleEnter = () => show();
    const handleLeave = () => hide();
    const handleScroll = () => { if (state.visible)
        position(); };
    // Init
    element.classList.add('wb-tooltip-trigger');
    element.setAttribute('aria-describedby', tooltipId);
    element.addEventListener('mouseenter', handleEnter);
    element.addEventListener('mouseleave', handleLeave);
    element.addEventListener('focus', handleEnter);
    element.addEventListener('blur', handleLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Cleanup
    const cleanup = () => {
        if (state.destroyed)
            return;
        state.destroyed = true;
        clearTimeout(state.showTimer);
        clearTimeout(state.hideTimer);
        element.removeEventListener('mouseenter', handleEnter);
        element.removeEventListener('mouseleave', handleLeave);
        element.removeEventListener('focus', handleEnter);
        element.removeEventListener('blur', handleLeave);
        window.removeEventListener('scroll', handleScroll);
        if (tip.parentNode)
            tip.remove();
        if (originalTitle)
            element.setAttribute('title', originalTitle);
        element.removeAttribute('aria-describedby');
        delete element._wbTooltip;
    };
    element._wbTooltip = { cleanup };
    return cleanup;
}
export default tooltip;
//# sourceMappingURL=tooltip.js.map
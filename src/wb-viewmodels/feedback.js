/**
 * Feedback Behaviors
 * -----------------------------------------------------------------------------
 * User feedback components including toasts, badges, alerts, spinners,
 * and progress indicators.
 * 
 * Custom Tag: <wb-feedback>
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <button x-toast message="Saved!">Save</button>
 *   <wb-badge  variant="success">New</span>
 * -----------------------------------------------------------------------------
 * All behaviors generate content from data attributes
 */

// Helper: detect builder context to suppress noisy toasts
function isBuilder() {
  try {
    if (typeof window === 'undefined') return false;
    if ((window.location && String(window.location.pathname).includes('builder.html'))) return true;
    return !!document.querySelector('.builder-layout');
  } catch (e) { return false; }
}

export function createToast(message, type = 'info', duration = 3000) {
  // Suppress all toasts while in the builder UI
  if (isBuilder()) return { remove: () => {} };
  let container = document.querySelector('.wb-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'wb-toast-container';
    container.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:10000;display:flex;flex-direction:column;gap:0.5rem;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const colors = { 
    info: 'var(--info-color, #3b82f6)', 
    success: 'var(--success-color, #22c55e)', 
    warning: 'var(--warning-color, #f59e0b)', 
    error: 'var(--danger-color, #ef4444)',
    danger: 'var(--danger-color, #ef4444)',
    primary: 'var(--primary, #6366f1)',
    secondary: 'var(--secondary, #64748b)'
  };
  const bg = colors[type] || colors.info;
  
  toast.style.cssText = `
    padding:0.25rem 0.5rem;border-radius:4px;color:white;font-size:0.75rem;
    background:${bg};
    box-shadow:0 2px 6px rgba(0,0,0,0.15);
    animation:wb-slide-in 0.3s ease;min-width:120px;
    display:flex;align-items:center;justify-content:space-between;gap:0.5rem;
  `;
  toast.innerHTML = `<span>${message}</span>`;
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = 'background:none;border:none;color:white;font-size:1rem;cursor:pointer;padding:0;line-height:1;opacity:0.8;';
  closeBtn.onclick = () => toast.remove();
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = 'wb-fade-out 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  return toast;
}

/**
 * Toast Behavior
 * Custom Tag: <button-tooltip> (Shared)
 * Attribute: [toast-message]
 */
export function toast(element, options = {}) {
  // Phase 2: 'variant' is standard, 'type' is legacy fallback
  const variantValue = options.variant || element.getAttribute('variant') || element.dataset.variant ||
                       options.type || element.getAttribute('type') || element.dataset.type || 'info';
  
  const config = {
    message: options.message || element.dataset.toastMessage || element.dataset.message || element.getAttribute('toast-message') || element.getAttribute('message') || 'Notification',
    variant: variantValue,
    type: variantValue, // Legacy alias for backward compatibility
    duration: parseInt(options.duration || element.dataset.duration || '3000'),
    position: options.position || element.dataset.position || 'top-right',
    ...options
  };

  element.classList.add('wb-toast-trigger');
  element.style.cursor = 'pointer';

  const showToast = () => {
    createToast(config.message, config.variant, config.duration);
    element.dispatchEvent(new CustomEvent('wb:toast:show', {
      bubbles: true,
      detail: { message: config.message, variant: config.variant, type: config.variant }
    }));
  };

  // Do not attach click-triggered toasts when inside the builder (noisy)
  if (!isBuilder()) {
    element.addEventListener('click', showToast);
  }
  element.dataset.wbReady = 'toast';
  return () => element.removeEventListener('click', showToast);
}

/**
 * Badge - Status badges
 * Attribute: [badge]
 */
export function badge(element, options = {}) {
  const rawVariant = options.variant || element.getAttribute('variant') || element.dataset.variant || element.getAttribute('badge') || 'default';
  // Sanitize variant for use as CSS class (replace spaces with dashes, lowercase)
  const sanitizedVariant = rawVariant.replace(/\s+/g, '-').toLowerCase();
  
  const config = {
    variant: sanitizedVariant,
    size: options.size || element.dataset.size || element.getAttribute('size') || 'md',
    pill: options.pill ?? (element.hasAttribute('data-pill') || element.hasAttribute('pill')),
    dot: options.dot ?? (element.hasAttribute('data-dot') || element.hasAttribute('dot')),
    ...options
  };

  // Use solid colors for better visibility
  const colors = {
    default: { bg: '#6b7280', text: 'white' },
    primary: { bg: '#6366f1', text: 'white' },
    success: { bg: '#22c55e', text: 'white' },
    warning: { bg: '#f59e0b', text: 'white' },
    error: { bg: '#ef4444', text: 'white' },
    info: { bg: '#3b82f6', text: 'white' }
  };
  const c = colors[config.variant] || colors.default;

  // Size configurations
  const sizes = {
    sm: { padding: '0.125rem 0.375rem', fontSize: '0.75rem' },
    md: { padding: '0.25rem 0.5rem', fontSize: '0.875rem' },
    lg: { padding: '0.375rem 0.75rem', fontSize: '1rem' }
  };
  const s = sizes[config.size] || sizes.md;

  element.classList.add('wb-badge', `wb-badge--${config.variant}`);
  
  // Add size class - always add for consistency
  element.classList.add(`wb-badge--${config.size}`);
  
  // Add pill class
  if (config.pill) {
    element.classList.add('wb-badge--pill');
  }
  
  // Add dot class
  if (config.dot) {
    element.classList.add('wb-badge--dot');
  }

  element.style.display = 'inline-block';
  element.style.fontWeight = '600';
  element.style.background = c.bg;
  element.style.color = c.text;
  
  // Dot badges are small circles
  if (config.dot) {
    element.style.width = '8px';
    element.style.height = '8px';
    element.style.padding = '0';
    element.style.borderRadius = '50%';
    element.style.fontSize = '0';
    element.textContent = ''; // Clear any text
  } else {
    element.style.padding = s.padding;
    element.style.fontSize = s.fontSize;
    element.style.borderRadius = config.pill ? '9999px' : '4px';
  }

  element.dataset.wbReady = 'badge';
  return () => {
    element.classList.remove('wb-badge', `wb-badge--${config.variant}`, `wb-badge--${config.size}`, 'wb-badge--pill', 'wb-badge--dot');
  };
}

/**
 * Progress - Animated progress bars with value display
 * Custom Tag: <wb-progress>
 */
export function progress(element, options = {}) {
  const config = {
    value: parseInt(options.value || element.getAttribute('value') || element.dataset.value || '0'),
    max: parseInt(options.max || element.getAttribute('max') || element.dataset.max || '100'),
    animated: options.animated ?? element.hasAttribute('data-animated') ?? false,
    striped: options.striped ?? (element.hasAttribute('striped') || element.hasAttribute('data-striped')),
    showLabel: options.showLabel ?? element.dataset.showLabel !== 'false',
    ...options
  };

  element.classList.add('wb-progress');
  if (config.animated) {
    element.classList.add('wb-progress--animated');
  }
  
  const pct = Math.min(100, Math.round((config.value / config.max) * 100));
  
  // COMPLIANCE: explicit width on container
  element.style.cssText = `
    width: 100%;
    height: 1.25rem;
    background: var(--bg-tertiary, #374151);
    border-radius: 9999px;
    overflow: hidden;
    position: relative;
  `;
  
  // If element is <progress>, hide native UI
  if (element.tagName === 'PROGRESS') {
    element.style.appearance = 'none';
    element.style.webkitAppearance = 'none';
    element.style.border = 'none';
  }
  
  // Create bar element with direct style assignments for compliance
  const bar = document.createElement('div');
  bar.className = 'wb-progress__bar';
  bar.style.cssText = `
    width: ${config.animated ? '0%' : pct + '%'};
    height: 100%;
    background: var(--primary, #6366f1);
    border-radius: 9999px;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 0.5rem;
    min-width: ${pct > 0 ? '2rem' : '0'};
  `;
  if (config.striped) {
    bar.style.backgroundImage = 'linear-gradient(45deg,rgba(255,255,255,0.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,0.15) 50%,rgba(255,255,255,0.15) 75%,transparent 75%,transparent)';
    bar.style.backgroundSize = '1rem 1rem';
    bar.style.animation = 'wb-stripe-move 1s linear infinite';
  }
  
  // Value label inside the bar
  const label = document.createElement('span');
  label.className = 'wb-progress__label';
  label.style.cssText = `
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  `;
  label.textContent = `${pct}%`;
  bar.appendChild(label);
  
  element.innerHTML = '';
  element.appendChild(bar);

  // Animate on load
  if (config.animated) {
    setTimeout(() => {
      const barEl = element.querySelector('.wb-progress__bar');
      if (barEl) barEl.style.width = `${pct}%`;
    }, 50);
  }

  element.wbProgress = {
    setValue: (v) => {
      const progressBar = element.querySelector('.wb-progress__bar');
      const progressLabel = element.querySelector('.wb-progress__label');
      const newPct = Math.min(100, Math.round((v / config.max) * 100));
      if (progressBar) {
        progressBar.style.width = `${newPct}%`;
        progressBar.style.minWidth = newPct > 0 ? '2rem' : '0';
      }
      if (progressLabel) progressLabel.textContent = `${newPct}%`;
    },
    reanimate: () => {
      const animBar = element.querySelector('.wb-progress__bar');
      if (animBar) {
        animBar.style.width = '0%';
        setTimeout(() => animBar.style.width = `${pct}%`, 50);
      }
    }
  };

  element.dataset.wbReady = 'progress';
  return () => element.classList.remove('wb-progress');
}

/**
 * Spinner - Loading spinner with staggered start support and speed control
 */
export function spinner(element, options = {}) {
  // Guard against re-initialization - check FIRST before any modifications
  if (element.dataset.wbReady?.includes('spinner') || element._wbSpinnerInit) {
    return () => {};
  }
  
  // Set flag IMMEDIATELY to prevent race conditions (before any DOM changes)
  element._wbSpinnerInit = true;
  element.dataset.wbReady = 'spinner';

  const config = {
    size: options.size || element.dataset.size || 'md',
    color: options.color || element.dataset.color || 'primary',
    delay: options.delay || element.dataset.delay || '0',
    speed: options.speed || element.dataset.speed || 'medium',
    ...options
  };

  const sizes = { xs: '12px', sm: '16px', md: '24px', lg: '32px', xl: '48px' };
  const size = sizes[config.size] || config.size || sizes.md;

  // Speed presets: slow (2s), medium (1.2s), fast (0.6s)
  const speeds = { slow: '2s', medium: '1.2s', fast: '0.6s' };
  const spinSpeed = speeds[config.speed] || config.speed || speeds.medium;

  // Support both named colors and custom hex colors
  const colors = {
    primary: '#6366f1',
    secondary: '#64748b',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  };
  const spinnerColor = config.color.startsWith('#') ? config.color : (colors[config.color] || colors.primary);

  // Clear any existing content
  element.innerHTML = '';

  // Style the container
  element.classList.add('wb-spinner');
  element.setAttribute('role', 'status');
  element.setAttribute('aria-label', 'Loading');
  element.style.display = 'inline-flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';

  // Create the spinning ring
  const ring = document.createElement('div');
  ring.className = 'wb-spinner__ring';
  ring.style.width = size;
  ring.style.height = size;
  ring.style.border = '3px solid var(--bg-tertiary, #374151)';
  ring.style.borderTopColor = spinnerColor;
  ring.style.borderRadius = '50%';
  ring.style.animation = `wb-spin ${spinSpeed} linear infinite`;
  
  // Handle delay - can be "0s", "-0.15s", "0.25", etc.
  const delayStr = String(config.delay);
  if (delayStr !== '0' && delayStr !== '0s') {
    ring.style.animationDelay = delayStr.includes('s') ? delayStr : `${delayStr}s`;
  }
  
  element.appendChild(ring);
  
  return () => {
    element.classList.remove('wb-spinner');
    element.innerHTML = '';
    delete element._wbSpinnerInit;
  };
}

/**
 * Avatar - User avatars with photo, status, and sizes
 */
export function avatar(element, options = {}) {
  const config = {
    src: options.src || element.getAttribute('src') || element.dataset.src || '',
    initials: options.initials || element.getAttribute('initials') || element.dataset.initials || '',
    name: options.name || element.getAttribute('name') || element.dataset.name || '',
    size: options.size || element.getAttribute('size') || element.dataset.size || 'md',
    status: options.status || element.getAttribute('status') || element.dataset.status || '',
    ...options
  };

  // Size configurations
  const sizes = { 
    xs: { px: '24px', font: '0.6rem', status: '6px' },
    sm: { px: '32px', font: '0.75rem', status: '8px' },
    md: { px: '40px', font: '0.875rem', status: '10px' },
    lg: { px: '56px', font: '1.25rem', status: '14px' },
    xl: { px: '80px', font: '1.75rem', status: '18px' }
  };
  const sizeConfig = sizes[config.size] || sizes.md;
  const initials = config.initials || (config.name ? config.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?');

  element.classList.add('wb-avatar', `wb-avatar--${config.size}`);
  element.style.cssText = `
    width: ${sizeConfig.px};
    height: ${sizeConfig.px};
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--primary, #6366f1);
    color: white;
    font-weight: 600;
    font-size: ${sizeConfig.font};
    position: relative;
    overflow: visible;
    flex-shrink: 0;
  `;

  // Build inner content
  let innerHTML = '';
  
  if (config.src) {
    innerHTML = `<img src="${config.src}" alt="${config.name || 'Avatar'}" style="
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    ">`;
  } else {
    innerHTML = `<span style="user-select:none;">${initials}</span>`;
  }

  // Status indicator
  if (config.status) {
    const statusColors = { 
      online: '#22c55e', 
      offline: '#6b7280', 
      busy: '#ef4444', 
      away: '#f59e0b',
      dnd: '#ef4444'
    };
    const statusColor = statusColors[config.status] || statusColors.offline;
    innerHTML += `<span class="wb-avatar__status wb-avatar__status--${config.status}" style="
      position: absolute;
      bottom: 0;
      right: 0;
      width: ${sizeConfig.status};
      height: ${sizeConfig.status};
      background: ${statusColor};
      border-radius: 50%;
      border: 2px solid var(--bg-primary, #1f2937);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
    "></span>`;
  }

  element.innerHTML = innerHTML;
  element.dataset.wbReady = 'avatar';
  return () => element.classList.remove('wb-avatar');
}

/**
 * Chip - Removable chips/tags
 */
export function chip(element, options = {}) {
  const config = {
    dismissible: options.dismissible ?? element.hasAttribute('data-dismissible'),
    variant: options.variant || element.dataset.variant || 'default',
    ...options
  };

  const colors = {
    default: { bg: 'var(--bg-tertiary, #374151)', text: 'var(--text-primary, #f9fafb)' },
    primary: { bg: 'var(--primary, #6366f1)', text: 'white' },
    success: { bg: 'var(--success, #22c55e)', text: 'white' },
    warning: { bg: 'var(--warning, #f59e0b)', text: 'white' },
    error: { bg: 'var(--error, #ef4444)', text: 'white' },
    info: { bg: 'var(--info, #3b82f6)', text: 'white' }
  };
  const c = colors[config.variant] || colors.default;

  element.classList.add('wb-chip');
  if (config.variant !== 'default') {
    element.classList.add(`wb-chip--${config.variant}`);
  }

  element.style.display = 'inline-flex';
  element.style.alignItems = 'center';
  element.style.gap = '0.25rem';
  element.style.padding = '0.25rem 0.75rem';
  element.style.background = c.bg;
  element.style.color = c.text;
  element.style.borderRadius = '999px';
  element.style.fontSize = '0.875rem';
  element.style.fontWeight = '500';

  if (config.dismissible && !element.querySelector('.wb-chip__remove')) {
    const btn = document.createElement('button');
    btn.className = 'wb-chip__remove';
    btn.innerHTML = '×';
    btn.style.cssText = 'background:none;border:none;color:inherit;cursor:pointer;opacity:0.7;padding:0;margin-left:0.25rem;font-size:1.1rem;line-height:1;display:flex;align-items:center;';
    btn.onclick = () => {
      element.dispatchEvent(new CustomEvent('wb:chip:remove', { bubbles: true }));
      element.remove();
    };
    element.appendChild(btn);
  }

  element.dataset.wbReady = 'chip';
  return () => element.classList.remove('wb-chip');
}

/**
 * Alert - Alert messages with distinct variant colors
 */
export function alert(element, options = {}) {
  // Support both 'type' and 'variant' attribute names
  const variantValue = options.variant || element.getAttribute('variant') || element.dataset.variant ||
                       options.type || element.getAttribute('type') || element.dataset.type || 'info';
  const config = {
    variant: variantValue,
    type: variantValue, // Legacy alias
    message: options.message || element.getAttribute('message') || element.dataset.message || '',
    heading: options.heading || element.getAttribute('heading') || element.dataset.heading ||
             options.title || element.getAttribute('title') || element.dataset.title || '',
    dismissible: options.dismissible ?? (element.hasAttribute('dismissible') || element.hasAttribute('data-dismissible')),
    ...options
  };

  // Distinct solid background colors for each variant
  const colors = {
    info: { bg: '#3b82f6', border: '#1d4ed8', text: 'white', icon: 'ℹ️' },
    success: { bg: '#22c55e', border: '#16a34a', text: 'white', icon: '✅' },
    warning: { bg: '#f59e0b', border: '#d97706', text: 'white', icon: '⚠️' },
    error: { bg: '#ef4444', border: '#dc2626', text: 'white', icon: '❌' }
  };
  const c = colors[config.variant] || colors.info;

  element.classList.add('wb-alert', `wb-alert--${config.variant}`);
  element.setAttribute('role', 'alert');
  element.style.cssText = `
    padding: 1rem 1.25rem;
    background: ${c.bg};
    border-left: 4px solid ${c.border};
    border-radius: 8px;
    color: ${c.text};
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  `;

  const content = config.message || element.textContent.trim() || 'Alert message';
  const headingText = config.heading || '';
  
  element.innerHTML = `
    <span class="wb-alert__icon" style="flex-shrink:0;font-size:1.25rem;">${c.icon}</span>
    <div class="wb-alert__content" style="flex:1;">
      ${headingText ? `<div class="wb-alert__heading" style="font-weight:700;margin-bottom:0.25rem;font-size:1rem;">${headingText}</div>` : ''}
      <p class="wb-alert__message" style="margin:0;font-size:0.9rem;opacity:0.95;">${content}</p>
    </div>
    ${config.dismissible ? `<button class="wb-alert__close" style="background:none;border:none;cursor:pointer;color:${c.text};opacity:0.8;font-size:1.5rem;line-height:1;padding:0;" onclick="this.parentElement.style.display='none'">×</button>` : ''}
  `;

  element.dataset.wbReady = 'alert';
  return () => element.classList.remove('wb-alert');
}

/**
 * Skeleton - Loading skeletons with shimmer animation
 */
export function skeleton(element, options = {}) {
  const config = {
    variant: options.variant || element.getAttribute('variant') || element.dataset.variant || 'text',
    lines: parseInt(options.lines || element.getAttribute('lines') || element.dataset.lines || '3'),
    width: options.width || element.getAttribute('width') || element.dataset.width || '100%',
    height: options.height || element.getAttribute('height') || element.dataset.height || '',
    ...options
  };

  element.classList.add('wb-skeleton', `wb-skeleton--${config.variant}`);
  element.style.display = 'block';

  // Shimmer animation style - uses CSS keyframes
  const skeletonStyle = `
    background: linear-gradient(
      90deg,
      var(--bg-tertiary, #374151) 0%,
      var(--bg-secondary, #4b5563) 50%,
      var(--bg-tertiary, #374151) 100%
    );
    background-size: 200% 100%;
    animation: wb-skeleton-shimmer 1.5s ease-in-out infinite;
  `;

  const variants = {
    text: () => {
      let html = '';
      for (let i = 0; i < config.lines; i++) {
        // Last line is shorter for natural look
        const w = i === config.lines - 1 && config.lines > 1 ? '60%' : '100%';
        html += `<div class="wb-skeleton__line" style="
          height: 1rem;
          border-radius: 4px;
          margin-bottom: 0.75rem;
          width: ${w};
          ${skeletonStyle}
        "></div>`;
      }
      element.innerHTML = html;
    },
    circle: () => {
      const size = config.width || '60px';
      element.innerHTML = `<div class="wb-skeleton__circle" style="
        width: ${size};
        height: ${size};
        border-radius: 50%;
        ${skeletonStyle}
      "></div>`;
    },
    rect: () => {
      element.innerHTML = `<div class="wb-skeleton__rect" style="
        width: ${config.width};
        height: ${config.height || '100px'};
        border-radius: 8px;
        ${skeletonStyle}
      "></div>`;
    },
    card: () => {
      element.innerHTML = `
        <div style="
          background: var(--bg-secondary, #1f2937);
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid var(--border-color, #374151);
        ">
          <div class="wb-skeleton__line" style="
            width: 100%;
            height: 120px;
            border-radius: 8px;
            margin-bottom: 1rem;
            ${skeletonStyle}
          "></div>
          <div class="wb-skeleton__line" style="
            height: 1.25rem;
            border-radius: 4px;
            margin-bottom: 0.75rem;
            width: 70%;
            ${skeletonStyle}
          "></div>
          <div class="wb-skeleton__line" style="
            height: 0.875rem;
            border-radius: 4px;
            width: 50%;
            ${skeletonStyle}
          "></div>
        </div>
      `;
    },
    avatar: () => {
      element.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div class="wb-skeleton__circle" style="
            width: 48px;
            height: 48px;
            border-radius: 50%;
            flex-shrink: 0;
            ${skeletonStyle}
          "></div>
          <div style="flex:1;">
            <div class="wb-skeleton__line" style="
              height: 1rem;
              border-radius: 4px;
              margin-bottom: 0.5rem;
              width: 60%;
              ${skeletonStyle}
            "></div>
            <div class="wb-skeleton__line" style="
              height: 0.75rem;
              border-radius: 4px;
              width: 40%;
              ${skeletonStyle}
            "></div>
          </div>
        </div>
      `;
    }
  };

  (variants[config.variant] || variants.text)();

  element.dataset.wbReady = 'skeleton';
  return () => element.classList.remove('wb-skeleton');
}

/**
 * Divider - Content dividers
 */
export function divider(element, options = {}) {
  const config = {
    text: options.text || element.dataset.text || '',
    vertical: options.vertical ?? element.hasAttribute('data-vertical'),
    ...options
  };

  element.classList.add('wb-divider');
  element.setAttribute('role', 'separator');

  if (config.vertical) {
    element.style.display = 'inline-block';
    element.style.width = '1px';
    element.style.height = '100%';
    element.style.minHeight = '1rem';
    element.style.background = 'var(--border-color, #374151)';
    element.style.margin = '0 0.5rem';
  } else {
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.gap = '0.75rem';
    element.style.margin = '0.75rem 0';
    element.style.color = 'var(--text-muted, #6b7280)';
    element.style.fontSize = '0.75rem';

    if (config.text) {
      element.innerHTML = `
        <span style="flex:1;height:1px;background:var(--border-color,#374151);"></span>
        <span>${config.text}</span>
        <span style="flex:1;height:1px;background:var(--border-color,#374151);"></span>
      `;
    } else {
      element.innerHTML = `<span style="flex:1;height:1px;background:var(--border-color,#374151);"></span>`;
    }
  }

  element.dataset.wbReady = 'divider';
  return () => element.classList.remove('wb-divider');
}

/**
 * Breadcrumb - Navigation breadcrumbs from data-items
 */
export function breadcrumb(element, options = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    separator: options.separator || element.dataset.separator || '/',
    ...options
  };

  element.classList.add('wb-breadcrumb');
  element.setAttribute('aria-label', 'Breadcrumb');
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.gap = '0.5rem';
  element.style.fontSize = '0.875rem';

  if (config.items.length > 0) {
    element.innerHTML = config.items.map((item, i) => {
      const isLast = i === config.items.length - 1;
      return `
        ${i > 0 ? `<span style="opacity:0.5;">${config.separator}</span>` : ''}
        <span class="wb-breadcrumb__item" style="${isLast ? 'font-weight:600;' : 'opacity:0.7;cursor:pointer;'}">${item.trim()}</span>
      `;
    }).join('');
  }

  element.dataset.wbReady = 'breadcrumb';
  return () => element.classList.remove('wb-breadcrumb');
}

/**
 * Notify - Toast notification that cycles through types on each click
 */
export function notify(element, options = {}) {
  const types = ['info', 'success', 'warning', 'error'];
  let typeIndex = 0;
  
  const config = {
    message: options.message || element.dataset.notifyMessage || element.dataset.message || 'Notification',
    duration: parseInt(options.duration || element.dataset.duration || '3000'),
    ...options
  };

  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  const colors = { 
    info: 'var(--primary, #3b82f6)', 
    success: '#22c55e', 
    warning: '#f59e0b', 
    error: '#ef4444' 
  };
  const messages = {
    info: config.message || 'Information message',
    success: 'Success! Operation completed.',
    warning: 'Warning: Please review.',
    error: 'Error: Something went wrong.'
  };

  element.classList.add('wb-notify-trigger');

  // Suppress notify clicks while in builder UI
  if (isBuilder()) {
    element.style.cursor = 'default';
    element.dataset.wbReady = 'notify';
    return () => element.classList.remove('wb-notify-trigger');
  }

  element.onclick = () => {
    const currentType = types[typeIndex];
    typeIndex = (typeIndex + 1) % types.length; // Cycle to next type
    
    // Create toast container if not exists
    let container = document.querySelector('.wb-notify-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'wb-notify-container';
      container.style.cssText = `
        position: fixed; top: 1rem; right: 1rem;
        z-index: 10001; display: flex; flex-direction: column; gap: 0.5rem;
      `;
      document.body.appendChild(container);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem; background: var(--bg-primary, #1f2937);
      border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      border-left: 4px solid ${colors[currentType]};
      color: var(--text-primary, #f9fafb);
      animation: wb-slide-in 0.3s ease;
      min-width: 250px; max-width: 400px;
    `;
    toast.innerHTML = `
      <span style="font-size:1.25rem;">${icons[currentType]}</span>
      <span style="flex:1;">${messages[currentType]}</span>
      <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;">&times;</button>
    `;
    
    toast.querySelector('button').onclick = () => toast.remove();
    container.appendChild(toast);
    
    // Auto remove
    if (config.duration > 0) {
      setTimeout(() => {
        toast.style.animation = 'wb-fade-out 0.2s ease';
        setTimeout(() => toast.remove(), 200);
      }, config.duration);
    }
    
    element.dispatchEvent(new CustomEvent('wb:notify:show', { 
      bubbles: true, 
      detail: { message: messages[currentType], type: currentType } 
    }));
  };

  return () => element.classList.remove('wb-notify-trigger');
}

/**
 * Pill - Badge with rounded corners (shortcut)
 */
export function pill(element, options = {}) {
  return badge(element, { ...options, pill: true });
}

export default { toast, createToast, badge, progress, spinner, avatar, chip, alert, skeleton, divider, breadcrumb, notify, pill };

import { readAttr } from '../core/read-attr.js';
/**
 * Progress Bar Behavior (DEPRECATED)
 * -----------------------------------------------------------------------------
 * @deprecated Use native <progress> element instead. The `progress` behavior
 * in `semantics/progress.js` enhances native <progress> with proper
 * cross-browser styling via pseudo-elements.
 * 
 * Migration:
 *   Before: <progress data-value="50" data-max="100">Loading</progress>
 *   After:  <progress value="50" max="100">50%</progress>
 * 
 * This file is retained for backward compatibility with existing <progress>
 * custom tags but will be removed in a future version.
 * -----------------------------------------------------------------------------
 */
export default function progressbar(element, options = {}) {
  const config = {
    value: parseFloat(options.value || readAttr(element, 'value') || 0),
    max: parseFloat(options.max || readAttr(element, 'max') || 100),
    label: options.label || readAttr(element, 'label') || '',
    variant: options.variant || readAttr(element, 'variant') || 'primary',
    striped: options.striped ?? readAttr(element, 'striped') === 'true',
    animated: options.animated ?? readAttr(element, 'animated') === 'true',
    ...options
  };

  element.classList.add('x-progress');
  
  // Inject styles
  injectProgressStyles();

  // Clear existing content if it's just text or empty
  if (!element.querySelector('.x-progress-bar')) {
    element.innerHTML = '';
  }

  // Create bar
  let bar = element.querySelector('.x-progress-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'x-progress-bar';
    element.appendChild(bar);
  }

  // Create label
  let labelEl = element.querySelector('.x-progress-label');
  if (config.label && !labelEl) {
    labelEl = document.createElement('span');
    labelEl.className = 'x-progress-label';
    element.appendChild(labelEl);
  }
  if (labelEl) labelEl.textContent = config.label;

  // Calculate percentage
  const percent = Math.min(100, Math.max(0, (config.value / config.max) * 100));

  // Colors
  const colors = {
    primary: 'var(--primary, #6366f1)',
    success: 'var(--success, #22c55e)',
    warning: 'var(--warning, #f59e0b)',
    danger: 'var(--danger, #ef4444)',
    info: 'var(--info, #3b82f6)'
  };
  const color = colors[config.variant] || colors.primary;

  // Styles
  element.style.cssText = `
    background: var(--bg-tertiary, #e5e7eb);
    border-radius: 999px;
    height: 1.5rem;
    width: 100%;
    position: relative;
    overflow: hidden;
  `;

  bar.style.cssText = `
    background-color: ${color};
    width: ${percent}%;
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    font-weight: bold;
  `;

  if (config.striped) {
    bar.style.backgroundImage = 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)';
    bar.style.backgroundSize = '1rem 1rem';
  }

  if (config.animated) {
    bar.style.animation = 'x-progress-stripes 1s linear infinite';
  }

  if (labelEl) {
    labelEl.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: var(--text-primary);
      font-size: 0.875rem;
      font-weight: 500;
      mix-blend-mode: difference;
      pointer-events: none;
    `;
  }
}

function injectProgressStyles() {
  if (document.getElementById('x-progressbar-css')) return;
  const style = document.createElement('style');
  style.id = 'x-progressbar-css';
  style.textContent = `
    @keyframes x-progress-stripes {
      from { background-position: 1rem 0; }
      to { background-position: 0 0; }
    }
  `;
  document.head.appendChild(style);
}

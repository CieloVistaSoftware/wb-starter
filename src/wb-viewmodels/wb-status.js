/**
 * Self-styling status bar displaying runtime metrics.
 * - `<wb-status>` fixed bar with behavior count and render time.
 */
export function cc() {}

export function status(element, options = {}) {
  // Move to body if not already there - ensures fixed positioning works
  if (element.parentElement !== document.body) {
    document.body.appendChild(element);
  }

  // Detect mobile
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  // Self-style the component - mobile first
  Object.assign(element.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    width: '100vw',
    height: isMobile ? '20px' : '24px',
    background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '0 0.5rem' : '0 1rem',
    fontSize: isMobile ? '0.65rem' : '0.75rem',
    color: 'var(--text-muted)',
    zIndex: '9999',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box'
  });

  // Build internal structure - simplified for mobile
  element.innerHTML = `
    <div class="wb-status__left" style="display:flex;align-items:center;gap:${isMobile ? '0.5rem' : '1rem'};">
      <div class="wb-status__item" style="display:flex;align-items:center;gap:0.25rem;">
        <span class="wb-status__dot" style="width:6px;height:6px;border-radius:50%;background:var(--success,#22c55e);flex-shrink:0;"></span>
        <span class="wb-status__message">Ready</span>
      </div>
    </div>
    <div class="wb-status__right" style="display:flex;align-items:center;gap:${isMobile ? '0.5rem' : '1rem'};">
      <div class="wb-status__item" style="display:${isMobile ? 'none' : 'flex'};align-items:center;gap:0.25rem;">
        <span>Behaviors:</span>
        <span class="wb-status__behaviors">--</span>
      </div>
      <div class="wb-status__item" style="display:flex;align-items:center;gap:0.25rem;">
        <span>${isMobile ? '' : 'Render: '}</span>
        <span class="wb-status__render">--</span>
      </div>
      <div class="wb-status__item">
        <span class="wb-status__time"></span>
      </div>
    </div>
  `;

  const dot = element.querySelector('.wb-status__dot');
  const message = element.querySelector('.wb-status__message');
  const behaviors = element.querySelector('.wb-status__behaviors');
  const render = element.querySelector('.wb-status__render');
  const time = element.querySelector('.wb-status__time');

  // Calculate render time
  const renderMs = Math.round(performance.now());
  const renderSec = (renderMs / 1000).toFixed(3);
  if (render) render.textContent = `${renderSec}s`;

  // Update behavior count
  const updateBehaviors = () => {
    if (window.WB?.behaviors && behaviors) {
      behaviors.textContent = Object.keys(WB.behaviors).length;
    }
  };

  // Update timestamp
  const updateTime = () => {
    if (time) time.textContent = new Date().toLocaleTimeString();
  };

  // Set message with type
  const setMessage = (text, type = 'info') => {
    if (message) message.textContent = text;
    if (dot) {
      dot.style.background = type === 'error' ? 'var(--error,#ef4444)' 
                           : type === 'warning' ? 'var(--warning,#f59e0b)'
                           : 'var(--success,#22c55e)';
    }
    // Auto-clear after 5s for non-errors
    if (type !== 'error') {
      setTimeout(() => {
        if (message) message.textContent = 'Ready';
        if (dot) dot.style.background = 'var(--success,#22c55e)';
      }, 5000);
    }
  };

  // Expose global API
  window.wbStatusMessage = setMessage;

  // Initial update
  requestAnimationFrame(() => {
    updateBehaviors();
    updateTime();
    if (message) message.textContent = `Loaded in ${renderSec}s`;
  });

  // Update time every second
  const interval = setInterval(updateTime, 1000);

  // Listen for WB ready
  document.addEventListener('wb:ready', updateBehaviors);

  // Reserve body space
  document.body.style.paddingBottom = '28px';

  // Cleanup
  return () => {
    clearInterval(interval);
    document.removeEventListener('wb:ready', updateBehaviors);
    delete window.wbStatusMessage;
    document.body.style.paddingBottom = '';
  };
}

export default status;

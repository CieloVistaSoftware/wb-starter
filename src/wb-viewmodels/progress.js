/**
 * Progress — animated progress bars.
 * Component: <wb-progress>
 * TODO: Migrate inline styles to progress.css
 */
export function cc() {}

/**
 * Progress - Animated progress bars
 */
export function progress(element, options = {}) {
  const config = {
    value: parseInt(options.value || element.dataset.value || '0'),
    max: parseInt(options.max || element.dataset.max || '100'),
    animated: options.animated ?? element.hasAttribute('data-animated') ?? false,
    striped: options.striped ?? element.hasAttribute('data-striped'),
    showLabel: options.showLabel ?? element.dataset.showLabel !== 'false',
    ...options
  };

  element.classList.add('wb-progress');
  if (config.animated) {
    element.classList.add('wb-progress--animated');
  }

  element.style.width = '100%';
  element.style.height = '8px';
  element.style.background = 'var(--bg-tertiary, #374151)';
  element.style.borderRadius = '9999px';
  element.style.overflow = 'hidden';
  element.style.position = 'relative';

  if (element.tagName === 'PROGRESS') {
    element.style.appearance = 'none';
    element.style.webkitAppearance = 'none';
    element.style.border = 'none';
  }

  const pct = Math.min(100, (config.value / config.max) * 100);

  const bar = document.createElement('div');
  bar.className = 'wb-progress__bar';
  bar.style.width = config.animated ? '0%' : `${pct}%`;
  bar.style.height = '100%';
  bar.style.background = 'var(--primary, #6366f1)';
  bar.style.borderRadius = '0.3rem';
  bar.style.transition = 'width 1s cubic-bezier(0.4, 0, 0.2, 1)';
  if (config.striped) {
    bar.style.backgroundImage = 'linear-gradient(45deg,rgba(255,255,255,0.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,0.15) 50%,rgba(255,255,255,0.15) 75%,transparent 75%,transparent)';
    bar.style.backgroundSize = '0.6rem 0.6rem';
  }
  element.innerHTML = '';
  element.appendChild(bar);

  if (config.animated) {
    setTimeout(() => {
      const barEl = element.querySelector('.wb-progress__bar');
      if (barEl) barEl.style.width = `${pct}%`;
    }, 50);
  }

  element.wbProgress = {
    setValue: (v) => {
      const progressBar = element.querySelector('.wb-progress__bar');
      if (progressBar) progressBar.style.width = `${(v / config.max) * 100}%`;
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

export default progress;

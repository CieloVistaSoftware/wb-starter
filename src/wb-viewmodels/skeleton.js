/**
 * Skeleton — loading placeholder with shimmer.
 * Component: <wb-skeleton>
 * TODO: Migrate inline styles to skeleton.css
 */
export function cc() {}

/**
 * Skeleton - Glassmorphism loading skeletons with shimmer animation
 */
export function skeleton(element, options = {}) {
  const config = {
    variant: options.variant || element.dataset.variant || 'text',
    lines: parseInt(options.lines || element.dataset.lines || '1'),
    width: options.width || element.dataset.width || '100%',
    height: options.height || element.dataset.height || '',
    ...options
  };

  element.classList.add('wb-skeleton', `wb-skeleton--${config.variant}`);
  element.style.display = 'block';

  const skeletonStyle = `
    background: linear-gradient(
      90deg,
      var(--bg-tertiary, rgba(255,255,255,0.05)) 0%,
      var(--bg-secondary, rgba(255,255,255,0.15)) 50%,
      var(--bg-tertiary, rgba(255,255,255,0.05)) 100%
    );
    background-size: 200% 100%;
    animation: wb-skeleton-shimmer 1.5s ease-in-out infinite;
  `;

  const variants = {
    text: () => {
      let html = '';
      for (let i = 0; i < config.lines; i++) {
        const w = i === config.lines - 1 && config.lines > 1 ? '60%' : '100%';
        html += `<div class="wb-skeleton__line" style="height:1rem;border-radius:4px;margin-bottom:0.5rem;width:${w};${skeletonStyle}"></div>`;
      }
      element.innerHTML = html;
    },
    circle: () => {
      element.innerHTML = `<div class="wb-skeleton__circle" style="width:${config.width};height:${config.width};border-radius:50%;${skeletonStyle}"></div>`;
    },
    rect: () => {
      element.innerHTML = `<div class="wb-skeleton__rect" style="width:${config.width};height:${config.height || '100px'};border-radius:8px;${skeletonStyle}"></div>`;
    },
    card: () => {
      element.innerHTML = `
        <div style="background:var(--bg-secondary, rgba(255,255,255,0.05));border-radius:8px;padding:1rem;border:1px solid var(--border-color, rgba(255,255,255,0.1));">
          <div class="wb-skeleton__line" style="width:100%;height:120px;border-radius:6px;margin-bottom:0.75rem;${skeletonStyle}"></div>
          <div class="wb-skeleton__line" style="height:1rem;border-radius:4px;margin-bottom:0.5rem;width:70%;${skeletonStyle}"></div>
          <div class="wb-skeleton__line" style="height:0.75rem;border-radius:4px;width:50%;${skeletonStyle}"></div>
        </div>
      `;
    }
  };

  (variants[config.variant] || variants.text)();

  element.dataset.wbReady = 'skeleton';
  return () => element.classList.remove('wb-skeleton');
}

export default skeleton;

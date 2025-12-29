/**
 * Stat - Statistic display
 */
export function stat(element, options = {}) {
  const config = {
    value: options.value || element.dataset.value || '0',
    label: options.label || element.dataset.label || '',
    icon: options.icon || element.dataset.icon || '',
    trend: options.trend || element.dataset.trend || '', // up, down
    ...options
  };

  element.classList.add('wb-stat');
  Object.assign(element.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  });

  let trendHtml = '';
  if (config.trend === 'up') {
    trendHtml = '<span style="color:var(--success, #22c55e);font-size:0.875rem;">↑</span>';
  } else if (config.trend === 'down') {
    trendHtml = '<span style="color:var(--error, #ef4444);font-size:0.875rem;">↓</span>';
  }

  element.innerHTML = `
    <div class="wb-stat__label" style="color:var(--text-secondary, #9ca3af);font-size:0.875rem;display:flex;align-items:center;gap:0.5rem;">
      ${config.icon ? `<span>${config.icon}</span>` : ''}
      ${config.label}
    </div>
    <div class="wb-stat__value" style="color:var(--text-primary, #f9fafb);font-size:1.5rem;font-weight:700;display:flex;align-items:center;gap:0.5rem;">
      ${config.value}
      ${trendHtml}
    </div>
  `;

  return () => element.classList.remove('wb-stat');
}

export default stat;

/**
 * Timeline - Vertical timeline
 */
export function timeline(element, options = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    ...options
  };

  element.classList.add('wb-timeline');
  
  let html = '';
  config.items.forEach((item, index) => {
    html += `
      <div class="wb-timeline__item" style="position:relative;padding-left:1.5rem;padding-bottom:1.5rem;">
        <div class="wb-timeline__marker" style="
          position:absolute;left:0;top:0.25rem;width:0.75rem;height:0.75rem;
          background:var(--primary, #6366f1);border-radius:50%;z-index:1;
        "></div>
        ${index < config.items.length - 1 ? `
        <div class="wb-timeline__line" style="
          position:absolute;left:0.3rem;top:1rem;bottom:0;width:2px;
          background:var(--border-color, #374151);
        "></div>
        ` : ''}
        <div class="wb-timeline__content" style="color:var(--text-primary, #f9fafb);">
          ${item.trim()}
        </div>
      </div>
    `;
  });
  
  element.innerHTML = html;

  return () => element.classList.remove('wb-timeline');
}

export default timeline;

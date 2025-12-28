/**
 * WB Collapse Behavior - Collapsible content
 */
export function collapse(element, options = {}) {
  const config = {
    label: options.label || element.dataset.label || 'Toggle',
    open: options.open ?? element.hasAttribute('data-open'),
    ...options
  };

  element.classList.add('wb-collapse');

  const content = element.innerHTML;

  element.innerHTML = `
    <button class="wb-collapse__trigger" style="
      display:flex;align-items:center;justify-content:space-between;
      width:100%;padding:0.75rem 1rem;
      background:var(--bg-secondary,#1f2937);
      border:1px solid var(--border-color,#374151);
      border-radius:6px;cursor:pointer;color:inherit;
      font-weight:500;
    ">
      <span>${config.label}</span>
      <span class="wb-collapse__icon" style="transition:transform 0.2s;">${config.open ? '▲' : '▼'}</span>
    </button>
    <div class="wb-collapse__content" style="
      padding:0.75rem 1rem;
      border:1px solid var(--border-color,#374151);
      border-top:none;border-radius:0 0 6px 6px;
      display:${config.open ? 'block' : 'none'};
      background:var(--bg-primary,#111827);
    ">${content}</div>
  `;

  const trigger = element.querySelector('.wb-collapse__trigger');
  const contentEl = element.querySelector('.wb-collapse__content');
  const icon = element.querySelector('.wb-collapse__icon');

  let isOpen = config.open;

  trigger.addEventListener('click', () => {
    isOpen = !isOpen;
    contentEl.style.display = isOpen ? 'block' : 'none';
    icon.textContent = isOpen ? '▲' : '▼';
    trigger.style.borderRadius = isOpen ? '6px 6px 0 0' : '6px';

    element.dispatchEvent(new CustomEvent('wb:collapse:toggle', { 
      bubbles: true, 
      detail: { open: isOpen } 
    }));
  });

  element.wbCollapse = {
    toggle: () => trigger.click(),
    open: () => { if (!isOpen) trigger.click(); },
    close: () => { if (isOpen) trigger.click(); },
    get isOpen() { return isOpen; }
  };

  element.dataset.wbReady = 'collapse';
  return () => element.classList.remove('wb-collapse');
}

// Accordion is an alias for collapse
export const accordion = collapse;

export default collapse;

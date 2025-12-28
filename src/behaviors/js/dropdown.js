/**
 * WB Dropdown Behavior - Click to show menu
 */
export function dropdown(element, options = {}) {
  const config = {
    items: (options.items || element.dataset.items || '').split(',').filter(Boolean),
    ...options
  };

  element.classList.add('wb-dropdown');
  element.style.position = 'relative';
  element.style.cursor = 'pointer';
  element.style.display = 'inline-block';

  // Create menu
  const menu = document.createElement('div');
  menu.className = 'wb-dropdown__menu';
  menu.style.cssText = `
    position:absolute;top:100%;left:0;
    background:var(--bg-secondary,#1f2937);
    border:1px solid var(--border-color,#374151);
    border-radius:8px;min-width:150px;
    box-shadow:0 10px 25px rgba(0,0,0,0.2);
    display:none;z-index:1000;overflow:hidden;
    margin-top:4px;
  `;

  menu.innerHTML = config.items.map(item => `
    <div class="wb-dropdown__item" style="
      padding:0.5rem 0.75rem;cursor:pointer;
      transition:background 0.15s;
    " onmouseenter="this.style.background='var(--bg-tertiary,#374151)'"
       onmouseleave="this.style.background=''">${item.trim()}</div>
  `).join('');

  element.appendChild(menu);

  let isOpen = false;

  const toggle = () => {
    isOpen = !isOpen;
    menu.style.display = isOpen ? 'block' : 'none';
    if (isOpen) {
      menu.style.animation = 'wb-fade-in 0.15s ease';
    }
  };

  const close = () => {
    isOpen = false;
    menu.style.display = 'none';
  };

  element.addEventListener('click', (e) => {
    if (e.target.closest('.wb-dropdown__item')) {
      element.dispatchEvent(new CustomEvent('wb:dropdown:select', { 
        bubbles: true, 
        detail: { value: e.target.textContent.trim() } 
      }));
      close();
    } else {
      toggle();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!element.contains(e.target)) close();
  });

  element.dataset.wbReady = 'dropdown';
  return () => { menu.remove(); element.classList.remove('wb-dropdown'); };
}

export default dropdown;

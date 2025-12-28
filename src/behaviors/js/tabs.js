/**
 * WB Tabs Behavior - Tab panels from child elements
 */
export function tabs(element, options = {}) {
  element.classList.add('wb-tabs');

  const panels = Array.from(element.children);
  if (panels.length === 0) return () => {};

  // Extract tab data
  const tabData = panels.map((panel, i) => ({
    title: panel.dataset.tabTitle || `Tab ${i + 1}`,
    content: panel.innerHTML,
    id: panel.id || `tab-${i}`
  }));

  // Build tabs UI
  element.innerHTML = `
    <div class="wb-tabs__nav" role="tablist" style="
      display:flex;gap:0;border-bottom:1px solid var(--border-color,#374151);
      margin-bottom:0.75rem;
    ">
      ${tabData.map((tab, i) => `
        <button class="wb-tabs__tab ${i === 0 ? 'wb-tabs__tab--active' : ''}" 
                role="tab" 
                data-index="${i}"
                style="
                  padding:0.5rem 1rem;background:none;border:none;
                  cursor:pointer;color:inherit;
                  border-bottom:2px solid ${i === 0 ? 'var(--primary,#6366f1)' : 'transparent'};
                  margin-bottom:-1px;font-weight:${i === 0 ? '600' : '400'};
                  opacity:${i === 0 ? '1' : '0.7'};
                ">${tab.title}</button>
      `).join('')}
    </div>
    <div class="wb-tabs__panels">
      ${tabData.map((tab, i) => `
        <div class="wb-tabs__panel" role="tabpanel" data-index="${i}" 
             style="display:${i === 0 ? 'block' : 'none'};">
          ${tab.content}
        </div>
      `).join('')}
    </div>
  `;

  // Tab click handler
  const nav = element.querySelector('.wb-tabs__nav');
  nav.addEventListener('click', (e) => {
    const tab = e.target.closest('.wb-tabs__tab');
    if (!tab) return;

    const index = parseInt(tab.dataset.index);

    // Update tabs
    element.querySelectorAll('.wb-tabs__tab').forEach((t, i) => {
      const active = i === index;
      t.classList.toggle('wb-tabs__tab--active', active);
      t.style.borderBottomColor = active ? 'var(--primary,#6366f1)' : 'transparent';
      t.style.fontWeight = active ? '600' : '400';
      t.style.opacity = active ? '1' : '0.7';
    });

    // Update panels
    element.querySelectorAll('.wb-tabs__panel').forEach((p, i) => {
      p.style.display = i === index ? 'block' : 'none';
    });

    element.dispatchEvent(new CustomEvent('wb:tabs:change', { 
      bubbles: true, 
      detail: { index, title: tabData[index].title } 
    }));
  });

  element.dataset.wbReady = 'tabs';
  return () => element.classList.remove('wb-tabs');
}

export default tabs;

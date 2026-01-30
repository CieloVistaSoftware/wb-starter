/**
 * List Behavior
 * Populates a list from data-items attribute
 * Helper Attribute: [x-behavior="list"]
 */
export function list(element, options = {}) {
    const config = {
        items: options.items || element.dataset.items || '',
        dividers: options.dividers !== undefined ? options.dividers : element.hasAttribute('data-dividers'),
        ...options
    };
    if (!config.items)
        return;
    // Parse items (JSON or comma separated)
    let items = [];
    if (config.items.trim().startsWith('[')) {
        try {
            items = JSON.parse(config.items);
        }
        catch (e) {
            console.warn('[list] Invalid JSON items, falling back to comma split', e);
            items = config.items.split(',').map(i => i.trim());
        }
    }
    else {
        items = config.items.split(',').map(i => i.trim());
    }
    // Add class for styling
    element.classList.add('wb-list');
    if (config.dividers) {
        element.classList.add('wb-list--dividers');
    }
    // Clear existing content if empty (or just append?)
    // Usually we replace content if data-items is provided
    element.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        li.classList.add('wb-list__item');
        element.appendChild(li);
    });
    // Add basic styles if not present
    if (!document.getElementById('wb-list-style')) {
        const style = document.createElement('style');
        style.id = 'wb-list-style';
        style.textContent = `
      .wb-list { list-style: none; padding: 0; margin: 0; }
      .wb-list__item { padding: 0.5rem 0; }
      .wb-list--dividers .wb-list__item:not(:last-child) {
        border-bottom: 1px solid var(--border-color, #eee);
      }
    `;
        document.head.appendChild(style);
    }
}
export default list;
//# sourceMappingURL=list.js.map
/**
 * builder-utils.js
 * Shared utility functions for the builder
 */
/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'info' | 'error' | 'success'
 */
export function toast(message, type = 'info') {
    const toastEl = document.getElementById('toast');
    if (!toastEl)
        return;
    // Clear any pending timeout
    if (toastEl.dataset.timeoutId) {
        clearTimeout(parseInt(toastEl.dataset.timeoutId));
        delete toastEl.dataset.timeoutId;
    }
    // Visual Reset
    toastEl.style.backgroundColor = '';
    toastEl.innerHTML = '';
    if (type === 'error') {
        toastEl.style.backgroundColor = 'var(--danger-color, #ef4444)';
        toastEl.style.display = 'flex';
        toastEl.style.alignItems = 'center';
        toastEl.style.gap = '12px';
        toastEl.style.paddingRight = '8px';
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        textSpan.style.flex = '1';
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Copy';
        copyBtn.style.cssText = 'background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:white;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;white-space:nowrap;transition:all 0.2s;';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(message).then(() => {
                copyBtn.textContent = '✔️ Copied';
                copyBtn.style.background = 'rgba(34, 197, 94, 0.4)';
                copyBtn.style.borderColor = 'rgba(34, 197, 94, 0.6)';
            }).catch(err => {
                console.error('Copy failed:', err);
                copyBtn.textContent = '❌ Failed';
            });
        };
        toastEl.appendChild(textSpan);
        toastEl.appendChild(copyBtn);
    }
    else {
        toastEl.textContent = message;
        toastEl.removeAttribute('style');
    }
    toastEl.classList.add('show');
    const duration = type === 'error' ? 8000 : 2500;
    const timeoutId = setTimeout(() => {
        toastEl.classList.remove('show');
    }, duration);
    toastEl.dataset.timeoutId = timeoutId;
}
/**
 * Update component count display
 */
export function updCount() {
    const count = document.querySelectorAll('.dropped').length;
    const countEl = document.getElementById('count');
    if (countEl)
        countEl.textContent = count + ' component' + (count !== 1 ? 's' : '');
}
/**
 * Check if canvas is empty and show placeholder
 */
export function chkEmpty() {
    const canvas = document.getElementById('canvas');
    if (!canvas.querySelector('.dropped')) {
        canvas.innerHTML = '<div class="empty" id="empty"><div class="empty-icon">+</div><h3>Drag components here</h3><p>Build your page visually</p></div>';
    }
}
/**
 * Update counts and refresh tree
 */
export function upd() {
    updCount();
    if (window.renderTree)
        window.renderTree();
    if (window.autoExtendCanvas)
        window.autoExtendCanvas();
}
/**
 * Auto-extend canvas height if needed
 */
export function autoExtendCanvas() {
    const canvas = document.getElementById('canvas');
    if (!canvas)
        return;
    const lastDropped = canvas.querySelector('.dropped:last-child');
    if (lastDropped) {
        const rect = lastDropped.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        if (rect.bottom > canvasRect.bottom - 100) {
            canvas.style.minHeight = (canvas.offsetHeight + 200) + 'px';
        }
    }
}
/**
 * Show context menu at position
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {HTMLElement} wrapper - The wrapper element
 */
export function showContextMenu(x, y, wrapper) {
    // Remove existing menu
    document.getElementById('builderContextMenu')?.remove();
    const componentData = JSON.parse(wrapper.dataset.c);
    const menu = document.createElement('div');
    menu.id = 'builderContextMenu';
    menu.className = 'context-menu';
    menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: var(--bg-secondary, #1f2937);
    border: 1px solid var(--border-color, #374151);
    border-radius: 8px;
    padding: 0.5rem 0;
    min-width: 200px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    animation: fadeIn 0.15s ease;
  `;
    menu.innerHTML = `
    <button class="ctx-item" onclick="viewSchema('${componentData.b}')">View Schema</button>
    <button class="ctx-item" onclick="selComp(document.getElementById('${wrapper.id}'))">Edit Properties</button>
    <hr class="ctx-divider">
    <button class="ctx-item" onclick="dup('${wrapper.id}')">Duplicate</button>
    <button class="ctx-item" onclick="moveUp('${wrapper.id}')">Move Up</button>
    <button class="ctx-item" onclick="moveDown('${wrapper.id}')">Move Down</button>
    <hr class="ctx-divider">
    <button class="ctx-item ctx-item--danger" onclick="del('${wrapper.id}')">Delete</button>
  `;
    // Style the menu items
    const style = document.createElement('style');
    style.textContent = `
    .ctx-item {
      display: block;
      width: 100%;
      padding: 0.5rem 1rem;
      text-align: left;
      background: none;
      border: none;
      color: var(--text-primary, #fff);
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.15s;
    }
    .ctx-item:hover { background: var(--bg-tertiary, #374151); }
    .ctx-item--danger { color: #ef4444; }
    .ctx-item--danger:hover { background: rgba(239, 68, 68, 0.1); }
    .ctx-divider { border: none; border-top: 1px solid var(--border-color, #374151); margin: 0.25rem 0; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `;
    menu.appendChild(style);
    document.body.appendChild(menu);
    // Adjust position if off-screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth)
        menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    if (rect.bottom > window.innerHeight)
        menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
    // Close on click outside
    setTimeout(() => {
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 0);
}
/**
 * Validate a component for required fields
 * @param {HTMLElement} wrapper - The wrapper element
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateComponent(wrapper) {
    const componentData = JSON.parse(wrapper.dataset.c || '{}');
    const innerElement = wrapper.querySelector('[data-wb]');
    if (!innerElement || !componentData.d)
        return { valid: true, missing: [] };
    const missing = [];
    // Check required fields based on component type
    const requiredFields = {
        'link': ['href'],
        'cardbutton': ['primary'],
        'cardimage': ['imageSrc'],
        'cardprofile': ['name'],
        'audio': ['src'],
        'video': ['src'],
        'cardpricing': ['plan', 'price']
    };
    const required = requiredFields[componentData.b] || [];
    for (const field of required) {
        const value = componentData.d[field] || innerElement.dataset[field];
        if (!value || value.trim() === '') {
            missing.push(field);
        }
    }
    return { valid: missing.length === 0, missing };
}
// Expose globally
window.toast = toast;
window.updCount = updCount;
window.chkEmpty = chkEmpty;
window.upd = upd;
window.autoExtendCanvas = autoExtendCanvas;
window.validateComponent = validateComponent;
//# sourceMappingURL=builder-utils.js.map
/**
 * Reorder Behavior (x-reorder)
 * Minimal drag-to-reorder behavior for grid/list containers.
 * - Attach to a container: <div x-reorder>...</div>
 * - Items are the container's direct children
 * - On drag start: create placeholder; item moves absolute while dragging
 * - On drop: place item where placeholder is and remove absolute layout
 */
export function reorder(container, options = {}) {
  container.classList.add('wb-reorder');
  container.dataset.wbReady = (container.dataset.wbReady || '') + ' reorder';

  let dragging = null;
  let placeholder = null;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let containerRect = null;

  const getItems = () => Array.from(container.children).filter(el => el !== placeholder && el !== dragging);

  function onPointerDown(e) {
    const target = e.target.closest('.grid-item, .reorder-item');
    if (!target || !container.contains(target)) return;
    
    // Don't handle if target or its children have x-draggable (let draggable handle it)
    if (e.target.closest('[x-draggable]')) return;
    
    e.preventDefault();

    // Determine the actual item element (grid-item wrapper or the item itself)
    let itemWrapper = target.classList.contains('grid-item') ? target : target.closest('.grid-item') || target;
    dragging = itemWrapper;

    // Compute offsets
    containerRect = container.getBoundingClientRect();
    const rect = dragging.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    startX = e.clientX;
    startY = e.clientY;

    // Create placeholder
    placeholder = document.createElement('div');
    placeholder.className = 'wb-reorder--placeholder';
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.height = `${rect.height}px`;
    // Insert placeholder at the current position
    dragging.parentElement.insertBefore(placeholder, dragging.nextSibling);

    // Make the dragged item absolute so grid stays in flow
    const wrapperRect = dragging.getBoundingClientRect();
    const relLeft = wrapperRect.left - containerRect.left;
    const relTop = wrapperRect.top - containerRect.top;

    dragging.style.width = `${wrapperRect.width}px`;
    dragging.style.height = `${wrapperRect.height}px`;
    dragging.style.position = 'absolute';
    dragging.style.left = `${relLeft}px`;
    dragging.style.top = `${relTop}px`;
    dragging.classList.add('dragging');
    dragging.style.touchAction = 'none';

    // Debug
    try { console.log('[WB] reorder:start', { id: dragging.querySelector('.reorder-item')?.id || dragging.id, relLeft, relTop }); } catch (err) {}

    // Try to capture pointer to ensure we receive move/up events
    try { if (e.pointerId && dragging.setPointerCapture) dragging.setPointerCapture(e.pointerId); } catch (err) {}
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    e.preventDefault();

    const x = e.clientX - containerRect.left - offsetX;
    const y = e.clientY - containerRect.top - offsetY;

    dragging.style.left = `${x}px`;
    dragging.style.top = `${y}px`;

    // Find nearest item to place the placeholder before
    const items = getItems();
    const centerX = e.clientX;
    const centerY = e.clientY;

    for (const item of items) {
      const r = item.getBoundingClientRect();
      const midX = r.left + r.width / 2;
      const midY = r.top + r.height / 2;

      // Debug: log midpoints and pointer location
      try { console.log('[WB] reorder:move check', { id: item.querySelector('.reorder-item')?.id || item.id, centerX, centerY, midX, midY }); } catch (err) {}

      // Use simple distance / direction heuristic: if pointer is above midY, insert before
      if (centerY < midY) {
        if (item !== placeholder.previousSibling) {
          item.parentElement.insertBefore(placeholder, item);
          try { console.log('[WB] reorder:placeholder moved before', item.querySelector('.reorder-item')?.id || item.id); } catch (err) {}
        }
        break;
      }
      // If reached last, move placeholder to end
      if (item === items[items.length - 1]) {
        item.parentElement.appendChild(placeholder);
        try { console.log('[WB] reorder:placeholder moved to end'); } catch (err) {}
      }
    }
  }

  function onPointerUp(e) {
    if (!dragging) return;
    e.preventDefault();

    // Place the item where the placeholder is
    placeholder.parentElement.insertBefore(dragging, placeholder);

    // Reset styles
    dragging.style.position = '';
    dragging.style.left = '';
    dragging.style.top = '';
    dragging.style.width = '';
    dragging.style.height = '';
    dragging.classList.remove('dragging');

    // Remove placeholder
    placeholder.remove();
    placeholder = null;

    // Release pointer capture if available
    try { if (e.pointerId && dragging.releasePointerCapture) dragging.releasePointerCapture(e.pointerId); } catch (err) {}

    // Emit event with order (include text for easier testing)
    const order = getItems().map(el => {
      const id = el.querySelector('.reorder-item')?.id || el.id || null;
      const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
      return { id, text };
    });
    try { console.log('[WB] reorder:end', { order }); } catch (err) {}
    try { container.setAttribute('data-last-order', JSON.stringify(order)); } catch (err) {}
    container.dispatchEvent(new CustomEvent('wb:reorder:end', { bubbles: true, detail: { order } }));

    dragging = null;
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  }

  // Attach listener on container (delegation)
  container.addEventListener('pointerdown', onPointerDown);

  return () => {
    container.removeEventListener('pointerdown', onPointerDown);
  };
}

export default reorder;
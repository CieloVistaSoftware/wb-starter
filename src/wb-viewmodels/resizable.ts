/**
 * Resizable Behavior
 * -----------------------------------------------------------------------------
 * Make an element resizable.
 * 
 * Helper Attribute: [x-resizable]
 * -----------------------------------------------------------------------------
 */
export function resizable(element: HTMLElement, options: Record<string, any> = {}) {
  const config = {
    directions: options.directions || element.dataset.directions || 'se', // n, s, e, w, ne, nw, se, sw, all
    minWidth: parseInt(options.minWidth || element.dataset.minWidth || '50', 10),
    minHeight: parseInt(options.minHeight || element.dataset.minHeight || '50', 10),
    maxWidth: parseInt(options.maxWidth || element.dataset.maxWidth || '0', 10) || Infinity,
    maxHeight: parseInt(options.maxHeight || element.dataset.maxHeight || '0', 10) || Infinity,
    aspectRatio: options.aspectRatio ?? element.hasAttribute('data-aspect-ratio'),
    ...options
  };

  element.classList.add('wb-resizable');

  // Ensure element is positioned
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.position === 'static') {
    element.style.position = 'relative';
  }

  // Parse directions
  const dirs = config.directions === 'all' 
    ? ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
    : config.directions.split(/[\s,]+/).filter(Boolean);

  // Create handles
  const handles = {};
  dirs.forEach(dir => {
    const handle = document.createElement('div');
    handle.className = `wb-resizable__handle wb-resizable__handle--${dir}`;
    handle.dataset.direction = dir;
    
    // Position and style handles
    const styles = {
      position: 'absolute',
      zIndex: '10'
    };

    switch (dir) {
      case 'n':
        Object.assign(styles, { top: '-4px', left: '0', right: '0', height: '8px', cursor: 'n-resize' });
        break;
      case 's':
        Object.assign(styles, { bottom: '-4px', left: '0', right: '0', height: '8px', cursor: 's-resize' });
        break;
      case 'e':
        Object.assign(styles, { top: '0', right: '-4px', bottom: '0', width: '8px', cursor: 'e-resize' });
        break;
      case 'w':
        Object.assign(styles, { top: '0', left: '-4px', bottom: '0', width: '8px', cursor: 'w-resize' });
        break;
      case 'ne':
        Object.assign(styles, { top: '-4px', right: '-4px', width: '12px', height: '12px', cursor: 'ne-resize' });
        break;
      case 'nw':
        Object.assign(styles, { top: '-4px', left: '-4px', width: '12px', height: '12px', cursor: 'nw-resize' });
        break;
      case 'se':
        Object.assign(styles, { bottom: '-4px', right: '-4px', width: '12px', height: '12px', cursor: 'se-resize' });
        break;
      case 'sw':
        Object.assign(styles, { bottom: '-4px', left: '-4px', width: '12px', height: '12px', cursor: 'sw-resize' });
        break;
    }

    Object.assign(handle.style, styles);
    element.appendChild(handle);
    handles[dir] = handle;
  });

  // State
  let isResizing = false;
  let currentDir = null;
  let startX, startY;
  let startWidth, startHeight;
  let startLeft, startTop;
  let aspectRatioValue;

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    // Use a different variable name to avoid duplicate declaration
    const handleEl = e.target.closest('.wb-resizable__handle');
    if (!handleEl) return;
    
    e.preventDefault();
    isResizing = true;
    currentDir = handleEl.dataset.direction;
    
    startX = e.clientX;
    startY = e.clientY;
    startWidth = element.offsetWidth;
    startHeight = element.offsetHeight;
    startLeft = element.offsetLeft;
    startTop = element.offsetTop;
    aspectRatioValue = startWidth / startHeight;
    
    element.classList.add('wb-resizable--resizing');
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    element.dispatchEvent(new CustomEvent('wb:resize:start', {
      bubbles: true,
      detail: { width: startWidth, height: startHeight }
    }));
  };

  const onMouseMove = (e) => {
    if (!isResizing) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;
    
    // Calculate new dimensions based on direction
    if (currentDir.includes('e')) {
      newWidth = startWidth + deltaX;
    }
    if (currentDir.includes('w')) {
      newWidth = startWidth - deltaX;
      newLeft = startLeft + deltaX;
    }
    if (currentDir.includes('s')) {
      newHeight = startHeight + deltaY;
    }
    if (currentDir.includes('n')) {
      newHeight = startHeight - deltaY;
      newTop = startTop + deltaY;
    }
    
    // Apply aspect ratio
    if (config.aspectRatio) {
      if (currentDir.includes('e') || currentDir.includes('w')) {
        newHeight = newWidth / aspectRatioValue;
      } else {
        newWidth = newHeight * aspectRatioValue;
      }
    }
    
    // Apply constraints
    newWidth = Math.max(config.minWidth, Math.min(config.maxWidth, newWidth));
    newHeight = Math.max(config.minHeight, Math.min(config.maxHeight, newHeight));
    
    // Apply changes
    element.style.width = `${newWidth}px`;
    element.style.height = `${newHeight}px`;
    
    if (currentDir.includes('w')) {
      element.style.left = `${startLeft + (startWidth - newWidth)}px`;
    }
    if (currentDir.includes('n')) {
      element.style.top = `${startTop + (startHeight - newHeight)}px`;
    }
    
    element.dispatchEvent(new CustomEvent('wb:resize:move', {
      bubbles: true,
      detail: { width: newWidth, height: newHeight }
    }));
  };

  const onMouseUp = () => {
    if (!isResizing) return;
    
    isResizing = false;
    currentDir = null;
    element.classList.remove('wb-resizable--resizing');
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    element.dispatchEvent(new CustomEvent('wb:resize:end', {
      bubbles: true,
      detail: { width: element.offsetWidth, height: element.offsetHeight }
    }));
  };

  element.addEventListener('mousedown', onMouseDown);

  // Expose methods
  element.wbResizable = {
    setSize: (width, height) => {
      element.style.width = `${Math.max(config.minWidth, Math.min(config.maxWidth, width))}px`;
      element.style.height = `${Math.max(config.minHeight, Math.min(config.maxHeight, height))}px`;
    },
    getSize: () => ({ width: element.offsetWidth, height: element.offsetHeight })
  };

  // Mark as ready
  element.dataset.wbReady = (element.dataset.wbReady || '') + ' resizable';

  // Cleanup
  return () => {
    element.classList.remove('wb-resizable', 'wb-resizable--resizing');
    element.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    Object.values(handles).forEach(h => h.remove());
    delete element.wbResizable;
  };
}

export default resizable;

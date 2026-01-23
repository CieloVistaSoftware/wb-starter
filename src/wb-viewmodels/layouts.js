/**
 * Layout Behaviors - Extended
 * -----------------------------------------------------------------------------
 * Structural layout primitives for building responsive interfaces.
 * Includes Grid, Flex, Stack, Cluster, and Masonry layouts.
 * 
 * Custom Tag: <wb-layout>
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <div x-grid data-columns="3">...</div>
 *   <div justify="between">...</div>
 */

/**
 * Grid - CSS Grid layout
 * Custom Tag: <wb-grid>
 */
export function grid(element, options = {}) {
  const config = {
    columns: options.columns || element.dataset.columns || element.getAttribute('columns') || '3',
    gap: options.gap || element.dataset.gap || element.getAttribute('gap') || '1rem',
    minWidth: options.minWidth || element.dataset.minWidth || element.getAttribute('min-width') || '',
    ...options
  };

  element.classList.add('wb-grid');
  element.style.display = 'grid';
  element.style.gap = config.gap;
  
  if (config.minWidth) {
    element.style.gridTemplateColumns = `repeat(auto-fit, minmax(${config.minWidth}, 1fr))`;
  } else {
    element.style.gridTemplateColumns = `repeat(${config.columns}, 1fr)`;
  }

  return () => element.classList.remove('wb-grid');
}

/**
 * Flex - Flexbox layout
 * Custom Tag: <wb-flex> or <wb-row>
 */
export function flex(element, options = {}) {
  const config = {
    direction: options.direction || element.dataset.direction || element.getAttribute('direction') || 'row',
    wrap: options.wrap || element.dataset.wrap || element.getAttribute('wrap') || 'wrap',
    justify: options.justify || element.dataset.justify || element.getAttribute('justify') || 'flex-start',
    align: options.align || element.dataset.align || element.getAttribute('align') || 'stretch',
    gap: options.gap || element.dataset.gap || element.getAttribute('gap') || '1rem',
    ...options
  };

  element.classList.add('wb-flex');
  element.style.display = 'flex';
  element.style.flexDirection = config.direction;
  element.style.flexWrap = config.wrap;
  element.style.justifyContent = config.justify;
  element.style.alignItems = config.align;
  element.style.gap = config.gap;

  return () => element.classList.remove('wb-flex');
}

/**
 * Container - Full-featured layout container
 * Supports: Stack (column), Row (horizontal), Grid (columns > 1)
 * User controls: direction, columns, gap, align, justify, wrap, padding
 * Custom Tag: <wb-container>
 */
export function container(element, options = {}) {
  const config = {
    direction: options.direction || element.dataset.direction || element.getAttribute('direction') || 'column',
    columns: parseInt(options.columns || element.dataset.columns || element.getAttribute('columns') || '1'),
    gap: options.gap || element.dataset.gap || element.getAttribute('gap') || '1rem',
    align: options.align || element.dataset.align || element.getAttribute('align') || 'stretch',
    justify: options.justify || element.dataset.justify || element.getAttribute('justify') || 'start',
    wrap: (options.wrap ?? element.dataset.wrap ?? element.getAttribute('wrap')) !== 'false',
    padding: options.padding || element.dataset.padding || element.getAttribute('padding') || '1rem',
    maxWidth: options.maxWidth || element.dataset.maxWidth || element.getAttribute('max-width') || '',
    ...options
  };

  element.classList.add('wb-container');
  
  // Map align/justify values to CSS
  const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
  const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' };
  
  // Determine layout mode
  if (config.columns === 1) {
    // FLEX MODE: Stack (column) or Row (row)
    element.style.display = 'flex';
    element.style.flexDirection = config.direction;
    element.style.flexWrap = config.wrap ? 'wrap' : 'nowrap';
    element.style.alignItems = alignMap[config.align] || config.align;
    element.style.justifyContent = justifyMap[config.justify] || config.justify;
    element.style.gap = config.gap;
  } else {
    // GRID MODE: Multiple columns
    element.style.display = 'grid';
    element.style.gridTemplateColumns = `repeat(${config.columns}, 1fr)`;
    element.style.alignItems = alignMap[config.align] || config.align;
    element.style.justifyContent = justifyMap[config.justify] || config.justify;
    element.style.gap = config.gap;
  }
  
  // Apply padding
  element.style.padding = config.padding;
  
  // Apply max-width if set
  if (config.maxWidth) {
    element.style.maxWidth = config.maxWidth;
    element.style.marginLeft = 'auto';
    element.style.marginRight = 'auto';
  }
  
  // Visual indicator in builder
  element.style.minHeight = '100px';
  element.style.border = '2px dashed var(--border-color, #374151)';
  element.style.borderRadius = '8px';
  element.style.background = 'var(--bg-secondary, rgba(31, 41, 55, 0.3))';
  
  // Show drop hint if empty
  if (!element.children.length) {
    element.innerHTML = `<div style="color: var(--text-tertiary, #6b7280); text-align: center; padding: 2rem;">
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
      <div>Drop components here</div>
      <div style="font-size: 0.75rem; opacity: 0.7;">${config.columns > 1 ? config.columns + ' columns' : config.direction}</div>
    </div>`;
  }
  
  element.dataset.wbReady = 'container';

  return () => {
    element.classList.remove('wb-container');
    element.style.cssText = '';
  };
}

/**
 * Stack - Vertical stack layout
 * Custom Tag: <wb-stack> or <wb-column>
 */
export function stack(element, options = {}) {
  const config = {
    gap: options.gap || element.dataset.gap || element.getAttribute('gap') || '1rem',
    ...options
  };

  element.classList.add('wb-stack');
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  element.style.gap = config.gap;

  return () => element.classList.remove('wb-stack');
}

/**
 * Cluster - Horizontal cluster layout
 * Custom Tag: <wb-cluster>
 */
export function cluster(element, options = {}) {
  const config = {
    gap: options.gap || element.dataset.gap || element.getAttribute('gap') || '1rem',
    justify: options.justify || element.dataset.justify || element.getAttribute('justify') || 'flex-start',
    align: options.align || element.dataset.align || element.getAttribute('align') || 'center',
    ...options
  };

  element.classList.add('wb-cluster');
  element.style.display = 'flex';
  element.style.flexWrap = 'wrap';
  element.style.gap = config.gap;
  element.style.justifyContent = config.justify;
  element.style.alignItems = config.align;

  return () => element.classList.remove('wb-cluster');
}

/**
 * Center - Center content
 * Custom Tag: <wb-center>
 */
export function center(element, options = {}) {
  const config = {
    maxWidth: options.maxWidth || element.dataset.maxWidth || element.getAttribute('max-width') || '',
    gutters: options.gutters || element.dataset.gutters || element.getAttribute('gutters') || '1rem',
    intrinsic: options.intrinsic ?? (element.hasAttribute('data-intrinsic') || element.hasAttribute('intrinsic')),
    ...options
  };

  element.classList.add('wb-center');
  
  if (config.intrinsic) {
    element.style.display = 'flex';
    element.style.flexDirection = 'column';
    element.style.alignItems = 'center';
  } else {
    element.style.boxSizing = 'content-box';
    element.style.marginLeft = 'auto';
    element.style.marginRight = 'auto';
    if (config.maxWidth) element.style.maxWidth = config.maxWidth;
    element.style.paddingLeft = config.gutters;
    element.style.paddingRight = config.gutters;
  }

  return () => element.classList.remove('wb-center');
}

/**
 * Sidebar Layout - Main content with sidebar
 * Custom Tag: <wb-sidebar>
 */
export function sidebarlayout(element, options = {}) {
  const config = {
    side: options.side || element.dataset.side || element.getAttribute('side') || 'left',
    sideWidth: options.sideWidth || element.dataset.sideWidth || element.getAttribute('side-width') || '300px',
    contentMin: options.contentMin || element.dataset.contentMin || element.getAttribute('content-min') || '50%',
    gap: options.gap || element.dataset.gap || element.getAttribute('gap') || '1rem',
    ...options
  };

  element.classList.add('wb-sidebar-layout');
  element.style.display = 'flex';
  element.style.flexWrap = 'wrap';
  element.style.gap = config.gap;

  const children = Array.from(element.children);
  if (children.length >= 2) {
    const sideIndex = config.side === 'left' ? 0 : 1;
    const mainIndex = config.side === 'left' ? 1 : 0;
    children[sideIndex].style.flexBasis = config.sideWidth;
    children[sideIndex].style.flexGrow = '1';
    children[mainIndex].style.flexBasis = '0';
    children[mainIndex].style.flexGrow = '999';
    children[mainIndex].style.minWidth = config.contentMin;
  }

  return () => element.classList.remove('wb-sidebar-layout');
}

/**
 * Switcher - Responsive switch layout
 * Custom Tag: <wb-switcher>
 */
export function switcher(element, options = {}) {
  const config = {
    threshold: options.threshold || element.dataset.threshold || element.getAttribute('threshold') || '30rem',
    gap: options.gap || element.dataset.gap || element.getAttribute('gap') || '1rem',
    limit: parseInt(options.limit || element.dataset.limit || element.getAttribute('limit') || '4'),
    ...options
  };

  element.classList.add('wb-switcher');
  element.style.display = 'flex';
  element.style.flexWrap = 'wrap';
  element.style.gap = config.gap;

  const children = Array.from(element.children);
  children.forEach(child => {
    child.style.flexGrow = '1';
    child.style.flexBasis = `calc((${config.threshold} - 100%) * 999)`;
  });

  return () => element.classList.remove('wb-switcher');
}

/**
 * Masonry - Masonry layout
 * Custom Tag: <wb-masonry>
 */
export function masonry(element, options = {}) {
  const config = {
    columns: parseInt(options.columns || element.dataset.columns || element.getAttribute('columns') || '3'),
    gap: options.gap || element.dataset.gap || element.getAttribute('gap') || '1rem',
    ...options
  };

  element.classList.add('wb-masonry');
  element.style.columnCount = config.columns;
  element.style.columnGap = config.gap;

  const items = element.children;
  for (let item of items) {
    item.style.breakInside = 'avoid';
    item.style.marginBottom = config.gap;
  }

  return () => element.classList.remove('wb-masonry');
}

/**
 * Sticky - Sticky positioning
 * Custom Tag: <wb-sticky>
 */
export function sticky(element, options = {}) {
  const config = {
    top: options.top || element.dataset.top || element.getAttribute('top') || '0',
    bottom: options.bottom || element.dataset.bottom || element.getAttribute('bottom') || '',
    zIndex: options.zIndex || element.dataset.zIndex || element.getAttribute('z-index') || '100',
    ...options
  };

  element.classList.add('wb-sticky');
  element.style.position = 'sticky';
  if (config.top) element.style.top = config.top;
  if (config.bottom) element.style.bottom = config.bottom;
  element.style.zIndex = config.zIndex;

  return () => element.classList.remove('wb-sticky');
}

/**
 * Fixed - Fixed positioning
 */
export function fixed(element, options = {}) {
  const config = {
    position: options.position || element.dataset.position || element.getAttribute('position') || 'bottom-right',
    offset: options.offset || element.dataset.offset || element.getAttribute('offset') || '1rem',
    zIndex: options.zIndex || element.dataset.zIndex || element.getAttribute('z-index') || '1000',
    ...options
  };

  element.classList.add('wb-fixed');
  element.style.position = 'fixed';
  element.style.zIndex = config.zIndex;

  const positions = {
    'top-left': { top: config.offset, left: config.offset },
    'top-right': { top: config.offset, right: config.offset },
    'top-center': { top: config.offset, left: '50%', transform: 'translateX(-50%)' },
    'bottom-left': { bottom: config.offset, left: config.offset },
    'bottom-right': { bottom: config.offset, right: config.offset },
    'bottom-center': { bottom: config.offset, left: '50%', transform: 'translateX(-50%)' },
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  };

  Object.assign(element.style, positions[config.position] || positions['bottom-right']);

  return () => element.classList.remove('wb-fixed');
}

/**
 * Scrollable - Scrollable container
 */
export function scrollable(element, options = {}) {
  const config = {
    direction: options.direction || element.dataset.direction || element.getAttribute('direction') || 'both',
    maxHeight: options.maxHeight || element.dataset.maxHeight || element.getAttribute('max-height') || '',
    maxWidth: options.maxWidth || element.dataset.maxWidth || element.getAttribute('max-width') || '',
    ...options
  };

  element.classList.add('wb-scrollable');
  
  if (config.direction === 'vertical' || config.direction === 'both') {
    element.style.overflowY = 'auto';
    if (config.maxHeight) element.style.maxHeight = config.maxHeight;
  }
  if (config.direction === 'horizontal' || config.direction === 'both') {
    element.style.overflowX = 'auto';
    if (config.maxWidth) element.style.maxWidth = config.maxWidth;
  }

  return () => element.classList.remove('wb-scrollable');
}

/**
 * Cover - Cover layout
 * Custom Tag: <wb-cover>
 */
export function cover(element, options = {}) {
  const config = {
    minHeight: options.minHeight || element.dataset.minHeight || element.getAttribute('min-height') || '100vh',
    padding: options.padding || element.dataset.padding || element.getAttribute('padding') || '1rem',
    ...options
  };

  element.classList.add('wb-cover');
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  element.style.minHeight = config.minHeight;
  element.style.padding = config.padding;

  const principal = element.querySelector('[data-principal]');
  if (principal) {
    principal.style.marginTop = 'auto';
    principal.style.marginBottom = 'auto';
  }

  return () => element.classList.remove('wb-cover');
}

/**
 * Frame - Aspect ratio frame
 * Custom Tag: <wb-frame>
 */
export function frame(element, options = {}) {
  const config = {
    ratio: options.ratio || element.dataset.ratio || element.getAttribute('ratio') || '16/9',
    ...options
  };

  element.classList.add('wb-frame');
  element.style.aspectRatio = config.ratio;
  element.style.overflow = 'hidden';

  const child = element.firstElementChild;
  if (child) {
    child.style.width = '100%';
    child.style.height = '100%';
    child.style.objectFit = 'cover';
  }

  return () => element.classList.remove('wb-frame');
}

/**
 * Reel - Horizontal scroll reel
 * Custom Tag: <wb-reel>
 */
export function reel(element, options = {}) {
  const config = {
    itemWidth: options.itemWidth || element.dataset.itemWidth || element.getAttribute('item-width') || 'auto',
    gap: options.gap || element.dataset.gap || element.getAttribute('gap') || '1rem',
    ...options
  };

  element.classList.add('wb-reel');
  element.style.display = 'flex';
  element.style.overflowX = 'auto';
  element.style.gap = config.gap;
  element.style.scrollSnapType = 'x mandatory';

  const children = element.children;
  for (let child of children) {
    child.style.flexShrink = '0';
    child.style.scrollSnapAlign = 'start';
    if (config.itemWidth !== 'auto') child.style.width = config.itemWidth;
  }

  return () => element.classList.remove('wb-reel');
}

/**
 * Imposter - Overlay imposter
 */
export function imposter(element, options = {}) {
  const config = {
    breakout: options.breakout ?? (element.hasAttribute('data-breakout') || element.hasAttribute('breakout')),
    margin: options.margin || element.dataset.margin || element.getAttribute('margin') || '0',
    ...options
  };

  element.classList.add('wb-imposter');
  element.style.position = config.breakout ? 'fixed' : 'absolute';
  element.style.top = '50%';
  element.style.left = '50%';
  element.style.transform = 'translate(-50%, -50%)';
  if (config.margin !== '0') {
    element.style.maxWidth = `calc(100% - ${config.margin} * 2)`;
    element.style.maxHeight = `calc(100% - ${config.margin} * 2)`;
    element.style.overflow = 'auto';
  }

  return () => element.classList.remove('wb-imposter');
}

/**
 * Icon - Icon layout helper
 * Custom Tag: <wb-icon>
 */
export function icon(element, options = {}) {
  const config = {
    size: options.size || element.dataset.size || element.getAttribute('size') || '1em',
    space: options.space || element.dataset.space || element.getAttribute('space') || '0.5em',
    ...options
  };

  element.classList.add('wb-icon');
  element.style.display = 'inline-flex';
  element.style.alignItems = 'center';
  element.style.gap = config.space;

  const svg = element.querySelector('svg');
  if (svg) {
    svg.style.width = config.size;
    svg.style.height = config.size;
  }

  return () => element.classList.remove('wb-icon');
}

/**
 * Drawer Layout - Collapsible container that pulls to the edge
 * Custom Tag: <wb-drawer>
 */
export function drawerLayout(element, options = {}) {
  const config = {
    position: options.position || element.dataset.position || element.getAttribute('position') || 'left',
    width: options.width || element.dataset.width || element.getAttribute('width') || '250px',
    height: options.height || element.dataset.height || element.getAttribute('height') || '250px',
    minWidth: options.minWidth || element.dataset.minWidth || element.getAttribute('min-width') || '1.5rem',
    minHeight: options.minHeight || element.dataset.minHeight || element.getAttribute('min-height') || '1.5rem',
    maxWidth: options.maxWidth || element.dataset.maxWidth || element.getAttribute('max-width') || '50vw',
    maxHeight: options.maxHeight || element.dataset.maxHeight || element.getAttribute('max-height') || '50vh',
    resizable: options.resizable ?? (element.dataset.resizable === 'true' || element.getAttribute('resizable') === 'true'),
    saveState: options.saveState ?? (element.dataset.saveState === 'true' || element.getAttribute('save-state') === 'true'),
    id: options.id || element.id || 'drawer',
    toggleSelector: options.toggleSelector || element.dataset.toggleSelector || element.getAttribute('toggle-selector'),
    handleSelector: options.handleSelector || element.dataset.handleSelector || element.getAttribute('handle-selector'),
    ...options
  };

  element.classList.add('wb-drawer-layout');
  element.classList.add('wb-drawer');
  
  const isVertical = config.position === 'top' || config.position === 'bottom';
  const storageKeyWidth = `wb-drawer-${config.id}-width`;
  const storageKeyCollapsed = `wb-drawer-${config.id}-collapsed`;
  
  // Restore state
  let savedWidth = config.saveState ? localStorage.getItem(storageKeyWidth) : null;
  let isCollapsed = config.saveState ? localStorage.getItem(storageKeyCollapsed) === 'true' : false;

  // Base styles
  element.style.position = 'relative';
  element.style.display = 'flex';
  element.style.flexDirection = 'column';
  
  if (isVertical) {
     element.style.transition = 'height 0.3s ease, min-height 0.3s ease, flex-basis 0.3s ease';
     element.style.width = '100%';
     // Initial state
     const initialHeight = savedWidth || config.height;
     element.style.height = isCollapsed ? config.minHeight : initialHeight;
     element.style.minHeight = isCollapsed ? config.minHeight : initialHeight;
     element.style.flexBasis = isCollapsed ? config.minHeight : initialHeight;
     if (config.maxHeight) element.style.maxHeight = config.maxHeight;
     element.dataset.originalSize = initialHeight;
  } else {
     element.style.transition = 'width 0.3s ease, min-width 0.3s ease, flex-basis 0.3s ease';
     // Initial state
     const initialWidth = savedWidth || config.width;
     element.style.width = isCollapsed ? config.minWidth : initialWidth;
     element.style.minWidth = isCollapsed ? config.minWidth : initialWidth;
     element.style.flexBasis = isCollapsed ? config.minWidth : initialWidth;
     if (config.maxWidth) element.style.maxWidth = config.maxWidth;
     element.dataset.originalSize = initialWidth;
  }
  
  if (isCollapsed) {
    element.classList.add('collapsed');
    element.style.overflow = 'hidden';
    element.dataset.prevBorder = element.style.border;
    element.style.border = 'none';
  }
  
  // Toggle Logic
  const toggle = () => {
    isCollapsed = !isCollapsed;
    if (config.saveState) localStorage.setItem(storageKeyCollapsed, isCollapsed);
    
    // Update arrow if using default button
    if (toggleBtn && !config.toggleSelector) {
      toggleBtn.innerHTML = getArrow(isCollapsed);
    }
    
    if (isCollapsed) {
      element.classList.add('collapsed');
      element.style.overflow = 'hidden'; // Hide content
      element.dataset.prevBorder = element.style.border;
      element.style.border = 'none';
      
      if (isVertical) {
          element.style.height = config.minHeight;
          element.style.minHeight = config.minHeight;
          element.style.flexBasis = config.minHeight;
      } else {
          element.style.width = config.minWidth;
          element.style.minWidth = config.minWidth;
          element.style.flexBasis = config.minWidth;
      }
    } else {
      element.classList.remove('collapsed');
      element.style.overflow = '';
      element.style.border = element.dataset.prevBorder || '';
      
      const restoredSize = element.dataset.originalSize || (isVertical ? config.height : config.width);
      if (isVertical) {
          element.style.height = restoredSize;
          element.style.minHeight = restoredSize;
          element.style.flexBasis = restoredSize;
      } else {
          element.style.width = restoredSize;
          element.style.minWidth = restoredSize;
          element.style.flexBasis = restoredSize;
      }
    }
  };

  // Expose toggle function on element
  element.wbToggle = toggle;

  // Setup Toggle Button
  let toggleBtn;
  if (config.toggleSelector) {
    toggleBtn = document.querySelector(config.toggleSelector);
    if (toggleBtn) toggleBtn.addEventListener('click', toggle);
  } else {
    // Create default toggle button
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'wb-drawer-toggle';
    
    // Arrow logic
    const getArrow = (collapsed) => {
        if (config.position === 'left') return collapsed ? '▶' : '◀';
        if (config.position === 'right') return collapsed ? '◀' : '▶';
        if (config.position === 'top') return collapsed ? '▼' : '▲';
        if (config.position === 'bottom') return collapsed ? '▲' : '▼';
        return '?';
    };
    
    toggleBtn.innerHTML = getArrow(isCollapsed);
    
    // Button Styles
    let btnStyles = `
      position: absolute;
      background: var(--bg-secondary, #1f2937);
      border: 1px solid var(--border-color, #374151);
      cursor: pointer;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: var(--text-secondary, #9ca3af);
      padding: 0;
      outline: none;
    `;
    
    if (config.position === 'left') {
        btnStyles += `
          top: 50%; transform: translateY(-50%); right: -${config.minWidth};
          width: ${config.minWidth}; height: 3rem;
          border-left: none; border-radius: 0 4px 4px 0;
        `;
    } else if (config.position === 'right') {
        btnStyles += `
          top: 50%; transform: translateY(-50%); left: 0;
          width: ${config.minWidth}; height: 3rem;
          border-right: none; border-radius: 4px 0 0 4px;
        `;
    } else if (config.position === 'top') {
        btnStyles += `
          left: 50%; transform: translateX(-50%); bottom: 0;
          height: ${config.minHeight}; width: 3rem;
          border-top: none; border-radius: 0 0 4px 4px;
        `;
    } else if (config.position === 'bottom') {
        btnStyles += `
          left: 50%; transform: translateX(-50%); top: 0;
          height: ${config.minHeight}; width: 3rem;
          border-bottom: none; border-radius: 4px 4px 0 0;
        `;
    }
    
    toggleBtn.style.cssText = btnStyles;
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      toggle();
    };
    element.appendChild(toggleBtn);
  }

  // Resizable Logic
  let resizeCleanup = null;
  if (config.resizable) {
    let handle;
    if (config.handleSelector) {
      handle = document.querySelector(config.handleSelector);
    } else {
      handle = document.createElement('div');
      handle.className = 'wb-drawer-handle';
      // Style based on position
      const size = '8px';
      const styles = { position: 'absolute', zIndex: '20', background: 'transparent' };
      
      if (config.position === 'left') {
        styles.right = '0'; styles.top = '0'; styles.bottom = '0'; styles.width = size; styles.cursor = 'col-resize';
      } else if (config.position === 'right') {
        styles.left = '0'; styles.top = '0'; styles.bottom = '0'; styles.width = size; styles.cursor = 'col-resize';
      } else if (config.position === 'top') {
        styles.bottom = '0'; styles.left = '0'; styles.right = '0'; styles.height = size; styles.cursor = 'row-resize';
      } else if (config.position === 'bottom') {
        styles.top = '0'; styles.left = '0'; styles.right = '0'; styles.height = size; styles.cursor = 'row-resize';
      }
      Object.assign(handle.style, styles);
      element.appendChild(handle);
    }

    if (handle) {
      let isResizing = false;
      let startX, startY, startSize;

      const onMouseDown = (e) => {
        // If collapsed, clicking handle expands it
        if (isCollapsed) {
          toggle();
          return;
        }
        
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startSize = isVertical ? element.offsetHeight : element.offsetWidth;
        
        // Create overlay for cursor handling (Compliance: No body.style modification)
        const overlay = document.createElement('div');
        overlay.id = 'wb-resize-overlay';
        overlay.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          z-index: 9999; cursor: ${isVertical ? 'row-resize' : 'col-resize'};
          user-select: none;
        `;
        document.body.appendChild(overlay);
        
        element.classList.add('resizing');
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      let rAF = null;

      const onMouseMove = (e) => {
        if (!isResizing) return;
        
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (rAF) return;

        rAF = requestAnimationFrame(() => {
          let newSize = startSize;
          if (config.position === 'left') newSize = startSize + (clientX - startX);
          else if (config.position === 'right') newSize = startSize - (clientX - startX);
          else if (config.position === 'top') newSize = startSize + (clientY - startY);
          else if (config.position === 'bottom') newSize = startSize - (clientY - startY);
          
          // Constraints
          // Calculate min in pixels
          let minStr = isVertical ? config.minHeight : config.minWidth;
          let min = 0;
          if (minStr && typeof minStr === 'string') {
            if (minStr.endsWith('rem')) {
              min = parseFloat(minStr) * 16; // Approx
            } else if (minStr.endsWith('px')) {
              min = parseFloat(minStr);
            } else {
              min = parseFloat(minStr);
            }
          }
          if (!min) min = 20; // Default fallback

          // Calculate max in pixels (handling vw, vh, %, px)
          let maxStr = isVertical ? config.maxHeight : config.maxWidth;
          let max;
          
          if (maxStr && typeof maxStr === 'string') {
            if (maxStr.endsWith('vw')) {
              max = (parseFloat(maxStr) / 100) * window.innerWidth;
            } else if (maxStr.endsWith('vh')) {
              max = (parseFloat(maxStr) / 100) * window.innerHeight;
            } else if (maxStr.endsWith('%')) {
               const parentSize = isVertical ? (element.parentElement?.clientHeight || window.innerHeight) : (element.parentElement?.clientWidth || window.innerWidth);
               max = (parseFloat(maxStr) / 100) * parentSize;
            } else {
              max = parseFloat(maxStr);
            }
          }
          
          if (!max) {
             max = (isVertical ? window.innerHeight : window.innerWidth) * 0.8;
          }
          
          newSize = Math.max(min, Math.min(max, newSize));
          
          if (isVertical) {
            element.style.height = newSize + 'px';
            element.style.minHeight = newSize + 'px';
            element.style.flexBasis = newSize + 'px';
          } else {
            element.style.width = newSize + 'px';
            element.style.minWidth = newSize + 'px';
            element.style.flexBasis = newSize + 'px';
          }
          rAF = null;
        });
      };

      const onMouseUp = () => {
        if (isResizing) {
          isResizing = false;
          if (rAF) {
            cancelAnimationFrame(rAF);
            rAF = null;
          }
          
          // Remove overlay
          const resizeOverlay = document.getElementById('wb-resize-overlay');
          if (resizeOverlay) resizeOverlay.remove();
          
          element.classList.remove('resizing');
          
          // Save new size
          const finalSize = isVertical ? element.offsetHeight : element.offsetWidth;
          element.dataset.originalSize = finalSize + 'px';
          if (config.saveState) {
            localStorage.setItem(storageKeyWidth, finalSize);
          }
          
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        }
      };

      handle.addEventListener('mousedown', onMouseDown);
      resizeCleanup = () => {
        handle.removeEventListener('mousedown', onMouseDown);
        if (!config.handleSelector) handle.remove();
      };
    }
  }

  return () => {
    element.classList.remove('wb-drawer-layout', 'wb-drawer', 'collapsed', 'resizing');
    if (toggleBtn && !config.toggleSelector) toggleBtn.remove();
    if (config.toggleSelector && toggleBtn) toggleBtn.removeEventListener('click', toggle);
    if (resizeCleanup) resizeCleanup();
    
    element.style.width = '';
    element.style.minWidth = '';
    element.style.height = '';
    element.style.minHeight = '';
    element.style.position = '';
    element.style.transition = '';
    element.style.display = '';
    element.style.flexDirection = '';
    element.style.border = '';
    element.style.overflow = '';
    delete element.wbToggle;
  };
}

export default {
  grid, flex, container, stack, cluster, center, sidebarlayout,
  switcher, masonry, sticky, fixed, scrollable, cover, frame, reel, imposter, icon, drawerLayout
};

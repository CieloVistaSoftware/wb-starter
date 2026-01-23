/**
 * Builder Drag & Drop Module
 * Handles all drag and drop functionality for the builder
 * 
 * @module builder-dnd
 */

import { getComponentType } from './behavior-types.js';
import {
  showDropZoneHighlight,
  hideDropZoneHighlight,
  findDropZone
} from './builder-editing.js';
import {
  handleSmartDrop,
  applyModifier,
  getDragFeedback
} from './builder-drop-handler.js';

// Drag feedback UI element
let feedbackIndicator = null;

/**
 * Show drag feedback indicator near cursor
 * @param {Object} feedback - Feedback object with message and allowed status
 * @param {number} x - Cursor X position
 * @param {number} y - Cursor Y position
 */
export function showDragFeedbackUI(feedback, x, y) {
  if (!feedbackIndicator) {
    feedbackIndicator = document.createElement('div');
    feedbackIndicator.id = 'drop-feedback-indicator';
    feedbackIndicator.style.cssText = `
      position: fixed;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
      z-index: 10000;
      transition: opacity 0.15s, transform 0.15s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(feedbackIndicator);
  }
  
  // Position near cursor
  feedbackIndicator.style.left = (x + 15) + 'px';
  feedbackIndicator.style.top = (y + 15) + 'px';
  feedbackIndicator.textContent = feedback.message || '';
  
  // Style based on allowed state
  if (feedback.allowed) {
    feedbackIndicator.style.background = 'var(--color-success, #10b981)';
    feedbackIndicator.style.color = '#fff';
  } else {
    feedbackIndicator.style.background = 'var(--color-error, #ef4444)';
    feedbackIndicator.style.color = '#fff';
  }
  
  feedbackIndicator.style.opacity = '1';
}

/**
 * Remove drag feedback indicator
 */
export function removeDragFeedbackUI() {
  if (feedbackIndicator) {
    feedbackIndicator.style.opacity = '0';
    setTimeout(() => {
      if (feedbackIndicator) {
        feedbackIndicator.remove();
        feedbackIndicator = null;
      }
    }, 150);
  }
}

/**
 * Find insertion point for drop based on cursor position
 * @param {HTMLElement} dropZone - The drop zone element
 * @param {number} clientX - Cursor X position
 * @param {number} clientY - Cursor Y position
 * @param {boolean} isRow - Whether the container is in row mode
 * @returns {HTMLElement|null} Reference node for insertion
 */
export function findInsertionPoint(dropZone, clientX, clientY, isRow) {
  // If row mode, always append to end (user request)
  if (isRow) return null;

  const children = Array.from(dropZone.children).filter(c => c.classList.contains('dropped'));

  for (const child of children) {
    const rect = child.getBoundingClientRect();
    // Column mode: check vertical position
    const midY = rect.top + rect.height / 2;
    if (clientY < midY) {
      return child;
    }
  }
  return null;
}

/**
 * Create drag start handler
 * @returns {Function} Event handler
 */
export function createDragStartHandler() {
  return (e) => {
    const item = e.target.closest('.comp-item');
    if (item) {
      item.classList.add('dragging');
      e.dataTransfer.setData('c', item.dataset.c);
    }
    // Lock dropped items
    if (e.target.classList.contains('dropped')) {
      e.preventDefault();
      return false;
    }
  };
}

/**
 * Create drag end handler
 * @returns {Function} Event handler
 */
export function createDragEndHandler() {
  return (e) => {
    const dragItem = e.target.closest('.comp-item');
    if (dragItem) {
      dragItem.classList.remove('dragging');
      hideDropZoneHighlight();
      removeDragFeedbackUI();
    }
  };
}

/**
 * Create drag over handler for canvas
 * @param {HTMLElement} canvas - The canvas element
 * @returns {Function} Event handler
 */
export function createDragOverHandler(canvas) {
  return (e) => {
    e.preventDefault();
    canvas.classList.add('drag-over');
    showDropZoneHighlight(e.target);

    // Show smart drop feedback based on what's being dragged
    const draggingItem = document.querySelector('.comp-item.dragging');
    if (draggingItem) {
      try {
        const component = JSON.parse(draggingItem.dataset.c);
        const feedback = getDragFeedback(component.b, e.target);
        if (feedback.message) {
          showDragFeedbackUI(feedback, e.clientX, e.clientY);
        }
      } catch (err) {
        // Ignore parse errors
      }
    }

    // Smart Snap Highlight for new components
    if (canvas.classList.contains('snap-enabled')) {
      const SNAP_GRID_SIZE = 20;
      let snapHighlight = document.getElementById('snap-guide-lines');
      if (!snapHighlight) {
        snapHighlight = document.createElement('div');
        snapHighlight.id = 'snap-guide-lines';
        snapHighlight.className = 'snap-guide-lines';
        canvas.appendChild(snapHighlight);
      }

      const canvasRect = canvas.getBoundingClientRect();
      const relativeX = e.clientX - canvasRect.left;
      const relativeY = e.clientY - canvasRect.top;

      // Snap to grid
      const gridX = Math.floor(relativeX / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
      const gridY = Math.floor(relativeY / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;

      snapHighlight.style.left = gridX + 'px';
      snapHighlight.style.top = gridY + 'px';
      snapHighlight.style.display = 'block';
    }
  };
}

/**
 * Create drag leave handler for canvas
 * @param {HTMLElement} canvas - The canvas element
 * @returns {Function} Event handler
 */
export function createDragLeaveHandler(canvas) {
  return (e) => {
    if (!canvas.contains(e.relatedTarget)) {
      canvas.classList.remove('drag-over');
      hideDropZoneHighlight();
      removeDragFeedbackUI();

      // Remove snap highlight
      const snapHighlight = document.getElementById('snap-guide-lines');
      if (snapHighlight) snapHighlight.remove();
    }
  };
}

/**
 * Create drop handler for canvas
 * @param {HTMLElement} canvas - The canvas element
 * @param {Object} handlers - Handler functions { add, addToGrid, addToContainer, addBehaviorToComponent, toast, saveHist, WB }
 * @returns {Function} Event handler
 */
export function createDropHandler(canvas, handlers) {
  const { 
    add, 
    addToGrid, 
    addToContainer, 
    addBehaviorToComponent, 
    toast, 
    saveHist, 
    WB,
    findContainerFromTarget,
    canDropInto,
    renderProps
  } = handlers;

  return (e) => {
    e.preventDefault();
    canvas.classList.remove('drag-over');
    hideDropZoneHighlight();
    removeDragFeedbackUI();

    // Remove snap highlight
    const snapHighlight = document.getElementById('snap-guide-lines');
    if (snapHighlight) snapHighlight.remove();

    const d = e.dataTransfer.getData('c');
    if (!d) return;

    const component = JSON.parse(d);

    // === SMART DROP HANDLING ===
    const dropResult = handleSmartDrop(component, e.target, canvas);
    
    if (dropResult.handled) {
      if (dropResult.rejected) {
        toast(dropResult.message || 'Cannot drop here');
        return;
      }
      
      // Handle different smart drop actions
      if (dropResult.action === 'applyModifier') {
        const result = applyModifier(dropResult.target, dropResult.behavior);
        if (result.success) {
          toast(`Applied ${component.n}`);
          WB.scan(dropResult.target);
          if (dropResult.target.classList.contains('selected')) {
            renderProps(dropResult.target);
          }
          saveHist();
        } else {
          toast(result.message || 'Could not apply effect');
        }
        return;
      }
      
      if (dropResult.action === 'addToContainer') {
        const dropZone = findDropZone(dropResult.container, JSON.parse(dropResult.container.dataset.c));
        if (dropZone) {
          addToContainer(component, dropResult.container, dropZone);
        }
        return;
      }
      
      if (dropResult.action === 'createActionGroup' || dropResult.action === 'createFromTemplate') {
        if (dropResult.template) {
          const templateComp = { ...component, d: { ...component.d, ...dropResult.template } };
          add(templateComp);
        } else {
          add(component);
        }
        return;
      }
      
      if (dropResult.action === 'addActionToElement') {
        addBehaviorToComponent(dropResult.target, component.b);
        return;
      }
      
      if (dropResult.action === 'createTrigger') {
        const triggerComp = {
          ...component,
          t: 'button',
          d: { ...component.d, text: component.n }
        };
        add(triggerComp);
        return;
      }
      
      if (dropResult.useTemplate && dropResult.template) {
        const useTemplateComp = { ...component, d: { ...component.d, ...dropResult.template } };
        add(useTemplateComp);
        return;
      }
    }
    // === END SMART DROP ===

    // Fallback: Check if this is a modifier/action being dropped onto an existing element
    const componentType = getComponentType(component);
    if (componentType === 'modifier' || componentType === 'action') {
      const existingWrapper = e.target.closest('.dropped');
      if (existingWrapper) {
        addBehaviorToComponent(existingWrapper, component.b);
        return;
      }
    }

    // Check if dropping into a grid
    const gridEl = e.target.closest('.dropped[data-grid]');
    if (gridEl) {
      addToGrid(component, gridEl);
      return;
    }

    // Check if dropping into a container component
    const containerInfo = findContainerFromTarget(e.target);
    if (containerInfo && containerInfo.behavior !== 'grid') {
      if (canDropInto(containerInfo.behavior, component.b)) {
        const primaryDropZone = findDropZone(containerInfo.wrapper, containerInfo.config);
        if (primaryDropZone) {
          let isRow = false;
          try {
            const cData = JSON.parse(containerInfo.wrapper.dataset.c);
            isRow = cData.d && cData.d.direction === 'row';
          } catch (err) { }

          const referenceNode = findInsertionPoint(primaryDropZone, e.clientX, e.clientY, isRow);
          addToContainer(component, containerInfo.wrapper, primaryDropZone, referenceNode);
          return;
        }
      }
    }

    // Default: add to canvas root
    const w = add(component);

    // Apply Smart Snap position if enabled
    if (canvas.classList.contains('snap-enabled')) {
      const SNAP_SIZE = 20;
      const dropCanvasRect = canvas.getBoundingClientRect();
      const snapRelX = e.clientX - dropCanvasRect.left;
      const snapRelY = e.clientY - dropCanvasRect.top;

      const gridX = Math.floor(snapRelX / SNAP_SIZE) * SNAP_SIZE;
      const gridY = Math.floor(snapRelY / SNAP_SIZE) * SNAP_SIZE;

      w.style.position = 'absolute';
      w.style.left = gridX + 'px';
      w.style.top = gridY + 'px';
      w.style.margin = '0';
      w.style.zIndex = '1000';

      try {
        const c = JSON.parse(w.dataset.c);
        if (!c.d) c.d = {};
        c.d._posX = gridX + 'px';
        c.d._posY = gridY + 'px';
        c.d._zIndex = '1000';
        w.dataset.c = JSON.stringify(c);
        saveHist();
      } catch (err) { }
    }
  };
}



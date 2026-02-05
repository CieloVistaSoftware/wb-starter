/**
 * Smart drop handling based on behavior types.
 * - Element/container/modifier drop logic from behaviorMeta.
 */
export function cc() {}

import { 
  behaviorMeta, 
  getBehaviorMeta, 
  canDropOnCanvas, 
  requiresElement, 
  createsGroup,
  getPreferredElement,
  getTemplate,
  getCategorizedBehaviors
} from './behaviorMeta.js';

// ============================================
// DROP HANDLING
// ============================================

/**
 * Handle a drop event based on behavior type
 * @param {Object} component - Component config from sidebar
 * @param {HTMLElement} dropTarget - Where the drop occurred
 * @param {HTMLElement} canvas - The canvas element
 * @returns {Object} Result with { handled: boolean, element?: HTMLElement, message?: string }
 */
export function handleSmartDrop(component, dropTarget, canvas) {
  const behavior = component.b;
  const meta = getBehaviorMeta(behavior);
  
  if (!meta) {
    // Unknown behavior - use default drop
    return { handled: false };
  }
  
  const isOnCanvas = dropTarget === canvas || dropTarget.id === 'empty';
  const existingElement = dropTarget.closest('.dropped');
  
  switch (meta.type) {
    case 'element':
    case 'container':
      return handleElementDrop(component, meta, dropTarget, canvas, existingElement);
      
    case 'modifier':
      return handleModifierDrop(component, meta, dropTarget, existingElement);
      
    case 'action':
      return handleActionDrop(component, meta, dropTarget, canvas, existingElement);
      
    default:
      return { handled: false };
  }
}

/**
 * Handle dropping an element or container
 */
function handleElementDrop(component, meta, dropTarget, canvas, existingElement) {
  // Elements and containers can always drop on canvas
  if (!existingElement || dropTarget === canvas) {
    // Use template if available, otherwise standard element
    if (meta.template) {
      return {
        handled: true,
        useTemplate: true,
        template: getTemplate(component.b, generateId()),
        component
      };
    }
    return { handled: false }; // Let normal add() handle it
  }
  
  // Dropping on existing element - check if it's a container
  const targetBehavior = getElementBehavior(existingElement);
  const targetMeta = getBehaviorMeta(targetBehavior);
  
  if (targetMeta?.canContain) {
    // Drop inside container
    return {
      handled: true,
      action: 'addToContainer',
      container: existingElement,
      component
    };
  }
  
  // Drop after the existing element
  return { handled: false };
}

/**
 * Handle dropping a modifier
 */
function handleModifierDrop(component, meta, dropTarget, existingElement) {
  if (!existingElement) {
    // Can't drop modifier on empty canvas
    return {
      handled: true,
      rejected: true,
      message: `"${component.n}" is an effect. Drop it on an existing element to apply.`
    };
  }
  
  // Check if modifier can attach to this element type
  const targetElement = existingElement.querySelector('');
  if (!targetElement) {
    return {
      handled: true,
      rejected: true,
      message: 'Cannot apply effect to this element.'
    };
  }
  
  const tagName = targetElement.tagName.toLowerCase();
  const attachTo = meta.attachTo;
  
  // Check attachment rules
  if (attachTo !== 'any') {
    const allowed = attachTo.split(',').map(s => s.trim().toLowerCase());
    
    // Special cases
    if (attachTo === 'text') {
      const textElements = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'label', 'div'];
      if (!textElements.includes(tagName)) {
        return {
          handled: true,
          rejected: true,
          message: `"${component.n}" can only be applied to text elements.`
        };
      }
    } else if (attachTo === 'clickable') {
      const clickable = ['button', 'a', 'input', 'select'];
      if (!clickable.includes(tagName) && !targetElement.hasAttribute('onclick')) {
        return {
          handled: true,
          rejected: true,
          message: `"${component.n}" can only be applied to clickable elements.`
        };
      }
    } else if (!allowed.includes(tagName)) {
      return {
        handled: true,
        rejected: true,
        message: `"${component.n}" can only be applied to: ${attachTo}`
      };
    }
  }
  
  // Apply the modifier
  return {
    handled: true,
    action: 'applyModifier',
    target: existingElement,
    behavior: component.b,
    component
  };
}

/**
 * Handle dropping an action
 */
function handleActionDrop(component, meta, dropTarget, canvas, existingElement) {
  // Actions with required targets create groups
  if (meta.target === 'required' && meta.group) {
    if (existingElement) {
      // Dropping on existing element - add action to it
      return {
        handled: true,
        action: 'addActionToElement',
        target: existingElement,
        component
      };
    }
    
    // Create action group with trigger + target
    if (meta.template) {
      return {
        handled: true,
        action: 'createActionGroup',
        template: getTemplate(component.b, generateId()),
        component
      };
    }
  }
  
  // Self-contained actions (no target needed) - create button
  if (!meta.target) {
    if (meta.template) {
      return {
        handled: true,
        action: 'createFromTemplate',
        template: getTemplate(component.b, generateId()),
        component
      };
    }
    
    // Create simple button trigger
    return {
      handled: true,
      action: 'createTrigger',
      triggerType: meta.trigger || 'button',
      component
    };
  }
  
  return { handled: false };
}

/**
 * Apply a modifier behavior to an existing element
 */
export function applyModifier(wrapper, behavior) {
  const el = wrapper.querySelector('');
  if (!el) return false;
  
  // Get current behaviors
  const currentBehaviors = el.dataset.wb.split(' ').filter(Boolean);
  
  // Check if already applied
  if (currentBehaviors.includes(behavior)) {
    return { success: false, message: 'Effect already applied' };
  }
  
  // Check if modifier allows multiple
  const meta = getBehaviorMeta(behavior);
  if (!meta?.multiple) {
    // Check if any other modifier of same type is applied
    for (const existing of currentBehaviors) {
      const existingMeta = getBehaviorMeta(existing);
      if (existingMeta?.type === 'modifier') {
        // Some modifiers can't stack
      }
    }
  }
  
  // Add the behavior
  currentBehaviors.push(behavior);
  el.dataset.wb = currentBehaviors.join(' ');
  
  // Update wrapper's component data
  const c = JSON.parse(wrapper.dataset.c);
  c.modifiers = c.modifiers || [];
  c.modifiers.push(behavior);
  wrapper.dataset.c = JSON.stringify(c);
  
  return { success: true };
}

/**
 * Remove a modifier from an element
 */
export function removeModifier(wrapper, behavior) {
  const el = wrapper.querySelector('');
  if (!el) return false;
  
  const behaviors = el.dataset.wb.split(' ').filter(b => b && b !== behavior);
  el.dataset.wb = behaviors.join(' ');
  
  // Update wrapper's component data
  const c = JSON.parse(wrapper.dataset.c);
  if (c.modifiers) {
    c.modifiers = c.modifiers.filter(m => m !== behavior);
  }
  wrapper.dataset.c = JSON.stringify(c);
  
  return { success: true };
}

/**
 * Get the primary behavior of an element
 */
function getElementBehavior(wrapper) {
  const el = wrapper.querySelector('');
  if (!el) return null;
  
  const behaviors = el.dataset.wb.split(' ').filter(Boolean);
  // First non-modifier behavior is the primary
  for (const b of behaviors) {
    const meta = getBehaviorMeta(b);
    if (meta && meta.type !== 'modifier') {
      return b;
    }
  }
  return behaviors[0] || null;
}

/**
 * Generate unique ID
 */
function generateId() {
  return 'wb-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ============================================
// DRAG FEEDBACK
// ============================================

/**
 * Get visual feedback for drag state
 */
export function getDragFeedback(behavior, dropTarget) {
  const meta = getBehaviorMeta(behavior);
  if (!meta) return { allowed: true, cursor: 'copy' };
  
  const isCanvas = dropTarget?.id === 'canvas' || dropTarget?.id === 'empty';
  const existingElement = dropTarget?.closest('.dropped');
  
  switch (meta.type) {
    case 'element':
    case 'container':
      return {
        allowed: true,
        cursor: 'copy',
        highlight: existingElement ? 'nest' : 'drop',
        message: existingElement ? 'Add inside' : 'Drop here'
      };
      
    case 'modifier':
      if (!existingElement) {
        return {
          allowed: false,
          cursor: 'not-allowed',
          highlight: 'error',
          message: 'Drop on element to apply effect'
        };
      }
      return {
        allowed: true,
        cursor: 'copy',
        highlight: 'apply',
        message: 'Apply effect'
      };
      
    case 'action':
      if (meta.target === 'required' && meta.group) {
        return {
          allowed: true,
          cursor: 'copy',
          highlight: existingElement ? 'action' : 'group',
          message: existingElement ? 'Add action' : 'Create group'
        };
      }
      return {
        allowed: true,
        cursor: 'copy',
        highlight: 'drop',
        message: 'Create trigger'
      };
      
    default:
      return { allowed: true, cursor: 'copy' };
  }
}

// ============================================
// SIDEBAR CATEGORIES
// ============================================

/**
 * Get components organized by type for sidebar
 */
export function getSidebarCategories() {
  const { elements, containers, modifiers, actions } = getCategorizedBehaviors();
  
  return {
    elements: {
      label: '📦 Elements',
      description: 'Standalone components',
      items: elements
    },
    containers: {
      label: '📐 Containers',
      description: 'Hold child elements',
      items: containers
    },
    modifiers: {
      label: '✨ Effects',
      description: 'Apply to existing elements',
      items: modifiers
    },
    actions: {
      label: '⚡ Actions',
      description: 'Triggers and interactions',
      items: actions
    }
  };
}

export default {
  handleSmartDrop,
  applyModifier,
  removeModifier,
  getDragFeedback,
  getSidebarCategories
};

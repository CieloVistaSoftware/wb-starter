/**
 * Adding/removing behaviors from existing components.
 * - Manages `data-wb` attribute behavior list.
 */
export function cc() {}

import { BEHAVIOR_TYPES } from './behavior-types.js';

/**
 * Add a behavior to an existing component (space-separated in data-wb)
 */
export function addBehaviorToComponent(wrapper, behaviorName, options = {}) {
  const { WB, renderProps, saveHist, toast } = options;
  
  const el = wrapper.querySelector('[data-wb]');
  if (!el) return;

  // Get current behaviors
  const currentBehaviors = el.dataset.wb.split(/\s+/).filter(Boolean);

  // Check if already has this behavior
  if (currentBehaviors.includes(behaviorName)) {
    if (toast) toast(`Already has ${behaviorName}`);
    return;
  }

  // Add the new behavior
  currentBehaviors.push(behaviorName);
  el.dataset.wb = currentBehaviors.join(' ');

  // Update component data to track added behaviors
  const c = JSON.parse(wrapper.dataset.c);
  c.behaviors = currentBehaviors;
  wrapper.dataset.c = JSON.stringify(c);

  // Re-scan to apply new behavior
  if (WB) WB.scan(wrapper);

  // Update properties panel if this component is selected
  if (wrapper.classList.contains('selected') && renderProps) {
    renderProps(wrapper);
  }

  if (saveHist) saveHist();
  if (toast) toast(`Added ${behaviorName}`);
}

/**
 * Remove a behavior from an existing component
 */
export function removeBehaviorFromComponent(wrapper, behaviorName, options = {}) {
  const { WB, renderProps, saveHist, toast } = options;
  
  const el = wrapper.querySelector('[data-wb]');
  if (!el) return;

  const c = JSON.parse(wrapper.dataset.c);
  const primaryBehavior = c.b;

  // Don't allow removing the primary behavior
  if (behaviorName === primaryBehavior) {
    if (toast) toast(`Can't remove primary behavior`);
    return;
  }

  // Get current behaviors and remove the specified one
  const currentBehaviors = el.dataset.wb.split(/\s+/).filter(b => b && b !== behaviorName);
  el.dataset.wb = currentBehaviors.join(' ');

  // Update component data
  c.behaviors = currentBehaviors;
  wrapper.dataset.c = JSON.stringify(c);

  // Remove the behavior's effects
  if (WB) WB.remove(el, behaviorName);

  // Re-scan to reapply remaining behaviors
  if (WB) WB.scan(wrapper);

  // Update properties panel if selected
  if (wrapper.classList.contains('selected') && renderProps) {
    renderProps(wrapper);
  }

  if (saveHist) saveHist();
  if (toast) toast(`Removed ${behaviorName}`);
}

/**
 * Toggle a behavior on/off for a component
 */
export function toggleBehavior(wrapperId, behaviorName, enabled, options = {}) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  if (enabled) {
    addBehaviorToComponent(wrapper, behaviorName, options);
  } else {
    removeBehaviorFromComponent(wrapper, behaviorName, options);
  }
}

/**
 * Get all behaviors currently on a component
 */
export function getComponentBehaviors(wrapper) {
  const el = wrapper.querySelector('[data-wb]');
  if (!el) return [];
  return el.dataset.wb.split(/\s+/).filter(Boolean);
}

// Expose globally for backward compatibility
window.addBehaviorToComponent = addBehaviorToComponent;
window.removeBehaviorFromComponent = removeBehaviorFromComponent;
window.toggleBehavior = toggleBehavior;
window.getComponentBehaviors = getComponentBehaviors;
window.BEHAVIOR_TYPES = BEHAVIOR_TYPES;

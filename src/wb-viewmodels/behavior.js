/**
 * Base behavior function that marks elements with wb-behavior class.
 * - Master behavior function for the WB system.
 */
export function cc() {}

/**
 * Behavior - Base behavior
 * Helper Attribute: [x-behavior="behavior"]
 */
export function behavior(element, options = {}) {
  // Master behavior function
  element.classList.add('wb-behavior');
}

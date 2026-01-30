/**
 * Behavior - Base behavior
 * Helper Attribute: [x-behavior="behavior"]
 */
export function behavior(element: HTMLElement, options: Record<string, any> = {}) {
  // Master behavior function
  element.classList.add('wb-behavior');
}

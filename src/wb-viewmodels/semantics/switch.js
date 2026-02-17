/**
 * Switch - Toggle switch component
 * Transforms a checkbox into a toggle switch
 * Helper Attribute: [x-behavior="switch"]
 */
export function switchInput(element, options = {}) {
  // Only apply to checkboxes
  if (element.type !== 'checkbox') return;

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-switch';
  
  // Insert wrapper before element
  element.parentNode.insertBefore(wrapper, element);
  
  // Move element inside wrapper
  wrapper.appendChild(element);
  
  // Create slider
  const slider = document.createElement('span');
  slider.className = 'wb-switch__slider';
  wrapper.appendChild(slider);

  return () => {
    // Cleanup: move element back out and remove wrapper
    if (wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
  };
}

export default switchInput;

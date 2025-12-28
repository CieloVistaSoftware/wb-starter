/**
 * Switch - Toggle switch component
 * NOT YET IMPLEMENTED
 */
export function switchInput(element, options = {}) {
  element.classList.add('wb-switch');
  element.dataset.wbReady = 'switch';
  return () => element.classList.remove('wb-switch');
}

export default switchInput;

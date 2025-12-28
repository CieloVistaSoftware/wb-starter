export function slider(element, options = {}) {
  element.classList.add('wb-slider');
  element.dataset.wbReady = 'slider';
  return () => element.classList.remove('wb-slider');
}
export default slider;

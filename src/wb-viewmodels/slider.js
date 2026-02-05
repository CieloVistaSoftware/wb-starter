/**
 * Slider component for selecting values from a range.
 * - `<wb-slider>` range input with visual enhancements.
 */
export function cc() {}

export function slider(element, options = {}) {
  element.classList.add('wb-slider');
  element.dataset.wbReady = 'slider';
  return () => element.classList.remove('wb-slider');
}
export default slider;

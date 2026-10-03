/**
 * wrap-input.js — wrap a behavior's host in a container with a real input (#883)
 *
 * tags.js and autocomplete.js each opened with the same block: an <input> is
 * a void element and cannot hold the list they add, so they wrap it in a
 * <div class="{block}"> where it stands, and when the host is NOT an input
 * they append a text input inside that wrapper. The input always gets
 * `{block}__input`.
 *
 * @param {HTMLElement} element - the behavior's host, already in the DOM
 * @param {string} block - BEM block class for the wrapper, e.g. 'x-tags'
 * @returns {{wrapper: HTMLDivElement, input: HTMLInputElement}}
 */
export function wrapInput(element, block) {
  const isInput = element.tagName === 'INPUT';
  const wrapper = document.createElement('div');
  wrapper.className = block;
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  const input = isInput ? /** @type {HTMLInputElement} */ (element) : document.createElement('input');
  if (!isInput) {
    input.type = 'text';
    wrapper.appendChild(input);
  }
  input.classList.add(`${block}__input`);
  return { wrapper, input };
}

// Standalone tags behavior extracted from enhancements.js
//
// `x-tags` goes on a REAL <input> — it's a void element and can't have
// children, so (unlike the old version of this file) we never append a new
// <input> into it. Instead, wrap the real input in a container (same
// approach as search.js) and add the tag list as a sibling.
export function tags(element, options = {}) {
  const isInput = element.tagName === 'INPUT';
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-tags';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  const input = isInput ? element : document.createElement('input');
  if (!isInput) {
    input.type = 'text';
    wrapper.appendChild(input);
  }
  input.classList.add('wb-tags__input');

  const tagList = document.createElement('div');
  tagList.className = 'wb-tags__list';
  wrapper.appendChild(tagList);

  function addTag(tag) {
    if (!tag) return;
    const tagEl = document.createElement('span');
    tagEl.className = 'wb-tags__tag';
    tagEl.textContent = tag;
    tagEl.onclick = () => {
      tagEl.remove();
      element.dispatchEvent(new CustomEvent('wb:tags:remove', { bubbles: true, detail: { tag } }));
    };
    tagList.appendChild(tagEl);
    element.dispatchEvent(new CustomEvent('wb:tags:add', { bubbles: true, detail: { tag } }));
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value) {
      addTag(input.value);
      input.value = '';
    }
  });
  return () => {
    wrapper.classList.remove('wb-tags');
    input.classList.remove('wb-tags__input');
    if (wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
    tagList.remove();
    if (!isInput) input.remove();
  };
}

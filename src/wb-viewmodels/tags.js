// Standalone tags behavior extracted from enhancements.js
export function tags(element, options = {}) {
  element.classList.add('wb-tags');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'wb-tags__input';
  element.appendChild(input);
  const tagList = document.createElement('div');
  tagList.className = 'wb-tags__list';
  element.appendChild(tagList);
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
    element.classList.remove('wb-tags');
    input.remove();
    tagList.remove();
  };
}

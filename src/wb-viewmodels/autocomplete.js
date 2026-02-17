// Standalone autocomplete behavior extracted from enhancements.js
export function autocomplete(element, options = {}) {
  element.classList.add('wb-autocomplete');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'wb-autocomplete__input';
  element.appendChild(input);
  const list = document.createElement('ul');
  list.className = 'wb-autocomplete__list';
  element.appendChild(list);
  let items = options.items || [];
  input.addEventListener('input', () => {
    const val = input.value.toLowerCase();
    list.innerHTML = '';
    items.filter(item => item.toLowerCase().includes(val)).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      li.onclick = () => {
        input.value = item;
        list.innerHTML = '';
        element.dispatchEvent(new CustomEvent('wb:autocomplete:select', { bubbles: true, detail: { value: item } }));
      };
      list.appendChild(li);
    });
  });
  return () => {
    element.classList.remove('wb-autocomplete');
    input.remove();
    list.remove();
  };
}

// Standalone autocomplete behavior extracted from enhancements.js
//
// `x-autocomplete` goes on a REAL <input> — it's a void element and can't
// have children, so (unlike the old version of this file) we never append a
// new <input> into it. Wrap the real input in a container (same approach as
// search.js) and add the suggestion list as a sibling, positioned below it.
export function autocomplete(element, options = {}) {
  const isInput = element.tagName === 'INPUT';
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-autocomplete';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  const input = isInput ? element : document.createElement('input');
  if (!isInput) {
    input.type = 'text';
    wrapper.appendChild(input);
  }
  input.classList.add('wb-autocomplete__input');

  const list = document.createElement('ul');
  list.className = 'wb-autocomplete__list';
  wrapper.appendChild(list);

  // Accept a JS array (options.items) or the HTML attribute as CSV
  // ("Apple,Banana,Cherry") or a JSON array string.
  let items = options.items;
  if (!items) {
    const raw = element.getAttribute('items') || '';
    try {
      items = raw.trim().startsWith('[') ? JSON.parse(raw) : raw.split(',').map((s) => s.trim()).filter(Boolean);
    } catch (e) {
      items = raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  } else {
    items = [...items];
  }

  // Remote lookup: `src`/`href="/api/items.json"` fetches a JSON array and
  // merges it with any static `items`. Fetched entries are appended once
  // loaded — typing before the fetch resolves still filters whatever is
  // available so far.
  const remoteUrl = options.src || element.getAttribute('src') || element.getAttribute('href');
  if (remoteUrl) {
    wrapper.classList.add('wb-autocomplete--loading');
    fetch(remoteUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) items.push(...data);
      })
      .catch((err) => {
        console.warn('[x-autocomplete] Failed to load remote items from', remoteUrl, err);
      })
      .finally(() => {
        wrapper.classList.remove('wb-autocomplete--loading');
      });
  }

  const renderSuggestions = () => {
    const val = input.value.toLowerCase();
    list.innerHTML = '';
    if (!val) return;
    items.filter((item) => item.toLowerCase().includes(val)).forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.onclick = () => {
        input.value = item;
        list.innerHTML = '';
        element.dispatchEvent(new CustomEvent('wb:autocomplete:select', { bubbles: true, detail: { value: item } }));
      };
      list.appendChild(li);
    });
  };
  input.addEventListener('input', renderSuggestions);

  return () => {
    wrapper.classList.remove('wb-autocomplete');
    input.classList.remove('wb-autocomplete__input');
    if (wrapper.parentNode) {
      wrapper.parentNode.insertBefore(element, wrapper);
      wrapper.remove();
    }
    list.remove();
    if (!isInput) input.remove();
  };
}

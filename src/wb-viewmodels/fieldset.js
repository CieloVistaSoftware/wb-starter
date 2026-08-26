// Standalone fieldset behavior extracted from enhancements.js
export function fieldset(element, options = {}) {
  // #753: read the PLAIN attribute as well as the data-* form. Every example
  // and doc writes `<fieldset collapsible>` -- the documented spelling -- while
  // this read only `data-collapsible`, so nothing collapsed and the demo showed
  // a plain fieldset. Same gap as #697 and #751 (form's `ajax`).
  //
  // `"false"` counts as false (#747): a string attribute value is truthy in JS,
  // so `collapsible="false"` read as a bare presence check means ON.
  const flag = (name) => {
    for (const n of [name, `data-${name}`]) {
      if (!element.hasAttribute(n)) continue;
      const v = element.getAttribute(n);
      return !(v === 'false' || v === '0');
    }
    return false;
  };

  const config = {
    collapsible: options.collapsible ?? flag('collapsible'),
    collapsed: options.collapsed ?? flag('collapsed'),
    ...options
  };
  element.classList.add('x-fieldset');
  const legend = element.querySelector('legend');
  if (legend && config.collapsible) {
    legend.classList.add('x-fieldset__legend', 'x-fieldset__legend--collapsible');
    if (config.collapsed) element.classList.add('x-fieldset--collapsed');
    legend.onclick = () => {
      element.classList.toggle('x-fieldset--collapsed');
    };
  }
  return () => element.classList.remove('x-fieldset');
}

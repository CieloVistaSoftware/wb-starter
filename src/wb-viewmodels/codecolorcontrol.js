/**
 * Code Color Control Behavior
 * -----------------------------------------------------------------------------
 * Two color pickers (background, text) for code panels (--bg-code /
 * --text-code, src/styles/behaviors/pre.css) plus a reset button. Neither
 * variable is set by any of the 51 themes in themes.css -- every theme falls
 * back to pre.css's own hardcoded default (#1e1e1e / #d4d4d4) regardless of
 * whether the active theme is dark or light. This control lets an author
 * override them directly rather than editing CSS, same "one control, one
 * source of truth, dispatch on change" shape as themecontrol.js.
 *
 * Custom Tag: <wb-codecolorcontrol>
 * -----------------------------------------------------------------------------
 */

const STORAGE_KEY = 'wb-code-colors';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function writeStored(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* best-effort */ }
}

// #1e1e1e/#d4d4d4 match pre.css's own var(--bg-code, #1e1e1e) fallback --
// duplicated here (not read from getComputedStyle) so the reset button can
// restore this EXACT value even on a page where pre.css hasn't loaded yet.
const DEFAULTS = { bg: '#1e1e1e', text: '#d4d4d4' };

export function codecolorcontrol(element, options = {}) {
  // Same re-init guard every other stateful behavior in this codebase uses
  // (toast()'s _wbToastInit, themecontrol()'s _wbThemeControlInit) -- a
  // second scan/observe pass reaching an already-initialized element would
  // otherwise append a second wrapper rather than skip.
  if (element._wbCodeColorControlInit) return () => {};
  element._wbCodeColorControlInit = true;

  const config = {
    target: options.target || element.getAttribute('target') || 'html',
    showLabel: options.showLabel ?? (element.getAttribute('show-label') !== 'false'),
    persist: options.persist ?? (element.getAttribute('persist') !== 'false'),
    ...options,
  };

  const targetEl = config.target === 'html' ? document.documentElement : document.querySelector(config.target);
  if (!targetEl) {
    console.warn('[WB] CodeColorControl: Target not found');
    return () => {};
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'wb-codecolorcontrol__wrapper';

  if (config.showLabel) {
    const label = document.createElement('span');
    label.className = 'wb-codecolorcontrol__label';
    label.textContent = 'Code Colors:';
    wrapper.appendChild(label);
  }

  function makeField(key, title) {
    const field = document.createElement('label');
    field.className = 'wb-codecolorcontrol__field';
    field.title = title;
    const input = document.createElement('input');
    input.type = 'color';
    input.className = 'wb-codecolorcontrol__input';
    field.appendChild(input);
    wrapper.appendChild(field);
    return input;
  }

  const bgInput = makeField('bg', 'Code background color');
  const textInput = makeField('text', 'Code text color');

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'wb-codecolorcontrol__reset';
  resetBtn.textContent = 'Reset';
  wrapper.appendChild(resetBtn);

  element.appendChild(wrapper);

  const apply = (bg, text, { save = true } = {}) => {
    targetEl.style.setProperty('--bg-code', bg);
    targetEl.style.setProperty('--text-code', text);
    bgInput.value = bg;
    textInput.value = text;
    if (config.persist && save) writeStored({ bg, text });
    element.dispatchEvent(new CustomEvent('wb:codecolors:change', { bubbles: true, detail: { bg, text } }));
  };

  const stored = config.persist ? readStored() : null;
  const initial = stored || DEFAULTS;
  // Reflect current values into the inputs without re-writing storage on
  // first render -- only an actual user edit (or explicit reset) persists.
  bgInput.value = initial.bg;
  textInput.value = initial.text;
  if (stored) {
    targetEl.style.setProperty('--bg-code', stored.bg);
    targetEl.style.setProperty('--text-code', stored.text);
  }

  const onBgInput = () => apply(bgInput.value, textInput.value);
  const onTextInput = () => apply(bgInput.value, textInput.value);
  const onReset = () => {
    targetEl.style.removeProperty('--bg-code');
    targetEl.style.removeProperty('--text-code');
    writeStored(null);
    bgInput.value = DEFAULTS.bg;
    textInput.value = DEFAULTS.text;
    element.dispatchEvent(new CustomEvent('wb:codecolors:change', { bubbles: true, detail: { ...DEFAULTS, reset: true } }));
  };

  bgInput.addEventListener('input', onBgInput);
  textInput.addEventListener('input', onTextInput);
  resetBtn.addEventListener('click', onReset);

  // Same cross-instance sync pattern as themecontrol.js -- a page with more
  // than one <wb-codecolorcontrol> stays in sync live, not just on reload.
  const onExternalChange = (e) => {
    if (e.target === element) return;
    bgInput.value = e.detail.bg;
    textInput.value = e.detail.text;
  };
  document.addEventListener('wb:codecolors:change', onExternalChange);

  element.wbCodeColorControl = {
    getColors: () => ({ bg: bgInput.value, text: textInput.value }),
    setColors: apply,
    reset: onReset,
  };

  return () => {
    bgInput.removeEventListener('input', onBgInput);
    textInput.removeEventListener('input', onTextInput);
    resetBtn.removeEventListener('click', onReset);
    document.removeEventListener('wb:codecolors:change', onExternalChange);
    wrapper.remove();
    delete element.wbCodeColorControl;
    delete element._wbCodeColorControlInit;
  };
}

export default codecolorcontrol;

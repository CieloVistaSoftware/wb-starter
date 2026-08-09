/**
 * Code Color Control Behavior
 * -----------------------------------------------------------------------------
 * Dropdown to select a code panel color preset (--bg-code/--text-code,
 * src/styles/behaviors/pre.css) -- applies immediately. Neither variable is
 * set by any of the 51 themes in themes.css -- every theme falls back to
 * pre.css's own hardcoded default (#1e1e1e/#d4d4d4) regardless of whether
 * the active theme is dark or light. Same "one control, one source of
 * truth, dispatch on change" shape as themecontrol.js, including its exact
 * dropdown UI (John: presets, not individual color swatches).
 *
 * Custom Tag: <wb-codecolorcontrol>
 * -----------------------------------------------------------------------------
 */

const STORAGE_KEY = 'wb-code-colors';

// First entry is the default (matches pre.css's own fallback exactly, so
// selecting it and never having touched the control produce identical
// output). A handful of well-known editor palettes, not a full syntax-token
// system -- this control only ever sets two variables.
const PRESETS = [
  { id: 'default', name: 'Default', bg: '#1e1e1e', text: '#d4d4d4' },
  { id: 'github-dark', name: 'GitHub Dark', bg: '#0d1117', text: '#c9d1d9' },
  { id: 'monokai', name: 'Monokai', bg: '#272822', text: '#f8f8f2' },
  { id: 'solarized-dark', name: 'Solarized Dark', bg: '#002b36', text: '#839496' },
  { id: 'solarized-light', name: 'Solarized Light', bg: '#fdf6e3', text: '#657b83' },
  { id: 'github-light', name: 'GitHub Light', bg: '#f6f8fa', text: '#24292f' },
  { id: 'dracula', name: 'Dracula', bg: '#282a36', text: '#f8f8f2' },
  { id: 'nord', name: 'Nord', bg: '#2e3440', text: '#d8dee9' },
];

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function writeStored(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* best-effort */ }
}

function findPreset(id) {
  return PRESETS.find((p) => p.id === id) || PRESETS[0];
}

export function codecolorcontrol(element, options = {}) {
  // Same re-init guard every other stateful behavior in this codebase uses
  // (toast()'s _wbToastInit, themecontrol()'s _wbThemeControlInit) -- a
  // second scan/observe pass reaching an already-initialized element would
  // otherwise append a second wrapper rather than skip.
  if (element._wbCodeColorControlInit) return () => {};
  element._wbCodeColorControlInit = true;

  const config = {
    target: options.target || element.getAttribute('target') || 'html',
    default: options.default || element.getAttribute('default') || 'default',
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

  let label = null;
  if (config.showLabel) {
    label = document.createElement('label');
    label.className = 'wb-codecolorcontrol__label';
    label.textContent = 'Code Colors:';
    wrapper.appendChild(label);
  }

  const select = document.createElement('select');
  select.className = 'wb-codecolorcontrol__select';
  PRESETS.forEach((preset) => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.name;
    select.appendChild(option);
  });
  wrapper.appendChild(select);

  element.appendChild(wrapper);

  let currentId = config.default;

  const applyPreset = (id) => {
    const preset = findPreset(id);
    currentId = preset.id;
    targetEl.style.setProperty('--bg-code', preset.bg);
    targetEl.style.setProperty('--text-code', preset.text);
    select.value = preset.id;

    if (config.persist) writeStored(preset.id);

    element.dispatchEvent(new CustomEvent('wb:codecolors:change', {
      bubbles: true,
      detail: { id: preset.id, name: preset.name, bg: preset.bg, text: preset.text },
    }));
  };

  if (config.persist) {
    const saved = readStored();
    if (saved && PRESETS.some((p) => p.id === saved)) currentId = saved;
  }
  applyPreset(currentId);

  const onChange = (e) => applyPreset(e.target.value);
  select.addEventListener('change', onChange);

  // Same cross-instance sync pattern as themecontrol.js -- a page with more
  // than one <wb-codecolorcontrol> stays in sync live, not just on reload.
  const onExternalChange = (e) => {
    if (e.target === element) return;
    currentId = e.detail.id;
    select.value = e.detail.id;
  };
  document.addEventListener('wb:codecolors:change', onExternalChange);

  element.wbCodeColorControl = {
    getPreset: () => currentId,
    setPreset: applyPreset,
    getPresets: () => [...PRESETS],
  };

  return () => {
    select.removeEventListener('change', onChange);
    document.removeEventListener('wb:codecolors:change', onExternalChange);
    wrapper.remove();
    delete element.wbCodeColorControl;
    delete element._wbCodeColorControlInit;
  };
}

export { PRESETS };
export default codecolorcontrol;

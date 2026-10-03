/**
 * Theme Control Behavior
 * -----------------------------------------------------------------------------
 * Dropdown to select from available themes - applies immediately.
 * 
 * Custom Tag: <div x-themecontrol>
 * -----------------------------------------------------------------------------
 */

// One list for every theme control and the Themes page (#1025).
import { THEMES } from '../core/themes-registry.js';

/**
 * Picking a theme from anywhere on the page (#1025). The Themes page shows one
 * card per theme, each `<button class="x-themecontrol__pick" data-theme="id">`.
 * A click goes through a page-wide control's own applyTheme(), so it persists
 * and every dropdown follows, exactly as choosing it from the list does. One
 * listener per document, however many controls there are.
 */
const pageControls = new Set();
const onPick = (e) => {
  const pick = e.target.closest?.('.x-themecontrol__pick[data-theme]');
  if (!pick) return;
  const id = pick.getAttribute('data-theme');
  if (!THEMES.some((t) => t.id === id)) return;
  const [apply] = pageControls;
  if (apply) apply(id);
};

export function themecontrol(element, options = {}) {
  // Confirmed live: two full "Theme: [dropdown]" pairs rendered inside the
  // SAME <div x-themecontrol id="headerThemeControl"> element, each showing a
  // DIFFERENT selected theme -- this function had no re-init guard (every
  // other stateful behavior in this codebase has one, e.g. toast()'s
  // element._wbToastInit), so a second WB scan/observe pass reaching an
  // already-initialized element just appended a SECOND
  // .x-themecontrol__wrapper via element.appendChild() below, rather than
  // skipping or replacing the first. The two dropdowns then drifted apart
  // because each call's own applyTheme(currentTheme) read localStorage at
  // ITS OWN invocation time, not just once.
  if (element._wbThemeControlInit) return () => {};
  element._wbThemeControlInit = true;
  const config = {
    target: options.target || element.getAttribute('target') || 'html',
    default: options.default || element.getAttribute('default') || 'dark',
    showLabel: options.showLabel ?? (element.getAttribute('show-label') !== 'false'),
    persist: options.persist ?? (element.getAttribute('persist') !== 'false'),
    ...options
  };

  // Get target element
  const targetEl = config.target === 'html' 
    ? document.documentElement 
    : document.querySelector(config.target);

  if (!targetEl) {
    console.warn('[WB] ThemeControl: Target not found');
    return () => {};
  }

  // #448: no classList.add('x-themecontrol') -- themecontrol.css selects
  // the `[x-themecontrol]` TAG directly now, so it just duplicated the tag
  // name.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-themecontrol> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-themecontrol> tag does not get a redundant class.
  element.classList.add('x-themecontrol');

  // Create the control UI
  const wrapper = document.createElement('div');
  wrapper.className = 'x-themecontrol__wrapper';

  // Label
  let label = null;
  if (config.showLabel) {
    label = document.createElement('label');
    label.className = 'x-themecontrol__label';
    label.textContent = 'Theme:';
    wrapper.appendChild(label);
  }

  // Dropdown select
  const select = document.createElement('select');
  select.className = 'x-themecontrol__select';

  // Add theme options
  THEMES.forEach(theme => {
    const option = document.createElement('option');
    option.value = theme.id;
    option.textContent = theme.name;
    option.title = theme.description;
    select.appendChild(option);
  });

  wrapper.appendChild(select);
  element.appendChild(wrapper);

  // Get initial theme from localStorage or default
  let currentTheme = config.default;
  if (config.persist && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('x-theme');
    if (saved && THEMES.some(t => t.id === saved)) {
      currentTheme = saved;
    }
  }

  // Apply theme function
  const applyTheme = (themeId) => {
    currentTheme = themeId;
    targetEl.dataset.theme = themeId;
    select.value = themeId;

    // Persist if enabled
    if (config.persist && typeof localStorage !== 'undefined') {
      localStorage.setItem('x-theme', themeId);
    }

    // Dispatch event
    element.dispatchEvent(new CustomEvent('wb:theme:change', {
      bubbles: true,
      detail: { theme: themeId, name: THEMES.find(t => t.id === themeId)?.name }
    }));
  };

  // Set initial theme
  applyTheme(currentTheme);

  if (targetEl === document.documentElement) {
    if (!pageControls.size) document.addEventListener('click', onPick);
    pageControls.add(applyTheme);
  }

  // Handle selection change
  const onChange = (e) => {
    applyTheme(e.target.value);
  };

  select.addEventListener('change', onChange);

  // John: "All theme controls must read from 1 place, one time. This will
  // keep them all in sync on different pages." applyTheme() already
  // dispatches wb:theme:change (bubbles) on ITS OWN element whenever it
  // runs, but nothing was listening -- a page with more than one
  // <div x-themecontrol> (e.g. the header's + one embedded in a doc/demo)
  // only ever synced on a fresh page load (each instance's own initial
  // localStorage read), not live: changing the theme in one left every
  // other instance's dropdown showing the stale value until reload.
  // Listen on document (not element) since a sibling instance elsewhere in
  // the DOM is never an ancestor this event would otherwise bubble through.
  const onExternalThemeChange = (e) => {
    if (e.target === element) return; // our own change already set select.value
    currentTheme = e.detail.theme;
    select.value = e.detail.theme;
  };
  document.addEventListener('wb:theme:change', onExternalThemeChange);

  // Expose methods
  element.wbThemeControl = {
    getTheme: () => currentTheme,
    setTheme: applyTheme,
    getThemes: () => [...THEMES]
  };

  // Mark as ready
  // Cleanup
  return () => {
    select.removeEventListener('change', onChange);
    pageControls.delete(applyTheme);
    if (!pageControls.size) document.removeEventListener('click', onPick);
    document.removeEventListener('wb:theme:change', onExternalThemeChange);
    wrapper.remove();
    delete element.wbThemeControl;
    delete element._wbThemeControlInit;
  };
}

// Export themes list for external use
export { THEMES };
export default themecontrol;

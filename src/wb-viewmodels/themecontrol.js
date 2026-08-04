/**
 * Theme Control Behavior
 * -----------------------------------------------------------------------------
 * Dropdown to select from available themes - applies immediately.
 * 
 * Custom Tag: <wb-theme-control>
 * -----------------------------------------------------------------------------
 */

// Available themes - matches themes.css (23 total)
const THEMES = [
  // Original 12
  { id: 'dark', name: 'Dark', description: 'Standard dark theme' },
  { id: 'light', name: 'Light', description: 'Standard light theme' },
  { id: 'cyberpunk', name: 'Cyberpunk', description: 'Vibrant magenta/cyan' },
  { id: 'ocean', name: 'Ocean', description: 'Calm blues' },
  { id: 'sunset', name: 'Sunset', description: 'Warm oranges' },
  { id: 'forest', name: 'Forest', description: 'Natural greens' },
  { id: 'midnight', name: 'Midnight', description: 'Deep monochromatic blue' },
  { id: 'twilight', name: 'Twilight', description: 'Purple-blue with warm accents' },
  { id: 'sakura', name: 'Sakura', description: 'Elegant pink' },
  { id: 'arctic', name: 'Arctic', description: 'Ice blue' },
  { id: 'desert', name: 'Desert', description: 'Warm sand tones' },
  { id: 'neon-dreams', name: 'Neon Dreams', description: 'Purple neon' },
  { id: 'retro-wave', name: 'Retro Wave', description: 'Retro pink/purple' },
  // New 10
  { id: 'lavender', name: 'Lavender', description: 'Soft purple pastels' },
  { id: 'emerald', name: 'Emerald', description: 'Rich jewel-toned green' },
  { id: 'ruby', name: 'Ruby', description: 'Deep red elegance' },
  { id: 'golden', name: 'Golden', description: 'Luxurious gold and amber' },
  { id: 'slate', name: 'Slate', description: 'Professional gray tones' },
  { id: 'coffee', name: 'Coffee', description: 'Warm brown tones' },
  { id: 'mint', name: 'Mint', description: 'Fresh mint green' },
  { id: 'noir', name: 'Noir', description: 'High contrast black/white' },
  { id: 'aurora', name: 'Aurora', description: 'Northern lights inspired' },
  { id: 'grape', name: 'Grape', description: 'Deep purple vibes' }
];

export function themecontrol(element, options = {}) {
  // Confirmed live: two full "Theme: [dropdown]" pairs rendered inside the
  // SAME <wb-themecontrol id="headerThemeControl"> element, each showing a
  // DIFFERENT selected theme -- this function had no re-init guard (every
  // other stateful behavior in this codebase has one, e.g. toast()'s
  // element._wbToastInit), so a second WB scan/observe pass reaching an
  // already-initialized element just appended a SECOND
  // .wb-themecontrol__wrapper via element.appendChild() below, rather than
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

  // #448: no classList.add('wb-themecontrol') -- themecontrol.css selects
  // the `wb-themecontrol` TAG directly now, so it just duplicated the tag
  // name.

  // Create the control UI
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-themecontrol__wrapper';

  // Label
  let label = null;
  if (config.showLabel) {
    label = document.createElement('label');
    label.className = 'wb-themecontrol__label';
    label.textContent = 'Theme:';
    wrapper.appendChild(label);
  }

  // Dropdown select
  const select = document.createElement('select');
  select.className = 'wb-themecontrol__select';

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
    const saved = localStorage.getItem('wb-theme');
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
      localStorage.setItem('wb-theme', themeId);
    }

    // Dispatch event
    element.dispatchEvent(new CustomEvent('wb:theme:change', {
      bubbles: true,
      detail: { theme: themeId, name: THEMES.find(t => t.id === themeId)?.name }
    }));
  };

  // Set initial theme
  applyTheme(currentTheme);

  // Handle selection change
  const onChange = (e) => {
    applyTheme(e.target.value);
  };

  select.addEventListener('change', onChange);

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
    wrapper.remove();
    delete element.wbThemeControl;
    delete element._wbThemeControlInit;
  };
}

// Export themes list for external use
export { THEMES };
export default themecontrol;

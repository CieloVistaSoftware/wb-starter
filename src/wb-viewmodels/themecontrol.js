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
  const config = {
    target: options.target || element.dataset.target || 'html',
    default: options.default || element.dataset.default || 'dark',
    showLabel: options.showLabel ?? (element.dataset.showLabel !== 'false'),
    persist: options.persist ?? (element.dataset.persist !== 'false'),
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

  element.classList.add('wb-themecontrol');

  // Create the control UI
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-themecontrol__wrapper';
  wrapper.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  `;

  // Label
  let label = null;
  if (config.showLabel) {
    label = document.createElement('label');
    label.className = 'wb-themecontrol__label';
    label.textContent = 'Theme:';
    label.style.cssText = `
      font-weight: 500;
      font-size: 0.875rem;
    `;
    wrapper.appendChild(label);
  }

  // Dropdown select
  const select = document.createElement('select');
  select.className = 'wb-themecontrol__select';
  select.style.cssText = `
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    font-size: 0.875rem;
    border: 1px solid var(--border-color, #ddd);
    border-radius: var(--radius-md, 6px);
    background: var(--bg-primary, #fff);
    color: var(--text-primary, #333);
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    min-width: 150px;
  `;

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
  element.classList.add('wb-ready');

  // Cleanup
  return () => {
    element.classList.remove('wb-themecontrol');
    select.removeEventListener('change', onChange);
    wrapper.remove();
    delete element.wbThemeControl;
  };
}

// Export themes list for external use
export { THEMES };
export default themecontrol;

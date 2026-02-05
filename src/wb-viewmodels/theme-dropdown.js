/**
 * Theme selector dropdown with 23 available themes.
 * - `<wb-theme-dropdown>` for runtime theme switching.
 */
export function cc() {}

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

export function themeDropdown(element, options = {}) {
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
    console.warn('[WB] ThemeDropdown: Target not found');
    return () => {};
  }

  element.classList.add('wb-theme-dropdown');

  // Apply flex layout directly to the element
  element.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  `;

  // Label
  let label = null;
  if (config.showLabel) {
    label = document.createElement('label');
    label.className = 'wb-theme-dropdown__label';
    label.textContent = 'Theme:';
    label.style.cssText = `
      font-weight: 500;
      font-size: 0.875rem;
    `;
    element.appendChild(label);
  }

  // Dropdown select
  const select = document.createElement('select');
  select.className = 'wb-theme-dropdown__select';
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

  element.appendChild(select);

  // Get initial theme: prefer an explicit data-theme on the page, else saved preference, else default
  let currentTheme = config.default;

  // 1) If the page author explicitly set a data-theme on the target, respect it (authoritative)
  try {
    if (targetEl && targetEl.hasAttribute && targetEl.hasAttribute('data-theme')) {
      const explicit = targetEl.getAttribute('data-theme');
      if (explicit && THEMES.some(t => t.id === explicit)) {
        currentTheme = explicit;
      }
    } else {
      // Special-case: pages that use the canonical `wb-page` should default to dark
      // even if the user previously selected a different persisted theme.
      try {
        if (document && document.querySelector && document.querySelector('wb-page')) {
          currentTheme = 'dark';
        } else if (config.persist) {
          // 2) Fallback to persisted user preference (if available and safe to access)
          try {
            if (typeof localStorage !== 'undefined') {
              const saved = localStorage.getItem('wb-theme');
              if (saved && THEMES.some(t => t.id === saved)) {
                currentTheme = saved;
              }
            }
          } catch (err) {
            // Some browsers block access to storage (tracking prevention). Don't fail — continue with default.
            console.info('[WB] ThemeDropdown: localStorage unavailable, skipping persisted theme check');
          }
        }
      } catch (err) {
        // defensive: if document access fails, fall back to persisted/default behavior
        console.warn('[WB] ThemeDropdown: error checking for wb-page', err);
      }
    }
  } catch (err) {
    console.warn('[WB] ThemeDropdown: error while resolving initial theme, falling back to default', err);
  }

  // Apply theme function
  const applyTheme = (themeId) => {
    currentTheme = themeId;
    targetEl.dataset.theme = themeId;
    select.value = themeId;

    // Persist if enabled (guarded)
    try {
      if (config.persist && typeof localStorage !== 'undefined') {
        localStorage.setItem('wb-theme', themeId);
      }
    } catch (err) {
      console.info('[WB] ThemeDropdown: unable to persist theme to localStorage');
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
  element.wbThemeDropdown = {
    getTheme: () => currentTheme,
    setTheme: applyTheme,
    getThemes: () => [...THEMES]
  };

  // Mark as ready
  element.dataset.wbReady = (element.dataset.wbReady || '') + ' theme-dropdown';

  // Cleanup
  return () => {
    element.classList.remove('wb-theme-dropdown');
    element.style.cssText = '';
    select.removeEventListener('change', onChange);
    if (label) label.remove();
    select.remove();
    delete element.wbThemeDropdown;
  };
}

// Backwards compatibility alias
export const themecontrol = themeDropdown;

// Export themes list for external use
export { THEMES };
export default themeDropdown;

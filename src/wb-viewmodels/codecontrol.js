/**
 * Code Control Behavior
 * Custom Tag: <wb-codecontrol>
 * Dropdown to select from available highlight.js code themes - applies immediately.
 * 
 * Usage:
 *   <wb-codecontrol ></div>
 *   <wb-codecontrol  size="xs"></div>
 *   <wb-codecontrol  show-label="false" size="sm"></div>
 */

// Curated list of highlight.js themes (organized by category)
const CODE_THEMES = [
  // Grayscale / Minimal
  { id: 'wb-grayscale-dark', name: 'WB Grayscale (Dark)', category: 'Minimal', description: 'High contrast dark grayscale', path: '/src/styles/code-themes/wb-grayscale-dark.css' },
  { id: 'ascetic', name: 'Ascetic', category: 'Minimal', description: 'Ultra minimal' },
  
  // Dark Themes
  { id: 'atom-one-dark', name: 'Atom One Dark', category: 'Dark', description: 'Default - popular dark theme' },
  { id: 'github-dark', name: 'GitHub Dark', category: 'Dark', description: 'GitHub dark mode' },
  { id: 'github-dark-dimmed', name: 'GitHub Dark Dimmed', category: 'Dark', description: 'Softer GitHub dark' },
  { id: 'monokai', name: 'Monokai', category: 'Dark', description: 'Classic Sublime theme' },
  { id: 'monokai-sublime', name: 'Monokai Sublime', category: 'Dark', description: 'Monokai variant' },
  { id: 'vs2015', name: 'VS 2015', category: 'Dark', description: 'Visual Studio dark' },
  { id: 'nord', name: 'Nord', category: 'Dark', description: 'Arctic, north-bluish' },
  { id: 'dracula', name: 'Obsidian', category: 'Dark', description: 'Dark with purple hints' },
  { id: 'night-owl', name: 'Night Owl', category: 'Dark', description: 'Accessibility-focused dark' },
  { id: 'tokyo-night-dark', name: 'Tokyo Night', category: 'Dark', description: 'Inspired by Tokyo nights' },
  { id: 'panda-syntax-dark', name: 'Panda Dark', category: 'Dark', description: 'Minimal dark syntax' },
  { id: 'rose-pine', name: 'Rosé Pine', category: 'Dark', description: 'All natural pine' },
  { id: 'rose-pine-moon', name: 'Rosé Pine Moon', category: 'Dark', description: 'Rosé Pine variant' },
  { id: 'agate', name: 'Agate', category: 'Dark', description: 'Dark with muted colors' },
  { id: 'androidstudio', name: 'Android Studio', category: 'Dark', description: 'Android IDE theme' },
  { id: 'an-old-hope', name: 'An Old Hope', category: 'Dark', description: 'Star Wars inspired' },
  { id: 'ir-black', name: 'IR Black', category: 'Dark', description: 'High contrast dark' },
  { id: 'obsidian', name: 'Obsidian', category: 'Dark', description: 'Dark slate theme' },
  { id: 'srcery', name: 'Srcery', category: 'Dark', description: 'Dark with vivid colors' },
  { id: 'sunburst', name: 'Sunburst', category: 'Dark', description: 'TextMate classic' },
  { id: 'xt256', name: 'XT256', category: 'Dark', description: '256 color terminal' },
  { id: 'hybrid', name: 'Hybrid', category: 'Dark', description: 'Vim hybrid theme' },
  { id: 'shades-of-purple', name: 'Shades of Purple', category: 'Dark', description: 'Purple-focused' },
  { id: 'stackoverflow-dark', name: 'Stack Overflow Dark', category: 'Dark', description: 'SO dark mode' },
  
  // Light Themes
  { id: 'atom-one-light', name: 'Atom One Light', category: 'Light', description: 'Popular light theme' },
  { id: 'github', name: 'GitHub', category: 'Light', description: 'GitHub light mode' },
  { id: 'vs', name: 'Visual Studio', category: 'Light', description: 'VS light theme' },
  { id: 'xcode', name: 'Xcode', category: 'Light', description: 'Apple Xcode theme' },
  { id: 'idea', name: 'IntelliJ IDEA', category: 'Light', description: 'JetBrains light' },
  { id: 'intellij-light', name: 'IntelliJ Light', category: 'Light', description: 'JetBrains light variant' },
  { id: 'tokyo-night-light', name: 'Tokyo Night Light', category: 'Light', description: 'Tokyo light variant' },
  { id: 'panda-syntax-light', name: 'Panda Light', category: 'Light', description: 'Minimal light syntax' },
  { id: 'rose-pine-dawn', name: 'Rosé Pine Dawn', category: 'Light', description: 'Rosé Pine light' },
  { id: 'stackoverflow-light', name: 'Stack Overflow Light', category: 'Light', description: 'SO light mode' },
  { id: 'default', name: 'Default', category: 'Light', description: 'highlight.js default' },
  { id: 'googlecode', name: 'Google Code', category: 'Light', description: 'Google style' },
  { id: 'docco', name: 'Docco', category: 'Light', description: 'Literate programming' },
  { id: 'foundation', name: 'Foundation', category: 'Light', description: 'Zurb Foundation' },
  { id: 'arduino-light', name: 'Arduino Light', category: 'Light', description: 'Arduino IDE' },
  { id: 'qtcreator-light', name: 'Qt Creator Light', category: 'Light', description: 'Qt IDE light' },
  
  // Special / Colorful
  { id: 'rainbow', name: 'Rainbow', category: 'Special', description: 'Colorful rainbow theme' },
  { id: 'a11y-dark', name: 'A11Y Dark', category: 'Special', description: 'Accessible dark' },
  { id: 'a11y-light', name: 'A11Y Light', category: 'Special', description: 'Accessible light' },
  { id: 'gradient-dark', name: 'Gradient Dark', category: 'Special', description: 'Dark with gradients' },
  { id: 'gradient-light', name: 'Gradient Light', category: 'Special', description: 'Light with gradients' },
  { id: 'kimbie-dark', name: 'Kimbie Dark', category: 'Special', description: 'Warm dark theme' },
  { id: 'kimbie-light', name: 'Kimbie Light', category: 'Special', description: 'Warm light theme' },
];

// Size configurations
const SIZES = {
  xs: { fontSize: '0.65rem', padding: '0.2rem 1.25rem 0.2rem 0.4rem', minWidth: '80px', arrowSize: '8' },
  sm: { fontSize: '0.75rem', padding: '0.3rem 1.5rem 0.3rem 0.5rem', minWidth: '100px', arrowSize: '10' },
  md: { fontSize: '0.875rem', padding: '0.5rem 2rem 0.5rem 0.75rem', minWidth: '140px', arrowSize: '12' },
  lg: { fontSize: '1rem', padding: '0.625rem 2.25rem 0.625rem 1rem', minWidth: '160px', arrowSize: '14' }
};

// Path to highlight.js styles
const HLJS_STYLES_PATH = '/node_modules/highlight.js/styles/';

// Global event for syncing all codecontrol instances
const SYNC_EVENT = 'x:codetheme:sync';

export function codecontrol(element, options = {}) {
  const config = {
    default: options.default || element.dataset.default || 'atom-one-dark',
    showLabel: options.showLabel ?? (element.dataset.showLabel !== 'false'),
    showCategory: options.showCategory ?? (element.dataset.showCategory !== 'false'),
    persist: options.persist ?? (element.dataset.persist !== 'false'),
    size: options.size || element.dataset.size || 'md',
    ...options
  };

  // Get size config
  const sizeConfig = SIZES[config.size] || SIZES.md;

  element.classList.add('x-codecontrol');

  // Create the control UI
  const wrapper = document.createElement('div');
  wrapper.className = 'x-codecontrol__wrapper';
  wrapper.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  `;

  // Label
  if (config.showLabel) {
    const label = document.createElement('label');
    label.className = 'x-codecontrol__label';
    label.textContent = 'Code:';
    label.style.cssText = `
      font-weight: 500;
      font-size: ${sizeConfig.fontSize};
      color: var(--text-primary, inherit);
    `;
    wrapper.appendChild(label);
  }

  // Dropdown select
  const select = document.createElement('select');
  select.className = 'x-codecontrol__select';
  select.style.cssText = `
    padding: ${sizeConfig.padding};
    font-size: ${sizeConfig.fontSize};
    border: 1px solid var(--border-color, #374151);
    border-radius: var(--radius-sm, 4px);
    background: var(--bg-primary, #1f2937);
    color: var(--text-primary, #f3f4f6);
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${sizeConfig.arrowSize}' height='${sizeConfig.arrowSize}' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.35rem center;
    min-width: ${sizeConfig.minWidth};
  `;

  // Group themes by category
  if (config.showCategory) {
    const categories = [...new Set(CODE_THEMES.map(t => t.category))];
    categories.forEach(category => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = category;
      
      CODE_THEMES
        .filter(t => t.category === category)
        .forEach(theme => {
          const option = document.createElement('option');
          option.value = theme.id;
          option.textContent = theme.name;
          option.title = theme.description;
          optgroup.appendChild(option);
        });
      
      select.appendChild(optgroup);
    });
  } else {
    // Flat list
    CODE_THEMES.forEach(theme => {
      const opt = document.createElement('option');
      opt.value = theme.id;
      opt.textContent = theme.name;
      opt.title = theme.description;
      select.appendChild(opt);
    });
  }

  wrapper.appendChild(select);
  element.appendChild(wrapper);

  // Get or create the theme link element
  let themeLink = document.querySelector('link[data-highlight-theme]');
  if (!themeLink) {
    themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.setAttribute('data-highlight-theme', 'true');
    document.head.appendChild(themeLink);
  }

  // Get initial theme from localStorage or default
  let currentTheme = config.default;
  if (config.persist && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('x-code-theme');
    if (saved && CODE_THEMES.some(t => t.id === saved)) {
      currentTheme = saved;
    }
  }

  // Apply theme function
  const applyTheme = (themeId, broadcast = true) => {
    currentTheme = themeId;
    
    const themeObj = CODE_THEMES.find(t => t.id === themeId);
    if (themeObj && themeObj.path) {
      themeLink.href = themeObj.path;
    } else {
      themeLink.href = `${HLJS_STYLES_PATH}${themeId}.css`;
    }
    
    select.value = themeId;

    // Persist if enabled
    if (config.persist && typeof localStorage !== 'undefined') {
      localStorage.setItem('x-code-theme', themeId);
    }

    // Dispatch change event
    element.dispatchEvent(new CustomEvent('x:codetheme:change', {
      bubbles: true,
      detail: { 
        theme: themeId, 
        name: CODE_THEMES.find(t => t.id === themeId)?.name,
        category: CODE_THEMES.find(t => t.id === themeId)?.category
      }
    }));

    // Broadcast sync event to all other codecontrol instances
    if (broadcast) {
      document.dispatchEvent(new CustomEvent(SYNC_EVENT, {
        detail: { theme: themeId, source: element }
      }));
    }
  };

  // Set initial theme
  applyTheme(currentTheme);

  // Handle selection change
  const onChange = (e) => {
    applyTheme(e.target.value);
  };

  select.addEventListener('change', onChange);

  // Listen for sync events from other codecontrol instances
  const onSync = (e) => {
    if (e.detail.source !== element && e.detail.theme !== currentTheme) {
      applyTheme(e.detail.theme, false); // Don't broadcast back
    }
  };

  document.addEventListener(SYNC_EVENT, onSync);

  // Expose methods
  element.wbCodeControl = {
    getTheme: () => currentTheme,
    setTheme: applyTheme,
    getThemes: () => [...CODE_THEMES],
    getThemesByCategory: (category) => CODE_THEMES.filter(t => t.category === category)
  };

  // Mark as ready
  element.dataset.wbReady = (element.dataset.wbReady || '') + ' codecontrol';

  // Cleanup
  return () => {
    element.classList.remove('x-codecontrol');
    select.removeEventListener('change', onChange);
    document.removeEventListener(SYNC_EVENT, onSync);
    wrapper.remove();
    delete element.wbCodeControl;
  };
}

// Export themes list for external use
export { CODE_THEMES, HLJS_STYLES_PATH, SIZES };
export default codecontrol;

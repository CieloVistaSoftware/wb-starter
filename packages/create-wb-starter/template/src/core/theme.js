/**
 * WB Theme - Theme management
 */
export const Theme = {
  current: 'dark',
  
  set(theme) {
    this.current = theme;
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
      localStorage.setItem('wb-theme', theme);

      // Ensure critical CSS custom-property aliases exist so tests and components relying on
      // shorthand tokens (--text-primary, --primary, --accent, etc.) never observe an empty value.
      try {
        const cs = getComputedStyle(document.documentElement);
        const fallbacks = {
          '--text-primary': cs.getPropertyValue('--color-text') || '#111827',
          '--text-secondary': cs.getPropertyValue('--color-text-muted') || '#6b7280',
          '--primary': cs.getPropertyValue('--color-primary') || '#3b82f6',
          '--secondary': cs.getPropertyValue('--color-secondary') || '#6366f1',
          '--accent': cs.getPropertyValue('--color-secondary') || '#6366f1'
        };
        for (const [k, v] of Object.entries(fallbacks)) {
          const cur = cs.getPropertyValue(k).trim();
          if (!cur) {
            document.documentElement.style.setProperty(k, v);
          }
        }
      } catch (err) {
        // best-effort; do not throw in production
        console.warn('[Theme] failed to apply fallbacks', err && err.message);
      }
    }
  },
  
  get() {
    if (typeof document !== 'undefined') {
      return document.documentElement.dataset.theme || localStorage.getItem('wb-theme') || 'dark';
    }
    return this.current;
  },
  
  toggle() {
    const current = this.get();
    this.set(current === 'dark' ? 'light' : 'dark');
  }
};

export default Theme;

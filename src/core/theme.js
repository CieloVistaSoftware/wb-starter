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

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

  /**
   * Ensure a deterministic first-paint theme when stylesheets may be delayed.
   * - JS-only fallback: inject minimal CSS custom properties and color-scheme
   *   on the root element so getComputedStyle(...) returns a dark token
   *   immediately. This is removed once the canonical stylesheet applies.
   * - Does NOT override an explicit authorial `data-theme`.
   */
  ensureFirstPaintFallback() {
    try {
      const el = document && document.documentElement;
      if (!el || el.hasAttribute('data-theme')) return;

      // If --bg-color is already computed, nothing to do
      let cs = null;
      try { cs = getComputedStyle(el).getPropertyValue('--bg-color').trim(); } catch (e) { cs = null; }
      if (cs) return;

      // Apply minimal fallback tokens synchronously (very small, targeted)
      el.style.setProperty('--bg-color', 'hsl(220, 25%, 10%)', 'important');
      el.style.setProperty('color-scheme', 'dark', 'important');

      // Once a stylesheet that defines the token is available, remove the inline fallback
      const observer = new MutationObserver(() => {
        try {
          const computed = getComputedStyle(el).getPropertyValue('--bg-color').trim();
          if (computed && computed !== 'hsl(220, 25%, 10%)') {
            // real stylesheet has taken over
            el.style.removeProperty('--bg-color');
            el.style.removeProperty('color-scheme');
            observer.disconnect();
          }
        } catch (err) {
          /* ignore */
        }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

      // Also stop observing after load to avoid leaks
      window.addEventListener('load', () => { try { observer.disconnect(); } catch (e) {} }, { once: true });
    } catch (e) {
      /* defensive */
    }
  },
  
  get() {
    if (typeof document !== 'undefined') {
      const el = document.documentElement;

      // 1) If author explicitly set a data-theme, respect it (authoritative)
      if (el && el.hasAttribute && el.hasAttribute('data-theme')) {
        return el.dataset.theme;
      }

      // 2) CSS-first contract for first-paint: if the computed tokens or
      //    color-scheme indicate a dark theme, prefer that _before_
      //    honoring any persisted preference. This preserves demos that
      //    include `site.css` (no CSS changes required) and prevents a
      //    runtime-flash where persisted 'light' wins the first paint.
      try {
        const cs = getComputedStyle(el);
        const computedBg = (cs.getPropertyValue('--bg-color') || '').trim();
        const colorScheme = (cs.getPropertyValue('color-scheme') || '').trim();

        const cssIndicatesDark = (
          colorScheme.includes('dark') ||
          /hsl\(220,\s*25%\s*,\s*10%\)/i.test(computedBg) ||
          computedBg.indexOf('10%') !== -1 // heuristic for the repo's dark token
        );

        if (cssIndicatesDark) {
          return 'dark';
        }
      } catch (e) {
        /* defensive - computed styles may be unavailable in some environments */
      }

      // 3) Finally, fall back to persisted preference (if any), else default
      try {
        const persisted = (typeof localStorage !== 'undefined') && (localStorage.getItem('wb-theme') || localStorage.getItem('theme'));
        if (persisted) return persisted;
      } catch (e) {
        /* localStorage may be unavailable */
      }

      return 'dark';
    }
    return this.current;
  },
  
  toggle() {
    const current = this.get();
    this.set(current === 'dark' ? 'light' : 'dark');
  }
};

export default Theme;

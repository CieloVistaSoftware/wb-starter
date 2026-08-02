import { VERSION } from '../core/version.js';

/**
 * Release — the ONE place any element displays the site's release/build
 * number. Single canonical read of src/core/version.js's VERSION export;
 * every consumer (wb-release custom tag, x-release attribute on any
 * element) renders through this one function, never a hardcoded literal.
 *
 * Replaces two separate ad-hoc mechanisms that grew up independently:
 * site-engine.js's {{WB_VERSION}} placeholder-token substitution for SPA
 * page fragments, and a direct VERSION import + manual DOM patch in
 * demos/landing-page-showcase.html for standalone (non-SPA) pages. Both
 * worked, but "add a new page that shows the version" meant picking
 * which of two mechanisms to use. x-release/wb-release works identically
 * everywhere -- SPA fragment or standalone page -- with no special-casing.
 *
 * Custom Tag: <wb-release></wb-release>
 * Attribute:  <span x-release></span>
 *
 * Attributes:
 *   format   Template string. `{version}`/`{commit}`/`{built}` tokens are
 *            replaced. Default: "v{version}".
 *   reload   "false" opts out of the click-to-clear-cache-and-reload
 *            affordance (on by default, matching the header's own
 *            version link).
 */

function formatBuiltAtCentral(isoString) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(isoString));
  } catch (e) {
    return isoString; // never break the element over a formatting failure
  }
}

async function clearCacheAndReload() {
  try {
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if (navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (err) {
    console.warn('[x-release] clear-cache partial failure:', err && err.message);
  }
  // A plain location.reload() bypasses Cache Storage/the service worker
  // (both cleared above) but not the browser's own HTTP disk cache --
  // force a genuinely new URL so nothing is served from cache.
  location.href = location.pathname + location.search
    + (location.search ? '&' : '?') + '_cb=' + Date.now()
    + location.hash;
}

export function release(element, options = {}) {
  const config = {
    format: options.format || element.getAttribute('format') || 'v{version}',
    reload: options.reload ?? (element.getAttribute('reload') !== 'false'),
    ...options,
  };

  element.classList.add('wb-release');
  element.textContent = config.format
    .replace('{version}', VERSION.version)
    .replace('{commit}', VERSION.commit)
    .replace('{built}', formatBuiltAtCentral(VERSION.builtAt));
  element.title = `Build ${VERSION.commit} · ${formatBuiltAtCentral(VERSION.builtAt)}`
    + (config.reload ? ' — tap to clear cache and reload' : '');

  let onClick = null;
  if (config.reload) {
    element.classList.add('wb-release--clickable');
    onClick = async (e) => {
      e.preventDefault();
      element.textContent = '⏳';
      await clearCacheAndReload();
    };
    element.addEventListener('click', onClick);
  }

  return () => {
    if (onClick) element.removeEventListener('click', onClick);
  };
}

import { VERSION } from '../core/version.js';

/**
 * Release — the ONE place any element displays the site's release/build
 * number. Single canonical read of src/core/version.js's VERSION export;
 * every consumer (x-release custom tag, x-release attribute on any
 * element) renders through this one function, never a hardcoded literal.
 *
 * Replaces two separate ad-hoc mechanisms that grew up independently:
 * site-engine.js's {{WB_VERSION}} placeholder-token substitution for SPA
 * page fragments, and a direct VERSION import + manual DOM patch in
 * demos/landing-page-showcase.html for standalone (non-SPA) pages. Both
 * worked, but "add a new page that shows the version" meant picking
 * which of two mechanisms to use. x-release/x-release works identically
 * everywhere -- SPA fragment or standalone page -- with no special-casing.
 *
 * Custom Tag: <div x-release></div>
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

  element.classList.add('x-release');

  // #1002 -- John: "the version number is supposed to represent a specific code
  // set", and "everything running on 3000 is the latest code".
  //
  // A bare number cannot promise that. `v4.0.1` was shown while serving a tree
  // 24 commits behind main with 377 uncommitted files: the same string named
  // the release AND something that was not the release, and nothing
  // distinguished them. That cost a whole session of mysteries -- a stale
  // badge, a missing Error Log menu item, "fixed" things that were not.
  //
  // So when the served tree is not its remote, the badge says so. Silence now
  // means "this IS the code set the number names", which is the only way the
  // number is worth reading.
  const behind = Number(VERSION.behind || 0);
  const ahead = Number(VERSION.ahead || 0);

  // John: "wouldn't +4 = 4.0.1.5". Right — `+4` was an annotation bolted onto a
  // version; a fourth segment IS a version. `4.0.1.4` reads as "four commits
  // past 4.0.1" and sorts and compares like the number it is, which is the
  // whole point of #1002: one string, one code set.
  //
  // BEHIND is not expressed this way on purpose. Being behind does not make a
  // newer build; it makes a STALE one, and rolling it into the number would
  // read as progress. It stays a warning.
  const versionText = ahead ? `${VERSION.version}.${ahead}` : VERSION.version;

  const marks = [];
  if (behind) marks.push(`⚠ ${behind} behind ${VERSION.upstream || 'remote'}`);
  if (VERSION.dirty) marks.push('dirty');
  const drift = marks.length ? ` ${marks.join(' · ')}` : '';

  element.textContent = config.format
    .replace('{version}', versionText)
    .replace('{commit}', VERSION.commit)
    .replace('{built}', formatBuiltAtCentral(VERSION.builtAt)) + drift;

  // Behind is the one that misleads, so make it impossible to read past.
  element.classList.toggle('x-release--stale', behind > 0);

  element.title = `Build ${VERSION.commit} · ${formatBuiltAtCentral(VERSION.builtAt)}`
    + (VERSION.branch ? ` · branch ${VERSION.branch}` : '')
    + (behind ? ` · ${behind} commits behind ${VERSION.upstream} — this is NOT the latest code` : '')
    + (VERSION.dirty ? ' · uncommitted changes' : '')
    + (config.reload ? ' — tap to clear cache and reload' : '');

  let onClick = null;
  let onContext = null;
  // John: "When clicking here show the What's new element", pointing at the
  // version badge.
  //
  // The badge names a code set; What's New says what is IN that code set. That
  // is the question a version number provokes, so a click answers it. The
  // previous action -- clear cache and reload -- was a developer convenience
  // nobody would guess from a version number; it moves to right-click so it is
  // still there without occupying the obvious gesture.
  element.classList.add('x-release--clickable');
  onClick = (e) => {
    e.preventDefault();
    const root = location.pathname.replace(/[^/]*$/, '');
    location.href = root + '?page=whats-new';
  };
  element.addEventListener('click', onClick);

  if (config.reload) {
    onContext = async (e) => {
      e.preventDefault();
      element.textContent = '⏳';
      await clearCacheAndReload();
    };
    element.addEventListener('contextmenu', onContext);
  }

  return () => {
    if (onClick) element.removeEventListener('click', onClick);
    if (onContext) element.removeEventListener('contextmenu', onContext);
  };
}

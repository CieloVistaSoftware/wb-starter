import { VERSION } from '../core/version.js';
import { versionNumber } from '../core/version-number.js';

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

  // #1243 -- John: the badge "must always represent the proper release it
  // displays". The release and the commits past it come from the release TAG
  // (stamp-version.js: `release`, `sinceRelease`), not from package.json and the
  // upstream: a checkout level with origin/main but 12 commits past v1.0.0 used
  // to read a bare "v1.0.0". An older stamp without the tag fields falls back to
  // the previous meaning rather than to nothing.
  // John, 2026-10-02: "1.0.what the latest push is e.g. 1.0.41 simple." The
  // number is computed in one place (src/core/version-number.js) so every
  // display of it agrees.
  const { number: shownVersion, release: releaseName, since: ahead } = versionNumber(VERSION);

  // BEHIND is not rolled into the number on purpose. Being behind does not make
  // a newer build; it makes a STALE one, and counting it would read as
  // progress. It stays a warning.
  const versionText = shownVersion;

  // Numbers only. John, 2026-10-02, on "v1.0.0 ⚠*": "What the hell are these
  // markings? I told you i only want numbers." The badge is the version and
  // nothing else; behind/edited live in the tooltip below, in words.
  element.textContent = config.format
    .replace('{version}', versionText)
    .replace('{commit}', VERSION.commit)
    .replace('{built}', formatBuiltAtCentral(VERSION.builtAt));

  // Behind is the one that misleads, so make it impossible to read past.
  element.classList.toggle('x-release--stale', behind > 0);

  element.title = `Build ${VERSION.commit} · ${formatBuiltAtCentral(VERSION.builtAt)}`
    + (ahead ? ` · ${ahead} commit${ahead === 1 ? '' : 's'} since the v${releaseName} tag` : '')
    + (VERSION.branch ? ` · branch ${VERSION.branch}` : '')
    + (behind ? ` · ${behind} commits behind ${VERSION.upstream} — this is NOT the latest code` : '')
    + (VERSION.dirty ? ` · uncommitted local edits — these files are not ${shownVersion} as committed` : '')
    + ' — click to get the latest code and reload'
    + (config.reload ? ' · right-click to only clear the cache and reload' : '');

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
  // John, 2026-10-02: "make pressing this button first get the latest code
  // before reloading." On port 3000 the local server fetches main
  // (POST api/update-to-latest; fast-forward only, never touches local edits).
  // On the live site there is no such endpoint -- the site already IS main --
  // so the request just fails and the page reloads with the newest files.
  // Releases stays one click away in the menu.
  onClick = async (e) => {
    e.preventDefault();
    element.textContent = '⏳';
    const root = location.pathname.replace(/[^/]*$/, '');
    try {
      const res = await fetch(root + 'api/update-to-latest', { method: 'POST' });
      if (res.ok) {
        const { updated, message } = await res.json();
        if (message) console.info(`[version] ${message}`);
        // John, 2026-10-02: "I want ... the latest code to be shown. That means
        // I get new versions every time i click." A refused update used to
        // reload silently onto the same old code. Now it says why.
        if (!updated && message && message !== 'already the latest code' && message !== 'test server: not updating') {
          window.alert(`Could not get the latest code:\n\n${message}`);
        }
      }
    } catch { /* the live site has no endpoint: just reload */ }
    await clearCacheAndReload();
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

import { VERSION } from '../core/version.js';
import { versionNumber } from '../core/version-number.js';
import { removeServiceWorkers } from '../core/service-worker.js';

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
  await removeServiceWorkers('[x-release]');
  // A plain location.reload() bypasses Cache Storage/the service worker
  // (both cleared above) but not the browser's own HTTP disk cache --
  // force a genuinely new URL so nothing is served from cache.
  location.href = location.pathname + location.search
    + (location.search ? '&' : '?') + '_cb=' + Date.now()
    + location.hash;
}

// " in a.js, b.css (+3 more)" -- the files that make the copy "edited".
function editedList(stamp) {
  const files = Array.isArray(stamp.dirtyFiles) ? stamp.dirtyFiles : [];
  if (!files.length) return '';
  const more = Number(stamp.dirtyCount || files.length) - files.length;
  return ` in ${files.join(', ')}${more > 0 ? ` (+${more} more)` : ''}`;
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

  // "Commit", not "Build": nothing is built (John: "I thought we didn't do
  // builds?"). It is the git commit these files are, and when it was stamped.
  element.title = `Commit ${VERSION.commit} · ${formatBuiltAtCentral(VERSION.builtAt)}`
    + (ahead ? ` · ${ahead} push${ahead === 1 ? '' : 'es'} to main since v${releaseName}` : '')
    + (VERSION.branch ? ` · branch ${VERSION.branch}` : '')
    + (behind ? ` · ${behind} commits behind ${VERSION.upstream} — this is NOT the latest code` : '')
    + (VERSION.dirty ? ` · uncommitted local edits${editedList(VERSION)} — these files are not ${shownVersion} as committed` : '')
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
    // John, 2026-10-02: "i clicked the version button and in progress shows
    // this" -- the badge still read the old number and nothing said why. On
    // the user's own machine every way the update can NOT happen is now said
    // out loud: no endpoint on this server (a plain file server, another
    // copy), a test-mode server, a refused pull, a failed request. Only on the
    // live site, which already IS main, is a silent reload the right answer.
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    let why = '';
    try {
      const res = await fetch(root + 'api/update-to-latest', { method: 'POST' });
      if (res.ok) {
        const { updated, message } = await res.json();
        if (message) console.info(`[version] ${message}`);
        if (!updated && message !== 'already the latest code') why = message || 'the server did not say why';
      } else {
        why = `the server on port ${location.port || '80'} has no update endpoint (HTTP ${res.status}). `
          + 'It is not wb-starter\'s own server (npm start) -- stop it and run npm start in your wb-starter folder';
      }
    } catch (err) {
      why = `the request to the server failed (${err && err.message ? err.message : 'no answer'})`;
    }
    if (local && why) {
      window.alert(`Could not get the latest code:\n\n${why}\n\nThis page is served from: ${location.origin}`);
    }
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

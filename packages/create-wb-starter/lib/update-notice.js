/**
 * Tell the person running create-wb-starter when npm has a newer version.
 *
 * John, 2026-10-13: "add the update notice to create-wb-starter". npm never
 * tells anyone a new version is out, and `npx create-wb-starter` can run an
 * old cached copy.
 *
 * It never gets in the way: one request to the registry, started at launch
 * and given at most 1.5 s, and any failure (offline, proxy, bad JSON) is
 * silent. Off in CI and when NO_UPDATE_NOTIFIER is set.
 */
const REGISTRY = 'https://registry.npmjs.org/create-wb-starter/latest';

/** True when `latest` is a higher X.Y.Z than `current`. Pre-release tags are ignored. */
export function isNewer(latest, current) {
  const parse = (v) => String(v).split('-')[0].split('.').map(Number);
  const [a, b] = [parse(latest), parse(current)];
  if (a.length !== 3 || b.length !== 3 || [...a, ...b].some(Number.isNaN)) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

/** The notice to print, or '' when there is nothing newer. */
export function updateMessage(latest, current) {
  if (!isNewer(latest, current)) return '';
  return `\nA newer create-wb-starter is out: ${current} -> ${latest}\n`
    + '  Next time run:  npm create wb-starter@latest <project-directory>\n';
}

/**
 * Start the check now; await the result later.
 * @param {string} current - this package's version
 * @param {{ env?: object, fetchFn?: Function, timeoutMs?: number }} [options]
 * @returns {Promise<string>} the notice, or ''
 */
export async function checkForUpdate(current, { env = process.env, fetchFn = globalThis.fetch, timeoutMs = 1500 } = {}) {
  if (env.CI || env.NO_UPDATE_NOTIFIER || typeof fetchFn !== 'function') return '';
  try {
    const res = await fetchFn(REGISTRY, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return '';
    const { version } = await res.json();
    return updateMessage(version, current);
  } catch {
    return '';
  }
}

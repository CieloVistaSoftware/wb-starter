/**
 * Tell the person running this scaffolder when npm has a newer version of it.
 *
 * John, 2026-10-13: "add the update notice". npm never tells anyone a new
 * version is out, and npx can run an old cached copy.
 *
 * It never gets in the way: one request to the registry, started at launch
 * and given at most 1.5 s, and any failure (offline, proxy, bad JSON) is
 * silent. Off in CI and when NO_UPDATE_NOTIFIER is set.
 */
const REGISTRY = 'https://registry.npmjs.org';

/** True when `latest` is a higher X.Y.Z than `current`. Pre-release tags are ignored. */
export function isNewer(latest, current) {
  const parse = (v) => String(v).split('-')[0].split('.').map(Number);
  const [a, b] = [parse(latest), parse(current)];
  if (a.length !== 3 || b.length !== 3 || [...a, ...b].some(Number.isNaN)) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

/**
 * The notice to print, or '' when there is nothing newer.
 * @param {string} name - the package name, e.g. "create-x" (run as `npm create x@latest`)
 */
export function updateMessage(name, latest, current) {
  if (!isNewer(latest, current)) return '';
  const createName = name.replace(/^create-/, '');
  return `\nA newer ${name} is out: ${current} -> ${latest}\n`
    + `  Next time run:  npm create ${createName}@latest <project-directory>\n`;
}

/**
 * Start the check now; await the result later.
 * @param {{ name: string, version: string }} pkg - this package's name and version
 * @param {{ env?: object, fetchFn?: Function, timeoutMs?: number }} [options]
 * @returns {Promise<string>} the notice, or ''
 */
export async function checkForUpdate({ name, version: current }, { env = process.env, fetchFn = globalThis.fetch, timeoutMs = 1500 } = {}) {
  if (env.CI || env.NO_UPDATE_NOTIFIER || typeof fetchFn !== 'function') return '';
  const { AbortSignal } = globalThis;
  try {
    const res = await fetchFn(`${REGISTRY}/${name}/latest`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return '';
    const { version } = await res.json();
    return updateMessage(name, version, current);
  } catch {
    return '';
  }
}

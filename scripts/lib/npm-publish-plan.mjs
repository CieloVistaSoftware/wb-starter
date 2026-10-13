/**
 * npm-publish-plan.mjs -- what publish-npm.yml does for one package (#1860)
 *
 * John, 2026-10-13: npm should have what the live site serves. The site serves
 * main and its badge counts every push, so after every push the badge's number
 * is published. Pure: given the number main is at and what npm already has,
 * say what to do. The workflow (scripts/publish-npm.mjs) acts on it.
 */
import { compareVersions } from '../../src/core/version-number.js';

/**
 * @param {string} wanted     the badge's number for main, e.g. "1.0.511"
 * @param {string[]} onNpm    every version npm has for the package
 * @returns {{ action: 'publish' | 'skip', why: string }}
 */
export function publishPlan(wanted, onNpm) {
  if (!/^\d+\.\d+\.\d+$/.test(String(wanted))) {
    throw new Error(`"${wanted}" is not a version number`);
  }
  if (onNpm.includes(wanted)) return { action: 'skip', why: `${wanted} is already on npm` };
  // Runs can finish out of order. Publishing an older number after a newer one
  // would move npm's "latest" backwards, so a newer one always wins.
  const newer = onNpm.filter((v) => compareVersions(v, wanted) > 0).sort(compareVersions).pop();
  if (newer) return { action: 'skip', why: `npm already has ${newer}, newer than ${wanted}` };
  return { action: 'publish', why: `${wanted} is not on npm yet` };
}

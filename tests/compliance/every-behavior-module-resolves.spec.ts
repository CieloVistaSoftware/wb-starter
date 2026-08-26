import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every behavior must map to a module file that exists on disk.
 *
 * `behaviorModules` in src/wb-viewmodels/index.js maps a behavior name to a
 * module basename, and loadModule() turns that into `./${moduleName}.js`.
 * Two entries carried literal square brackets:
 *
 *     control:  '[x-control]',
 *     repeater: '[x-repeater]',
 *
 * so the runtime asked for `./[x-control].js`, a path that cannot exist. Both
 * behaviors failed every single load. Nothing surfaced it: the failure is a
 * rejected dynamic import inside a cooldown that re-arms forever, so each
 * retry was a fresh 404 rather than one loud error (#882).
 *
 * A static check is the right shape here. Proving it in a browser needs the
 * behavior to be reached on some page first, which is exactly the coverage
 * these two never had.
 */

const INDEX = 'src/wb-viewmodels/index.js';
const VM_DIR = 'src/wb-viewmodels';

function behaviorModules(): Array<[string, string]> {
  const src = readFileSync(INDEX, 'utf8');
  const block = /const behaviorModules = \{([\s\S]*?)\n\};/.exec(src);
  if (!block) throw new Error('behaviorModules block not found in ' + INDEX);
  const body = block[1].replace(/\/\/.*$/gm, '');
  return [...body.matchAll(/(['"]?[A-Za-z0-9_-]+['"]?)\s*:\s*'([^']+)'/g)]
    .map((m) => [m[1].replace(/['"]/g, ''), m[2]] as [string, string]);
}

const MAPPINGS = behaviorModules();

test.describe('behavior module resolution', () => {
  test('the mapping was actually parsed', () => {
    // A regex that silently matches nothing would make every assertion below
    // vacuously true (#863).
    expect(MAPPINGS.length, 'no behavior->module mappings parsed').toBeGreaterThan(150);
  });

  test('every mapped module resolves to a real file', () => {
    const broken = MAPPINGS
      .filter(([, mod]) => !existsSync(join(VM_DIR, `${mod}.js`)))
      .map(([name, mod]) => `  ${name} -> ./${mod}.js  (no such file)`);

    expect(
      broken.length,
      `\n${broken.join('\n')}\n\nloadModule() imports \`./\${moduleName}.js\`. A name that does not ` +
      `resolve makes the behavior fail every load, silently: the rejected import sits behind a ` +
      `cooldown that re-arms, so it retries forever instead of failing once, loudly.`,
    ).toBe(0);
  });

  test('no module name contains characters that cannot appear in a path', () => {
    // The bracketed values parsed fine and read plausibly; only the resulting
    // URL was nonsense. Reject the shape too, not just the missing file.
    //
    // Nested segments are legitimate and common here -- `semantics/dialog`,
    // `semantics/inline` -- so slashes are allowed. Brackets, quotes,
    // whitespace and traversal are not.
    const SEGMENT = /^[a-z][a-z0-9-]*(\/[a-z][a-z0-9-]*)*$/i;
    const weird = MAPPINGS
      .filter(([, mod]) => !SEGMENT.test(mod))
      .map(([name, mod]) => `  ${name} -> '${mod}'`);
    expect(
      weird.length,
      `\n${weird.join('\n')}\n\nA module name becomes a URL path. Brackets, quotes, spaces and ` +
      `".." have no place in one.`,
    ).toBe(0);
  });
});

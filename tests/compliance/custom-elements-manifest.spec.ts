import { test, expect } from '@playwright/test';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ROOT } from '../base';

/**
 * COMPLIANCE GATE (#1057): the IntelliSense manifest generator must actually
 * generate something, and what it generates must match what is committed.
 *
 * `scripts/generate-custom-elements.js` was dead for a whole major version and
 * nothing said so. Its selector guard still read `startsWith('wb-')` after
 * 4.0.0 renamed all 54 mappings to `x-*`, so every mapping was skipped, the
 * loop produced nothing, and the script wrote a 76-byte manifest over a 55KB
 * one — while printing `✅ Generated 0 component definitions` and exiting 0.
 *
 * That is the failure mode this file exists to make impossible: SILENT
 * SUCCESS. An empty result was indistinguishable from a good one, because
 * nothing ever compared the output to anything.
 *
 * The second defect it guards is the one the empty output was hiding. Every
 * schema property was emitted with a hardcoded `data-` prefix, so the manifest
 * advertised ~180 attribute names that exist nowhere in the framework and VS
 * Code suggested them to anyone typing in a wb-starter page — the tooling built
 * to teach the current syntax was teaching the deprecated one (#224).
 *
 * These checks RUN the real generator rather than reading it, because a static
 * read of the source is exactly the kind of instrument that reports success
 * while measuring nothing (docs/standards/A-GATE-MUST-BE-SEEN-TO-FAIL.md).
 * WB_CEM_OUT redirects the write to a temp file so the gate can never repeat
 * the destruction it is guarding against.
 */

const GENERATOR = path.join(ROOT, 'scripts', 'generate-custom-elements.js');
const MANIFEST = path.join(ROOT, 'data', 'custom-elements.json');

/** Selectors declared in the generator's own mapping table. */
function declaredSelectors(source: string): string[] {
  const table = source.match(/const customElementMappings = \[([\s\S]*?)\n\];/);
  if (!table) throw new Error('customElementMappings table not found in generator source');
  return [...table[1].matchAll(/selector:\s*'([^']+)'/g)].map(m => m[1]);
}

function runGenerator(scriptPath: string, outPath: string) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: ROOT,
    encoding: 'utf-8',
    env: { ...process.env, WB_CEM_OUT: outPath },
  });
}

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wb-cem-'));
}

test.describe('Custom Elements Manifest (#1057)', () => {

  test('generator emits one definition per mapping — never zero', () => {
    const source = fs.readFileSync(GENERATOR, 'utf-8');
    const selectors = declaredSelectors(source);
    expect(selectors.length, 'generator declares no mappings at all').toBeGreaterThan(0);

    const dir = tempDir();
    const out = path.join(dir, 'custom-elements.json');
    const run = runGenerator(GENERATOR, out);

    expect(
      run.status,
      `generator exited ${run.status}\n${run.stdout || ''}\n${run.stderr || ''}`
    ).toBe(0);
    expect(fs.existsSync(out), 'generator produced no output file').toBe(true);

    const manifest = JSON.parse(fs.readFileSync(out, 'utf-8'));
    const tags: string[] = manifest.modules.map((m: any) => m.declarations[0].tagName);

    // The #1057 signature exactly: 54 mappings in, 0 definitions out.
    expect(
      tags.length,
      `generator resolved ${tags.length} definitions from ${selectors.length} mappings — ` +
      `a selector guard that no longer matches the mapping table produces an EMPTY manifest ` +
      `and still exits 0`
    ).toBe(selectors.length);

    expect([...tags].sort()).toEqual([...selectors].sort());

    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('generated attribute names are plain, not data-* (#224)', () => {
    const dir = tempDir();
    const out = path.join(dir, 'custom-elements.json');
    const run = runGenerator(GENERATOR, out);
    expect(run.status, run.stderr || '').toBe(0);

    const manifest = JSON.parse(fs.readFileSync(out, 'utf-8'));
    const attrs: string[] = manifest.modules.flatMap((m: any) =>
      (m.declarations[0].attributes || []).map((a: any) => a.name)
    );

    expect(attrs.length, 'no attributes emitted at all — schemas did not resolve').toBeGreaterThan(0);

    const legacy = [...new Set(attrs.filter(a => a.startsWith('data-')))];
    expect(
      legacy,
      `the manifest advertises ${legacy.length} data-* attribute names to IntelliSense. ` +
      `v3 attributes are plain (title, variant, size); a hardcoded data- prefix in ` +
      `schemaToAttributes() manufactures names that exist nowhere in the framework`
    ).toEqual([]);

    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('committed manifest is what the generator produces today', () => {
    expect(fs.existsSync(MANIFEST), 'data/custom-elements.json is missing').toBe(true);

    const committed = fs.readFileSync(MANIFEST, 'utf-8');
    const parsed = JSON.parse(committed);
    expect(
      parsed.modules.length,
      `data/custom-elements.json holds ${parsed.modules.length} definitions ` +
      `(${committed.length} bytes) — an empty manifest is a destroyed manifest`
    ).toBeGreaterThan(0);

    const dir = tempDir();
    const out = path.join(dir, 'custom-elements.json');
    const run = runGenerator(GENERATOR, out);
    expect(run.status, run.stderr || '').toBe(0);
    const fresh = fs.readFileSync(out, 'utf-8');

    expect(
      JSON.parse(fresh),
      'data/custom-elements.json is stale — regenerate with `npm run generate:custom-elements`'
    ).toEqual(parsed);

    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('resolving zero definitions is a failure, not a file to write', () => {
    // Fault injection, permanently wired in: rename every selector in a COPY of
    // the generator so the guard matches nothing. That reproduces the exact
    // #1057 state — a mapping table the guard no longer recognises. The floor
    // must turn it into a non-zero exit with nothing written; without the floor
    // this is the run that overwrites 55KB with 76 bytes.
    const source = fs.readFileSync(GENERATOR, 'utf-8');
    const rootLine = "const rootDir = path.resolve(__dirname, '..');";
    expect(source, 'generator no longer defines rootDir as expected').toContain(rootLine);

    const mutated = source
      .replace(rootLine, () => 'const rootDir = ' + JSON.stringify(ROOT) + ';')
      .replace(/selector: '[a-z]+-/g, "selector: 'zz-");

    const dir = tempDir();
    const script = path.join(dir, 'generate-custom-elements.mutated.mjs');
    fs.writeFileSync(script, mutated);

    const out = path.join(dir, 'custom-elements.json');
    const run = runGenerator(script, out);

    expect(
      run.status,
      `generator resolved 0 definitions and exited ${run.status}. Zero definitions ` +
      `must be a failure — exit 0 here is the silent success that destroyed the manifest.\n` +
      (run.stdout || '')
    ).not.toBe(0);

    expect(
      fs.existsSync(out),
      'generator wrote an empty manifest instead of refusing'
    ).toBe(false);

    fs.rmSync(dir, { recursive: true, force: true });
  });
});

/**
 * EVERY SCHEMA FILE IS READABLE
 * =============================
 * #1103. `src/wb-models/article.schema.json` was 0 bytes at HEAD — 216 lines
 * and 9 properties gone — and it was committed. Pre-commit passed it, the
 * spec-collection check passed it, the compliance project passed it, CI passed
 * it. It surfaced only because an unrelated measurement `JSON.parse`d the
 * directory and threw.
 *
 * WHY THIS GATE DID NOT ALREADY EXIST
 * -----------------------------------
 * It half did. `scripts/validate-schemas.mjs` catches a parse failure by name
 * and has since it was written — it is wired into nothing. No npm script, no
 * husky hook, no Playwright project. It writes `data/schema-validation.json`
 * and exits 0. The #1098 shape exactly: the check exists, the report is
 * generated, nobody reads it.
 *
 * SCOPE IS DELIBERATELY ONE GUARANTEE
 * -----------------------------------
 * A schema file is readable and says something. Not `$view`, not `$methods`,
 * not `schemaFor` — `validate-schemas.mjs` reports ~300 of those and that
 * backlog is the reason it was never wired in. A gate that lands red goes
 * straight into `data/test-baseline-failures.json` and stops being read, which
 * is #743's lesson. This one is green today and its failure means a file was
 * destroyed.
 *
 * Failures name the files. A count is not actionable; a list is.
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MODELS = path.join(ROOT, 'src', 'wb-models');

function schemaFiles(): string[] {
  return fs.readdirSync(MODELS).filter((f) => f.endsWith('.schema.json')).sort();
}

test.describe('src/wb-models schemas', () => {
  test('the directory holds schemas at all', () => {
    // Guards the gate itself: an empty listing would make every assertion below
    // vacuously true, which is #1091's disease — a test that passes by not
    // running. 156 today; the floor only has to prove the directory resolved.
    expect(schemaFiles().length).toBeGreaterThan(100);
  });

  test('every schema file parses as JSON', () => {
    const broken: string[] = [];

    for (const file of schemaFiles()) {
      const raw = fs.readFileSync(path.join(MODELS, file), 'utf8');
      if (!raw.trim()) { broken.push(`${file} — EMPTY (0 bytes of content)`); continue; }
      try {
        JSON.parse(raw);
      } catch (e) {
        broken.push(`${file} — ${(e as Error).message}`);
      }
    }

    expect(broken, `Unreadable schema files:\n  ${broken.join('\n  ')}`).toEqual([]);
  });

  test('every schema still identifies itself', () => {
    // A file that parses but holds `{}` is the same loss with valid syntax.
    // The bar is identity, not completeness: 32 schemas legitimately declare no
    // `properties` (the animation behaviors — bounce, pulse, shake — take none),
    // so requiring properties would land this gate red on correct files.
    const hollow: string[] = [];

    for (const file of schemaFiles()) {
      const raw = fs.readFileSync(path.join(MODELS, file), 'utf8');
      if (!raw.trim()) { continue; }   // reported by the parse test, not twice here

      let schema: Record<string, unknown>;
      try { schema = JSON.parse(raw); } catch { continue; }

      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        hollow.push(`${file} — not a JSON object`);
        continue;
      }
      if (Object.keys(schema).length === 0) { hollow.push(`${file} — {}, an empty object`); continue; }
      if (!schema.$id && !schema.title && !schema.schemaFor && !schema.behavior) {
        hollow.push(`${file} — names nothing: no $id, title, schemaFor or behavior`);
      }
    }

    expect(hollow, `Schemas that identify nothing:\n  ${hollow.join('\n  ')}`).toEqual([]);
  });
});

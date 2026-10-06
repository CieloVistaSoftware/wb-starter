/**
 * A schema names a <div> or <span> host only with a reason (#918).
 *
 * semanticElement is what IntelliSense tells an author to type
 * (scripts/update-intellisense.js). It taught `<div x-checkbox>` for 41 of 73
 * behaviors, Law 0 inverted at the moment the author is typing: HTML already
 * has <input type="checkbox">, <select>, <textarea>.
 *
 * So a generic host must be argued. A schema whose semanticElement is div or
 * span carries `genericHost`: why HTML has no better element. A decorator that
 * applies to any element declares no semanticElement at all, and the hint is
 * omitted rather than invented.
 */
import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const MODELS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/wb-models');

test('every div/span semanticElement says why HTML has no better host', () => {
  const files = fs.readdirSync(MODELS).filter((f) => f.endsWith('.schema.json'));
  expect(files.length, 'read the schemas').toBeGreaterThan(100);
  const unargued: string[] = [];
  for (const f of files) {
    const el = JSON.parse(fs.readFileSync(path.join(MODELS, f), 'utf8')).semanticElement;
    const tag = String(el?.tagName || '').toLowerCase();
    if ((tag === 'div' || tag === 'span') && !(typeof el.genericHost === 'string' && el.genericHost.trim().length > 10)) {
      unargued.push(`${f}: semanticElement.tagName "${tag}" with no genericHost reason`);
    }
  }
  expect(
    unargued,
    'Name the HTML element the behavior is meant for, drop semanticElement for a decorator that fits any '
      + 'element, or say in genericHost why no element fits:\n  ' + unargued.join('\n  '),
  ).toEqual([]);
});

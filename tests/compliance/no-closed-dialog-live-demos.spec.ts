import { test, expect } from '../fixtures/offline';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

/**
 * A doc never shows a live demo of a closed <dialog> (#1904).
 *
 * An ```html fence that reaches a behavior is rendered live (Standard §1a). A
 * <dialog> with no `open` renders nothing, so the reader got an empty box above
 * the code -- 8 of them across dialog.md and auto-injection.md (found by the
 * 2026-10-16 audit of every .md doc), against §1 "every example visibly
 * renders". Markup that only shows what to write is an illustration:
 * ```html-static. A live dialog demo opens it (`open`) or ships its trigger.
 */
const ROOT = process.cwd();
const FENCE = '`'.repeat(3);

test('no ```html fence is just a closed <dialog>', () => {
  const docs = execFileSync('git', ['ls-files', '*.md'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter((f) => f && !f.startsWith('archive/') && !f.includes('node_modules'));
  const rx = new RegExp(FENCE + 'html\\r?\\n([\\s\\S]*?)' + FENCE, 'g');
  const found: string[] = [];
  for (const f of docs) {
    const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of s.matchAll(rx)) {
      // Comments are annotation (<dialog showClose>  <!-- on -->), not content.
      const body = m[1].replace(/<!--[\s\S]*?-->/g, '').trim();
      const first = body.split(/\r?\n/)[0] || '';
      // The example is dialogs only -- it starts with one and nothing a reader
      // could click follows the last </dialog> (an attribute list of opening
      // tags has no closing one at all) -- and none of them is open.
      const lastClose = body.toLowerCase().lastIndexOf('</dialog>');
      const after = lastClose === -1 ? '' : body.slice(lastClose + '</dialog>'.length).trim();
      const onlyDialogs = /^<dialog\b/i.test(first) && after === '';
      if (onlyDialogs && !/<dialog\b[^>]*\bopen\b/i.test(body)) {
        found.push(f + ':' + (s.slice(0, m.index).split('\n').length) + '  ' + first.slice(0, 70));
      }
    }
  }
  expect(found, 'fence these ' + FENCE + 'html-static (an illustration), or add open / a trigger so the demo shows something').toEqual([]);
});

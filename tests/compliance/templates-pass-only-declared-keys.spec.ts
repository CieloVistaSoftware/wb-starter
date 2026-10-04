import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * #1142: data/templates.json gave two cardhero templates their picture as
 * `image`, a key cardhero never reads (it reads `background`), so the picture
 * was declared and silently dropped. The same mistake sat in five behaviors:
 * navbar cta/ctaHref, cardhero height, container background, form padding,
 * cardtestimonial featured.
 *
 * Every key a template passes to a behavior must be a property that
 * behavior's schema declares. HTML global attributes (id, class, title, role)
 * are always allowed.
 *
 * KNOWN is the nested debt filed as #1447 (the file has had no reader since
 * the Builder went; delete or revive it). It may only shrink: an entry that is
 * no longer a mismatch fails here too, so the list cannot go stale.
 */
const GLOBAL_ATTRIBUTES = new Set(['id', 'class', 'title', 'role']);

const KNOWN = new Set([
  'card.content', 'card.icon', 'card.align',
  'cardhorizontal.content', 'cardhorizontal.icon',
  'cardpricing.badge', 'cardimage.footer',
  'input.type', 'button.text', 'details.content',
  'list (no schema)',
]);

interface Component { b?: string; d?: Record<string, unknown>; children?: Component[] }

function mismatches(): Map<string, string[]> {
  const root = process.cwd();
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'templates.json'), 'utf8'));
  const found = new Map<string, string[]>();
  const add = (key: string, where: string) => found.set(key, [...(found.get(key) ?? []), where]);
  const schemaProps = new Map<string, Set<string> | null>();
  const propsOf = (b: string): Set<string> | null => {
    if (!schemaProps.has(b)) {
      const file = path.join(root, 'src', 'wb-models', `${b}.schema.json`);
      schemaProps.set(b, fs.existsSync(file)
        ? new Set(Object.keys(JSON.parse(fs.readFileSync(file, 'utf8')).properties ?? {}))
        : null);
    }
    return schemaProps.get(b)!;
  };
  const walk = (list: Component[] | undefined, id: string) => {
    for (const c of list ?? []) {
      if (c.b) {
        const props = propsOf(c.b);
        if (!props) add(`${c.b} (no schema)`, id);
        else for (const k of Object.keys(c.d ?? {})) {
          if (!props.has(k) && !GLOBAL_ATTRIBUTES.has(k)) add(`${c.b}.${k}`, id);
        }
      }
      walk(c.children, id);
    }
  };
  for (const t of data.templates) walk(t.components, t.id);
  return found;
}

test('every key a template passes is one its behavior declares (#1142)', () => {
  const found = mismatches();
  const unexpected = [...found].filter(([k]) => !KNOWN.has(k)).map(([k, ids]) => `${k} in ${[...new Set(ids)].join(', ')}`);
  expect(unexpected, 'template keys no behavior reads').toEqual([]);
});

test('the known #1447 debt only shrinks (#1142)', () => {
  const found = mismatches();
  const gone = [...KNOWN].filter((k) => !found.has(k));
  expect(gone, 'no longer mismatched -- remove from KNOWN').toEqual([]);
});

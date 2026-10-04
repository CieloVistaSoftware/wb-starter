import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * #1467: the Behaviors page taught markup that does not work. Its
 * x-drawer-layout examples said position="start"/"end" where the behavior
 * knows only left/right/top/bottom -- the collapse toggle got an unstyled
 * x-drawer-toggle--start class and sat on top of the first link, its arrow was
 * blank, resizing did nothing. Hero "centered", span "muted" and notes "end"
 * were the same mistake.
 *
 * Every attribute an example puts on the element carrying x-<behavior>, whose
 * schema property is an enum, must use a value that enum declares. Only that
 * element is read: a host's own attributes (<button variant="primary" x-toast>
 * is the BUTTON's variant) are not the behavior's options.
 */
const camel = (s: string) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

test('catalogue examples pass only values their behavior declares (#1467)', () => {
  const root = process.cwd();
  const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'data', 'behavior-examples.json'), 'utf8')).examples;
  const modelsDir = path.join(root, 'src', 'wb-models');
  const schemaFor = (token: string) => {
    const name = token.replace(/^x-/, '');
    for (const candidate of [name, camel(name)]) {
      const f = path.join(modelsDir, `${candidate}.schema.json`);
      if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
    }
    return null;
  };

  let checked = 0;
  const bad: string[] = [];
  for (const [token, entry] of Object.entries<any>(catalogue)) {
    const schema = schemaFor(token);
    if (!schema?.properties) continue;
    const sources = [entry.source, ...(entry.examples || []).map((x: any) => x.source)].filter(Boolean);
    // The opening tag that carries this behavior's own x- attribute.
    const hostTag = new RegExp(`<[a-zA-Z][\\w-]*\\b[^>]*\\s${token}(?=[\\s=>/])[^>]*>`);
    for (const src of sources) {
      const tag = hostTag.exec(src)?.[0];
      if (!tag) continue;
      // Every behavior on this element may own an attribute: its x-* tokens,
      // and the tag's native behavior (a <button> IS the button behavior). A
      // value is valid if any of them declares it -- <button variant="primary"
      // x-toast toast-variant="success"> is the button's variant, and the
      // toast reads toast-variant first for exactly that reason.
      const tagName = /^<([a-zA-Z][\w-]*)/.exec(tag)![1].toLowerCase();
      const owners = [schema, schemaFor(tagName),
        ...[...tag.matchAll(/\s(x-[\w-]+)(?=[\s=>/])/g)].map((m) => m[1] === token ? null : schemaFor(m[1]))]
        .filter((s) => s?.properties);
      for (const [, attr, value] of tag.matchAll(/\s([\w-]+)="([^"]*)"/g)) {
        const prop = schema.properties[attr] ?? schema.properties[camel(attr)];
        if (!prop || !Array.isArray(prop.enum)) continue;
        checked++;
        const declaredSomewhere = owners.some((s) => {
          const p = s.properties[attr] ?? s.properties[camel(attr)];
          return p && (!Array.isArray(p.enum) || p.enum.map(String).includes(value));
        });
        if (!declaredSomewhere) {
          bad.push(`${token} ${attr}="${value}" -- declared: ${prop.enum.join(', ')}`);
        }
      }
    }
  }
  expect(checked, 'the scan found enum attributes in the catalogue').toBeGreaterThan(20);
  expect([...new Set(bad)], 'examples teach values the behavior does not have').toEqual([]);
});

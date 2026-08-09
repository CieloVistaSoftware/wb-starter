import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const site = JSON.parse(readFileSync('src/wb-models/pages/wb-component-library.site.json', 'utf-8'));
const allComponents = site.pages.flatMap(p => p.components || []);
const dir = resolve('src/wb-models');

const results = [];
for (const name of allComponents) {
  const candidates = [join(dir, `${name}.schema.json`), join(dir, `${name.replace(/-/g, '')}.schema.json`)];
  let found = false;
  for (const c of candidates) {
    try {
      const s = JSON.parse(readFileSync(c, 'utf-8'));
      const hasMatrix = !!(s.test?.matrix?.combinations?.length);
      const matrixCount = s.test?.matrix?.combinations?.length || 0;
      const propCount = Object.keys(s.properties || {}).length;
      results.push({ name, hasMatrix, matrixCount, propCount, file: c.split(/[\\/]/).pop() });
      found = true;
      break;
    } catch {}
  }
  if (!found) results.push({ name, hasMatrix: false, matrixCount: 0, propCount: 0, file: 'NOT FOUND' });
}

const missing = results.filter(r => !r.hasMatrix);
const has = results.filter(r => r.hasMatrix);
const output = {
  total: results.length,
  withMatrix: has.length,
  withoutMatrix: missing.length,
  missing: missing.map(m => m.name),
  details: results
};
writeFileSync(resolve('data/matrix-audit.json'), JSON.stringify(output, null, 2));

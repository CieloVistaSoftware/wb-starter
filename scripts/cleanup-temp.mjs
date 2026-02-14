import { unlinkSync } from 'fs';
const toDelete = [
  'scripts/show-failures.cjs',
  'scripts/show-failures.mjs'
];
for (const f of toDelete) {
  try { unlinkSync(f); console.log('Deleted:', f); } catch(e) { console.log('Not found:', f); }
}

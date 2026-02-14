import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SKIP_FILES = [
  'strict-mode-runtime.spec.ts', 'v3-syntax-compliance.spec.ts',
  'legacy-pill.spec.ts', 'project-integrity.spec.ts',
  'schema-validation.spec.ts', 'verify_optout.spec.ts',
  'test-coverage-compliance.spec.ts', 'find-pill.spec.ts',
];

function walk(dir, cb) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, cb);
    else cb(p);
  }
}

const hits = [];
walk('tests', (f) => {
  if (!f.endsWith('.ts')) return;
  const filename = f.split(/[/\\]/).pop();
  if (SKIP_FILES.includes(filename)) return;
  
  const content = readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('data-wb') && !line.trimStart().startsWith('//') && !line.trimStart().startsWith('*')) {
      hits.push(`${relative('tests', f)}:${i + 1}: ${line.trim().substring(0, 140)}`);
    }
  });
});

console.log(`Remaining data-wb references (excluding skipped files): ${hits.length}\n`);
for (const h of hits) console.log(h);

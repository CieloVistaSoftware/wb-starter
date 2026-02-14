/**
 * full-data-wb-audit.mjs
 * Scans ENTIRE project for all data-wb references.
 * Categorizes by directory and type for migration planning.
 * Excludes: node_modules, .git, dist, build, coverage
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative, extname } from 'path';

const EXCLUDE = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'test-results', '.playwright-artifacts']);

function walk(dir, cb) {
  for (const f of readdirSync(dir)) {
    if (EXCLUDE.has(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, cb);
    else cb(p);
  }
}

const VALID_EXTS = new Set(['.js', '.ts', '.html', '.css', '.json', '.md', '.mjs']);

const hits = [];
walk('.', (filePath) => {
  const ext = extname(filePath).toLowerCase();
  if (!VALID_EXTS.has(ext)) return;
  
  const rel = relative('.', filePath).replace(/\\/g, '/');
  
  // Skip performance tests
  if (rel.includes('performance') || rel.includes('perf')) return;
  
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, i) => {
    // Match data-wb (exact), data-wb-*, data-wb="*", dataset.wb*
    if (line.includes('data-wb') || line.match(/dataset\.wb[A-Z]/)) {
      const trimmed = line.trim();
      
      // Determine area
      let area = 'other';
      if (rel.startsWith('src/core/')) area = 'core-runtime';
      else if (rel.startsWith('src/wb-viewmodels/builder')) area = 'builder';
      else if (rel.startsWith('src/wb-viewmodels/')) area = 'viewmodels';
      else if (rel.startsWith('src/')) area = 'src-other';
      else if (rel.startsWith('tests/compliance')) area = 'tests-compliance';
      else if (rel.startsWith('tests/builder')) area = 'tests-builder';
      else if (rel.startsWith('tests/debug')) area = 'tests-debug';
      else if (rel.startsWith('tests/')) area = 'tests-other';
      else if (rel.startsWith('demos/') || rel.startsWith('pages/') || rel.startsWith('public/')) area = 'html-pages';
      else if (rel.startsWith('docs/')) area = 'docs';
      else if (rel.startsWith('data/')) area = 'data-files';
      else if (rel.startsWith('scripts/')) area = 'scripts';
      
      // Determine pattern type
      let pattern = 'unknown';
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('#')) {
        pattern = 'comment';
      } else if (trimmed.includes('dataset.wb')) {
        pattern = 'dataset-marker';
      } else if (trimmed.match(/data-wb[='"]/)) {
        pattern = 'html-attribute';
      } else if (trimmed.includes("'data-wb") || trimmed.includes('"data-wb')) {
        pattern = 'string-reference';
      } else if (trimmed.includes('[data-wb')) {
        pattern = 'css-or-selector';
      } else if (trimmed.includes('data-wb-error')) {
        pattern = 'error-marker';
      } else if (trimmed.includes('data-wb-')) {
        pattern = 'data-wb-prefixed';
      } else if (trimmed.includes('data-wb')) {
        pattern = 'generic-data-wb';
      }
      
      hits.push({
        file: rel,
        line: i + 1,
        area,
        pattern,
        ext,
        text: trimmed.substring(0, 180)
      });
    }
  });
});

// Build summary
const byArea = {};
const byPattern = {};
const byFile = {};

for (const h of hits) {
  byArea[h.area] = (byArea[h.area] || 0) + 1;
  byPattern[h.pattern] = (byPattern[h.pattern] || 0) + 1;
  byFile[h.file] = (byFile[h.file] || 0) + 1;
}

// Sort files by hit count
const topFiles = Object.entries(byFile)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30)
  .map(([f, c]) => ({ file: f, count: c }));

const report = {
  generated: new Date().toISOString(),
  total: hits.length,
  excludes: ['performance tests', 'node_modules', '.git'],
  byArea,
  byPattern,
  topFiles,
  hits
};

writeFileSync('data/full-data-wb-audit.json', JSON.stringify(report, null, 2));

console.log(`\nFull audit: ${hits.length} total hits\n`);
console.log('By Area:');
for (const [k, v] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log('\nBy Pattern:');
for (const [k, v] of Object.entries(byPattern).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log('\nTop 15 Files:');
topFiles.slice(0, 15).forEach(f => console.log(`  ${f.count}x  ${f.file}`));
console.log('\nFull report: data/full-data-wb-audit.json');

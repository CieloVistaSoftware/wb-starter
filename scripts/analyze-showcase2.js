import fs from 'fs';

const html = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');

// Check for missing behaviors that tests expect
const missing = ['x-masonry', 'x-dropdown', 'x-toggle', 'x-drawer-layout', 'x-sticky'];
console.log('=== Missing from showcase page ===');
missing.forEach(m => {
  const re = new RegExp(m, 'gi');
  const count = (html.match(re) || []).length;
  console.log(`${m}: ${count} instances`);
});

// Check what the definitive test expects section by section
console.log('\n=== Definitive test expectations ===');
const def = fs.readFileSync('tests/behaviors/behaviors-showcase-definitive.spec.ts', 'utf8');

// Find all test names
const tests = [...def.matchAll(/test\(['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
console.log(`Total tests: ${tests.length}`);
tests.forEach(t => console.log('  - ' + t));

// Check what showcase.spec.ts expects
console.log('\n=== showcase.spec.ts expectations ===');
const show = fs.readFileSync('tests/behaviors/behaviors-showcase.spec.ts', 'utf8');
const showTests = [...show.matchAll(/test\(['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
console.log(`Total tests: ${showTests.length}`);
showTests.forEach(t => console.log('  - ' + t));

// Check what demo page the showcase.spec uses
const showGotos = [...show.matchAll(/goto\(['"`]([^'"`]+)['"`]\)/g)];
console.log('\nshowcase.spec goto:', showGotos.map(m => m[1]).join(', '));

// Check behaviors.html exists and what it has
console.log('\n=== behaviors.html check ===');
try {
  const bhtml = fs.readFileSync('demos/behaviors.html', 'utf8');
  console.log('behaviors.html exists, length:', bhtml.length);
  const bhMissing = ['x-masonry', 'x-dropdown', 'x-toggle', 'x-drawer-layout', 'x-tabs', 'wb-tabs'];
  bhMissing.forEach(m => {
    const re = new RegExp(m, 'gi');
    const count = (bhtml.match(re) || []).length;
    console.log(`  ${m}: ${count}`);
  });
} catch (e) {
  console.log('behaviors.html does NOT exist');
}

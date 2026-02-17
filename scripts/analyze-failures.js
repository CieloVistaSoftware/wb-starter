import fs from 'fs';

// Check index.html for nav elements
const html = fs.readFileSync('index.html', 'utf8');
const navs = [...html.matchAll(/<nav[^>]*>/gi)];
console.log('=== index.html nav elements ===');
navs.forEach(n => console.log(n[0]));

// Check for siteBody
if (html.includes('siteBody')) console.log('Has #siteBody');
if (html.includes('siteNav')) console.log('Has #siteNav');

// Check home.html
console.log('\n=== home.html ===');
try {
  const home = fs.readFileSync('pages/home.html', 'utf8');
  const homeNavs = [...home.matchAll(/<nav[^>]*>/gi)];
  homeNavs.forEach(n => console.log(n[0]));
  if (home.includes('scrollalong')) console.log('Has scrollalong');
} catch (e) { console.log('No home.html'); }

// Check all pages for scrollalong usage
console.log('\n=== scrollalong usage in pages ===');
const pages = fs.readdirSync('pages');
pages.forEach(p => {
  try {
    const c = fs.readFileSync('pages/' + p, 'utf8');
    if (c.includes('scrollalong')) console.log(p + ': uses scrollalong');
  } catch (e) {}
});

// Check demos
console.log('\n=== scrollalong usage in demos ===');
try {
  const demos = fs.readdirSync('demos');
  demos.forEach(d => {
    try {
      const c = fs.readFileSync('demos/' + d, 'utf8');
      if (c.includes('scrollalong')) console.log(d + ': uses scrollalong');
    } catch (e) {}
  });
} catch (e) {}

// Check what the sticky test page is
console.log('\n=== sticky.spec.ts test page ===');
const sticky = fs.readFileSync('tests/behaviors/sticky.spec.ts', 'utf8');
const gotoLines = [...sticky.matchAll(/goto\(['"`]([^'"`]+)['"`]\)/g)];
gotoLines.forEach(m => console.log('goto: ' + m[1]));

// Check autoinject tests
console.log('\n=== autoinject test pages ===');
const ai = fs.readFileSync('tests/behaviors/autoinject.spec.ts', 'utf8');
const aiGotos = [...ai.matchAll(/goto\(['"`]([^'"`]+)['"`]\)/g)];
aiGotos.forEach(m => console.log('goto: ' + m[1]));

// Check fixes-verification for builder references
console.log('\n=== fixes-verification builder references ===');
const fv = fs.readFileSync('tests/behaviors/fixes-verification.spec.ts', 'utf8');
const builderRefs = [...fv.matchAll(/[Bb]uilder/g)];
console.log('Builder mentions: ' + builderRefs.length);

// Card test failures - check what pages they use
console.log('\n=== card test pages ===');
const cardFiles = ['tests/cards/cards-comprehensive.spec.ts', 'tests/cards/card-styling.spec.ts', 'tests/cards/cardprogressbar.spec.ts'];
cardFiles.forEach(f => {
  try {
    const c = fs.readFileSync(f, 'utf8');
    const gotos = [...c.matchAll(/goto\(['"`]([^'"`]+)['"`]\)/g)];
    console.log(f.split('/').pop() + ': ' + gotos.map(m => m[1]).join(', '));
  } catch (e) { console.log(f + ': ' + e.code); }
});

// Home page permutation test
console.log('\n=== home-page-permutation test page ===');
const hp = fs.readFileSync('tests/behaviors/ui/home-page-permutation.spec.ts', 'utf8');
const hpGotos = [...hp.matchAll(/goto\(['"`]([^'"`]+)['"`]\)/g)];
hpGotos.forEach(m => console.log('goto: ' + m[1]));

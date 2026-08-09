import fs from 'fs';
let c = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');

// 1. Convert <button class="wb-btn wb-btn--VARIANT wb-btn--SIZE"> to <wb-button variant="VARIANT" size="SIZE">
c = c.replace(/<button class="wb-btn wb-btn--(\w+) wb-btn--(\w+)"/g, '<wb-button variant="$1" size="$2"');

// 2. Convert <button class="wb-btn wb-btn--VARIANT"> to <wb-button variant="VARIANT">
c = c.replace(/<button class="wb-btn wb-btn--(\w+)"/g, '<wb-button variant="$1"');

// 3. Convert </button> to </wb-button>
c = c.replace(/<\/button>/g, '</wb-button>');

// 4. Fix wb-modal and wb-drawer that had wb-btn classes
c = c.replace(/<wb-modal class="wb-btn wb-btn--\w+"/g, '<wb-modal');
c = c.replace(/<wb-drawer class="wb-btn wb-btn--\w+"/g, '<wb-drawer');

// 5. Remove ALL empty string attribute assignments: attr="" -> attr
c = c.replace(/ (\w[\w-]*)=""/g, ' $1');

// 6. Remove inline wb-btn CSS block if it exists
c = c.replace(/\s*\.wb-btn\s*\{[^}]*\}/g, '');
c = c.replace(/\s*\.wb-btn--\w+\s*\{[^}]*\}/g, '');
c = c.replace(/\s*\.wb-btn--\w+:hover:not\(:disabled\)\s*\{[^}]*\}/g, '');

fs.writeFileSync('demos/behaviors-showcase.html', c);

// Report
const result = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');
const btnCount = (result.match(/<button /g) || []).length;
const wbBtnRef = (result.match(/wb-btn/g) || []).length;
const emptyAssign = (result.match(/ \w[\w-]*=""/g) || []).length;
const wbButtonCount = (result.match(/<wb-button /g) || []).length;
const closeWbBtn = (result.match(/<\/wb-button>/g) || []).length;
console.log('Results:');
console.log('  <wb-button> tags: ' + wbButtonCount);
console.log('  </wb-button> closes: ' + closeWbBtn);
console.log('  Remaining <button>: ' + btnCount);
console.log('  Remaining wb-btn refs: ' + wbBtnRef);
console.log('  Remaining empty assigns: ' + emptyAssign);

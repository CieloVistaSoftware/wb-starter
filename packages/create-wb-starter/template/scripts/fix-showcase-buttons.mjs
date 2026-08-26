import fs from 'fs';
let c = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');

// 1. Convert <button class="x-btn x-btn--VARIANT x-btn--SIZE"> to <button variant="VARIANT" size="SIZE">
c = c.replace(/<button class="x-btn x-btn--(\w+) x-btn--(\w+)"/g, '<button variant="$1" size="$2"');

// 2. Convert <button class="x-btn x-btn--VARIANT"> to <button variant="VARIANT">
c = c.replace(/<button class="x-btn x-btn--(\w+)"/g, '<button variant="$1"');

// 3. Convert </button> to </button>
c = c.replace(/<\/button>/g, '</button>');

// 4. Fix x-modal and x-drawer that had x-btn classes
c = c.replace(/<dialog class="x-btn x-btn--\w+"/g, '<dialog');
c = c.replace(/<div x-drawer class="x-btn x-btn--\w+"/g, '<div x-drawer');

// 5. Remove ALL empty string attribute assignments: attr="" -> attr
c = c.replace(/ (\w[\w-]*)=""/g, ' $1');

// 6. Remove inline x-btn CSS block if it exists
c = c.replace(/\s*\.x-btn\s*\{[^}]*\}/g, '');
c = c.replace(/\s*\.x-btn--\w+\s*\{[^}]*\}/g, '');
c = c.replace(/\s*\.x-btn--\w+:hover:not\(:disabled\)\s*\{[^}]*\}/g, '');

fs.writeFileSync('demos/behaviors-showcase.html', c);

// Report
const result = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');
const btnCount = (result.match(/<button /g) || []).length;
const wbBtnRef = (result.match(/x-btn/g) || []).length;
const emptyAssign = (result.match(/ \w[\w-]*=""/g) || []).length;
const wbButtonCount = (result.match(/<button /g) || []).length;
const closeWbBtn = (result.match(/<\/x-button>/g) || []).length;
console.log('Results:');
console.log('  <button> tags: ' + wbButtonCount);
console.log('  </button> closes: ' + closeWbBtn);
console.log('  Remaining <button>: ' + btnCount);
console.log('  Remaining x-btn refs: ' + wbBtnRef);
console.log('  Remaining empty assigns: ' + emptyAssign);

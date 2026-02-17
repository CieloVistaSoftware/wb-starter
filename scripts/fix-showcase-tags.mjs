import fs from 'fs';
let c = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');

// Fix mismatched tags: <button ...>...</wb-button> → <wb-button ...>...</wb-button>
c = c.replace(/<button ([^>]*)>(.*?)<\/wb-button>/g, '<wb-button $1>$2</wb-button>');

// Also convert any remaining plain <button> with </button>
c = c.replace(/<button ([^>]*)>(.*?)<\/button>/g, '<wb-button $1>$2</wb-button>');

// Fix duplicate variant attributes on toast buttons: variant="primary" x-toast message="..." variant="success"
// The toast variant should be a separate attribute like toast-variant
// For now, remove the first variant when there's a second one (the toast variant should be on message context)
// Actually the x-toast reads variant for toast type. The button variant is for styling.
// Fix: rename the toast variant to toast-variant
// Simpler: just keep the last variant attribute (browser behavior) since these are toast trigger buttons
// No — let's not touch that now. Just fix the tag mismatches.

fs.writeFileSync('demos/behaviors-showcase.html', c);

const result = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');
const mismatched = (result.match(/<button [^>]*>.*?<\/wb-button>/g) || []).length;
const plainBtn = (result.match(/<button /g) || []).length;
const wbBtn = (result.match(/<wb-button /g) || []).length;
console.log('Mismatched tags remaining: ' + mismatched);
console.log('Remaining <button>: ' + plainBtn);
console.log('<wb-button> tags: ' + wbBtn);

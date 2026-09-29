import fs from 'fs';
let html = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');
const count = (html.match(/x-collapse label="/g) || []).length;
html = html.replace(/x-collapse label="/g, 'x-collapse heading="');
fs.writeFileSync('demos/behaviors-showcase.html', html);
console.log('Replaced ' + count + ' x-collapse label → heading');

// Also remove the x-accordion alias reference from the test
// The definitive test checks for x-accordion — update to x-collapse

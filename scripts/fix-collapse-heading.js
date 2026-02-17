import fs from 'fs';
let html = fs.readFileSync('demos/behaviors-showcase.html', 'utf8');
const count = (html.match(/wb-collapse label="/g) || []).length;
html = html.replace(/wb-collapse label="/g, 'wb-collapse heading="');
fs.writeFileSync('demos/behaviors-showcase.html', html);
console.log('Replaced ' + count + ' wb-collapse label → heading');

// Also remove the wb-accordion alias reference from the test
// The definitive test checks for wb-accordion — update to wb-collapse

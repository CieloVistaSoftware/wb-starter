/**
 * Fix wb-mdhtml code examples to use script tags
 * This prevents HTML from being parsed by the browser
 */
import fs from 'fs';

const filePath = 'demos/behaviors-showcase.html';
let content = fs.readFileSync(filePath, 'utf8');

// Only fix examples that don't already have script tags
// Pattern: <wb-mdhtml>\n``` (without script tag already)
const pattern1 = /<wb-mdhtml>\n```/g;
content = content.replace(pattern1, '<wb-mdhtml>\n        <script type="text/markdown">\n```');

// Pattern: ```\n      </wb-mdhtml> (without script closing tag already)
// But NOT if there's already a </script> before it
const pattern2 = /```\n      <\/wb-mdhtml>/g;
content = content.replace(pattern2, '```\n        </script>\n      </wb-mdhtml>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all wb-mdhtml code examples');

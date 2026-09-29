const fs = require('fs');
const d = JSON.parse(fs.readFileSync('data/schema-index.json', 'utf8'));
const b = d.schemas.find(s => s.name === 'button');
if (b) {
  console.log('ICON:', JSON.stringify(b.properties.icon, null, 2));
} else {
  console.log('No button schema. First 10:');
  d.schemas.slice(0,10).forEach(s => console.log(' ', s.name));
}

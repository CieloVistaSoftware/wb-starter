import { readFileSync } from 'fs';
const s = JSON.parse(readFileSync('src/wb-models/card.schema.json','utf-8'));
process.stdout.write(JSON.stringify(s.test.site, null, 2));

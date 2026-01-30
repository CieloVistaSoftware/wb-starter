import fs from 'fs';
import path from 'path';
const f = path.resolve('tests/issues/issue-note-1769220751805.spec.ts');
let c = fs.readFileSync(f,'utf8');

c = c.replace(/await page\.goto\('http:\/\/localhost:3000\/\?page=behaviors[\s\S]*?\'\);/, "await page.goto('http://localhost:3000/?page=behaviors');");

fs.writeFileSync(f,c,'utf8');
console.log('fixed', f);

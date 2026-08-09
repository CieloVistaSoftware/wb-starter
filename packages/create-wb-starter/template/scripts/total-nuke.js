/**
 * TOTAL NUKE - Delete ALL data-wb from everywhere
 */
import fs from 'fs';
import path from 'path';

const SKIP = ['node_modules', '.git', 'dist', 'coverage', 'data'];
let totalFixed = 0;

function nuke(dir) {
  fs.readdirSync(dir).forEach(item => {
    if (SKIP.includes(item)) return;
    const fp = path.join(dir, item);
    if (fs.statSync(fp).isDirectory()) {
      nuke(fp);
    } else if (/\.(html|js|css)$/i.test(item)) {
      let c = fs.readFileSync(fp, 'utf8');
      if (!c.includes('x-behavior')) return;
      const orig = c;
      
      // Kill all patterns
      c = c.replace(/\s*x-legacy=["'][^"']*["']/g, '');
      c = c.replace(/\[x-legacy=["'][^"']*["']\]/g, '[x-behavior]');
      c = c.replace(/\[data-wb\]/g, '');
      c = c.replace(/x-legacy=/g, 'x-legacy=');
      c = c.replace(/\.x-legacy/g, '.x-legacy');
      c = c.replace(/'x-behavior'/g, "'x-behavior'");
      c = c.replace(/"x-behavior"/g, '"x-behavior"');
      c = c.replace(/x-ignore/g, 'x-ignore');
      c = c.replace(/x-eager/g, 'x-eager');
      
      if (c !== orig) {
        fs.writeFileSync(fp, c);
        console.log('✅ ' + fp);
        totalFixed++;
      }
    }
  });
}

console.log('🔥 TOTAL NUKE - Removing ALL data-wb\n');
nuke('.');
console.log(`\n✅ Fixed ${totalFixed} files`);

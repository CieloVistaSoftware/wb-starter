import { promises as fs } from 'fs';
import path from 'path';

const DOCS_DIR = path.resolve('docs');
const dryRun = process.argv.includes('--dry-run');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.isFile() && p.endsWith('.md')) await processFile(p);
  }
}

async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  // Look for first occurrence of 'WB' and ensure it's expanded on first use
  let changed = false;

  // If a heading in the first 10 lines contains WB, update that line (existing heuristic)
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (/Web Behaviors/i.test(line)) { changed = false; break; } // already present

    if (/\bWB\b/.test(line) && /^\s*#/.test(line)) {
      lines[i] = line.replace(/\bWB\b/g, 'Web Behaviors (WB)');
      changed = true;
      break;
    }

    if (/WB Framework/i.test(line) && /^\s*#?/.test(line)) {
      lines[i] = line.replace(/WB Framework/ig, 'Web Behaviors (WB) Framework');
      changed = true;
      break;
    }
  }

  // If still not changed, replace the first occurrence of the token 'WB' anywhere in the file
  if (!changed) {
    const match = content.match(/\bWB\b/);
    if (match) {
      // Ensure we don't replace occurrences that are already part of the expanded form
      const before = content.slice(Math.max(0, match.index - 50), match.index + 50);
      if (!/Web Behaviors/i.test(before)) {
        const newContent = content.replace(/\bWB\b/, 'Web Behaviors (WB)');
        if (dryRun) {
          console.log(`[DRY] Would update (first WB in body): ${filePath}`);
        } else {
          await fs.writeFile(filePath, newContent, 'utf8');
          console.log(`Updated (first WB in body): ${filePath}`);
        }
        changed = true;
      }
    }
  }

  if (changed) {
    const out = lines.join('\n');
    if (dryRun) {
      console.log(`[DRY] Would update: ${filePath}`);
    } else {
      await fs.writeFile(filePath, out, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  }
}

(async function main(){
  try {
    await walk(DOCS_DIR);
    console.log('Done');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
#!/usr/bin/env node
/*
  scripts/lock-annotate.js
  - Add or update structured metadata in a Lock/*.md file.
  - Example:
      node scripts/lock-annotate.js --file LOCKED-foo.md --set "owner=@alice" "expires=2026-02-10" "status=active" --note "still needed for PR #123"
*/

import fs from 'fs/promises';
import path from 'path';

const argv = process.argv.slice(2);
const opts = { file: null, set: [], note: null };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if ((a === '--file' || a === '-f') && argv[i+1]) opts.file = argv[++i];
  else if (a === '--set' && argv[i+1]) {
    while (argv[i+1] && !argv[i+1].startsWith('--')) opts.set.push(argv[++i]);
  } else if (a === '--note' && argv[i+1]) opts.note = argv[++i];
  else if (a === '--help') { console.log('usage: lock-annotate --file LOCKED-foo.md --set key=value --note "..."'); process.exit(0); }
}
if (!opts.file) { console.error('Missing --file'); process.exit(2); }

const lockPath = path.join(process.cwd(), 'Lock', opts.file);
(async function main(){
  try {
    let txt = await fs.readFile(lockPath, 'utf8');
    const meta = {};
    // extract existing simple key: value lines at top
    const lines = txt.split(/\r?\n/);
    let insertAt = 0;
    for (let i = 0; i < Math.min(40, lines.length); i++) {
      const m = lines[i].match(/^([A-Za-z0-9_\-]+)\s*:\s*(.*)$/);
      if (m) { meta[m[1].toLowerCase()] = m[2]; insertAt = i+1; }
      else if (/^\s*$/.test(lines[i])) { insertAt = i+1; break; }
      else break;
    }
    for (const s of opts.set) {
      const [k,v] = s.split('='); if (!k) continue; meta[k.toLowerCase()] = v ?? '';
    }
    // rebuild header
    const header = [];
    if (meta) {
      for (const [k,v] of Object.entries(meta)) header.push(`${k}: ${v}`);
    }
    if (opts.note) header.push(`note: ${opts.note}`);
    // replace top block
    const rest = lines.slice(insertAt).join('\n').trimStart();
    const out = header.join('\n') + '\n\n' + rest + '\n';
    await fs.writeFile(lockPath, out, 'utf8');
    console.log('Updated', opts.file);
  } catch (err) {
    console.error('Failed to update', opts.file, err.message);
    process.exit(3);
  }
})();

/**
 * Strip data- prefix from all attributes on wb-* elements in HTML files.
 * data-title="x" → title="x"
 * data-elevated → elevated
 */
import fs from 'fs';
import path from 'path';

const skipDirs = ['node_modules', 'tmp', '.git', 'archive'];
let totalFixed = 0;
let filesFixed = 0;

function fixFile(fp) {
    const original = fs.readFileSync(fp, 'utf8');
    // Match wb-* opening tags and strip data- from their attributes
    const fixed = original.replace(/<wb-[a-z][-a-z]*[^>]*>/gi, (tag) => {
        const before = tag;
        // Replace data-attr-name with attr-name inside the tag
        const result = tag.replace(/\bdata-([a-z][a-z0-9-]*)/gi, '$1');
        if (result !== before) {
            const count = (before.match(/\bdata-[a-z]/gi) || []).length;
            totalFixed += count;
        }
        return result;
    });

    if (fixed !== original) {
        fs.writeFileSync(fp, fixed, 'utf8');
        filesFixed++;
        console.log(`Fixed: ${fp}`);
    }
}

function scan(dir) {
    for (const entry of fs.readdirSync(dir)) {
        if (skipDirs.includes(entry)) continue;
        const fp = path.join(dir, entry);
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) {
            scan(fp);
        } else if (entry.endsWith('.html')) {
            fixFile(fp);
        }
    }
}

scan('.');
console.log(`\nDone: ${totalFixed} data- attributes fixed in ${filesFixed} files`);

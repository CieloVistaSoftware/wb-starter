/**
 * Find all data- attributes on wb-* elements in HTML files
 */
import fs from 'fs';
import path from 'path';

const skipDirs = ['node_modules', 'tmp', '.git', 'archive'];
const results = [];

function scan(dir) {
    for (const entry of fs.readdirSync(dir)) {
        if (skipDirs.includes(entry)) continue;
        const fp = path.join(dir, entry);
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) {
            scan(fp);
        } else if (entry.endsWith('.html')) {
            const content = fs.readFileSync(fp, 'utf8');
            const lines = content.split(/\r?\n/);
            lines.forEach((line, i) => {
                const tagMatch = line.match(/<wb-[a-z]+[^>]*data-[a-z][^>]*/gi);
                if (tagMatch) {
                    tagMatch.forEach(m => {
                        const attrs = m.match(/data-[a-z][a-z-]*/gi);
                        if (attrs) {
                            results.push({
                                file: fp,
                                line: i + 1,
                                attrs: attrs
                            });
                        }
                    });
                }
            });
        }
    }
}

scan('.');

fs.writeFileSync('data/data-attr-report.json', JSON.stringify({
    total: results.reduce((s, r) => s + r.attrs.length, 0),
    fileCount: new Set(results.map(r => r.file)).size,
    results
}, null, 2));

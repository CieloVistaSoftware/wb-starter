/**
 * Rule 4 (docs/code-examples-standard.md, #307): a markdown code example
 * showing real wb-* / x-* markup must be a live wb-demo block, not a plain
 * static html fence.
 *
 * This is an AUDIT, not a hard gate yet -- #307 asks for the violation count
 * to be visible before mass-converting anything. Once the project-wide
 * conversion (tracked separately per doc folder, following #306's approach)
 * is complete, this can flip to a real failing assertion.
 *
 * Heuristic: a fence "shows real component usage" if it contains a wb-*
 * custom tag or an x-* attribute. CSS/JS fences, reference tables, and
 * intentionally-invalid markup (no wb-* / x-* content) are not flagged.
 */
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs');

function mdFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) mdFiles(full, acc);
    else if (entry.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

const RENDERABLE = /<(wb-[a-z-]+)[\s>]|\sx-[a-z][a-z0-9-]*(=|[\s>])/;

test('audit: markdown code fences that should be live <wb-demo> blocks (Rule 4, #307)', () => {
  const offenders: { file: string; count: number }[] = [];
  let totalFences = 0;

  for (const file of mdFiles(DOCS_DIR)) {
    const text = fs.readFileSync(file, 'utf8');
    const fenceRe = /```html\n([\s\S]*?)```/g;
    let m;
    let count = 0;
    while ((m = fenceRe.exec(text))) {
      if (RENDERABLE.test(m[1])) count++;
    }
    if (count > 0) {
      totalFences += count;
      offenders.push({ file: path.relative(DOCS_DIR, file), count });
    }
  }

  offenders.sort((a, b) => b.count - a.count);
  const report = offenders.map((o) => `  ${o.file}: ${o.count}`).join('\n');
  console.log(
    `Rule 4 audit: ${totalFences} static fence(s) across ${offenders.length} file(s) still need <wb-demo> conversion:\n${report}`
  );
});

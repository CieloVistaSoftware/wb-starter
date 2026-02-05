import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('no binary image files live under pages/ (images must go in images/)', async () => {
  const pagesDir = path.join(process.cwd(), 'pages');
  const exts = /\.(jpe?g|png|gif|webp|avif|mp3|wav|ogg|m4a)$/i;
  const failures: string[] = [];

  const walk = (dir: string) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return [p];
  });

  if (!fs.existsSync(pagesDir)) return;
  const files = walk(pagesDir).filter(f => exts.test(f));
  for (const f of files) {
    // allow images that are intentionally placed under pages/ by naming convention (none expected)
    failures.push(path.relative(process.cwd(), f));
  }

  expect(failures, `Found image files under pages/: ${failures.join(', ')}`).toEqual([]);
});

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * EVERY SCHEMA PROPERTY SAYS WHAT IT DOES (#749)
 * ==============================================
 * John, on the Figure doc: "the attributes description don't explain what they
 * do. where they show etc." The generated docs said "Read by figure()." for
 * every attribute. The docs were rewritten, but 36 properties across ten layout
 * schemas (center, container, cover, frame, grid, icon, reel, sidebarlayout,
 * stat, switcher) still carried it, and a schema description is what VS Code
 * shows on hover, the most-read documentation in the project.
 *
 * "Read by x()" names the function that reads the attribute, which is a fact
 * about the code, not about what the attribute does.
 */
const DIR = path.join(process.cwd(), 'src/wb-models');

test('no schema property is described as "Read by x()"', () => {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.schema.json'));
  expect(files.length, 'the schemas were read, so this can fail').toBeGreaterThan(100);
  const bad: string[] = [];
  for (const f of files) {
    const schema = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    for (const [name, prop] of Object.entries<any>(schema.properties || {})) {
      if (typeof prop?.description === 'string' && /^Read by \w+\(\)/.test(prop.description.trim())) {
        bad.push(`${f}: ${name}`);
      }
    }
  }
  expect(bad, 'say what the attribute does and where it shows').toEqual([]);
});

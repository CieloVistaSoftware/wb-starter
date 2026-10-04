import { test, expect } from '../fixtures/offline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * #1174 -- a test run never writes into the product's notes.
 *
 * data/notes.json is tracked: it is a person's saved work. The notes specs save
 * 'Test note content ...' through the dev server, so every run appended to it
 * and 4.0.5 shipped 147 test notes. A server started for tests
 * (WB_TEST_SERVER=1) now keeps them in the ignored data/test-results/.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PRODUCT = path.join(ROOT, 'data/notes.json');
const SCRATCH = path.join(ROOT, 'data/test-results/notes-under-test.json');

test('saving a note during a test run leaves data/notes.json byte-identical', async ({ request }) => {
  const before = fs.existsSync(PRODUCT) ? fs.readFileSync(PRODUCT) : null;
  const content = `Guard note for #1174 ${Date.now()}`;
  const res = await request.post('/api/notes/append', {
    data: { note: { id: `note-1174-${Date.now()}`, page: 'test', content, createdAt: new Date().toISOString() } },
  });
  expect(res.ok()).toBe(true);
  const after = fs.existsSync(PRODUCT) ? fs.readFileSync(PRODUCT) : null;
  expect(after?.equals(before ?? Buffer.alloc(0)) ?? before === null, 'a test wrote into the tracked data/notes.json').toBe(true);
  expect(fs.readFileSync(SCRATCH, 'utf8'), 'the note goes to the test scratch file instead').toContain(content);
});

test('the committed notes carry no test residue', () => {
  const notes = JSON.parse(fs.readFileSync(PRODUCT, 'utf8')).notes as Array<{ content: string }>;
  // The three shapes the notes specs save: notes-updates and notes.
  const RESIDUE = [/Test note content/, /^Outgoing note \d+$/, /^Duplicate test \d+$/];
  const residue = notes.filter((n) => RESIDUE.some((r) => r.test(String(n.content).trim())));
  expect(residue.length, 'test notes committed into the product data').toBe(0);
});

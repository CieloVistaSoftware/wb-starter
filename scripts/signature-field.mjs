#!/usr/bin/env node
/**
 * Read one field out of an issue's Signature block.
 *
 *   node scripts/signature-field.mjs <file> <field> [--runnable]
 *
 * Prints the value, or nothing. With --runnable, prints only values that are
 * actually executable (a .spec.ts path or a `node …` command) — a `test:` that
 * says "a spec is still wanted" is prose, not proof.
 *
 * WHY THIS IS A FILE AND NOT A ONE-LINER IN THE WORKFLOW
 * -----------------------------------------------------
 * It started as `node -e` inside a YAML `run:` block. The shell ate one level of
 * backslashes, so `[^\\S\\n]` reached node as `[^\S\n]`, which JavaScript parses
 * as "not S and not newline" — the class matched nearly everything and every
 * issue reported "no test", including ones that plainly had one. Before that it
 * was `grep -oP`, which is a GNU build option and simply absent on some shells.
 * Two escaping layers and a portability trap for four lines of matching. A file
 * has neither, and can be tested before it ships.
 *
 * The pattern itself matters too: [^\S\n], not \s. `\s` matches the newline, so
 * an EMPTY `test:` swallows the `fix:` line beneath it and reports THAT as the
 * test — the slip that made 11 of 13 priority-1 issues look covered when 3 were.
 */
import { readFileSync } from 'node:fs';

const [file, field] = process.argv.slice(2);
const runnableOnly = process.argv.includes('--runnable');

if (!file || !field) {
  console.error('usage: signature-field.mjs <file> <field> [--runnable]');
  process.exit(2);
}

let body = '';
try {
  body = readFileSync(file, 'utf8');
} catch (err) {
  console.error(`cannot read ${file}: ${err.message}`);
  process.exit(2);
}

const pattern = new RegExp('^' + field + ':[^\\S\\n]*(\\S.*?)[^\\S\\n]*$', 'm');
const m = body.match(pattern);
const value = m ? m[1].replace(/^["']|["']$/g, '').trim() : '';

if (!value || value === 'null') process.exit(0);
if (runnableOnly && !/\.spec\.ts|^node\s/.test(value)) process.exit(0);

process.stdout.write(value);

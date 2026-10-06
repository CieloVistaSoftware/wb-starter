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

const pattern = new RegExp('^([^\\S\\n]*)' + field + ':[^\\S\\n]*(\\S.*?)[^\\S\\n]*$', 'm');
const m = body.match(pattern);
let value = m ? m[2].replace(/^["']|["']$/g, '').trim() : '';

// #1588: a YAML block value -- `test: |` (or `>`, with an optional - or +)
// followed by indented lines -- was read as the literal '|', so an issue
// whose test is written as a block (#852) read as having none. The value is
// the lines indented deeper than the field, up to the first line that is not.
if (m && /^[|>][-+]?$/.test(value)) {
  const fieldIndent = m[1].length;
  const after = body.slice(m.index + m[0].length).split('\n').slice(1);
  const lines = [];
  for (const line of after) {
    if (line.trim() === '') { lines.push(''); continue; }
    if (line.match(/^[^\S\n]*/)[0].length <= fieldIndent) break;
    lines.push(line.trim());
  }
  value = lines.join(value.startsWith('>') ? ' ' : '\n').trim();
}

if (!value || value === 'null') process.exit(0);
// m: a block value's `node …` command can start any of its lines.
if (runnableOnly && !/\.spec\.ts|^node\s/m.test(value)) process.exit(0);

process.stdout.write(value);

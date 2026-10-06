/**
 * audit-schema-vs-behavior.mjs — find properties a schema PROMISES that its
 * behavior never reads (#669).
 *
 * John, looking at the Behaviors page: "none of the dialogs work" and "audio
 * showdisplay shows nothing". Both turned out to be the same defect, and it is
 * not a page defect:
 *
 *   audio.schema.json declares showEq, showDisplay, showPlayButton.
 *   audio.js reads src, controls, volume, playlist, show-eq, autoplay, loop.
 *   -> showDisplay and showPlayButton are wired to NOTHING.
 *   -> showEq is published under a name the code does not read (it reads show-eq).
 *
 * dialog.js:18 already records the same thing about its own variants:
 * "Schema declares variant: default/centered/fullscreen ... but this was never
 * read anywhere -- every variant produced an identical dialog."
 *
 * Anything that trusts the schema -- the Behaviors selector, IntelliSense, the
 * docs -- faithfully advertises options that do nothing. This audit turns that
 * from anecdote into a list.
 *
 * The work is in scripts/lib/schema-behavior-reads.mjs, which resolves each
 * schema through the runtime's own behavior registry (the filename match this
 * script used to do left 78 schemas unaudited). The same function backs
 * tests/compliance/schema-properties-are-read.spec.ts.
 *
 * Usage:
 *   node scripts/audit-schema-vs-behavior.mjs          # human report
 *   node scripts/audit-schema-vs-behavior.mjs --json   # machine-readable
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { auditSchemaReads } from './lib/schema-behavior-reads.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { unresolved, unread } = await auditSchemaReads(ROOT);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ unresolved, unread }, null, 2));
  process.exit(0);
}

const totalUnread = unread.reduce((n, r) => n + r.unread.length, 0);
console.log('Schema promises vs behavior reality\n');
console.log(`  schemas with properties declared but never read : ${unread.length}`);
console.log(`  properties affected                             : ${totalUnread}`);
console.log(`  schemas with no behavior in the registry        : ${unresolved.length}\n`);

for (const r of [...unread].sort((a, b) => b.unread.length - a.unread.length)) {
  console.log(`  ${r.schema.padEnd(18)} ${String(r.unread.length).padStart(2)}/${r.declared}  ${r.module.padEnd(24)} ${r.unread.join(', ')}`);
}
if (unresolved.length) console.log('\nNo behavior in the registry for:\n  ' + unresolved.join(', '));
process.exit(unread.length || unresolved.length ? 1 : 0);
